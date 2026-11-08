import { AuthContext } from '@/context/AuthContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import {
  AlertCircleIcon,
  ArrowRight,
  KeyRoundIcon,
  ShieldAlertIcon,
  UserCheckIcon,
} from 'lucide-react';
import { useContext, useState } from 'react';

interface DemoAccount {
  label: string;
  role: 'admin' | 'user';
  username: string;
  password: string;
  rut?: string;
  description: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: 'Ejecutivo Riesgo (Admin)',
    role: 'admin',
    username: 'admin',
    password: 'AdminPassword123!',
    description: 'Puede consultar el score de cualquier RUT de persona o empresa.',
  },
  {
    label: 'Juan Pérez (Usuario)',
    role: 'user',
    username: 'usuario',
    password: 'UserPassword123!',
    rut: '12.345.678-9',
    description: 'Solo autorizado para consultar su propio RUT (12.345.678-9).',
  },
  {
    label: 'Comercial Andina SpA (Usuario)',
    role: 'user',
    username: 'empresa',
    password: 'EmpresaPassword123!',
    rut: '76.543.210-3',
    description: 'Solo autorizado para consultar su propio RUT (76.543.210-3).',
  },
];

export default function LoginView() {
  const { login } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      username: '',
      password: '',
    },
    validate: {
      username: isNotEmpty('El nombre de usuario o RUT no puede estar vacío.'),
      password: (val) =>
        val.trim().length < 4
          ? 'La contraseña debe tener al menos 4 caracteres.'
          : null,
    },
  });

  const handleSubmit = async ({ username, password }: typeof form.values) => {
    setAuthError(null);
    setSubmitting(true);

    await login(username, password, {
      onError: (message) => {
        setAuthError(message);
        form.setErrors({
          username: ' ',
          password: ' ',
        });
      },
    });

    setSubmitting(false);
  };

  const fillDemoAccount = (account: DemoAccount) => {
    setAuthError(null);
    form.clearErrors();
    form.setValues({
      username: account.username,
      password: account.password,
    });
  };

  return (
    <Container size='sm' py='md'>
      <Paper withBorder p='xl' radius='lg' shadow='sm'>
        <Group justify='space-between' mb='xs'>
          <Title order={2}>Iniciar sesión</Title>
          <Badge variant='light' color='teal' leftSection={<KeyRoundIcon size={12} />}>
            Autenticación JWT
          </Badge>
        </Group>
        <Text size='sm' c='dimmed' mb='lg'>
          Ingresa con tus credenciales para evaluar el score de riesgo financiero por RUT.
        </Text>

        {authError && (
          <Alert
            variant='light'
            color='red'
            title='Fallo de autenticación (401)'
            icon={<AlertCircleIcon size={18} />}
            mb='md'
          >
            {authError}
          </Alert>
        )}

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput
            label='Nombre de usuario o RUT'
            placeholder='Ej: admin, usuario o 12.345.678-9'
            {...form.getInputProps('username')}
            mb='sm'
          />

          <PasswordInput
            label='Contraseña'
            placeholder='Ingresa tu contraseña'
            {...form.getInputProps('password')}
          />

          <Button
            fullWidth
            type='submit'
            mt='lg'
            loading={submitting}
            rightSection={<ArrowRight size='1rem' />}
          >
            Iniciar sesión
          </Button>
        </form>

        <Divider label='Credenciales Mock para Evaluación Rápida' labelPosition='center' my='lg' />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='sm'>
          {DEMO_ACCOUNTS.map((acc) => (
            <Card key={acc.username} withBorder padding='sm' radius='md'>
              <Stack gap={6} justify='space-between' h='100%'>
                <div>
                  <Group justify='space-between' mb={4}>
                    <Badge
                      size='xs'
                      color={acc.role === 'admin' ? 'yellow' : 'teal'}
                      variant='light'
                    >
                      {acc.role.toUpperCase()}
                    </Badge>
                    {acc.rut && (
                      <Text size='xs' fw={600} c='dimmed'>
                        {acc.rut}
                      </Text>
                    )}
                  </Group>
                  <Text fw={600} size='sm'>
                    {acc.label}
                  </Text>
                  <Text size='xs' c='dimmed' mt={2}>
                    {acc.description}
                  </Text>
                </div>

                <Button
                  variant='light'
                  size='xs'
                  fullWidth
                  mt='xs'
                  leftSection={
                    acc.role === 'admin' ? (
                      <ShieldAlertIcon size={14} />
                    ) : (
                      <UserCheckIcon size={14} />
                    )
                  }
                  onClick={() => fillDemoAccount(acc)}
                >
                  Cargar ({acc.username})
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Paper>
    </Container>
  );
}
