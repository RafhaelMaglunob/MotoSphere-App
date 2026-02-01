import express from "express";
import cors from "cors";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDb } from "./firebase"; // make sure this points to your Firebase config
import nodemailer from "nodemailer";

const app = express();
app.use(cors());
app.use(express.json());

// === CONFIG ===
const PORT = 3000;
const GMAIL_EMAIL = "motosphere.smart@gmail.com";
const GMAIL_APP_PASSWORD = "evidjfvmdlpudgam";

// === TRANSPORTER ===
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_EMAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});

// === IN-MEMORY STORE FOR CODES ===
const verificationStore: Record<string, string> = {};

/**
 * Send verification email
 */
app.post("/send-verification", async (req, res) => {
  const { email, uid } = req.body;

  if (!email || !uid) {
    return res.status(400).json({ success: false, error: "Missing email or uid" });
  }

  // Generate unique token
  const token = Math.random().toString(36).substring(2, 15);
  verificationStore[token] = uid;

  const verifyUrl = `http://localhost:${PORT}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"MotoSphere App" <${GMAIL_EMAIL}>`,
    to: email,
    subject: "Verify Your MotoSphere Email",
    html: `
      <h2>MotoSphere Email Verification</h2>
      <p>Click the button below to verify your email:</p>
      <a href="${verifyUrl}" style="
        display:inline-block;
        padding:10px 20px;
        background-color:#4CAF50;
        color:white;
        text-decoration:none;
        border-radius:5px;
      ">Verify Email</a>
      <p>If you did not request this, ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to", email);
    res.json({ success: true });
  } catch (error: any) {
    console.error("❌ Failed to send email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify email endpoint
 */
app.get("/verify-email", async (req, res) => {
  const token = req.query.token as string;

  if (!token || !verificationStore[token]) {
    return res.status(400).send("Invalid or expired verification link.");
  }

  const uid = verificationStore[token];
  const db = getDb();
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return res.status(404).send("User not found.");
  }

  // Update Firestore
  await updateDoc(userRef, { emailVerified: true });

  // Remove token after verification
  delete verificationStore[token];

  res.send("<h2>✅ Your email has been successfully verified!</h2>");
  console.log(`✅ User ${uid} email verified`);
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Verification server running at http://localhost:${PORT}`);
});
