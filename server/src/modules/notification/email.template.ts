export const emailTheme = {
  brand: "#000000",
  brandText: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6b7280",
  bg: "#ffffff",
  bgSubtle: "#f9f9f9",
  border: "#e5e7eb",
  danger: "#e11d48",
} as const;

export type EmailTheme = typeof emailTheme;

export function buildWelcomeEmail(displayName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:${emailTheme.bgSubtle}; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailTheme.bgSubtle};">
      <tr>
        <td align="center" style="padding:24px 12px;">

          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
            style="max-width:480px; width:100%; background-color:${emailTheme.bg}; border:1px solid ${emailTheme.border}; border-radius:8px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding:32px;">

                <h1 style="margin:0 0 16px 0; font-size:22px; font-weight:700; color:${emailTheme.brand}; line-height:1.3;">
                  Welcome to Huddle, ${displayName}! 👋
                </h1>

                <p style="margin:0 0 16px 0; font-size:15px; color:${emailTheme.text}; line-height:1.6;">
                  We're glad you're here. Your account is set up and ready — you can start a conversation or jump into a call whenever you like.
                </p>

                <p style="margin:0 0 24px 0; font-size:15px; color:${emailTheme.text}; line-height:1.6;">
                  Huddle is built for fast, real-time conversations with the people who matter to you.
                </p>

                <p style="margin:0; font-size:13px; color:${emailTheme.textMuted}; line-height:1.6; border-top:1px solid ${emailTheme.border}; padding-top:16px;">
                  If you didn't create this account, you can safely ignore this email or contact supporemailTheme.
                </p>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function buildPasswordResetEmail(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:${emailTheme.bgSubtle}; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailTheme.bgSubtle};">
      <tr>
        <td align="center" style="padding:24px 12px;">

          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
            style="max-width:480px; width:100%; background-color:${emailTheme.bg}; border:1px solid ${emailTheme.border}; border-radius:8px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding:32px;">

                <h2 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:${emailTheme.brand}; line-height:1.3;">
                  Reset your password
                </h2>

                <p style="margin:0 0 8px 0; font-size:15px; color:${emailTheme.text}; line-height:1.6;">
                  You requested a password reset for your Huddle account. Use the code below to continue:
                </p>

                <!-- the code: big, spaced, long-press / double-click selects it cleanly -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                  <tr>
                    <td align="center" bgcolor="${emailTheme.bgSubtle}" style="padding:20px; border:1px solid ${emailTheme.border}; border-radius:8px;">
                      <span style="font-family:'SF Mono', Menlo, Consolas, monospace; font-size:34px; font-weight:700; letter-spacing:10px; color:${emailTheme.brand};">
                        ${otp}
                      </span>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 16px 0; font-size:14px; color:${emailTheme.textMuted}; line-height:1.6;">
                  This code expires in 10 minutes. Don'emailTheme share it with anyone — Huddle staff will never ask for it.
                </p>

                <p style="margin:0; font-size:13px; color:${emailTheme.textMuted}; line-height:1.6; border-top:1px solid ${emailTheme.border}; padding-top:16px;">
                  If you didn't request this, you can safely ignore this email. Your password won't change.
                </p>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}

export function buildPasswordChangedEmail(
  accountEmail: string,
  changedAt: Date,
): string {
  const when = changedAt.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:${emailTheme.bgSubtle}; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailTheme.bgSubtle};">
      <tr>
        <td align="center" style="padding:24px 12px;">

          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
            style="max-width:480px; width:100%; background-color:${emailTheme.bg}; border:1px solid ${emailTheme.border}; border-radius:8px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding:32px;">

                <h2 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:${emailTheme.brand}; line-height:1.3;">
                  Your password was changed
                </h2>

                <p style="margin:0 0 8px 0; font-size:15px; color:${emailTheme.text}; line-height:1.6;">
                  This is a confirmation that the password for your Huddle account
                  (<strong>${accountEmail}</strong>) was changed on ${when}.
                </p>

                <!-- the security warning: danger colour, left accent — the part they must notice -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td bgcolor="${emailTheme.bgSubtle}" style="padding:16px; border-left:4px solid ${emailTheme.danger}; border-radius:4px;">
                      <p style="margin:0 0 6px 0; font-size:15px; font-weight:600; color:${emailTheme.danger};">
                        Didn't do this?
                      </p>
                      <p style="margin:0; font-size:14px; color:${emailTheme.text}; line-height:1.6;">
                        Your account may be at risk. Reset your password immediately and contact support if you can't regain access.
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; font-size:13px; color:${emailTheme.textMuted}; line-height:1.6; border-top:1px solid ${emailTheme.border}; padding-top:16px;">
                  This is an automated security notification from Huddle. Please don't reply to this message.
                </p>

              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`.trim();
}
