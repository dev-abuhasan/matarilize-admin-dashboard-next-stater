// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions, } from 'next-auth'

declare module 'next-auth' {
  interface User {
    accessToken?: string
    refreshToken?: string
  }
  interface Session {
    accessToken?: string
    refreshToken?: string
  }
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const response = await fetch(`http://localhost:5000/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.message)

    return {
      accessToken: data.data.tokens.accessToken,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // assume 15min expiry
      refreshToken: data.data.tokens.refreshToken ?? refreshToken, // fallback
      user: data.data.user,
    }
  } catch (error) {
    console.error("Refresh token failed:", error)

    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialProvider({
      name: 'Credentials',
      type: 'credentials',

      credentials: {},
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }

        try {
          const res = await fetch(`http://localhost:5000/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          console.log(res)
          const data = await res.json()

          if (data.status !== 'success') {
            throw new Error(data.message || 'Login failed')
          }

          const { user, tokens } = data.data

          return {
            ...user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }
        } catch (e: any) {
          console.log(e)
          throw new Error(e.message)
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
    })

  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60 // ** 7 days
  },

  pages: {
    signIn: '/login'
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {

      if (trigger === 'update' && session) {
        return {
          ...token,
          ...session,
          user: session.user && typeof session.user === 'object'
            ? { ...(typeof token.user === 'object' ? token.user : {}), ...session.user }
            : token.user
        };
      }

      if (user) {
        token.user = user  // Save full user object
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }


      return token
    },
    async session({ session, token }) {
      session.user = token.user as any  // Add full user object to session
      session.accessToken = token.accessToken as string | undefined
      session.refreshToken = token.refreshToken as string | undefined

      return session
    }
  }
}
