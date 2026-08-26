const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wowlife_stores');
  const res = await mongoose.connection.db.collection('stores').updateMany(
    { $or: [{ upiId: null }, { upiId: '' }, { upiId: { $exists: false } }] },
    { $set: { upiId: 'rohinibalan529@oksbi' } }
  );
  console.log('Successfully updated stores without upiId:', res.modifiedCount);
  const stores = await mongoose.connection.db.collection('stores').find({}).toArray();
  stores.forEach(s => console.log('Store:', s.name, '-> upiId:', s.upiId));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
