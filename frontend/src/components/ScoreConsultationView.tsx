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
  RingProgress,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  FileJsonIcon,
  LockIcon,
  SearchIcon,
} from 'lucide-react';
import { useContext, useState } from 'react';
import classes from './ScoreConsultationView.module.css';

interface QueryHistoryItem extends ScoreResponse {
  status: 'OK';
}

function formatDisplayDate(isoString: string): string {
  const match = isoString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
  );
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
  }

  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(parsed.getUTCDate())}/${pad(parsed.getUTCMonth() + 1)}/${parsed.getUTCFullYear()} - ${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}`;
}

function getRiskEvaluation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 70) {
    return {
      label: 'Riesgo Bajo',
      color: 'teal',
      description: 'Comportamiento financiero favorable con alta capacidad crediticia.',
    };
  }
  if (score >= 40) {
    return {
      label: 'Riesgo Moderado',
      color: 'yellow',
      description: 'Indicadores crediticios intermedios; sujeto a evaluación de garantías.',
    };
  }
  return {
    label: 'Riesgo Alto',
    color: 'red',
    description: 'Indicadores crediticios bajos; requiere aprobación de comité de riesgo.',
  };
}

const SAMPLE_RUTS = [
  { rut: '12.345.678-9', name: 'Juan Pérez' },
  { rut: '76.543.210-3', name: 'Comercial Pepito SpA' },
  { rut: '11.111.111-1', name: 'Pepito Hernández' },
];

export default function ScoreConsultationView() {
  const { user, token } = useContext(AuthContext);

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
        <Grid gutter='lg'>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p='lg' radius='lg' shadow='sm' h='100%'>
              <Group justify='space-between' align='center' mb='xs'>
                <Title order={3}>Consulta tu riesgo financiero</Title>
                {user && (
                  <Badge
                    size='xs'
                    variant='dot'
                    color={user.role === 'admin' ? 'yellow' : 'teal'}
                  >
                    {user.role.toUpperCase()}
                  </Badge>
                )}
              </Group>
              <Text size='sm' c='dimmed' mb='md'>
                Obtén un resultado entre 0 y 100, indicando tu nivel de riesgo financiero.
              </Text>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <TextInput
                  label='RUT'
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
                  Consultar
                </Button>
              </form>

              <Divider
                label='RUTs de Prueba'
                labelPosition='center'
                my='lg'
              />

              <Stack gap='xs'>
                {SAMPLE_RUTS.map((sample) => {
                  const isOwnRut = user?.rut === sample.rut;
                  const isAllowed = user?.role === 'admin' || isOwnRut;

                  return (
                    <UnstyledButton
                      key={sample.rut}
                      className={classes.sampleRow}
                      px='md'
                      py='sm'
                      onClick={() => handleQuickRutSelect(sample.rut)}
                    >
                      <Group justify='space-between' align='center' wrap='nowrap'>
                        <div>
                          <Text fw={600} size='sm' lh={1.25}>
                            {sample.name}
                          </Text>
                          <Text size='xs' c='dimmed' ff='monospace' mt={2}>
                            {sample.rut}
                          </Text>
                        </div>

                        <Group gap='xs' wrap='nowrap'>
                          <Badge
                            size='xs'
                            variant='dot'
                            color={isAllowed ? 'teal' : 'red'}
                          >
                            {isAllowed ? 'Permitido' : 'Restringido'}
                          </Badge>
                          <ChevronRightIcon size={15} className={classes.chevron} />
                        </Group>
                      </Group>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </Paper>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p='lg' radius='lg' shadow='sm' h='100%'>
              <Title order={3} mb='md'>
                Resultado
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
                  <Card withBorder radius='md' p='lg'>
                    <Group justify='space-between' align='center' wrap='nowrap' gap='md'>
                      <Stack gap='sm' justify='center'>
                        <div>
                          <Text size='xs' c='dimmed' tt='uppercase' fw={700} lh={1.2}>
                            RUT
                          </Text>
                          <Title order={2} lh={1.2}>
                            {scoreResult.rut}
                          </Title>
                        </div>

                        <Group gap={6} align='center' wrap='nowrap'>
                          <Badge
                            color={riskInfo.color}
                            variant='light'
                            size='lg'
                          >
                            {riskInfo.label}
                          </Badge>
                          <Tooltip
                            label={riskInfo.description}
                            withArrow
                            multiline
                            w={240}
                          >
                            <Text
                              component='span'
                              c='dimmed'
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                cursor: 'help',
                              }}
                              aria-label='Información sobre el nivel de riesgo'
                            >
                              <CircleHelpIcon size={16} />
                            </Text>
                          </Tooltip>
                        </Group>

                        <Group gap={6} c='dimmed' mt={2}>
                          <CalendarClockIcon size={14} />
                          <Text size='xs' fw={500}>
                            {formatDisplayDate(scoreResult.fecha)}
                          </Text>
                        </Group>
                      </Stack>

                      <RingProgress
                        size={128}
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
                            <Text size='xs' c='dimmed' mt={2}>
                              / 100
                            </Text>
                          </div>
                        }
                      />
                    </Group>
                  </Card>

                  <div>
                    <Group gap={6} mb={4}>
                      <FileJsonIcon size={14} />
                      <Text size='xs' fw={600} c='dimmed'>
                        JSON
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
                    <Text size='sm' c='dimmed'>
                      Ingresa un RUT o selecciona uno de los botones de prueba para consultar tu riesgo financiero.
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
              Historial de consultas
            </Title>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>RUT</Table.Th>
                  <Table.Th>Riesgo Financiero</Table.Th>
                  <Table.Th>Fecha de Consulta</Table.Th>
                  <Table.Th>Acción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {history.map((item) => (
                  <Table.Tr key={item.rut}>
                    <Table.Td>{item.rut}</Table.Td>
                    <Table.Td>
                      <Badge color={getRiskEvaluation(item.score).color} variant='light'>
                        {item.score} / 100
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDisplayDate(item.fecha)}</Table.Td>
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
