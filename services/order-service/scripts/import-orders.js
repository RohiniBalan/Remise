require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Order = require("../models/Order");


mongoose
.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("✅ MongoDB Connected");


    const workbook = XLSX.readFile(
        path.join(__dirname, "orders.xlsx")
    );


    const sheet = workbook.Sheets[workbook.SheetNames[0]];


    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });


    console.log("Excel rows:", rows.length);


    /*
      Group products by orderId

      Example:

      TXN001
        - Rice
        - Oil
        - Sugar

      becomes

      one MongoDB order with items array
    */

    const groupedOrders = {};


    rows.forEach(row => {

        if (!groupedOrders[row.orderId]) {

            groupedOrders[row.orderId] = {

                ...row,

                items: []

            };

        }


        groupedOrders[row.orderId].items.push({

            productId: row.productId,

            title: row.itemTitle,

            price: Number(row.itemPrice),

            quantity: Number(row.itemQuantity),

            image: row.itemImage

        });

    });



    const orders = Object.values(groupedOrders);


    console.log(
        "Unique orders:",
        orders.length
    );


    let imported = 0;


    for (const row of orders) {

        try {


            const order = new Order({

                _id: row._id,

                orderId: row.orderId,

                userId: row.userId,

                contactEmail: row.contactEmail,


                storeId: row.storeId,

                storeName: row.storeName,


                items: row.items,


                totalAmount:
                    Number(row.totalAmount),



                shippingAddress: {

                    firstName: row.shippingFirstName,

                    lastName: row.shippingLastName,

                    address: row.shippingAddress,

                    city: row.shippingCity,

                    state: row.shippingState,

                    pinCode: row.shippingPinCode,

                    phone: row.shippingPhone

                },


                billingAddress: {

                    firstName: row.billingFirstName,

                    lastName: row.billingLastName,

                    address: row.billingAddress,

                    city: row.billingCity,

                    state: row.billingState,

                    pinCode: row.billingPinCode,

                    phone: row.billingPhone

                },


                paymentMethod:
                    row.paymentMethod,


                paymentStatus:
                    row.paymentStatus,


                orderStatus:
                    row.orderStatus,


                deliveryMethod:
                    row.deliveryMethod,


                deliveryStatus:
                    row.deliveryStatus,


                paymentProofImage:
                    row.paymentProofImage || null,


                createdAt:
                    new Date(row.createdAt),


                __v:
                    Number(row.__v) || 0

            });



            await order.save();


            imported++;


        } catch(error) {


            console.log(
                "Failed:",
                row.orderId
            );


            console.log(error.message);

        }

    }



    console.log("----------------------------");

    console.log(
        "Imported Orders:",
        imported
    );

    console.log("----------------------------");


    process.exit();


})
.catch(err => {

    console.log(err);

    process.exit();

});