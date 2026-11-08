import {
  Switch,
  SwitchProps,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { MoonIcon, SunIcon } from 'lucide-react';

export default function ColorSchemeToggle(props: SwitchProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  const checked = computedColorScheme === 'dark';

  return (
    <Switch
      withThumbIndicator={false}
      size='md'
      color='dark.4'
      checked={checked}
      onChange={toggleColorScheme}
      onLabel={<SunIcon size='0.825rem' />}
      offLabel={<MoonIcon size='0.825rem' />}
      aria-label='Cambiar esquema de color'
      {...props}
    />
  );
}
