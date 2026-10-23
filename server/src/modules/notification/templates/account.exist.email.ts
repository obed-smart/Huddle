// modules/notification/templates/account-exists.template.ts
import { emailTheme as t } from "../email.theme";

export function buildAccountExistsEmail(
  loginUrl: string,
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
                  You already have a Huddle account
                </h2>

                <p style="margin:0 0 8px 0; font-size:15px; color:${t.text}; line-height:1.6;">
                  Hi ${greetingName}, someone tried to sign up for Huddle with this email address, but you already have an account. There's nothing new to set up.
                </p>

                <p style="margin:0 0 8px 0; font-size:15px; color:${t.text}; line-height:1.6;">
                  Just log in with your existing details:
                </p>

                <!-- button: table with bgcolor, NOT a styled <a> (Outlook strips padding/bg on links) -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;">
                  <tr>
                    <td align="center" bgcolor="${t.brand}" style="border-radius:6px;">
                      <a href="${loginUrl}"
                        style="display:inline-block; padding:12px 32px; font-size:15px; font-weight:600; color:${t.brandText}; text-decoration:none;">
                        Log In
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 16px 0; font-size:14px; color:${t.textMuted}; line-height:1.6;">
                  Forgot your password? Use the "Forgot password" link on the login page to reset it.
                </p>

                <p style="margin:0; font-size:13px; color:${t.textMuted}; line-height:1.6; border-top:1px solid ${t.border}; padding-top:16px;">
                  If this wasn't you, you can safely ignore this email — your account hasn't changed and no new account was created.
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
