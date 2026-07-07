const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product'); // Import Product to deduct stock

// =========================================================
// 1. FAST2SMS HELPER FUNCTION
// =========================================================
const sendOrderConfirmationSMS = async (order) => {
    try {
        let rawPhone = order.shippingAddress?.phone || '';
        const phone = rawPhone.replace(/\D/g, '').slice(-10);

        if (phone.length !== 10) {
            console.error('❌ [SMS Error] Invalid phone number format:', rawPhone);
            return;
        }

        const name = order.shippingAddress.firstName;
        const orderId = order.orderId;
        const amount = order.totalAmount;

        const message = `Hi ${name}, your order ${orderId} for Rs ${amount} is confirmed. Thank you!`;

        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            route: 'q', 
            message: message,
            language: 'english',
            flash: 0,
            numbers: phone 
        }, {
            headers: {
                'authorization': 'beowqwtU9RILHHYRIC6xyK2ZlYoRrk0ZCTIhi8mQ4ReIxkRL7NtxMonOxQo7', 
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ [SMS Success] Confirmation sent to ${phone}. Message ID:`, response.data.request_id);
    } catch (error) {
        console.error('❌ [SMS Error] Failed to send via Fast2SMS:', error.response ? error.response.data : error.message);
    }
};

// =========================================================
// 2. BREVO EMAIL HELPER FUNCTION
// =========================================================
const sendOrderConfirmationEmail = async (order) => {
    try {
        const name = order.shippingAddress?.firstName || 'Customer';
        const orderId = order.orderId;
        const amount = order.totalAmount;
        const customerEmail = order.contactEmail;

        if (!customerEmail) {
            console.error('❌ [Email Error] No customer email provided for order:', orderId);
            return;
        }

        // Format items into an HTML list
        const itemsHtml = order.items.map(item => 
            `<li>${item.quantity}x <strong>${item.title}</strong> - Rs ${item.price}</li>`
        ).join('');

        const payload = {
            sender: {
                name: "WOW Lifestyle Toys", 
                email: "your-verified-email@domain.com" // MUST match your verified Brevo sender email
            },
            to: [
                {
                    email: customerEmail,
                    name: name
                }
            ],
            subject: `Order Confirmation - ${orderId}`,
            htmlContent: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4CAF50;">Order Confirmed! 🎉</h2>
                    <p>Hi ${name},</p>
                    <p>Thank you for shopping with WOW Lifestyle Toys. We have successfully received your order <strong>${orderId}</strong>.</p>
                    
                    <h3>Order Summary:</h3>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    
                    <h3 style="border-top: 1px solid #eee; padding-top: 10px;">Total Amount: Rs ${amount}</h3>
                    
                    <p>We will notify you once your order is processed and shipped.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>WOW Lifestyle Toys Team</strong></p>
                </div>
            `
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'accept': 'application/json',
                'api-key': 'YOUR_BREVO_API_KEY_HERE', // Paste your Brevo API key here
                'content-type': 'application/json'
            }
        });

        console.log(`✅ [Email Success] Confirmation sent to ${customerEmail}. Message ID: ${response.data.messageId}`);
    } catch (error) {
        console.error('❌ [Email Error] Failed to send via Brevo:', error.response ? error.response.data : error.message);
    }
};

// =========================================================
// YOUR PHONEPE OAUTH CREDENTIALS
// =========================================================
const CLIENT_ID = "M23IOM3UNHZVS_2603051535"; 
const CLIENT_SECRET = "YmFjMDMzYjItYjJlOS00NWRkLWFjZDYtYTU1MzU5YzE1ZTJl"; 
const MERCHANT_ID = "M23IOM3UNHZVS"; 
const CLIENT_VERSION = "1";

