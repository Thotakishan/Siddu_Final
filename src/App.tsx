import { RouterProvider } from 'react-router-dom'
import { useEffect } from 'react'
import { router } from './router'
import { tokenStorage } from './shared/auth/tokenStorage'
import { useAuthStore } from './shared/stores/authStore'

export default function App() {
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    const session = tokenStorage.hydrate()
    if (session) setSession(session)
  }, [setSession])

  return <RouterProvider router={router} />
}
