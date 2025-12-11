import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      // 1. ASK FOR PERMISSION (Scope)
      // "repo" gives full control to read private repositories
      authorization: { params: { scope: "repo" } },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    // 2. GRAB THE KEY (JWT)
    // When GitHub gives us the key, we save it to the token
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    // 3. PASS THE KEY TO THE APP (Session)
    // We expose the key to the frontend so we can use it
    async session({ session, token }) {
      // @ts-ignore
      session.accessToken = token.accessToken
      return session
    },
  },
})

export { handler as GET, handler as POST }