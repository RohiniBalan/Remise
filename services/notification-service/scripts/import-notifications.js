require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const Notification = require("../models/Notification");


mongoose
.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("✅ MongoDB Connected");


    const workbook = XLSX.readFile(
        path.join(__dirname, "notifications.xlsx")
    );


    const sheet = workbook.Sheets[workbook.SheetNames[0]];


    const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: ""
    });


    console.log("Excel rows:", rows.length);


    let imported = 0;


    for (const row of rows) {

        try {


            const notification = new Notification({

                _id:
                    row._id,


                userId:
                    row.userId,


                offerId:
                    row.offerId || null,


                storeId:
                    row.storeId || null,


                type:
                    row.type || "offer",


                title:
                    row.title,


                body:
                    row.body,


                image:
                    row.image || null,


                url:
                    row.url || "/nearby",


                isRead:
                    row.isRead === true ||
                    row.isRead === "true",


                createdAt:
                    new Date(row.createdAt)

            });



            await notification.save();


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
        "Imported Notifications:",
        imported
    );

    console.log("----------------------------");


    process.exit();


})
.catch(err => {

    console.log(err);

    process.exit();

});