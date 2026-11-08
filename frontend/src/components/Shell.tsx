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
              <Text fw={700} size='md' lh={1.1} c='white'>
                ProntoPaga Risk
              </Text>
              <Text size='xs' c='rgba(255, 255, 255, 0.8)' lh={1.1}>
                Consulta de Riesgo Financiero
              </Text>
            </div>
          </div>

          <Group gap='sm'>
            {user && (
              <Badge
                variant='light'
                color={user.role === 'admin' ? 'yellow' : 'cyan'}
                size='md'
              >
                Rol: {user.role.toUpperCase()}
              </Badge>
            )}

            <Menu withArrow position='bottom-end' shadow='md' width={230}>
              <Menu.Target>
                <UnstyledButton aria-label='Menú de usuario'>
                  <Avatar
                    color='teal'
                    radius='xl'
                    variant='filled'
                    style={{ cursor: 'pointer', border: '2px solid rgba(255,255,255,0.6)' }}
                  >
                    {user ? user.name.slice(0, 2).toUpperCase() : 'PP'}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                {user && (
                  <>
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
                    <Divider my='xs' />
                  </>
                )}
                <Menu.Label>Tema visual</Menu.Label>
                <Box px='sm' py='xs'>
                  <ColorSchemeToggle />
                </Box>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main className={classes.main}>{children}</AppShell.Main>
    </AppShell>
  );
}
