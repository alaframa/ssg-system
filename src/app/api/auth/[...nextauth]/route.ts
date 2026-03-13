import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: { email: {label:"Email", type:"text"}, password:{label:"Password", type:"password"} },
      async authorize(credentials){
        const user = await prisma.user.findUnique({where:{email:credentials?.email}});
        if (!user || !user.hashedPassword) return null;
        const valid = await bcrypt.compare(credentials.password,user.hashedPassword);
        if (!valid) return null;
        return user;
      }
    })
  ],
  session: { strategy: "database" },
  pages: { signIn: "/login" },
  callbacks: { async session({session,user}) { session.user.id = user.id; session.user.role = user.role; return session; } },
  secret: process.env.NEXTAUTH_SECRET
});

export { handler as GET, handler as POST };