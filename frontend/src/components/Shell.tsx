import { AuthContext } from '@/context/AuthContext';
import {
  AppShell,
  Avatar,
  Badge,
  Box,
  Container,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { LogOutIcon, ShieldCheckIcon } from 'lucide-react';
import { PropsWithChildren, useContext } from 'react';
import ColorSchemeToggle from './ColorSchemeToggle';
import classes from './Shell.module.css';

export default function Shell({ children }: PropsWithChildren) {
  const { user, logout } = useContext(AuthContext);

  return (
    <AppShell header={{ height: 60 }}>
      <AppShell.Header className={classes.header}>
        <Container className={classes['header-container']} size='md'>
          <div className={classes.brand}>
            <ShieldCheckIcon size={24} />
            <div>
              <Text fw={600} size='lg' lh={1.1} c='white'>
                Consulta de Riesgo Financiero
              </Text>
            </div>
          </div>

          <Group gap='sm'>
            <ColorSchemeToggle />

            {user && (
              <>
                <Badge
                  variant='filled'
                  color={user.role === 'admin' ? 'yellow.5' : 'cyan.3'}
                  c='dark.9'
                  size='md'
                  style={{
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  Rol: {user.role.toUpperCase()}
                </Badge>

                <Menu withArrow position='bottom-end' shadow='md' width={230}>
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
                      <Text fw={600} size='sm'>
                        {user.name}
                      </Text>
                      <Text size='xs' c='dimmed'>
                        Usuario: {user.username}
                      </Text>
                      {user.rut && (
                        <Text size='xs' c='dimmed'>
                          RUT: {user.rut}
                        </Text>
                      )}
                    </Box>
                    <Menu.Item
                      color='red'
                      leftSection={<LogOutIcon size='1rem' />}
                      onClick={logout}
                    >
                      Cerrar sesión
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main className={classes.main}>{children}</AppShell.Main>
    </AppShell>
  );
}
