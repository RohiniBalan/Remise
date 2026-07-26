require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Offer = require("../models/Offer");


mongoose
.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("✅ MongoDB Connected");


    const workbook = XLSX.readFile(
        path.join(__dirname, "offers.xlsx")
    );


    const sheet = workbook.Sheets[workbook.SheetNames[0]];


    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });


    console.log("Excel rows:", rows.length);


    let imported = 0;


    for (const row of rows) {

        try {

            const offer = new Offer({

                _id: row._id,

                storeId: row.storeId,

                storeName: row.storeName,


                storeLocation: {

                    type: row["storeLocation.type"],

                    coordinates: [

                        Number(row["storeLocation.coordinates[0] (lon)"]),

                        Number(row["storeLocation.coordinates[1] (lat)"])

                    ]

                },


                title: row.title,

                description: row.description,

                image: row.image,

                category: row.category,


                originalPrice:
                    Number(row.originalPrice),


                offerPrice:
                    Number(row.offerPrice),


                discountPercent:
                    Number(row.discountPercent),


                validFrom:
                    new Date(row.validFrom),


                validUntil:
                    new Date(row.validUntil),


                notificationRadius:
                    Number(row.notificationRadius),


                isActive:
                    row.isActive === true || row.isActive === "true",


                notificationSent:
                    row.notificationSent === true || row.notificationSent === "true",


                viewCount:
                    Number(row.viewCount) || 0,


                orderCount:
                    Number(row.orderCount) || 0,


                createdAt:
                    new Date(row.createdAt)

            });


            await offer.save();


            imported++;


        } catch(error) {


            console.log(
                "Failed:",
                row.title
            );


            console.log(error.message);

        }

    }


    console.log("----------------------------");

    console.log(
        "Imported Offers:",
        imported
    );

    console.log("----------------------------");


    process.exit();


})
.catch(err => {

    console.log(err);

    process.exit();

});