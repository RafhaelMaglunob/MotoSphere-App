import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Configure your email (Gmail example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'motosphere.smart@gmail.com',      // ← Your email
    pass: 'your-app-password-here'          // ← Your 16-char App Password
  }
});

// Define the request data type
interface VerificationEmailData {
  email: string;
}

export const sendVerificationCode = functions.https.onCall(
  async (request: functions.https.CallableRequest<VerificationEmailData>) => {
    // Check if user is authenticated
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be logged in'
      );
    }

    const { email } = request.data;

    if (!email) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Email is required'
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // Store code in Firestore
      await admin.firestore().collection('verificationCodes').add({
        email: email,
        code: code,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        used: false,
        uid: request.auth.uid
      });

      console.log('✅ Code stored in Firestore:', code);

      // Send email
      const mailOptions = {
        from: '"MotoSphere" <motosphere.smart@gmail.com>',
        to: email,
        subject: 'Your MotoSphere Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0A1A3A; color: #fff; border-radius: 12px;">
            <h2 style="color: #22D3EE; text-align: center;">Email Verification</h2>
            <p style="font-size: 16px; color: #9BB3D6;">Hello,</p>
            <p style="font-size: 16px; color: #9BB3D6;">Your verification code is:</p>
            
            <div style="background-color: #0F2A52; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #22D3EE; letter-spacing: 10px; font-size: 36px; margin: 0;">${code}</h1>
            </div>
            
            <p style="font-size: 14px; color: #9BB3D6;">This code will expire in <strong>15 minutes</strong>.</p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', email);

      return { success: true };

    } catch (error: any) {
      console.error('❌ Error in sendVerificationCode:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to send verification email: ' + error.message
      );
    }
  }
);