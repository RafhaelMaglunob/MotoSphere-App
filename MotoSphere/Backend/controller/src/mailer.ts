import nodemailer from 'nodemailer';
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra as {
    GMAIL_USER: string;
    GMAIL_APP_PASSWORD: string;
};



export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: extra.GMAIL_USER,
        pass: extra.GMAIL_APP_PASSWORD
    }
});
