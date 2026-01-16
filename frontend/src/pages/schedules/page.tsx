import { useEffect, useState } from 'react';
import { 
  Container, Title, Button, Group, TextInput, Paper, 
  Stack, Text, ActionIcon, SimpleGrid, Card, Badge, ThemeIcon, Box, LoadingOverlay, Modal, Select 
} from '@mantine/core';
import { IconPlus, IconTrash, IconStairs, IconEdit, IconX } from '@tabler/icons-react';

import type { Schedule, ScheduleLevel } from '../../features/schedules/types';
import { CreateSchedule, DeleteSchedule, GetSchedules, UpdateSchedule } from '../../features/schedules/api';
import { IntervalInput } from '../../features/schedules/components/IntervalInput';

const SchedulesPage = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Состояние формы (Создание / Редактирование)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Состояние модалки удаления (Замена)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [replacementId, setReplacementId] = useState<string | null>(null);

  // Поля формы
  const [name, setName] = useState('');
  const [levels, setLevels] = useState<ScheduleLevel[]>([
    { level: 1, intervalMinutes: 10 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ЗАГРУЗКА ---
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = () => {
    setLoading(true);
    GetSchedules()
      .then(setSchedules)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // --- ЛОГИКА ФОРМЫ ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setLevels([{ level: 1, intervalMinutes: 10 }]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (schedule: Schedule) => {
    setEditingId(schedule.id);
    setName(schedule.name);
    
    // Сортируем уровни для правильного порядка
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

  // --- ЛОГИКА УРОВНЕЙ ---

  const addLevel = () => {
    setLevels(prev => [...prev, { level: prev.length + 1, intervalMinutes: 60 }]);
  };

  const removeLevel = (index: number) => {
    setLevels(prev => prev.filter((_, i) => i !== index));
  };

  const updateLevelMinutes = (index: number, minutes: number) => {
    setLevels(prev => prev.map((item, i) => 
      i === index ? { ...item, intervalMinutes: minutes } : item
    ));
  };

  // --- ОТПРАВКА (CREATE / UPDATE) ---

  const handleSubmit = async () => {
    if (!name) return;
    setIsSubmitting(true);
    
    const payloadLevels = levels.map((lvl, index) => ({
      level: index, // Пересчитываем уровни от 0 (или 1, как на бэке)
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

  // --- ЛОГИКА УДАЛЕНИЯ (С ЗАМЕНОЙ) ---

  const handleTryDelete = () => {
      // 1. Проверяем, не дефолтное ли это расписание
      const current = schedules.find(s => s.id === editingId);
      if (current?.isDefault) { // Убедись, что поле isDefault приходит с бэка
          alert('Это системное расписание, его нельзя удалить.');
          return;
      }

      // 2. Предлагаем замену (первое попавшееся, кроме текущего)
      const firstAvailable = schedules.find(s => s.id !== editingId);
      if (firstAvailable) setReplacementId(String(firstAvailable.id));
      
      setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
      if (!editingId || !replacementId) return;
      
      try {
          // Вызываем API с параметром замены
          // Важно: Убедись, что DeleteSchedule принимает второй аргумент
          await DeleteSchedule(editingId, Number(replacementId));
          
          await loadSchedules();
          setDeleteModalOpen(false);
          handleCloseForm(); // Закрываем форму, т.к. удалили то, что редактировали
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

      {/* ФОРМА (Показывается при создании или редактировании) */}
      {isFormOpen && (
        <Paper withBorder p="xl" radius="md" mb={40} shadow="md" bg="gray.0" style={{ margin: '0 auto' }}>
          <Group justify="space-between" mb="md">
             <Title order={4}>
                {editingId ? `Редактирование: ${name}` : 'Новая стратегия'}
             </Title>
             <ActionIcon variant="subtle" color="gray" onClick={handleCloseForm}>
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
          />

          <Text fw={500} mb="xs">Этапы повторения</Text>
          <Stack gap="sm" mb="lg">
            {levels.map((lvl, index) => (
              <Paper key={index} withBorder p="xs" radius="md" bg="white">
                <Group align="center">
                  <Badge size="md" circle color="blue">{index + 1}</Badge>
                  
                  <Box style={{ flex: 1 }}>
                     <IntervalInput 
                        valueMinutes={lvl.intervalMinutes} 
                        onChange={(mins) => updateLevelMinutes(index, mins)}
                     />
                  </Box>

                  <ActionIcon 
                      color="red" 
                      variant="subtle" 
                      onClick={() => removeLevel(index)}
                      disabled={levels.length <= 1}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Paper>
            ))}
          </Stack>

          <Button 
            variant="dashed" 
            fullWidth 
            mb="xl"
            leftSection={<IconPlus size={16}/>} 
            onClick={addLevel}
            color="gray"
            style={{ border: '1px dashed #ced4da' }}
          >
            Добавить шаг
          </Button>

          <Group justify="space-between">
             {/* Кнопка удаления только при редактировании */}
             {editingId ? (
                 <Button color="red" variant="light" onClick={handleTryDelete} leftSection={<IconTrash size={16}/>}>
                     Удалить
                 </Button>
             ) : (
                 <div /> // Пустой блок для выравнивания flex
             )}

             <Group>
                 <Button variant="default" onClick={handleCloseForm}>Отмена</Button>
                 <Button onClick={handleSubmit} loading={isSubmitting}>
                     {editingId ? 'Сохранить изменения' : 'Создать'}
                 </Button>
             </Group>
          </Group>
        </Paper>
      )}

      {/* СПИСОК СТРАТЕГИЙ */}
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        {schedules.map(sch => (
          <Card 
            key={sch.id} 
            withBorder 
            shadow="sm" 
            radius="md" 
            padding="lg"
            onClick={() => handleOpenEdit(sch)}
            style={{ 
                cursor: 'pointer', 
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderColor: editingId === sch.id ? '#228be6' : undefined,
                borderWidth: editingId === sch.id ? '2px' : '1px'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                 <ThemeIcon color="violet" variant="light" radius="md"><IconStairs size={20}/></ThemeIcon>
                 <Text fw={600} size="lg">{sch.name}</Text>
              </Group>
              <IconEdit size={16} color="gray" />
            </Group>
            
            <Text size="sm" c="dimmed" mb="md">
               Этапов: {sch.levels?.length || 0}
            </Text>

            <Group gap={4}>
                {sch.levels?.slice(0, 3).map((l, i) => (
                    <Badge key={i} size="sm" variant="outline" color="gray">
                        {l.intervalMinutes}м
                    </Badge>
                ))}
                {(sch.levels?.length || 0) > 3 && <Text size="xs" c="dimmed">...</Text>}
            </Group>
          </Card>
        ))}
      </SimpleGrid>
      
      {/* МОДАЛКА УДАЛЕНИЯ (ЗАМЕНА) */}
      <Modal 
          opened={deleteModalOpen} 
          onClose={() => setDeleteModalOpen(false)} 
          title="Удаление стратегии"
          centered
       >
          <Stack>
              <Text size="sm">
                  Если эта стратегия используется в активных колодах, их нужно перевести на другую стратегию.
              </Text>
              
              <Select 
                  label="Выберите замену"
                  placeholder="Выберите расписание..."
                  data={schedules
                      .filter(s => s.id !== editingId) // Исключаем само удаляемое расписание
                      .map(s => ({ value: String(s.id), label: s.name }))
                  }
                  value={replacementId}
                  onChange={setReplacementId}
                  allowDeselect={false}
              />

              <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Отмена</Button>
                  <Button color="red" onClick={handleConfirmDelete}>
                      Удалить и перенести
                  </Button>
              </Group>
          </Stack>
       </Modal>

      {schedules.length === 0 && !loading && (
          <Text c="dimmed" ta="center" mt="xl">Нет стратегий. Создайте первую!</Text>
      )}
    </Container>
  );
};

export default SchedulesPage;