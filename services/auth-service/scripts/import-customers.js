require("dotenv").config();

const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

const User = require("../models/User");

// Change this path if your .env is elsewhere
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {

    console.log("✅ MongoDB Connected");

    const workbook = XLSX.readFile(
        path.join(__dirname, "customers.xlsx")
    );

    const sheetName = workbook.SheetNames[0];

    const customers = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        {
            defval: ""
        }
    );

    console.log(`Found ${customers.length} customers`);

    let imported = 0;
    let skipped = 0;

    for (const row of customers) {

        try {

            const exists = await User.findOne({
                email: row.email
            });

            if (exists) {
                skipped++;
                continue;
            }

            const user = new User({

                _id: row._id,

                fullname: row.fullname,

                email: row.email,

                mobilenumber: row.mobilenumber,

                password: row.password,

                avatar: row.avatar || null,

                role: row.role || "user",

                isEmailVerified:
                    row.isEmailVerified === true ||
                    row.isEmailVerified === "true",

                emailVerificationToken:
                    row.emailVerificationToken || null,

                emailVerificationExpires:
                    row.emailVerificationExpires
                        ? new Date(row.emailVerificationExpires)
                        : null,

                cart:
                    typeof row.cart === "string" && row.cart.length
                        ? JSON.parse(row.cart)
                        : [],

                createdAt:
                    row.createdAt
                        ? new Date(row.createdAt)
                        : new Date()

            });

            await user.save();

            imported++;

        } catch (err) {

            console.log("❌ Failed:", row.email);

            console.log(err.message);

        }

    }

    console.log("--------------------------------");

    console.log("Imported :", imported);

    console.log("Skipped :", skipped);

    console.log("--------------------------------");

    process.exit();

})
.catch(err => {

    console.log(err);

    process.exit();

});