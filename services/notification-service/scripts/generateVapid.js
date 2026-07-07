/**
 * Run once: node scripts/generateVapid.js
 * Copy the output into your notification-service .env file and
 * copy VAPID_PUBLIC_KEY into the client .env as NEXT_PUBLIC_VAPID_PUBLIC_KEY
 */
const webpush = require('web-push');
const keys    = webpush.generateVAPIDKeys();
console.log('\n✅  VAPID keys generated — add these to your .env files:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\n(Also add VAPID_PUBLIC_KEY to client/.env as NEXT_PUBLIC_VAPID_PUBLIC_KEY)\n');
