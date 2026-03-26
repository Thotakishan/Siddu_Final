import { Navigate, useLocation } from 'react-router-dom'
import { type PropsWithChildren } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Role } from '../types/auth'

type Props = PropsWithChildren<{
  allowedRoles?: Role[]
}>

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === Role.Customer ? '/products' : '/dashboard'} replace />
  }

  return <>{children}</>
}

