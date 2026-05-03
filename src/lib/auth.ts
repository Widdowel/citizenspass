import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { logAudit } from "./audit";
import { isAccountLocked, recordOtpFailure, clearAccountLock } from "./security";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "CIP / NIN", type: "text" },
        otp: { label: "Code OTP", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier) return null;
        const id = (credentials.identifier as string).trim();

        const user = await prisma.user.findFirst({
          where: { OR: [{ cip: id }, { nin: id }] },
        });
        if (!user) return null;

        // Voie OTP (citoyens)
        if (credentials.otp) {
          // Lock check
          const lock = await isAccountLocked(user.id);
          if (lock.locked) return null;

          const code = (credentials.otp as string).trim();
          const otp = await prisma.otpCode.findFirst({
            where: {
              userId: user.id,
              consumed: false,
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: "desc" },
          });
          if (!otp) {
            await recordOtpFailure(user.id);
            return null;
          }

          // Vérification bcrypt du code (DB stocke le hash, jamais le code en clair)
          const codeOk = await compare(code, otp.codeHash);
          if (!codeOk) {
            // Incrémente attempts + lock après 5 échecs
            await prisma.otpCode.update({
              where: { id: otp.id },
              data: { attempts: { increment: 1 } },
            });
            await recordOtpFailure(user.id);
            return null;
          }

          await prisma.otpCode.update({
            where: { id: otp.id },
            data: { consumed: true },
          });
          await clearAccountLock(user.id);

          await logAudit({
            actorId: user.id,
            actorType: "SYSTEM",
            action: "OTP_CONSUMED",
            resourceType: "User",
            resourceId: user.id,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cip: user.cip,
            nin: user.nin,
          };
        }

        // Voie mot de passe (admins / fallback démo)
        if (credentials.password) {
          const isValid = await compare(
            credentials.password as string,
            user.password,
          );
          if (!isValid) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cip: user.cip,
            nin: user.nin,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role: string; cip?: string; nin?: string | null };
        token.role = u.role;
        token.cip = u.cip;
        token.nin = u.nin ?? null;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as unknown as {
          role: string;
          cip: string;
          nin: string | null;
          id: string;
        };
        s.role = token.role as string;
        s.cip = token.cip as string;
        s.nin = (token.nin as string | null) ?? null;
        s.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
});
