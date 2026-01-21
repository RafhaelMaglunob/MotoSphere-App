import emailjs from '@emailjs/nodejs';

export default async function handler(req, res) {
  // Set CORS headers
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

  console.log('📨 Incoming request');

  try {
    const { email, code, userName } = req.body;

    if (!email || !code) {
      console.log('❌ Missing email or code');
      return res.status(400).json({ 
        success: false,
        error: 'Email and code required' 
      });
    }

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey || !privateKey) {
      console.error('❌ Missing environment variables');
      return res.status(500).json({ 
        success: false,
        error: 'Email service not configured'
      });
    }

    console.log('📧 Sending email to:', email);

    // FIXED: Match your template variables
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        email: email,  // Changed from to_email to email
        to_name: userName || 'User',
        verification_code: code
      },
      {
        publicKey: publicKey,
        privateKey: privateKey,
      }
    );

    console.log('✅ EmailJS Success:', response);

    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('❌ Detailed error:', {
      message: error.message,
      text: error.text,
      status: error.status
    });
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to send email',
      details: error.text || error.message
    });
  }
}