import { AuthContext } from '@/context/AuthContext';
import { smartFormatRutOrIdentifier } from '@/utils/rut';
import {
  Alert,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SimpleGrid,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import {
  AlertCircleIcon,
  ArrowRight,
  ChevronRightIcon,
} from 'lucide-react';
import { useContext, useState } from 'react';
import classes from './ScoreConsultationView.module.css';

interface DemoAccount {
  label: string;
  subtitle: string;
  role: 'admin' | 'user';
  loginIdentifier: string;
  password: string;
  rut?: string;
}

const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    label: 'Ejecutivo',
    subtitle: 'Acceso global',
    role: 'admin',
    loginIdentifier: 'admin',
    password: 'AdminPassword123!',
  },
  {
    label: 'Juan Pérez',
    subtitle: '12.345.678-9',
    role: 'user',
    loginIdentifier: '12.345.678-9',
    password: 'UserPassword123!',
    rut: '12.345.678-9',
  },
  {
    label: 'Comercial Pepito SpA',
    subtitle: '76.543.210-3',
    role: 'user',
    loginIdentifier: '76.543.210-3',
    password: 'EmpresaPassword123!',
    rut: '76.543.210-3',
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
      username: isNotEmpty('El RUT no puede estar vacío.'),
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
        form.setFieldValue('password', '');
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
      username: account.loginIdentifier,
      password: account.password,
    });
  };

  return (
    <Container size='sm' py='md'>
      <Paper withBorder p='xl' radius='lg' shadow='sm'>
        <Group justify='space-between' mb='xs'>
          <Title order={2}>Inicia sesión</Title>
        </Group>
        <Text size='sm' c='dimmed' mb='lg'>
          para consultar tu nivel de riesgo financiero.
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
            label='RUT'
            placeholder='12.345.678-9'
            value={form.values.username}
            error={form.errors.username}
            onChange={(event) =>
              form.setFieldValue(
                'username',
                smartFormatRutOrIdentifier(event.currentTarget.value)
              )
            }
            onBlur={() =>
              form.setFieldValue(
                'username',
                smartFormatRutOrIdentifier(form.values.username)
              )
            }
            mb='sm'
          />

          <PasswordInput
            label='Contraseña'
            placeholder='Ingresa tu contraseña'
            autoComplete='current-password'
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

        <Divider label='Credenciales de prueba' labelPosition='center' my='lg' />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing='sm'>
          {DEMO_ACCOUNTS.map((acc) => (
            <UnstyledButton
              key={acc.loginIdentifier}
              className={classes.sampleRow}
              px='md'
              py='sm'
              onClick={() => fillDemoAccount(acc)}
            >
              <Group justify='space-between' align='center' mb={8} wrap='nowrap'>
                <Badge
                  size='xs'
                  variant='dot'
                  color={acc.role === 'admin' ? 'yellow' : 'teal'}
                >
                  {acc.role.toUpperCase()}
                </Badge>
                <ChevronRightIcon size={15} className={classes.chevron} />
              </Group>

              <Text fw={600} size='sm' lh={1.25}>
                {acc.label}
              </Text>
              <Text
                size='xs'
                c='dimmed'
                ff={acc.rut ? 'monospace' : undefined}
                mt={2}
              >
                {acc.subtitle}
              </Text>
            </UnstyledButton>
          ))}
        </SimpleGrid>
      </Paper>
    </Container>
  );
}
