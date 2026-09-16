import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { PageMetadata, CrawlSummary } from '@/types/site-intelligence';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      smtpConfig,
      recipient,
      subject,
      summary,
      pages = [],
      singlePage,
      reportType = 'full-audit'
    }: {
      smtpConfig: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        fromName?: string;
      };
      recipient: string;
      subject?: string;
      summary?: CrawlSummary;
      pages?: PageMetadata[];
      singlePage?: PageMetadata;
      reportType?: 'full-audit' | 'single-page' | 'codebase-audit';
    } = body;

    const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.yourdomain.com';
    const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 465);
    const secure = smtpConfig?.secure !== undefined ? smtpConfig.secure : (process.env.SMTP_SECURE === 'true' || port === 465);
    const user = smtpConfig?.user || process.env.SMTP_USER || '';
    const pass = smtpConfig?.pass || process.env.SMTP_PASS || '';
    const fromName = smtpConfig?.fromName || 'Site Intelligence Platform';

    if (!host || !user || !pass) {
      return NextResponse.json(
        { success: false, message: 'SMTP credentials missing. Please configure Host, Username, and Password.' },
        { status: 400 }
      );
    }

    if (!recipient) {
      return NextResponse.json(
        { success: false, message: 'Recipient email address is required.' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: host.trim(),
      port,
      secure,
      auth: {
        user: user.trim(),
        pass: pass.trim()
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      socketTimeout: 20000
    });

    let emailSubject = subject || 'Site Intelligence SEO Audit Report';
    let htmlContent = '';

    if (reportType === 'single-page' && singlePage) {
      emailSubject = subject || `SEO Audit Report: ${singlePage.title || singlePage.url}`;
      const criticals = singlePage.issues.filter(i => i.type === 'critical');
      const warnings = singlePage.issues.filter(i => i.type === 'warning');

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5, #0ea5e9); padding: 20px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; opacity: 0.85;">Single Page Diagnostic Audit</div>
            <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700;">${singlePage.title || 'Audited HTML Page'}</h1>
            <div style="margin-top: 8px; font-size: 12px; font-family: monospace; word-break: break-all; opacity: 0.95;">${singlePage.url}</div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Status Code</div>
              <div style="font-size: 18px; font-weight: bold; color: ${singlePage.statusCode === 200 ? '#10b981' : '#ef4444'}; margin-top: 4px;">${singlePage.statusCode}</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Word Count</div>
              <div style="font-size: 18px; font-weight: bold; color: #334155; margin-top: 4px;">${singlePage.wordCount} words</div>
            </div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Critical Issues</div>
              <div style="font-size: 18px; font-weight: bold; color: ${criticals.length > 0 ? '#ef4444' : '#10b981'}; margin-top: 4px;">${criticals.length}</div>
            </div>
          </div>

          <h3 style="color: #0f172a; font-size: 15px; margin: 20px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Audit Issues Breakdown (${singlePage.issues.length})</h3>
          <div style="margin-bottom: 20px;">
            ${singlePage.issues.length === 0 ? '<p style="color: #10b981; font-weight: 500;">✓ No technical SEO issues detected on this page.</p>' : singlePage.issues.map(issue => `
              <div style="background: ${issue.type === 'critical' ? '#fef2f2' : issue.type === 'warning' ? '#fffbeb' : '#f8fafc'}; border: 1px solid ${issue.type === 'critical' ? '#fecaca' : issue.type === 'warning' ? '#fde68a' : '#e2e8f0'}; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; color: ${issue.type === 'critical' ? '#b91c1c' : issue.type === 'warning' ? '#b45309' : '#334155'};">
                  <span>[${issue.code}] ${issue.category}</span>
                  <span style="text-transform: uppercase;">${issue.type}</span>
                </div>
                <div style="font-size: 13px; color: #1e293b; margin-top: 4px;">${issue.message}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 4px; font-style: italic;">Fix: ${issue.recommendation}</div>
              </div>
            `).join('')}
          </div>

          <div style="background: #f1f5f9; border-radius: 8px; padding: 14px; font-size: 12px; color: #475569; line-height: 1.5;">
            <div><strong>Canonical Tag:</strong> ${singlePage.canonicalUrl || 'None (Missing)'}</div>
            <div><strong>Schema.org JSON-LD:</strong> ${singlePage.schemaValid ? 'Valid ' + singlePage.pageType : 'Missing or Incomplete'}</div>
            <div><strong>Missing Image Alts:</strong> ${singlePage.imagesWithoutAlt || 0} of ${singlePage.totalImages || 0}</div>
          </div>
          
          <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Sent securely via SMTP relay (${host}) by Site Intelligence Platform.
          </div>
        </div>
      `;
    } else {
      // Full Crawl / Codebase Executive Audit Report
      const totalPages = pages.length;
      const criticalCount = pages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'critical').length || 0), 0);
      const warningCount = pages.reduce((acc, p) => acc + (p.issues?.filter(i => i.type === 'warning').length || 0), 0);
      const schemaValidCount = pages.filter(p => p.schemaValid).length;
      const topIssues = pages.flatMap(p => (p.issues || []).map(i => ({ ...i, pageUrl: p.url, pageTitle: p.title }))).filter(i => i.type === 'critical').slice(0, 8);

      emailSubject = subject || `Executive SEO Audit Report (${totalPages} Pages Audited)`;

      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e1b4b, #312e81, #4338ca); padding: 24px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 1.5px; color: #a5b4fc;">Executive Site Intelligence Report</div>
            <h1 style="margin: 6px 0 4px 0; font-size: 22px; font-weight: 800;">SEO & Architecture Audit Summary</h1>
            <p style="margin: 0; font-size: 13px; color: #c7d2fe;">Automated crawl and code inspection report generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase;">Total Pages</div>
              <div style="font-size: 20px; font-weight: 800; color: #1e293b; margin-top: 2px;">${totalPages}</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #dc2626; font-weight: 700; text-transform: uppercase;">Critical Flags</div>
              <div style="font-size: 20px; font-weight: 800; color: #dc2626; margin-top: 2px;">${criticalCount}</div>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #d97706; font-weight: 700; text-transform: uppercase;">Warnings</div>
              <div style="font-size: 20px; font-weight: 800; color: #d97706; margin-top: 2px;">${warningCount}</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #16a34a; font-weight: 700; text-transform: uppercase;">Schema Coverage</div>
              <div style="font-size: 20px; font-weight: 800; color: #16a34a; margin-top: 2px;">${totalPages > 0 ? Math.round((schemaValidCount / totalPages) * 100) : 0}%</div>
            </div>
          </div>

          <h3 style="color: #0f172a; font-size: 15px; margin: 24px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Top Priority Critical Issues</h3>
          <div style="margin-bottom: 20px;">
            ${topIssues.length === 0 ? '<p style="color: #10b981; font-weight: 500;">✓ Excellent: No critical blocker issues identified in this audit run.</p>' : topIssues.map(issue => `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px;">
                <div style="font-size: 11px; font-weight: bold; color: #b91c1c;">[${issue.code}] ${issue.message}</div>
                <div style="font-size: 12px; color: #475569; margin-top: 3px; font-family: monospace;">Page: ${issue.pageUrl}</div>
                <div style="font-size: 12px; color: #1e293b; margin-top: 4px; font-style: italic;">Action: ${issue.recommendation}</div>
              </div>
            `).join('')}
          </div>

          <h3 style="color: #0f172a; font-size: 15px; margin: 24px 0 10px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Audited Pages Overview (${pages.slice(0, 10).length} of ${pages.length})</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 11px;">
                <th style="padding: 8px 10px;">URL / Title</th>
                <th style="padding: 8px 10px;">Status</th>
                <th style="padding: 8px 10px;">Type</th>
                <th style="padding: 8px 10px;">Issues</th>
              </tr>
            </thead>
            <tbody>
              ${pages.slice(0, 10).map(page => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 8px 10px;">
                    <div style="font-weight: 600; color: #1e293b;">${page.title || 'Untitled'}</div>
                    <div style="font-size: 11px; color: #64748b; font-family: monospace;">${page.url}</div>
                  </td>
                  <td style="padding: 8px 10px; font-weight: bold; color: ${page.statusCode === 200 ? '#16a34a' : '#dc2626'};">${page.statusCode}</td>
                  <td style="padding: 8px 10px; color: #475569;">${page.pageType}</td>
                  <td style="padding: 8px 10px;">
                    <span style="font-weight: bold; color: ${page.issues.filter(i => i.type === 'critical').length > 0 ? '#dc2626' : '#16a34a'};">
                      ${page.issues.length} issues
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            Dispatched via SMTP relay (${host}) &bull; Site Intelligence Enterprise SEO Engine.
          </div>
        </div>
      `;
    }

    const info = await transporter.sendMail({
      from: `"${fromName}" <${user.trim()}>`,
      to: recipient.trim(),
      subject: emailSubject,
      html: htmlContent
    });

    return NextResponse.json({
      success: true,
      message: `Audit email report sent successfully to ${recipient}.`,
      messageId: info.messageId,
      accepted: info.accepted
    });

  } catch (error: any) {
    console.error('Error sending audit report email:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to dispatch email report via SMTP relay.',
        code: error?.code || 'SMTP_SEND_FAILED'
      },
      { status: 500 }
    );
  }
}
