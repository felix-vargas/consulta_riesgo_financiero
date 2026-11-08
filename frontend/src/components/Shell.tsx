import { AuthContext } from '@/context/AuthContext';
import {
  AppShell,
  Avatar,
  Badge,
  Box,
  Container,
  Divider,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { LogOutIcon } from 'lucide-react';
import { PropsWithChildren, useContext } from 'react';
import ColorSchemeToggle from './ColorSchemeToggle';
import classes from './Shell.module.css';

function CreditCardCheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M12 19H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5.5' />
      <path d='M3 10h18' />
      <path d='M7 15h.01' />
      <path d='M11 15h2' />
      <path d='m16 19 2 2 4-4' />
    </svg>
  );
}

export default function Shell({ children }: PropsWithChildren) {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header className={classes.header}>
        <Container className={classes['header-container']} size='md'>
          <div className={classes.brand}>
            <CreditCardCheckIcon size={24} />
            <div>
              <Text fw={600} size='lg' lh={1.1} c='white'>
                Consulta de Riesgo Financiero
              </Text>
            </div>
          </div>

          <Group gap='sm'>
            <ColorSchemeToggle />

            {user && (
              <Menu withArrow position='bottom-end' shadow='md' width={240}>
                <Menu.Target>
                  <UnstyledButton aria-label='Menú de usuario'>
                    <Avatar
                      color='teal.9'
                      radius='xl'
                      variant='filled'
                      style={{
                        cursor: 'pointer',
                        border: '2px solid rgba(255, 255, 255, 0.75)',
                      }}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                  </UnstyledButton>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Sesión activa</Menu.Label>
                  <Box px='sm' pb='xs'>
                    <Group justify='space-between' align='center' wrap='nowrap' mb={4}>
                      <Text fw={600} size='sm' truncate>
                        {user.name}
                      </Text>
                      <Badge
                        size='xs'
                        variant='dot'
                        color={user.role === 'admin' ? 'yellow' : 'teal'}
                      >
                        {user.role.toUpperCase()}
                      </Badge>
                    </Group>
                    <Text size='xs' c='dimmed' ff='monospace'>
                      {user.rut ? `RUT: ${user.rut}` : `Usuario: ${user.username}`}
                    </Text>
                  </Box>
                  <Divider my={4} />
                  <Menu.Item
                    color='red'
                    leftSection={<LogOutIcon size='1rem' />}
                    onClick={logout}
                  >
                    Cerrar sesión
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main className={classes.main}>{children}</AppShell.Main>
    </AppShell>
  );
}
