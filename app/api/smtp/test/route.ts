import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      host = process.env.SMTP_HOST || 'smtp.yourdomain.com',
      port = Number(process.env.SMTP_PORT) || 465,
      secure = process.env.SMTP_SECURE === 'true' || port === 465,
      user = process.env.SMTP_USER || '',
      pass = process.env.SMTP_PASS || '',
      sendPing = false,
      recipient = ''
    } = body;

    if (!host || !user || !pass) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing SMTP credentials. Please provide Host, Username, and Password.' 
        },
        { status: 400 }
      );
    }

    // Configure Nodemailer transporter for custom/standard SMTP
    const transporter = nodemailer.createTransport({
      host: host.trim(),
      port: Number(port),
      secure: Boolean(secure),
      auth: {
        user: user.trim(),
        pass: pass.trim()
      },
      tls: {
        // Allows self-signed or shared certificates common in mail hosting
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    // Verify SMTP connection
    const startTime = Date.now();
    await transporter.verify();
    const latency = Date.now() - startTime;

    let pingResult = null;
    if (sendPing && recipient) {
      const info = await transporter.sendMail({
        from: `Site Intelligence <${user.trim()}>`,
        to: recipient.trim(),
        subject: '✓ SMTP Test Ping — Site Intelligence Platform',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 16px; border-radius: 8px; color: #ffffff; text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 20px; font-weight: bold;">SMTP Connection Verified</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Site Intelligence Platform Integration</p>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
              Your SMTP relay integration is active and operating normally. Automated crawl alerts, executive audit summaries, and schema change notifications can now be dispatched securely through your email server.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace; font-size: 12px; color: #1e293b;">
              <div><strong>Host:</strong> ${host}</div>
              <div><strong>Port:</strong> ${port} (${secure ? 'SSL/TLS' : 'STARTTLS'})</div>
              <div><strong>Sender Account:</strong> ${user}</div>
              <div><strong>Server Latency:</strong> ${latency}ms</div>
              <div><strong>Timestamp:</strong> ${new Date().toUTCString()}</div>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center;">
              Dispatched automatically by Site Intelligence Enterprise Crawler Engine.
            </p>
          </div>
        `
      });
      pingResult = {
        messageId: info.messageId,
        accepted: info.accepted
      };
    }

    return NextResponse.json({
      success: true,
      message: `Successfully connected to SMTP server (${host}:${port}) in ${latency}ms.`,
      latencyMs: latency,
      ping: pingResult
    });

  } catch (error: any) {
    console.error('SMTP Connection verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to authenticate with SMTP server. Please verify your host, port, and email credentials.',
        code: error?.code || 'SMTP_CONNECTION_FAILED'
      },
      { status: 500 }
    );
  }
}
