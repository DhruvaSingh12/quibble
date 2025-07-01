import nodemailer from 'nodemailer';

// Create transporter using SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendOTPEmail(email: string, otp: string, username: string) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Quibble'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your email - Quibble',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9f9f9;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Quibble</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Welcome to our community!</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${username}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Thanks for signing up for Quibble! To complete your registration, please verify your email address using the verification code below:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f3f4f6; border: 2px dashed #8b5cf6; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Verification Code</p>
                <div style="background-color: white; border-radius: 6px; padding: 20px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <span style="color: #8b5cf6; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 4px;">${otp}</span>
                </div>
              </div>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
                This code will expire in <strong>10 minutes</strong>. If you didn't create an account with Quibble, please ignore this email.
              </p>
              
              <!-- Tips -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 0 6px 6px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Security tip:</strong> Never share this verification code with anyone. Quibble will never ask for your verification code via phone or email.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                © 2025 Quibble. All rights reserved.
              </p>
              <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${username}!

Thanks for signing up for Quibble! To complete your registration, please verify your email address using the verification code below:

Verification Code: ${otp}

This code will expire in 10 minutes. If you didn't create an account with Quibble, please ignore this email.

Security tip: Never share this verification code with anyone. Quibble will never ask for your verification code via phone or email.

© 2025 Quibble. All rights reserved.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
