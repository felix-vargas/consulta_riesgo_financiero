import { AuthContext } from '@/context/AuthContext';
import { extractApiError, fetchScoreByRut } from '@/lib/axios';
import type { ScoreResponse } from '@/types/api';
import { formatRutInput, isValidRutSyntax } from '@/utils/rut';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  Progress,
  RingProgress,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  FileJsonIcon,
  LockIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserIcon,
} from 'lucide-react';
import { useContext, useState } from 'react';

interface QueryHistoryItem extends ScoreResponse {
  status: 'OK';
}

function getRiskEvaluation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 70) {
    return {
      label: 'Riesgo Bajo — Perfil Sólido',
      color: 'teal',
      description: 'Comportamiento financiero favorable con alta capacidad crediticia.',
    };
  }
  if (score >= 40) {
    return {
      label: 'Riesgo Moderado — Revisión Estándar',
      color: 'yellow',
      description: 'Indicadores crediticios intermedios; sujeto a evaluación de garantías.',
    };
  }
  return {
    label: 'Riesgo Alto — Alerta Crediticia',
    color: 'red',
    description: 'Score bajo el umbral recomendado; requiere aprobación de comité de riesgo.',
  };
}

const SAMPLE_RUTS = [
  { rut: '12.345.678-9', label: '12.345.678-9 (RUT Juan Pérez / Ejemplo PDF)' },
  { rut: '76.543.210-3', label: '76.543.210-3 (RUT Comercial Andina SpA)' },
  { rut: '11.111.111-1', label: '11.111.111-1 (RUT Tercero Externo)' },
];

