const fs = require('fs');
require('dotenv').config();

console.log('🔍 Verifying Web Client ID Configuration\n');

// Check .env
const webClientId = process.env.WEB_CLIENT_ID;
console.log('WEB_CLIENT_ID from .env:', webClientId);
console.log('Length:', webClientId?.length);

if (!webClientId) {
  console.log('❌ WEB_CLIENT_ID not found in .env');
} else if (webClientId.length < 50) {
  console.log('⚠️  WEB_CLIENT_ID seems too short - might be Android client ID');
} else if (!webClientId.includes('.apps.googleusercontent.com')) {
  console.log('❌ Invalid format');
} else {
  console.log('✅ WEB_CLIENT_ID looks valid');
}

// Check google-services.json for comparison
try {
  const googleServices = JSON.parse(fs.readFileSync('./google-services.json', 'utf8'));
  const clients = googleServices?.client?.[0]?.oauth_client || [];
  
  console.log('\n📄 OAuth clients in google-services.json:');
  clients.forEach((client, i) => {
    console.log(`\n  Client ${i + 1}:`);
    console.log(`    Type: ${client.client_type} (3 = Web, 1 = Android)`);
    console.log(`    ID: ${client.client_id}`);
    
    if (client.client_type === 3 && client.client_id !== webClientId) {
      console.log('    ⚠️  This Web client ID differs from your .env!');
    }
  });
} catch (err) {
  console.log('\n⚠️  Could not read google-services.json');
}

console.log('\n📋 Next Steps:');
console.log('1. Go to Google Cloud Console → Credentials');
console.log('2. Find "Web client (auto created by Google Service)"');
console.log('3. Copy that Client ID to your .env file');
console.log('4. Run: npx expo start --clear');
console.log('5. Rebuild: npx expo run:android\n');