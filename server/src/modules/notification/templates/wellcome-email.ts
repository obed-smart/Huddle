import { emailTheme } from "../email.theme";

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
