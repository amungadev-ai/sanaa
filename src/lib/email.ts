/**
 * Email Service — Nodemailer with mail.sanaathrumylens.co.ke
 *
 * Environment variables:
 *   EMAIL_HOST=mail.sanaathrumylens.co.ke
 *   EMAIL_PORT=465
 *   EMAIL_USER=verification@sanaathrumylens.co.ke
 *   EMAIL_PASS=<password>
 *   EMAIL_SECURE=true
 */

import { createTransport, Transporter } from "nodemailer";

// Singleton transporter — created once and reused
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = process.env.EMAIL_PORT || process.env.SMTP_PORT;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = createTransport({
      host,
      port: Number(port) || 465,
      secure: process.env.EMAIL_SECURE === "true" || Number(port) === 465,
      auth: {
        user,
        pass,
      },
      // Connection timeout settings
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return transporter;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using the configured SMTP server
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`[DEV] Email to ${options.to}: ${options.subject}`);
    return false;
  }

  try {
    const fromEmail = process.env.EMAIL_USER || "verification@sanaathrumylens.co.ke";

    await mailer.sendMail({
      from: `"Sanaa Through My Lens" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || undefined,
    });

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    // Reset transporter on failure so it reconnects on next attempt
    transporter = null;
    return false;
  }
}

/**
 * Send OTP/verification code email
 */
export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Your Verification Code — Sanaa Through My Lens",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 32px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">Sanaa Through My Lens</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #1a1a1a; font-size: 16px; margin-bottom: 24px;">Your verification code is:</p>
          <div style="background: #f8f8f8; padding: 20px; text-align: center; font-size: 36px; font-weight: bold; letter-spacing: 10px; border-radius: 8px; color: #1a1a2e;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">This code expires in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #f8f8f8; padding: 16px 32px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Sanaa Through My Lens — Arts & Culture Blog</p>
        </div>
      </div>
    `,
    text: `Your verification code is: ${code}. This code expires in 10 minutes.`,
  });
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `https://sanaathrumylens.co.ke/auth/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Verify Your Email — Sanaa Through My Lens",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 32px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">Sanaa Through My Lens</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #1a1a1a; font-size: 16px;">Please verify your email address to activate your account:</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${verifyUrl}" style="background: #1a1a2e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px;">Verify Email Address</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link to your browser:</p>
          <p style="color: #4a90d9; font-size: 13px; word-break: break-all;">${verifyUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">This link expires in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.</p>
        </div>
        <div style="background: #f8f8f8; padding: 16px 32px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Sanaa Through My Lens — Arts & Culture Blog</p>
        </div>
      </div>
    `,
    text: `Welcome ${name}! Please verify your email by visiting: ${verifyUrl}. This link expires in 24 hours.`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const resetUrl = `https://sanaathrumylens.co.ke/auth/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Password Reset — Sanaa Through My Lens",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 32px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">Sanaa Through My Lens</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin-top: 0;">Password Reset</h2>
          <p style="color: #1a1a1a; font-size: 16px;">You requested a password reset. Click the button below to set a new password:</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${resetUrl}" style="background: #1a1a2e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy this link to your browser:</p>
          <p style="color: #4a90d9; font-size: 13px; word-break: break-all;">${resetUrl}</p>
          <p style="color: #666; font-size: 14px; margin-top: 24px;">This link expires in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background: #f8f8f8; padding: 16px 32px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Sanaa Through My Lens — Arts & Culture Blog</p>
        </div>
      </div>
    `,
    text: `Password reset requested. Visit this link to reset: ${resetUrl}. This link expires in 1 hour.`,
  });
}

/**
 * Send welcome email after sign-up
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: "Welcome to Sanaa Through My Lens!",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 32px; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 20px;">Sanaa Through My Lens</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin-top: 0;">Welcome, ${name}! 🎉</h2>
          <p style="color: #1a1a1a; font-size: 16px;">Thank you for joining <strong>Sanaa Through My Lens</strong> — your new home for arts and culture in East Africa.</p>
          <p style="color: #1a1a1a; font-size: 16px;">Here's what you can do:</p>
          <ul style="color: #1a1a1a; font-size: 16px; line-height: 1.8;">
            <li>Read and comment on articles about art, music, film, and culture</li>
            <li>Bookmark your favourite stories to read later</li>
            <li>Subscribe to our newsletter for weekly highlights</li>
            <li>Stay updated on upcoming events and exhibitions</li>
          </ul>
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://sanaathrumylens.co.ke" style="background: #1a1a2e; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 16px;">Start Reading</a>
          </div>
        </div>
        <div style="background: #f8f8f8; padding: 16px 32px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">Sanaa Through My Lens — Arts & Culture Blog</p>
        </div>
      </div>
    `,
    text: `Welcome ${name}! Thank you for joining Sanaa Through My Lens. Start reading at https://sanaathrumylens.co.ke`,
  });
}
