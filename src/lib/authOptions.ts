import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing credentials");
          return null
        }
        console.log("[AUTH] Authorizing email:", credentials.email);
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        if (!user) {
          console.log("[AUTH] User not found in database for email:", credentials.email);
          return null
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        console.log("[AUTH] Password check for email:", credentials.email, "isValid:", isValid, "role:", user.role);
        if (!isValid) return null
        return { id: user.id, name: user.nama, email: user.email, role: user.role, warehouseId: user.warehouseId }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).role = (user as any).role
        ;(token as any).id = (user as any).id
        ;(token as any).warehouseId = (user as any).warehouseId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = (token as any).role as string
        ;(session.user as any).id = (token as any).id as string
        ;(session.user as any).warehouseId = (token as any).warehouseId as string | null
      }
      return session
    }
  },
  pages: { signIn: '/login' },
  session: { strategy: "jwt" },
}
