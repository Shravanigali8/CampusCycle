// Email service - supports SendGrid, Resend, or console logging (dev)

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  const subject = 'Verify your CampusCycle account';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to CampusCycle!</h2>
          <p>Thanks for signing up. Please verify your email address by clicking the button below:</p>
          <a href="${link}" class="button">Verify Email</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;">${link}</p>
          <p>This link will expire in 24 hours.</p>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  const text = `Welcome to CampusCycle! Verify your email by visiting: ${link}`;

  await sendEmail({ to: email, subject, html, text });
}

async function sendEmail(options: EmailOptions): Promise<void> {
  // Try Resend first (simpler API)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'CampusCycle <noreply@campuscycle.app>',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (response.ok) {
        console.log(`✅ Email sent via Resend to ${options.to}`);
        return;
      } else {
        const error = await response.text();
        console.error('Resend error:', error);
        throw new Error('Resend failed');
      }
    } catch (error) {
      console.error('Resend email failed, trying SendGrid...', error);
    }
  }

  // Try SendGrid
  if (process.env.SMTP_PASS && process.env.SMTP_HOST === 'smtp.sendgrid.net') {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SMTP_PASS}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: process.env.SMTP_FROM || 'noreply@campuscycle.app' },
          subject: options.subject,
          content: [
            { type: 'text/plain', value: options.text || options.html },
            { type: 'text/html', value: options.html },
          ],
        }),
      });

      if (response.ok) {
        console.log(`✅ Email sent via SendGrid to ${options.to}`);
        return;
      } else {
        const error = await response.text();
        console.error('SendGrid error:', error);
        throw new Error('SendGrid failed');
      }
    } catch (error) {
      console.error('SendGrid email failed:', error);
    }
  }

  // Fallback: Log to console (development)
  console.log('📧 Email (not sent - no email service configured):');
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Link: ${options.html.match(/https?:\/\/[^\s"<>]+/)?.[0] || 'N/A'}`);
  console.log('\n💡 To enable email sending, set up Resend or SendGrid in environment variables.');
}
