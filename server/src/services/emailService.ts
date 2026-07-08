import nodemailer from 'nodemailer';
import { GASService } from './gasService';

export class EmailService {
  /**
   * Helper to check if SMTP settings are fully configured in environmental variables.
   */
  public static isSMTPConfigured(): boolean {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  /**
   * Sends a beautifully formatted registration invitation email to the designated institution POC.
   */
  public static async sendInvitationEmail(params: {
    to: string;
    registrationLink: string;
    institutionName: string;
    amount: number;
    transactionId: string;
    eventName?: string;
  }): Promise<{ success: boolean; mode: 'SMTP' | 'GAS' | 'MOCK'; error?: string }> {
    const { to, registrationLink, institutionName, amount, transactionId, eventName } = params;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const fullRegistrationUrl = `${clientUrl.replace(/\/$/, '')}${registrationLink}`;

    const subject = `Official Registration Invitation - ANVESHA 2026 (Ref: ${transactionId})`;
    const textContent = `
Dear Principal / Event Coordinator,

We have verified your registration fee transaction of ₹${amount} for ${institutionName} through the SIB Feebook Portal.

Please complete your official student roster submission using the link below:
${fullRegistrationUrl}

Details:
- Institution Name: ${institutionName}
- Transaction ID: ${transactionId}
- Verified Amount: ₹${amount}
${eventName ? `- Target Event: ${eventName}\n` : ''}

ANVESHA 2026 Secretariat
Christ University, Bengaluru
    `.trim();

    const htmlContent = `
<div style="background-color: #f8fafc; padding: 40px 10px; font-family: 'Inter', -apple-system, sans-serif; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
    <!-- Header Banner -->
    <div style="background-color: #002147; padding: 32px; text-align: center; border-bottom: 4px solid #C5A059;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; font-family: 'Merriweather', Georgia, serif; letter-spacing: 1px;">ANVESHA 2026</h1>
      <p style="color: #C5A059; margin: 6px 0 0 0; font-size: 12px; font-weight: 650; letter-spacing: 2px; text-transform: uppercase;">Christ University Inter PU Fest</p>
    </div>
    
    <!-- Body Content -->
    <div style="padding: 40px 32px;">
      <h2 style="margin-top: 0; color: #002147; font-family: 'Merriweather', Georgia, serif; font-size: 20px; font-weight: 700;">Official Registration Invitation</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
        Dear Principal / Event Coordinator,
      </p>
      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
        We are pleased to inform you that we have verified your registration fee transaction for <strong>${institutionName}</strong> through the SIB Feebook Portal. 
      </p>
      
      <!-- Transaction Detail Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
        <h4 style="margin: 0 0 12px 0; color: #002147; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Payment Roster Record</h4>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500; width: 140px;">Institution:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${institutionName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Transaction ID:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600; font-family: monospace;">${transactionId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount Verified:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: 700;">₹${amount}</td>
          </tr>
          ${eventName ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Selected Event:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${eventName}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
        Please click the button below to complete and submit the official student roster.
      </p>

      <!-- Action Button -->
      <div style="text-align: center; margin-bottom: 35px;">
        <a href="${fullRegistrationUrl}" target="_blank" style="display: inline-block; background-color: #C5A059; color: #002147; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 8px; border: 1px solid #b59049; text-transform: uppercase; letter-spacing: 0.5px;">Complete Registration</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
      
      <p style="font-size: 11px; line-height: 1.5; color: #94a3b8; margin: 0; text-align: center;">
        This invitation is tied to the transaction reference above. Do not forward this link.
        <br />
        © 2026 Christ University, Bengaluru. ANVESHA Inter PU Fest Secretariat.
      </p>
    </div>
  </div>
</div>
    `.trim();

    // 1. Try SMTP if configured
    if (this.isSMTPConfigured()) {
      try {
        console.log(`[Email Service - SMTP] Dispatching real email to: ${to}`);
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || `"ANVESHA 2026" <${process.env.SMTP_USER}>`,
          to,
          subject,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[Email Service - SMTP] Dispatch successful to: ${to}`);
        return { success: true, mode: 'SMTP' };
      } catch (smtpErr: any) {
        console.error(`[Email Service - SMTP Error] Failed to send via SMTP:`, smtpErr);
        // Fall through to Apps Script if SMTP fails, or bubble up
      }
    }

    // 2. Try Google Apps Script email bridge if configured
    if (GASService.isConfigured()) {
      try {
        console.log(`[Email Service - GAS Bridge] Dispatching real email through Google Apps Script to: ${to}`);
        const gasRes = await GASService.querySheet('SEND_EMAIL', {
          to,
          subject,
          body: textContent,
          htmlBody: htmlContent,
        });

        if (gasRes && gasRes.success) {
          console.log(`[Email Service - GAS Bridge] Dispatch successful to: ${to}`);
          return { success: true, mode: 'GAS' };
        } else {
          console.error(`[Email Service - GAS Bridge Error] GAS reported failure:`, gasRes?.error || 'Unknown error');
        }
      } catch (gasErr: any) {
        console.error(`[Email Service - GAS Bridge Error] Exception when sending via GAS:`, gasErr);
      }
    }

    // 3. Fallback to mock log
    console.log(`\n======================================================`);
    console.log(`📬 [MOCK EMAIL SENT - NO OUTBOUND SERVICES CONFIGURED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body Link: ${fullRegistrationUrl}`);
    console.log(`======================================================\n`);
    return { success: true, mode: 'MOCK' };
  }
}
