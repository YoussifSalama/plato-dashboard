export default function verifyEmailTemplate(
	name: string,
	verifyEmailUrl: string
) {
	return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Verify your email — Plato Hiring</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef2ff;color:#111827;font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#eef2ff;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,0.12);">
            <tr>
              <td style="padding:20px 32px;background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#ffffff;">
                <h1 style="margin:0;font-size:20px;line-height:1.4;">Plato Hiring</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 28px 32px;">
                <h2 style="margin:0 0 12px 0;font-size:20px;color:#111827;">Hi ${name},</h2>
                <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#374151;">
                  Please verify your email address to activate your account.
                </p>
                <div style="margin:0 0 20px 0;">
                  <a href="${verifyEmailUrl}"
                     style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                    Verify Email
                  </a>
                </div>
                <p style="margin:0 0 16px 0;font-size:13px;line-height:1.6;color:#6b7280;">
                  If the button doesn't work, copy and paste this link into your browser:<br />
                  <a href="${verifyEmailUrl}" style="color:#2563eb;text-decoration:none;">${verifyEmailUrl}</a>
                </p>
                <p style="margin:0;font-size:13px;color:#9ca3af;">
                  This link expires in 24 hours. If you did not create an account, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}
