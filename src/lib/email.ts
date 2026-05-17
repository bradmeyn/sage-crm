import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

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
  await resend.emails.send({
    from: 'CRM <noreply@yourdomain.com>',
    to: email,
    subject: `You've been invited to join ${orgName}`,
    html: `<p>${inviterName} has invited you to join <strong>${orgName}</strong>.</p>
           <p><a href="${link}">Accept invitation</a></p>
           <p>This link expires in 48 hours.</p>`,
  })
}
