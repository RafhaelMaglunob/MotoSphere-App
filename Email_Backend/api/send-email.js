// api/send-email.js

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

  console.log('📨 Incoming email request');
  console.log('📨 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { email, code, userName, emailType } = req.body;

    // Validate required fields
    if (!email) {
      console.log('❌ Missing email');
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }

    if (!code && emailType === '2fa') {
      console.log('❌ Missing code for 2FA email');
      return res.status(400).json({ 
        success: false,
        error: 'Code is required for 2FA emails' 
      });
    }

    // Get environment variables
    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    console.log('🔍 Environment check:');
    console.log('  - Service ID:', serviceId ? '✅' : '❌');
    console.log('  - Public Key:', publicKey ? '✅' : '❌');
    console.log('  - Private Key:', privateKey ? '✅' : '❌');

    if (!serviceId || !publicKey || !privateKey) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        success: false,
        error: 'Email service not configured properly',
        details: {
          serviceId: !!serviceId,
          publicKey: !!publicKey,
          privateKey: !!privateKey
        }
      });
    }

    // Determine template based on emailType
    let templateId;
    
    if (emailType === '2fa') {
      templateId = process.env.EMAILJS_TEMPLATE_2FA;
      console.log('📧 Sending 2FA Email');
    } else if (emailType === 'email_verification') {
      templateId = process.env.EMAILJS_TEMPLATE_VERIFICATION;
      console.log('📧 Sending Email Verification');
    } else if (emailType === 'welcome') {
      templateId = process.env.EMAILJS_TEMPLATE_WELCOME;
      console.log('📧 Sending Welcome Email');
    } else {
      templateId = process.env.EMAILJS_TEMPLATE_2FA; // Default to 2FA
      console.log('📧 Defaulting to 2FA template');
    }

    if (!templateId) {
      console.error('❌ Template ID not configured for type:', emailType);
      return res.status(500).json({ 
        success: false,
        error: 'Email template not configured',
        emailType: emailType
      });
    }

    console.log('📧 Email details:');
    console.log('  - To:', email);
    console.log('  - Code:', code);
    console.log('  - User:', userName || 'User');
    console.log('  - Template:', templateId);

    // Send via EmailJS REST API
    const emailPayload = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: {
        email: email,
        user_name: userName || 'User',
        verification_code: code,
        code_display: code ? code.split('').join(' ') : ''
      }
    };

    console.log('📤 Sending to EmailJS...');

    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload)
    });

    const responseText = await emailResponse.text();
    console.log('📬 EmailJS Status:', emailResponse.status);
    console.log('📬 EmailJS Response:', responseText);

    if (!emailResponse.ok) {
      console.error('❌ EmailJS Error Response:', responseText);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to send email via EmailJS',
        details: responseText,
        status: emailResponse.status
      });
    }

    console.log('✅ Email sent successfully');

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      emailType: emailType || '2fa',
      recipient: email
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}