export const runtime = 'nodejs';
export const maxDuration = 30;

import { NextResponse } from 'next/server';
import { withApi, handleOptions } from '../../_lib/middleware/handler';
import { sendEmail } from '../../_lib/utils/email';
import logger from '../../_lib/utils/logger';

export const OPTIONS = handleOptions(['POST']);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Replaces the `send-contact-email` Supabase Edge Function — same request/response shape. */
export const POST = withApi(
  async (req) => {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (name.length > 100 || subject.length > 200 || message.length > 5000 || email.length > 255 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    try {
      await sendEmail({
        to: 'vk5457396@gmail.com',
        from: 'AI Assistants Contact <onboarding@resend.dev>',
        subject: `Contact Form: ${safeSubject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #6366f1;">New Contact Form Submission</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Name:</strong> ${safeName}</p>
              <p><strong>Email:</strong> ${safeEmail}</p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
            </div>
            <div style="background: #fff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="margin-top: 0;">Message:</h3>
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      logger.error('Contact email failed', { detail: (error as Error)?.message });
      return NextResponse.json({ error: 'Failed to send email' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  },
  { rateLimit: { scope: 'contact-send', max: 10 } }
);
