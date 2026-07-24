const fs = require("fs");
const path = require("path");

// Path to products.json
const inputFile = "C:\\Porulon-Project\\products.json";

// Output file
const outputFile = "C:\\Porulon-Project\\products_updated.json";

const products = JSON.parse(fs.readFileSync(inputFile, "utf8"));

products.forEach(product => {
  if (product._id && product._id.$oid) {
    product._id = product._id.$oid;
  }
});

fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));

console.log("✅ Conversion completed!");
console.log("Saved to:", outputFile);