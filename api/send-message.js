// pages/api/send-message.js
// SMS sending API using Twilio for Vercel

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  console.log('📱 Incoming SMS request');
  console.log('📱 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { phoneNumber, code, userName, messageType } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      console.log('❌ Missing phone number');
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }

    if (!code && messageType === 'phone_verification') {
      console.log('❌ Missing code for verification message');
      return res.status(400).json({ 
        success: false,
        error: 'Code is required for verification messages' 
      });
    }

    // Get environment variables
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    console.log('🔍 Environment check:');
    console.log('  - Twilio Account SID:', twilioAccountSid ? '✅ Set' : '❌ Missing');
    console.log('  - Twilio Auth Token:', twilioAuthToken ? '✅ Set' : '❌ Missing');
    console.log('  - Twilio Phone Number:', twilioPhoneNumber ? '✅ Set' : '❌ Missing');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error('❌ Missing Twilio environment variables');
      return res.status(500).json({ 
        success: false,
        error: 'SMS service not configured. Missing Twilio credentials.',
        details: {
          accountSid: !!twilioAccountSid,
          authToken: !!twilioAuthToken,
          phoneNumber: !!twilioPhoneNumber
        }
      });
    }

    // Validate phone number format
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      console.log('❌ Invalid phone number format:', phoneNumber);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid phone number format. Use: +639123456789 or 09123456789'
      });
    }

    // Format phone number to international format if needed
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith('0')) {
      formattedPhone = '+63' + phoneNumber.slice(1);
    }

    // Build message content based on messageType
    let messageContent;
    
    if (messageType === 'phone_verification') {
      messageContent = `Your MotoSphere phone verification code is: ${code}. Valid for 10 minutes.`;
      console.log('📧 Sending Phone Verification SMS');
    } else if (messageType === '2fa') {
      messageContent = `Your MotoSphere verification code is: ${code}. Do not share this code with anyone.`;
      console.log('📧 Sending 2FA SMS');
    } else if (messageType === 'welcome') {
      messageContent = `Welcome to MotoSphere, ${userName || 'User'}! Your account has been created successfully.`;
      console.log('📧 Sending Welcome SMS');
    } else if (messageType === 'alert') {
      messageContent = `MotoSphere Alert: ${code || 'Suspicious activity detected on your account. Please verify.'}`;
      console.log('📧 Sending Alert SMS');
    } else {
      messageContent = `Your MotoSphere verification code is: ${code || 'N/A'}`;
      console.log('📧 Defaulting to verification message');
    }

    console.log('📱 SMS details:');
    console.log('  - To:', formattedPhone);
    console.log('  - Code:', code || 'N/A');
    console.log('  - User:', userName || 'User');
    console.log('  - Type:', messageType);

    // Prepare Twilio request
    const authString = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

    const smsPayload = new URLSearchParams({
      From: twilioPhoneNumber,
      To: formattedPhone,
      Body: messageContent
    });

    console.log('📤 Sending to Twilio...');

    const smsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: smsPayload.toString()
      }
    );

    const responseData = await smsResponse.json();
    console.log('📬 Twilio Status:', smsResponse.status);
    console.log('📬 Twilio Response:', JSON.stringify(responseData, null, 2));

    if (!smsResponse.ok) {
      console.error('❌ Twilio Error:', responseData);
      
      let errorMessage = 'Failed to send SMS';
      if (responseData.message) {
        errorMessage = responseData.message;
      }
      if (responseData.code === 21211) {
        errorMessage = 'Invalid phone number format';
      } else if (responseData.code === 21608) {
        errorMessage = 'Phone number is not capable of receiving SMS';
      } else if (responseData.code === 21603) {
        errorMessage = 'Twilio credentials are invalid or account is not active';
      }

      return res.status(smsResponse.status).json({ 
        success: false,
        error: errorMessage,
        twilioCode: responseData.code,
        details: responseData.message
      });
    }

    console.log('✅ SMS sent successfully');
    console.log('📬 Message SID:', responseData.sid);

    return res.status(200).json({ 
      success: true, 
      message: 'SMS sent successfully',
      messageType: messageType || 'verification',
      recipient: formattedPhone,
      sid: responseData.sid,
      status: responseData.status
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('❌ Error message:', error.message);
    
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}