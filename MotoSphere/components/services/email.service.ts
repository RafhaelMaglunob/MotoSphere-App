export const sendVerificationEmail = async (
  email: string,
  code: string
) => {
  const res = await fetch('http://YOUR_IP:3000/api/send-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  if (!res.ok) {
    throw new Error('Email failed');
  }
};
