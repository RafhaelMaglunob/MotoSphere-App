import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sendVerification from './sendVerification';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', sendVerification);

app.listen(3000, () => {
  console.log('🚀 Email server running');
});
