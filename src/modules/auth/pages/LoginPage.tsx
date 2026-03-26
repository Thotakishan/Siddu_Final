import { Button, Card, Checkbox, Container, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { z } from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notifications } from '@mantine/notifications'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { useAuthStore } from '../../../shared/stores/authStore'
import { tokenStorage } from '../../../shared/auth/tokenStorage'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
  remember: z.boolean(),
})

type FormValues = z.infer<typeof schema>

type LocationState = { from?: string }

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@demo.com', password: 'demo', remember: true },
    mode: 'onTouched',
  })

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      const res = await authService.login({ email: values.email, password: values.password })
      setSession(res)
      tokenStorage.setSession(res, { persist: values.remember })
      notifications.show({ color: 'teal', title: 'Welcome', message: `Signed in as ${res.user.name}` })

      const state = location.state as LocationState | null
      const dest = state?.from ?? '/dashboard'
      navigate(dest, { replace: true })
    } catch {
      notifications.show({ color: 'red', title: 'Login failed', message: 'Invalid credentials or server error.' })
    }
  }

  return (
    <Container size={420} py={80}>
      <Stack gap="md">
        <Title order={2}>Sign in</Title>
        <Text c="dimmed" size="sm">
          Demo users: admin@demo.com, inventory@demo.com, sales@demo.com, support@demo.com, customer@demo.com (password: demo)
        </Text>

        <Card withBorder radius="md" p="lg">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack>
              <TextInput
                label="Email"
                placeholder="you@company.com"
                {...register('email')}
                error={errors.email?.message}
                autoComplete="email"
              />
              <PasswordInput
                label="Password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                autoComplete="current-password"
              />
              <Group justify="space-between">
                <Checkbox label="Remember me" {...register('remember')} />
              </Group>
              <Button type="submit" loading={isSubmitting} fullWidth>
                Sign in
              </Button>
            </Stack>
          </form>
        </Card>

        <Text size="xs" c="dimmed">
          This is a frontend-only mock. Tokens are simulated and refreshed automatically via Axios interceptors.
        </Text>
      </Stack>
    </Container>
  )
}

