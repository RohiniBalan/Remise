require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const OfferOrder = require("../models/OfferOrder");


mongoose
.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("✅ MongoDB Connected");


    const workbook = XLSX.readFile(
        path.join(__dirname, "offerorders.xlsx"),
         { cellDates: true } 
    );


    const sheet = workbook.Sheets[workbook.SheetNames[0]];


    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });


    console.log("Excel rows:", rows.length);


    let imported = 0;


    for (const row of rows) {

        try {


            const offerOrder = new OfferOrder({

                _id: row._id,


                offerId:
                    row.offerId,


                storeId:
                    row.storeId,


                storeName:
                    row.storeName,


                userId:
                    row.userId || null,


                customerName:
                    row.customerName,


                customerPhone:
                    row.customerPhone,


                customerEmail:
                    row.customerEmail,


                deliveryAddress:
                    row.deliveryAddress,


                offerTitle:
                    row.offerTitle,


                offerImage:
                    row.offerImage,


                unitPrice:
                    Number(row.unitPrice),


                quantity:
                    Number(row.quantity),


                totalAmount:
                    Number(row.totalAmount),


                status:
                    row.status,


                notes:
                    row.notes,


                createdAt:
                    new Date(row.createdAt)

            });



            await offerOrder.save();


            imported++;


        } catch(error) {


            console.log(
                "Failed:",
                row.offerTitle
            );


            console.log(error.message);

        }

    }


    console.log("----------------------------");

    console.log(
        "Imported Offer Orders:",
        imported
    );

    console.log("----------------------------");


    process.exit();


})
.catch(err => {

    console.log(err);

    process.exit();

});