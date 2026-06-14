import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set — cannot send email')
  }
  _resend ??= new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendInviteEmail({
  inviterName,
  orgName,
  email,
  invitationId,
  baseUrl,
}: {
  inviterName: string
  orgName: string
  email: string
  invitationId: string
  baseUrl: string
}) {
  const link = `${baseUrl}/accept-invitation?id=${invitationId}`
  await getResend().emails.send({
    from: 'CRM <noreply@yourdomain.com>',
    to: email,
    subject: `You've been invited to join ${orgName}`,
    html: `<p>${inviterName} has invited you to join <strong>${orgName}</strong>.</p>
           <p><a href="${link}">Accept invitation</a></p>
           <p>This link expires in 48 hours.</p>`,
  })
}

export async function sendFactFindEmail({
  clientName,
  orgName,
  email,
  link,
  expiresInDays,
}: {
  clientName: string
  orgName: string
  email: string
  link: string
  expiresInDays: number
}) {
  await getResend().emails.send({
    from: 'CRM <noreply@yourdomain.com>',
    to: email,
    subject: `${orgName} — please complete your fact find`,
    html: `<p>Hi ${clientName},</p>
           <p>${orgName} has asked you to complete some details for your financial advice.</p>
           <p><a href="${link}">Open your fact find</a></p>
           <p>You'll be asked to confirm your date of birth to open the form. This link expires in ${expiresInDays} days.</p>`,
  })
}
