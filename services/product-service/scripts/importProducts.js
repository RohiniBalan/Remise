require('dotenv').config();
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');

const Product = require('../models/Product');

async function importProducts() {
    try {

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ Connected to MongoDB");

        const filePath = path.join(__dirname, '../import/Products.xlsx');

        const workbook = XLSX.readFile(filePath);

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const products = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${products.length} products`);

        let inserted = 0;
        let skipped = 0;

        for (const item of products) {

            const exists = await Product.findOne({
                title: item.title,
                storeId: item.storeId
            });

            if (exists) {
                skipped++;
                continue;
            }

            await Product.create({

                title: item.title,
                description: item.description,

                price: Number(item.price),

                discountedPrice: Number(item.discountedPrice),

                imageUrl: item.imageUrl,

                category: item.category,

                brand: item.brand,

                availability: item.availability || "In Stock",

                totalStock: Number(item.totalStock),

                featured: item.featured === true || item.featured === "TRUE",

                storeId: item.storeId,

                ownerId: item.ownerId,

                images: [],

                tags: [],

                ageGroup: null

            });

            inserted++;

            process.stdout.write(
                `\rImported ${inserted} products`
            );
        }

        console.log("\n");
        console.log("=================================");
        console.log("Import Completed");
        console.log("Inserted :", inserted);
        console.log("Skipped  :", skipped);
        console.log("=================================");

        process.exit();

    } catch (err) {

        console.error(err);

        process.exit(1);

    }
}

importProducts();