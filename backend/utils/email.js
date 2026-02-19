const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Check if SendGrid is configured
const useSendGrid = !!process.env.SENDGRID_API_KEY;

if (useSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Nodemailer transporter (fallback)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (useSendGrid) {
      // Use SendGrid
      const msg = {
        to,
        from: process.env.FROM_EMAIL || 'noreply@dllc.com',
        subject,
        text: text || '',
        html: html || text
      };
      await sgMail.send(msg);
    } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use Nodemailer
      await transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@dllc.com',
        to,
        subject,
        text: text || '',
        html: html || text
      });
    } else {
      // Log to console if no email service configured
      console.log('=== EMAIL (No service configured) ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', text || html);
      console.log('=====================================');
    }
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const subject = 'Password Reset Request - DLLC HR Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c2a49;">Password Reset Request</h2>
      <p>You have requested to reset your password for the DLLC HR Portal.</p>
      <p>Please click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #1c2a49; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        This link will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

const sendLeaveApprovalEmail = async (employeeEmail, leaveType, status, comments) => {
  const subject = `Leave Request ${status} - DLLC HR Portal`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c2a49;">Leave Request Update</h2>
      <p>Your ${leaveType} leave request has been <strong>${status.toLowerCase()}</strong>.</p>
      ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        Please log in to the HR portal for more details.
      </p>
    </div>
  `;
  return sendEmail({ to: employeeEmail, subject, html });
};

const sendWelcomeEmail = async (email, fullName, temporaryPassword) => {
  const subject = 'Welcome to DLLC HR Portal';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1c2a49;">Welcome to DLLC HR Portal</h2>
      <p>Hello ${fullName},</p>
      <p>Your account has been created successfully. Here are your login credentials:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
      </div>
      <p style="color: #d9534f;">Please change your password after your first login for security.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'https://payroll-platform-3.preview.emergentagent.com'}" style="background-color: #1c2a49; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendLeaveApprovalEmail,
  sendWelcomeEmail
};