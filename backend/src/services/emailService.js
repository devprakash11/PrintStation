import nodemailer from 'nodemailer';

function getTransporter() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Password reset email is not configured. Missing: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const transporter = getTransporter();
  const productName = 'PrintStation';

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `${productName} — Reset your admin password`,
    text: `Hello ${name || 'Admin'},\n\nWe received a request to reset your PrintStation admin password. Use this link within 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nPrintStation Admin Portal`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f7f5;padding:32px;font-family:Arial,sans-serif;color:#171717"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:32px"><p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e85d2a">PrintStation Admin</p><h1 style="margin:0 0 12px;font-size:28px">Reset your password</h1><p style="color:#666;line-height:1.6">Hello ${name || 'Admin'}, we received a request to reset your PrintStation admin password.</p><p style="margin:24px 0"><a href="${resetUrl}" style="display:inline-block;background:#e85d2a;color:#000;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:9px">Reset password</a></p><p style="color:#777;font-size:13px;line-height:1.6">This link expires in 30 minutes. If you did not request a password reset, you can safely ignore this email.</p></div></body></html>`,
  });
}