export default function ScoreConsultationView() {
  const { user, token, logout } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [errorState, setErrorState] = useState<{
    status: number | null;
    code: string;
    message: string;
  } | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      rut: user?.rut ?? '12.345.678-9',
    },
    validate: {
      rut: (value) =>
        isValidRutSyntax(value)
          ? null
          : 'Ingresa un RUT chileno válido (ej: 12.345.678-9).',
    },
  });

  const executeQuery = async (rutToQuery: string) => {
    if (!token) return;

    setLoading(true);
    setErrorState(null);

    try {
      const data = await fetchScoreByRut(rutToQuery, token);
      setScoreResult(data);
      setHistory((prev) => {
        const filtered = prev.filter((item) => item.rut !== data.rut);
        return [{ ...data, status: 'OK' as const }, ...filtered].slice(0, 6);
      });
    } catch (err) {
      const parsedError = extractApiError(err);
      setScoreResult(null);
      setErrorState(parsedError);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async ({ rut }: typeof form.values) => {
    const formatted = formatRutInput(rut);
    form.setFieldValue('rut', formatted);
    await executeQuery(formatted);
  };

  const handleQuickRutSelect = async (targetRut: string) => {
    form.clearErrors();
    form.setFieldValue('rut', targetRut);
    await executeQuery(targetRut);
  };

  const riskInfo = scoreResult ? getRiskEvaluation(scoreResult.score) : null;

  return (
    <Container size='md'>
      <Stack gap='lg'>
        <Paper withBorder p='lg' radius='lg' shadow='xs'>
          <Group justify='space-between' align='flex-start'>
            <div>
              <Group gap='xs' mb={4}>
                <UserIcon size={18} />
                <Title order={4}>{user?.name}</Title>
                <Badge
                  color={user?.role === 'admin' ? 'yellow' : 'teal'}
                  variant='light'
                >
                  Rol: {user?.role}
                </Badge>
                {user?.rut && (
                  <Badge color='gray' variant='outline'>
                    RUT Token: {user.rut}
                  </Badge>
                )}
              </Group>
              <Text size='sm' c='dimmed'>
                {user?.role === 'admin'
                  ? 'Permisos de Administrador: Puedes consultar el score crediticio de cualquier RUT.'
                  : `Permisos de Usuario: Solo estás autorizado para consultar tu propio RUT (${user?.rut}). Consultar otro RUT retornará 403 Forbidden.`}
              </Text>
            </div>

            <Button variant='subtle' color='red' size='xs' onClick={logout}>
              Cambiar cuenta
            </Button>
          </Group>
        </Paper>

        <Grid gutter='lg'>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p='lg' radius='lg' shadow='sm' h='100%'>
              <Title order={3} mb='xs'>
                Consulta de Score por RUT
              </Title>
              <Text size='sm' c='dimmed' mb='md'>
                El cálculo es determinista: un mismo RUT siempre retorna el mismo score entre 0 y 100.
              </Text>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                  label='RUT a consultar'
                  placeholder='12.345.678-9'
                  size='md'
                  value={form.values.rut}
                  error={form.errors.rut}
                  onChange={(event) =>
                    form.setFieldValue(
                      'rut',
                      formatRutInput(event.currentTarget.value)
                    )
                  }
                  mb='md'
                />

                <Button
                  type='submit'
                  fullWidth
                  size='md'
                  loading={loading}
                  leftSection={<SearchIcon size={18} />}
                >
                  Consultar Score Financiero
                </Button>
              </form>

              <Divider
                label='RUTs de Prueba (Testear Autorización RBAC)'
                labelPosition='center'
                my='lg'
              />

              <Stack gap='xs'>
                {SAMPLE_RUTS.map((sample) => {
                  const isOwnRut = user?.rut === sample.rut;
                  const isAllowed = user?.role === 'admin' || isOwnRut;

                  return (
                    <Button
                      key={sample.rut}
                      variant='light'
                      color={isAllowed ? 'teal' : 'orange'}
                      size='xs'
                      justify='space-between'
                      rightSection={
                        <Badge
                          size='xs'
                          color={isAllowed ? 'teal' : 'red'}
                          variant='filled'
                        >
                          {isAllowed ? 'Permitido (200)' : 'Bloqueado (403)'}
                        </Badge>
                      }
                      onClick={() => handleQuickRutSelect(sample.rut)}
                    >
                      {sample.label}
                    </Button>
                  );
                })}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p='lg' radius='lg' shadow='sm' h='100%'>
              <Title order={3} mb='md'>
                Resultado de Evaluación
              </Title>

              {errorState && (
                <Alert
                  variant='light'
                  color={errorState.status === 403 ? 'orange' : 'red'}
                  title={
                    errorState.status === 403
                      ? 'Acceso Denegado — Control de Autorización (403 Forbidden)'
                      : errorState.status === 401
                        ? 'Error de Autenticación (401 Unauthorized)'
                        : 'Error en la Consulta'
                  }
                  icon={
                    errorState.status === 403 ? (
                      <LockIcon size={20} />
                    ) : (
                      <AlertTriangleIcon size={20} />
                    )
                  }
                >
                  <Text size='sm' fw={500} mb={4}>
                    {errorState.message}
                  </Text>
                  <Text size='xs' c='dimmed'>
                    Código de respuesta: {errorState.status ?? 'ERR'} ({errorState.code})
                  </Text>
                </Alert>
              )}

              {scoreResult && riskInfo && (
                <Stack gap='md'>
                  <Card withBorder radius='md' p='md'>
                    <Group justify='space-between' align='center' wrap='nowrap'>
                      <div>
                        <Text size='xs' c='dimmed' tt='uppercase' fw={700}>
                          RUT Consultado
                        </Text>
                        <Title order={2} mb={4}>
                          {scoreResult.rut}
                        </Title>
                        <Badge
                          color={riskInfo.color}
                          variant='light'
                          size='lg'
                          leftSection={<CheckCircle2Icon size={14} />}
                        >
                          {riskInfo.label}
                        </Badge>
                        <Text size='xs' c='dimmed' mt='xs'>
                          {riskInfo.description}
                        </Text>
                      </div>

                      <RingProgress
                        size={130}
                        thickness={12}
                        roundCaps
                        sections={[
                          { value: scoreResult.score, color: riskInfo.color },
                        ]}
                        label={
                          <div style={{ textAlign: 'center' }}>
                            <Text fw={800} size='xl' lh={1}>
                              {scoreResult.score}
                            </Text>
                            <Text size='xs' c='dimmed'>
                              / 100
                            </Text>
                          </div>
                        }
                      />
                    </Group>

                    <Progress
                      value={scoreResult.score}
                      color={riskInfo.color}
                      size='sm'
                      radius='xl'
                      mt='md'
                    />

                    <Group justify='space-between' mt='sm'>
                      <Group gap={6}>
                        <CalendarClockIcon size={14} />
                        <Text size='xs' c='dimmed'>
                          Fecha evaluación (UTC):
                        </Text>
                      </Group>
                      <Text size='xs' fw={600}>
                        {scoreResult.fecha}
                      </Text>
                    </Group>
                  </Card>

                  <div>
                    <Group gap={6} mb={4}>
                      <FileJsonIcon size={14} />
                      <Text size='xs' fw={600} c='dimmed'>
                        Payload JSON retornado por GET /score/:rut
                      </Text>
                    </Group>
                    <Code block>
                      {JSON.stringify(scoreResult, null, 2)}
                    </Code>
                  </div>
                </Stack>
              )}

              {!scoreResult && !errorState && (
                <Card withBorder radius='md' p='xl' style={{ textAlign: 'center' }}>
                  <Stack align='center' gap='xs'>
                    <ShieldCheckIcon size={40} opacity={0.4} />
                    <Text fw={600}>Sin consulta activa</Text>
                    <Text size='sm' c='dimmed'>
                      Ingresa un RUT o selecciona uno de los botones de prueba para consultar su score crediticio.
                    </Text>
                  </Stack>
                </Card>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {history.length > 0 && (
          <Paper withBorder p='lg' radius='lg' shadow='xs'>
            <Title order={4} mb='sm'>
              Consultas recientes en esta sesión (Verificación de Determinismo)
            </Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>RUT</Table.Th>
                  <Table.Th>Score Determinista</Table.Th>
                  <Table.Th>Fecha (ISO UTC)</Table.Th>
                  <Table.Th>Acción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {history.map((item) => (
                  <Table.Tr key={item.rut}>
                    <Table.Td fw={600}>{item.rut}</Table.Td>
                    <Table.Td>
                      <Badge color={getRiskEvaluation(item.score).color} variant='light'>
                        {item.score} / 100
                      </Badge>
                    </Table.Td>
                    <Table.Td>{item.fecha}</Table.Td>
                    <Table.Td>
                      <Button
                        size='compact-xs'
                        variant='subtle'
                        onClick={() => handleQuickRutSelect(item.rut)}
                      >
                        Re-consultar
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
