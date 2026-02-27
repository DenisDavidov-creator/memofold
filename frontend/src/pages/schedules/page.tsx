import { useEffect, useState } from 'react';
import { 
  Container, Title, Button, Group, TextInput, Paper, 
  Stack, Text, ActionIcon, SimpleGrid, Card, Badge, ThemeIcon, Box, LoadingOverlay, Modal, Select,
} from '@mantine/core';
import { IconPlus, IconTrash, IconStairs, IconEdit, IconX } from '@tabler/icons-react';

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
      intervalMinutes: lvl.intervalMinutes
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

  if (loading && schedules.length === 0) return <LoadingOverlay visible={true} />;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2}>Настройки интервалов</Title>
        {!isFormOpen && (
            <Button onClick={handleOpenCreate} leftSection={<IconPlus size={18}/>}>
             Создать стратегию
            </Button>
        )}
      </Group>

      {/* ФОРМА */}
      {isFormOpen && (
        <Paper 
          withBorder p="xl" radius="md" mb={40} shadow="md" 
          style={{ 
              backgroundColor: 'var(--mantine-color-default-hover)', 
              borderColor: 'var(--mantine-color-default-border)'
          }}
        >
          <Group justify="space-between" align="center" mb="md" wrap="nowrap">
             {/* Исправлено: замена truncate на стили в Title */}
             <Title 
                order={4} 
                style={{ 
                    flex: 1, 
                    minWidth: 0, 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                }}
             >
                {editingId ? `Редактирование: ${name}` : 'Новая стратегия'}
             </Title>
             <ActionIcon 
                variant="subtle" 
                color="gray" 
                onClick={handleCloseForm}
                style={{ flexShrink: 0 }}
             >
                 <IconX size={20} />
             </ActionIcon>
          </Group>

          <TextInput 
            label="Название" 
            placeholder="Например: Стандартная" 
            mb="lg"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            data-autofocus
            variant="default"
            styles={{
                input: { backgroundColor: 'var(--mantine-color-body)' }
            }}
          />

          <Text fw={500} mb="xs">Этапы повторения</Text>
          <Stack gap="sm" mb="lg">
            {levels.map((lvl, index) => (
              <Paper 
                key={index} withBorder p="xs" radius="md" 
                style={{ backgroundColor: 'var(--mantine-color-body)' }}
              >
                <Group align="center" wrap="nowrap">
                  <Badge size="md" circle color="blue" style={{ flexShrink: 0 }}>{index + 1}</Badge>
                  <Box style={{ flex: 1 }}>
                     <IntervalInput 
                        valueMinutes={lvl.intervalMinutes} 
                        onChange={(mins) => {
                            setLevels(prev => prev.map((item, i) => i === index ? { ...item, intervalMinutes: mins } : item));
                        }}
                     />
                  </Box>
                  <ActionIcon 
                      color="red" variant="subtle" 
                      onClick={() => setLevels(prev => prev.filter((_, i) => i !== index))}
                      disabled={levels.length <= 1}
                      style={{ flexShrink: 0 }}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>

          <Button 
            variant="dashed" fullWidth mb="xl"
            leftSection={<IconPlus size={16}/>} 
            onClick={() => setLevels(prev => [...prev, { level: prev.length + 1, intervalMinutes: 60 }])}
            color="gray"
            style={{ borderColor: 'var(--mantine-color-default-border)', borderStyle: 'dashed' }}
          >
            Добавить шаг
          </Button>

          <Group justify="space-between">
             {editingId ? (
                 <Button color="red" variant="light" onClick={() => setDeleteModalOpen(true)} leftSection={<IconTrash size={16}/>}>
                     Удалить
                 </Button>
             ) : <div />}

             <Group>
                 <Button variant="default" onClick={handleCloseForm}>Отмена</Button>
                 <Button onClick={handleSubmit} loading={isSubmitting}>
                     {editingId ? 'Сохранить' : 'Создать'}
                 </Button>
             </Group>
          </Group>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {schedules.map(sch => (
          <Card 
            key={sch.id} withBorder shadow="sm" radius="md" padding="lg"
            onClick={() => handleOpenEdit(sch)}
            style={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                borderColor: editingId === sch.id ? 'var(--mantine-color-blue-filled)' : undefined,
                borderWidth: editingId === sch.id ? '2px' : '1px'
            }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                 <ThemeIcon color="violet" variant="light" radius="md"><IconStairs size={20}/></ThemeIcon>
                 <Text fw={600} size="lg">{sch.name}</Text>
              </Group>
              <IconEdit size={16} color="var(--mantine-color-dimmed)" />
            </Group>
            <Text size="sm" c="dimmed" mb="md">Этапов: {sch.levels?.length || 0}</Text>
            <Group gap={4}>
                {sch.levels?.slice(0, 3).map((l, i) => (
                    <Badge key={i} size="sm" variant="outline" color="gray">{l.intervalMinutes}м</Badge>
                ))}
                {(sch.levels?.length || 0) > 3 && <Text size="xs" c="dimmed">...</Text>}
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      
      <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Удаление стратегии" centered>
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
                  <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Отмена</Button>
                  <Button color="red" onClick={handleConfirmDelete}>Удалить и перенести</Button>
              </Group>
          </Stack>
       </Modal>
    </Container>
  );
};

export default SchedulesPage;