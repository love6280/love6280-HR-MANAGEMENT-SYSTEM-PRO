import nodemailer from 'nodemailer';

let transporter;

const createTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal fallback or console logging fallback
    console.log('SMTP credentials not configured. Using console logger for emails.');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('====================================');
        console.log('EMAIL SENT (MOCK):');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Text: ${mailOptions.text}`);
        if (mailOptions.html) {
          console.log(`HTML: ${mailOptions.html.substring(0, 300)}...`);
        }
        console.log('====================================');
        return { messageId: 'mock-id-' + Date.now() };
      }
    };
  }
};

await createTransporter().catch(console.error);

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'HRMS Pro'}" <${process.env.FROM_EMAIL || 'noreply@hrms.com'}>`,
      to,
      subject,
      text,
      html,
    });
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    return null;
  }
};

export default transporter;
