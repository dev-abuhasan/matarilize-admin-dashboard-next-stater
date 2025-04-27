'use client'
import { redirect, usePathname } from 'next/navigation'

const AuthRedirect = () => {
  const pathname = usePathname()

  const redirectUrl = `/login?redirectTo=${pathname}`
  const login = `/login`

  return redirect(pathname === login ? login : pathname === '/' ? login : redirectUrl)
}

export default AuthRedirect;
