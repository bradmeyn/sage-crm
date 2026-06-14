import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db } from "@/db/index";
import * as schema from "@/db/schema";
import { sendInviteEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [
    tanstackStartCookies(),
    organization({
      allowUserToCreateOrganization: true,
      sendInvitationEmail: async (data) => {
        await sendInviteEmail({
          inviterName: data.inviter.user.name,
          orgName: data.organization.name,
          email: data.email,
          invitationId: data.invitation.id,
          baseUrl: process.env.BETTER_AUTH_URL!,
        });
      },
    }),
  ],
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
        fieldName: "firstName",
      },
      lastName: {
        type: "string",
        required: false,
        fieldName: "lastName",
      },
      phone: {
        type: "string",
        required: false,
        fieldName: "phone",
      },
    },
  },
});
