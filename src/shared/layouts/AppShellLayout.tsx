import { AppShell, Burger, Group, NavLink, ScrollArea, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { IconAlertCircle, IconBox, IconClipboardList, IconDashboard, IconMoon, IconReportAnalytics, IconSun, IconUsers } from '@tabler/icons-react'
import { type ReactNode } from 'react'
import { useThemeStore } from '../stores/themeStore'
import { useAuthStore } from '../stores/authStore'
import { Role } from '../types/auth'

type NavItem = {
  label: string
  path: string
  icon: ReactNode
  roles?: Role[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <IconDashboard size={18} />,
    roles: [Role.Admin, Role.InventoryManager, Role.SalesManager, Role.Support],
  },
  {
    label: 'Products',
    path: '/products',
    icon: <IconBox size={18} />,
    roles: [Role.Admin, Role.InventoryManager, Role.Customer],
  },
  {
    label: 'Inventory',
    path: '/inventory',
    icon: <IconClipboardList size={18} />,
    roles: [Role.Admin, Role.InventoryManager],
  },
  {
    label: 'Orders',
    path: '/orders',
    icon: <IconClipboardList size={18} />,
    roles: [Role.Admin, Role.SalesManager, Role.Support],
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: <IconUsers size={18} />,
    roles: [Role.Admin, Role.Support, Role.SalesManager, Role.InventoryManager],
  },
  {
    label: 'Issues',
    path: '/issues',
    icon: <IconAlertCircle size={18} />,
    roles: [Role.Admin, Role.Support],
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: <IconReportAnalytics size={18} />,
    roles: [Role.Admin, Role.SalesManager],
  },
]

export function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const colorScheme = useThemeStore((s) => s.colorScheme)
  const toggleTheme = useThemeStore((s) => s.toggle)
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)

  const visibleItems = navItems.filter((it) => {
    if (!it.roles || it.roles.length === 0) return true
    return user ? it.roles.includes(user.role) : false
  })

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>E-Commerce IMS</Text>
          </Group>

          <Group>
            <NavLink
              label={colorScheme === 'dark' ? 'Light' : 'Dark'}
              leftSection={colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
              onClick={toggleTheme}
            />
            <NavLink
              label="Logout"
              onClick={() => {
                clear()
                navigate('/login', { replace: true })
              }}
            />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {visibleItems.map((it) => (
            <NavLink
              key={it.path}
              label={it.label}
              leftSection={it.icon}
              active={location.pathname === it.path}
              onClick={() => navigate(it.path)}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

