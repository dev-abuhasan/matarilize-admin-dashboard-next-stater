// Third-party Imports
import CredentialProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions, } from 'next-auth'

// import { PrismaClient } from '@prisma/client'
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import type { Adapter } from 'next-auth/adapters'
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number; // expiry in seconds
  [key: string]: any;
}

// const prisma = new PrismaClient()

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

const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await fetch(`http://localhost:5000/api/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.message);

    return {
      accessToken: data.data.tokens.accessToken,
      refreshToken: data.data.tokens.refreshToken,
      user: data.data.user,
    };
  } catch (error) {
    console.error('Failed to refresh access token:', error);

    return null;
  }
};

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma) as Adapter,

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

          const data = await res.json()

          if (data.status !== 'success') {
            throw new Error(data.message || 'Login failed')
          }

          const { user, tokens, id } = data.data

          return {
            id,
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
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.user = user  // Save full user object
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000 as number;
      }

      const deCodeToken = token.accessToken as string | undefined;

      if (deCodeToken) {
        const decoded = jwtDecode<JwtPayload>(deCodeToken);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (isExpired) {
          console.log('Token expired, refreshing...');
          const refreshed = await refreshAccessToken(token.refreshToken as string);

          if (refreshed) {
            token.accessToken = refreshed.accessToken;
            token.refreshToken = refreshed.refreshToken ?? token.refreshToken;
            token.accessTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000 as number;
            token.user = refreshed.user ?? token.user;
          }
        }
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
