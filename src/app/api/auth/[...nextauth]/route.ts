import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  session: {
    strategy: "jwt"
  },
  providers: [
    CredentialsProvider({
      name: "Demo operator",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id: "user-demo",
          name: "ReydarOS Operator",
          email: credentials.email
        };
      }
    })
  ],
  pages: {
    signIn: "/settings"
  }
});

export { handler as GET, handler as POST };
