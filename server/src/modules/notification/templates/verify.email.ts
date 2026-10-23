import { emailTheme as t } from "../email.theme";

export function buildVerifyEmail(
  verifyUrl: string,
  ttsHours: number,
  displayName?: string,
): string {
  const greetingName = displayName?.trim() || "there";

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background-color:${t.bgSubtle}; -webkit-text-size-adjust:100%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${t.bgSubtle};">
      <tr>
        <td align="center" style="padding:24px 12px;">

          <table role="presentation" width="480" cellpadding="0" cellspacing="0"
            style="max-width:480px; width:100%; background-color:${t.bg}; border:1px solid ${t.border}; border-radius:8px; font-family:-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <tr>
              <td style="padding:32px;">

                <h2 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:${t.brand}; line-height:1.3;">
                  Confirm your email
                </h2>

                <p style="margin:0 0 8px 0; font-size:15px; color:${t.text}; line-height:1.6;">
                  Hi ${greetingName}, thanks for signing up for Huddle. Confirm this email address to activate your account.
                </p>

                <!-- button: a table with bgcolor, NOT a styled <a> (Outlook strips padding/bg on links) -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
                  <tr>
                    <td align="center" bgcolor="${t.brand}" style="border-radius:6px;">
                      <a href="${verifyUrl}"
                        style="display:inline-block; padding:12px 32px; font-size:15px; font-weight:600; color:${t.brandText}; text-decoration:none;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- plain-text fallback: some clients mangle the button; always give the raw link -->
                <p style="margin:0 0 20px 0; font-size:13px; color:${t.textMuted}; line-height:1.6;">
                  If the button doesn't work, copy and paste this link into your browser:
                  <br />
                  <a href="${verifyUrl}" style="color:${t.brand}; word-break:break-all;">${verifyUrl}</a>
                </p>

                <p style="margin:0 0 16px 0; font-size:14px; color:${t.textMuted}; line-height:1.6;">
                  This link expires in ${ttsHours} hours. For your security, it can only be used once.
                </p>

                <p style="margin:0; font-size:13px; color:${t.textMuted}; line-height:1.6; border-top:1px solid ${t.border}; padding-top:16px;">
                  If you didn't sign up for Huddle, you can safely ignore this email — no account will be activated.
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
