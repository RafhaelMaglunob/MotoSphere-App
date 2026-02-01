import { Router } from 'express';
import { transporter } from './mailer';
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as {
    GMAIL_USER: string;
};
const router = Router();

router.post('/send-verification', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  await transporter.sendMail({
    from: `"MotoSphere" <${extra.GMAIL_USER}>`,
    to: email,
    subject: 'Email Verification',
    html: `<h2>Your code</h2><h1>${code}</h1>`
  });

  res.json({ success: true });
});

export default router;
