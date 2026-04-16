import { useEffect, useState } from 'react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    LoadingOverlay,
    Modal,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconStairs, IconTrash, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';

import type { Schedule, ScheduleLevel } from '../../features/schedules/types';
import { CreateSchedule, DeleteSchedule, GetSchedules, UpdateSchedule } from '../../features/schedules/api';
import { IntervalInput } from '../../features/schedules/components/IntervalInput';
import { useReviewSession } from '../../app/providers/ReviewProvider';

const SchedulesPage = () => {
    const { setSessionActive } = useReviewSession();

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [replacementId, setReplacementId] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [levels, setLevels] = useState<ScheduleLevel[]>([{ level: 1, intervalMinutes: 10 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setSessionActive(false);
        loadSchedules();
    }, [setSessionActive]);

    const loadSchedules = () => {
        setLoading(true);
        GetSchedules()
            .then(setSchedules)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setName('');
        setLevels([{ level: 1, intervalMinutes: 10 }]);
        setIsFormOpen(true);
    };

    const handleOpenEdit = (schedule: Schedule) => {
        setEditingId(schedule.id);
        setName(schedule.name);
        const sortedLevels = schedule.levels
            ? [...schedule.levels].sort((a, b) => a.level - b.level)
            : [{ level: 1, intervalMinutes: 10 }];
        setLevels(sortedLevels);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!name) return;
        setIsSubmitting(true);
        const payloadLevels = levels.map((lvl, index) => ({
            level: index,
            intervalMinutes: lvl.intervalMinutes,
        }));

        try {
            if (editingId) {
                await UpdateSchedule(editingId, { name, levels: payloadLevels });
            } else {
                await CreateSchedule({ name, levels: payloadLevels });
            }
            await loadSchedules();
            handleCloseForm();
        } catch (e) {
            alert('Ошибка при сохранении');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!editingId || !replacementId) return;
        try {
            await DeleteSchedule(editingId, Number(replacementId));
            await loadSchedules();
            setDeleteModalOpen(false);
            handleCloseForm();
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };

    if (loading && schedules.length === 0) return <LoadingOverlay visible />;

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={2} fw={800}>Настройки интервалов</Title>
                {!isFormOpen && (
                    <Button onClick={handleOpenCreate} leftSection={<IconPlus size={18} />} radius="xl">
                        Создать стратегию
                    </Button>
                )}
            </Group>

            {/* FORM */}
            {isFormOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <Paper withBorder p="xl" radius="xl" mb={40} shadow="md">
                        <Group justify="space-between" align="center" mb="lg" wrap="nowrap">
                            <Title
                                order={4}
                                style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {editingId ? `Редактирование: ${name}` : 'Новая стратегия'}
                            </Title>
                            <ActionIcon variant="subtle" color="gray" onClick={handleCloseForm} radius="md">
                                <IconX size={18} />
                            </ActionIcon>
                        </Group>

                        <TextInput
                            label="Название"
                            placeholder="Например: Стандартная"
                            mb="lg"
                            value={name}
                            onChange={(e) => setName(e.currentTarget.value)}
                            data-autofocus
                            radius="xl"
                        />

                        <Text fw={600} mb="sm">Этапы повторения</Text>
                        <Stack gap="sm" mb="lg">
                            {levels.map((lvl, index) => (
                                <Paper key={index} withBorder p="sm" radius="xl">
                                    <Group align="center" wrap="nowrap">
                                        <Badge size="md" circle color="cyan" style={{ flexShrink: 0 }}>
                                            {index + 1}
                                        </Badge>
                                        <Box style={{ flex: 1 }}>
                                            <IntervalInput
                                                valueMinutes={lvl.intervalMinutes}
                                                onChange={(mins) => {
                                                    setLevels(prev =>
                                                        prev.map((item, i) =>
                                                            i === index ? { ...item, intervalMinutes: mins } : item
                                                        )
                                                    );
                                                }}
                                            />
                                        </Box>
                                        <ActionIcon
                                            color="red"
                                            variant="subtle"
                                            onClick={() => setLevels(prev => prev.filter((_, i) => i !== index))}
                                            disabled={levels.length <= 1}
                                            radius="md"
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            ))}
                        </Stack>

                        <Button
                            variant="light"
                            color="gray"
                            fullWidth
                            mb="xl"
                            leftSection={<IconPlus size={16} />}
                            onClick={() => setLevels(prev => [...prev, { level: prev.length + 1, intervalMinutes: 60 }])}
                            radius="xl"
                        >
                            Добавить шаг
                        </Button>

                        <Group justify="space-between">
                            {editingId ? (
                                <Button color="red" variant="light" onClick={() => setDeleteModalOpen(true)} leftSection={<IconTrash size={16} />} radius="xl">
                                    Удалить
                                </Button>
                            ) : <div />}

                            <Group>
                                <Button variant="default" onClick={handleCloseForm} radius="xl">Отмена</Button>
                                <Button onClick={handleSubmit} loading={isSubmitting} radius="xl">
                                    {editingId ? 'Сохранить' : 'Создать'}
                                </Button>
                            </Group>
                        </Group>
                    </Paper>
                </motion.div>
            )}

            {schedules.length === 0 && !isFormOpen ? (
                <Box py={80} style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} radius="xl" variant="light" color="violet" mx="auto" mb="lg">
                        <IconStairs size={32} />
                    </ThemeIcon>
                    <Text size="lg" fw={600} mb="xs">Нет стратегий</Text>
                    <Text c="dimmed" size="sm" mb="xl">Создайте свою стратегию интервального повторения</Text>
                    <Button radius="xl" leftSection={<IconPlus size={16} />} onClick={handleOpenCreate}>
                        Создать стратегию
                    </Button>
                </Box>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {schedules.map((sch, i) => (
                        <motion.div
                            key={sch.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.2 }}
                        >
                            <Card
                                withBorder
                                shadow="sm"
                                radius="xl"
                                padding="lg"
                                onClick={() => handleOpenEdit(sch)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    borderColor: editingId === sch.id ? 'var(--mantine-color-cyan-filled)' : undefined,
                                    borderWidth: editingId === sch.id ? 2 : 1,
                                }}
                            >
                                <Group justify="space-between" mb="xs">
                                    <Group gap="xs">
                                        <ThemeIcon color="violet" variant="light" radius="md">
                                            <IconStairs size={18} />
                                        </ThemeIcon>
                                        <Text fw={700} size="md">{sch.name}</Text>
                                    </Group>
                                    <IconEdit size={15} color="var(--mantine-color-dimmed)" />
                                </Group>
                                <Text size="sm" c="dimmed" mb="md">
                                    Этапов: {sch.levels?.length || 0}
                                </Text>
                                <Group gap={6}>
                                    {sch.levels?.slice(0, 4).map((l, idx) => (
                                        <Badge key={idx} size="sm" variant="light" color="gray">
                                            {l.intervalMinutes < 60
                                                ? `${l.intervalMinutes}м`
                                                : l.intervalMinutes < 1440
                                                ? `${Math.round(l.intervalMinutes / 60)}ч`
                                                : `${Math.round(l.intervalMinutes / 1440)}д`
                                            }
                                        </Badge>
                                    ))}
                                    {(sch.levels?.length || 0) > 4 && (
                                        <Text size="xs" c="dimmed">+{(sch.levels?.length || 0) - 4}</Text>
                                    )}
                                </Group>
                            </Card>
                        </motion.div>
                    ))}
                </SimpleGrid>
            )}

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Удаление стратегии" centered radius="xl">
                <Stack>
                    <Text size="sm">Если эта стратегия используется, выберите замену для активных колод.</Text>
                    <Select
                        label="Выберите замену"
                        placeholder="Выберите расписание..."
                        data={schedules.filter(s => s.id !== editingId).map(s => ({ value: String(s.id), label: s.name }))}
                        value={replacementId}
                        onChange={setReplacementId}
                        allowDeselect={false}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setDeleteModalOpen(false)} radius="xl">Отмена</Button>
                        <Button color="red" onClick={handleConfirmDelete} radius="xl">Удалить и перенести</Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
};

export default SchedulesPage;
