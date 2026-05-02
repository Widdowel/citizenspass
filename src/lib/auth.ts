import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "CIP / NIN", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        const id = (credentials.identifier as string).trim();

        const user = await prisma.user.findFirst({
          where: { OR: [{ cip: id }, { nin: id }] },
        });

        if (!user) return null;

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
