import { type PropsWithChildren, useEffect, useMemo } from 'react'
import { MantineProvider, createTheme } from '@mantine/core'
import { useThemeStore } from '../stores/themeStore'

const theme = createTheme({})

export function AppThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useThemeStore((s) => s.colorScheme)
  const hydrate = useThemeStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const value = useMemo(() => ({ colorScheme }), [colorScheme])

  return (
    <MantineProvider theme={theme} forceColorScheme={value.colorScheme}>
      {children}
    </MantineProvider>
  )
}

