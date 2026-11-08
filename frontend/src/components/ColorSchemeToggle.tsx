import {
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { MoonIcon, SunIcon } from 'lucide-react';

export default function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const isDark = computedColorScheme === 'dark';

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <Tooltip
      label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      withArrow
    >
      <ActionIcon
        onClick={toggleColorScheme}
        variant='filled'
        color={isDark ? 'dark.5' : 'favras-teal.9'}
        size='lg'
        radius='xl'
        aria-label='Cambiar esquema de color'
        style={{
          border: '1px solid rgba(255, 255, 255, 0.35)',
          color: 'white',
        }}
      >
        {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}
