import nodemailer, { type Transporter } from "nodemailer";

interface WorkFromHomeEmailParams {
  employeeName: string;
  employeeEmail: string;
  employeeId?: string;
  departmentName?: string;
  leadName: string;
  leadEmail: string;
  checkInTime: string;
  date: string;
  notes?: string;
}

let transporterInstance: Transporter | null = null;

function getEmailTransporter() {
  if (transporterInstance) return transporterInstance;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else if (user && pass) {
    // Direct Gmail service connection
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  } else {
    // Development fallback transporter (logs to console/stream)
    transporterInstance = nodemailer.createTransport({
      streamTransport: true,
      newline: "windows",
      buffer: true,
    });
  }

  return transporterInstance;
}

/**
 * Sends a notification email to the team lead (manimehalaidigitechzo@gmail.com)
 * when an employee / team member checks in with "Work from Home"
 */
export async function sendWorkFromHomeEmail(params: WorkFromHomeEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    const transporter = getEmailTransporter();
    const fromAddress =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      `"Digitechzo WorkOS" <manimehalaidigitechzo@gmail.com>`;

    const primaryLeadEmail =
      process.env.LEAD_NOTIFICATION_EMAIL || "manimehalaidigitechzo@gmail.com";

    // Ensure manimehalaidigitechzo@gmail.com is always included as recipient
    const recipientList = Array.from(
      new Set(
        [
          primaryLeadEmail,
          params.leadEmail,
          "manimehalaidigitechzo@gmail.com",
        ].filter(Boolean)
      )
    ).join(", ");

    const subject = `[Work from Home] ${params.employeeName} checked in remotely - ${params.date}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Work From Home Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 24px 28px; color: #ffffff; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
          .title { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
          .subtitle { margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe; }
          .content { padding: 28px; }
          .info-table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 20px; }
          .info-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
          .info-table td.label { font-weight: 600; color: #64748b; width: 35%; }
          .info-table td.value { color: #0f172a; font-weight: 500; }
          .notes-box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #334155; margin-top: 8px; }
          .footer { background: #f8fafc; padding: 16px 28px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">🏠 Work From Home Alert</span>
            <h1 class="title">Team Member Check-In Notice</h1>
            <p class="subtitle">Digitechzo WorkOS • Automated Attendance Dispatch</p>
          </div>
          <div class="content">
            <p style="font-size: 14px; margin-top: 0; line-height: 1.5;">
              Hello <strong>${params.leadName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
              This is to inform you that <strong>${params.employeeName}</strong> has checked in with the work type <strong>Work from Home</strong> for today.
            </p>

            <table class="info-table">
              <tr>
                <td class="label">Team Member</td>
                <td class="value"><strong>${params.employeeName}</strong> (${params.employeeEmail})</td>
              </tr>
              ${params.employeeId ? `<tr><td class="label">Employee ID</td><td class="value">${params.employeeId}</td></tr>` : ""}
              ${params.departmentName ? `<tr><td class="label">Department</td><td class="value">${params.departmentName}</td></tr>` : ""}
              <tr>
                <td class="label">Date</td>
                <td class="value">${params.date}</td>
              </tr>
              <tr>
                <td class="label">Punch-In Time</td>
                <td class="value"><strong>${params.checkInTime}</strong></td>
              </tr>
              <tr>
                <td class="label">Work Type</td>
                <td class="value"><span style="color: #2563eb; font-weight: 700;">🏠 Work from Home</span></td>
              </tr>
            </table>

            ${
              params.notes
                ? `<div style="margin-top: 16px;">
                    <strong style="font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Note / Reason:</strong>
                    <div class="notes-box">${params.notes}</div>
                   </div>`
                : ""
            }

            <p style="font-size: 13px; color: #64748b; margin-top: 24px; line-height: 1.5;">
              You can monitor their active breaks, daily tasks, and updates directly from the Digitechzo WorkOS Lead Dashboard.
            </p>
          </div>
          <div class="footer">
            Digitechzo WorkOS • Internal Attendance & Workforce Management
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipientList,
      subject,
      html: htmlContent,
      text: `${params.employeeName} (${params.employeeEmail}) has checked in as Work from Home on ${params.date} at ${params.checkInTime}.\nNotes: ${params.notes || "None"}\nRecipient: ${recipientList}`,
    });

    console.log(`[Email] Work from Home email sent to ${recipientList} for ${params.employeeName}. MessageId:`, info.messageId || "streamed");

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Email] Failed to send Work from Home email:", error);
    return { success: false, error: error?.message || "Email sending error" };
  }
}
