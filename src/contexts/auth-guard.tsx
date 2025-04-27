// Third-party Imports
import { getServerSession } from 'next-auth'

// Type Imports
import type { ChildrenType } from '@core/types'
import AuthRedirect from '@/components/auth-redirect'

// Component Imports

export default async function AuthGuard({ children }: ChildrenType) {
  const session = await getServerSession()

  return <>{session ? children : <AuthRedirect />}</>
}