// @route   POST /api/payment/initiate
router.post('/initiate', async (req, res) => {
    try {
        const { amount, redirectUrl, cartItems, contactEmail, shippingAddress, billingAddress, paymentMethod, userId } = req.body;
        
        if (!redirectUrl) {
            return res.status(400).json({ success: false, message: 'redirectUrl is required from frontend' });
        }

        const amountInPaise = Math.round(amount * 100);
        const merchantOrderId = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
        const returnUrl = `${redirectUrl}?orderId=${merchantOrderId}`;

        // 1. CREATE ORDER (Status defaults to PENDING)
        const newOrder = await Order.create({
            orderId: merchantOrderId,
            userId: userId || null,
            contactEmail,
            items: cartItems.map(item => ({
                productId: item.id || item._id || item.productId, 
                title: item.title, 
                price: item.price, 
                quantity: item.quantity, 
                image: item.image
            })),
            totalAmount: amount,
            shippingAddress,
            billingAddress,
            paymentMethod,
            paymentStatus: 'PENDING'
        });

        // 2. IF COD: Instantly Mark Success & Deduct Stock
        if (paymentMethod === 'cod') {
            newOrder.paymentStatus = 'SUCCESS';
            await newOrder.save();

            // Forcefully update stock using updateOne to bypass any schema validation issues
            for (const item of newOrder.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const newStock = Math.max(0, product.totalStock - item.quantity);
                        const newAvailability = newStock === 0 ? 'Out Of Stock' : product.availability;

                        await Product.updateOne(
                            { _id: item.productId },
                            { 
                                $set: { 
                                    totalStock: newStock,
                                    availability: newAvailability
                                } 
                            }
                        );
                        console.log(`[COD] Successfully updated stock for ${product.title}. New stock: ${newStock}`);
                    }
                }
            }

            // ---> TRIGGER: Send SMS and Email for COD <---
            if (newOrder.shippingAddress && newOrder.shippingAddress.phone) {
                sendOrderConfirmationSMS(newOrder); // Does not block the response
            }
            if (newOrder.contactEmail) {
                sendOrderConfirmationEmail(newOrder); // Does not block the response
            }

            return res.status(200).json({ success: true, isCod: true, url: returnUrl });
        }

        // 3. IF PHONEPE: Initiate Gateway (Stock will be deducted in /status route)
        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', CLIENT_ID);
        tokenParams.append('client_version', CLIENT_VERSION);
        tokenParams.append('client_secret', CLIENT_SECRET);
        tokenParams.append('grant_type', 'client_credentials');

        const tokenResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token', 
            tokenParams.toString(), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) return res.status(500).json({ success: false, message: 'Failed to generate Auth Token' });

        const paymentPayload = {
            merchantId: MERCHANT_ID,
            merchantOrderId: merchantOrderId,
            amount: amountInPaise,
            expireAfter: 1800,
            metaInfo: { udf1: "Website Order" },
            paymentFlow: {
                type: "PG_CHECKOUT",
                message: "Order Payment",
                merchantUrls: {
                    redirectUrl: returnUrl,
                    cancelUrl: returnUrl
                }
            }
        };

        const paymentResponse = await axios.post(
            'https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay',
            paymentPayload,
            { headers: { 'Content-Type': 'application/json', 'Authorization': `O-Bearer ${accessToken}` } }
        );

        const payUrl = paymentResponse.data.redirectUrl || (paymentResponse.data.data && paymentResponse.data.data.redirectUrl);

        if (payUrl) {
            res.status(200).json({ success: true, url: payUrl });
        } else {
            res.status(500).json({ success: false, message: 'Payment URL not found in PhonePe response' });
        }

    } catch (error) {
        console.error('Initiate Error:', error.message);
        res.status(500).json({ success: false, message: 'Initiation failed' });
    }
});


// @route   GET /api/payment/status/:orderId
router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;

        // FAKE SUCCESS FOR TEST MODE & DEDUCT STOCK
        const order = await Order.findOne({ orderId });

        if (order && order.paymentStatus !== 'SUCCESS') {
            order.paymentStatus = 'SUCCESS';
            await order.save();

            // Forcefully update stock using updateOne to bypass schema validation failures
            for (const item of order.items) {
                if (item.productId) {
                    const product = await Product.findById(item.productId);
                    if (product) {
                        const newStock = Math.max(0, product.totalStock - item.quantity);
                        const newAvailability = newStock === 0 ? 'Out Of Stock' : product.availability;

                        await Product.updateOne(
                            { _id: item.productId },
                            { 
                                $set: { 
                                    totalStock: newStock,
                                    availability: newAvailability
                                } 
                            }
                        );
                        console.log(`[PHONEPE] Successfully updated stock for ${product.title}. New stock: ${newStock}`);
                    }
                }
            }

            // ---> TRIGGER: Send SMS and Email for PhonePe <---
            if (order.shippingAddress && order.shippingAddress.phone) {
                sendOrderConfirmationSMS(order);
            }
            if (order.contactEmail) {
                sendOrderConfirmationEmail(order);
            }
        }

        setTimeout(() => {
            res.status(200).json({ 
                success: true, 
                status: 'SUCCESS', 
                message: 'Order Placed Successfully!', 
                rawData: { transactionId: orderId, state: 'COMPLETED' } 
            });
        }, 1500);

    } catch (error) {
        console.error('Status Check Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to check status' });
    }
});

router.post('/callback', (req, res) => { res.status(200).send('OK'); });
module.exports = router;