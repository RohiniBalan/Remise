const axios = require('axios');

const sendOrderConfirmationEmail = async (order) => {
    try {
        const name = order.shippingAddress.firstName;
        const orderId = order.orderId;
        const amount = order.totalAmount;
        const customerEmail = order.contactEmail;

        // Format the items into an HTML list
        const itemsHtml = order.items.map(item => 
            `<li>${item.quantity}x <strong>${item.title}</strong> - Rs ${item.price}</li>`
        ).join('');

        // The exact payload structure required by Brevo
        const payload = {
            sender: {
                name: "WOW Lifestyle Toys", 
                email: "your-verified-sender@email.com" // MUST be the email you verified in Brevo step 1
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
                    <p>Thank you for your purchase. We have successfully received your order <strong>${orderId}</strong>.</p>
                    
                    <h3>Order Summary:</h3>
                    <ul>
                        ${itemsHtml}
                    </ul>
                    
                    <h3 style="border-top: 1px solid #eee; padding-top: 10px;">Total Amount: Rs ${amount}</h3>
                    
                    <p>We will notify you once your order is shipped.</p>
                    <br/>
                    <p>Best Regards,</p>
                    <p><strong>WOW Lifestyle Team</strong></p>
                </div>
            `
        };

        // Call the Brevo v3 SMTP Email API
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
            headers: {
                'accept': 'application/json',
                'api-key': 'YOUR_BREVO_API_KEY_HERE', // Paste your Brevo API key here
                'content-type': 'application/json'
            }
        });

        // The response includes a messageId you can use to track deliverability events
        console.log(`✅ [Email Success] Confirmation sent to ${customerEmail}. Message ID: ${response.data.messageId}`);
        return true;

    } catch (error) {
        // Detailed error logging specifically for Brevo
        console.error('❌ [Email Error] Failed to send via Brevo:', error.response ? error.response.data : error.message);
        return false;
    }
};

module.exports = sendOrderConfirmationEmail;