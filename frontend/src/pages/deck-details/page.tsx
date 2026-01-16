import {
  ActionIcon,
  Anchor,
  Badge, Box,
  Button,
  Container,
  Group,
  LoadingOverlay,
  Modal,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Table, Text,
  TextInput,
  Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconLanguage,
  IconLock,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconTrash,
  IconVocabulary
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from 'recharts';

import { createCard, deleteCard, deleteDeck, getDeckById, resetDeck, updateCard, updateDeck } from '../../features/decks/api';
import type { Card, DeckDetails } from '../../features/decks/types';
import { GetSchedules } from '../../features/schedules/api';

// --- КОМПОНЕНТ ГРАФИКА ---
const DeckHistoryChart = ({ data }: { data: any[] }) => {


  if (!data || data.length < 2) return null;

    const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Доступ к полному объекту (с датой)
      return (
        <Paper shadow="md" p="xs" radius="md" withBorder bg="rgba(255, 255, 255, 0.95)">
          <Text size="xs" c="dimmed" mb={2}>
              Попытка #{label} ({data.date})
          </Text>
          <Text size="sm" fw={700} c="blue">
            {payload[0].value}% точность
          </Text>
        </Paper>
      );
    }
    return null;
  };

  const chartData = data.map((item, index) => ({
      index: index + 1,
      date: new Date(item.reviewDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), // Для тултипа
      accuracy: item.accuracy
  }))
  
  return (
    <Paper withBorder p="md" radius="md" mb="xl">
      <Text size="sm" fw={500} mb="lg" c="dimmed">Динамика успеваемости</Text>
      
      {/* 1. Используем Box от Mantine */}
      <Box h={250} w="100%"> 
        
        {/* 2. ResponsiveContainer внутри Box */}
        <ResponsiveContainer
        width="100%"
        height="100%"
        initialDimension={ { width: 320, height: 200 } }
        >
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#228be6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#228be6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
             <XAxis 
            dataKey="index" 
            tick={{fontSize: 11, fill: '#868e96'}} 
            tickLine={false} 
            axisLine={false}
            // interval={0} // Показывать все точки
        />
    
            {/* А дату показываем только в тултипе */}
            <RechartsTooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#dee2e6', strokeWidth: 1 }} 
            />
            <Area type="monotone" dataKey="accuracy" stroke="#228be6" strokeWidth={2} fillOpacity={1} fill="url(#colorAccuracy)" />
            </AreaChart>
        </ResponsiveContainer>

      </Box>
    </Paper>
  );
};

const DeckDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<DeckDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // UI States
  const [isRevealed, setIsRevealed] = useState(false);
  const [settingsOpen, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  
  // Settings Form
  const [editName, setEditName] = useState('');
  const [editScheduleId, setEditScheduleId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [schedules, setSchedules] = useState<{ value: string, label: string }[]>([]);

  // Add/Edit Card Forms
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ originalWord: '', translation: '', originalContext: '', translationContext: '' });
  
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState({ originalWord: '', translation: '', originalContext: '', translationContext: '' });

  // LOAD DATA
  useEffect(() => {
    if (!id) return;
    
    getDeckById(id)
      .then((data) => {
  
        const safeDeck = { ...data, cards: data.cards || [], history: data.deckHistories || [] };
        setDeck(safeDeck);
        
        setEditName(data.name);
        if ((data as any).scheduleId) setEditScheduleId(String((data as any).scheduleId));
        if (data.nextReviewDate) setEditDate(new Date(data.nextReviewDate).toISOString().slice(0, 16));

        // Если новая - показываем слова
        if ((data.currentLevel || 0) === 0) setIsRevealed(true);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    GetSchedules().then(data => {
        setSchedules(data.map(s => ({ value: String(s.id), label: s.name })));
    });
  }, [id]);

  const isStarted = (deck?.currentLevel || 0) > 0;

  // --- HANDLERS ---

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCard = async () => {
    if (!deck || !form.originalWord || !form.translation) return;
    setIsAdding(true);
    try {
      const newCard = await createCard({
        deckId: Number(id),
        originalWord: form.originalWord,
        translation: form.translation,
        originalContext: form.originalContext,
        translationContext: form.translationContext
      });
      setDeck(prev => prev ? { ...prev, cards: [...prev.cards, newCard] } : null);
      setForm({ originalWord: '', translation: '', originalContext: '', translationContext: '' });
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } catch (err) { alert('Ошибка'); } finally { setIsAdding(false); }
  };

  const handleDeleteCard = async (cardId: number) => {
      if (!confirm('Удалить слово?')) return;
      try {
          await deleteCard({ cardId, deckId: Number(id) });
          setDeck(prev => prev ? { ...prev, cards: prev.cards.filter(c => c.id !== cardId) } : null);
      } catch (e) { alert('Ошибка удаления'); }
  };

  const handleUpdateDeck = async () => {
    if (!id) return;
    try {
        const payload: any = { name: editName, scheduleId: Number(editScheduleId) };
        if (!isStarted && editDate) payload.nextReviewDate = new Date(editDate).toISOString();

        const updated = await updateDeck(Number(id), payload);
        setDeck(prev => prev ? { ...prev, name: updated.name, nextReviewDate: updated.nextReviewDate } : null);
        closeSettings();
    } catch (e) { alert('Ошибка обновления'); }
  };

  const handleDeleteDeck = async () => {
      if (!confirm('Удалить колоду?')) return;
      try { await deleteDeck(Number(id)); navigate('/decks'); } catch (e) { alert('Ошибка'); }
  };

  const handleResetProgress = async () => {
      if (!confirm('Сбросить прогресс?')) return;
      try { await resetDeck(Number(id)); window.location.reload(); } catch (e) { alert('Ошибка'); }
  };

  const handleStartReview = () => {
    if (!deck?.cards || deck.cards.length === 0) return;
    navigate(`/decks/${id}/review`, { state: { cards: deck.cards, primaryDirection: deck.nextPrimaryDirection, isArchived: deck.isArchived } });
  };

  // Edit Card Logic
  const handleOpenEdit = (card: Card) => {
    setEditingCard(card);
    setEditForm({
        originalWord: card.originalWord,
        translation: card.translation,
        originalContext: card.originalContext || '',
        translationContext: card.translationContext || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    try {
        const updated = await updateCard({ id: editingCard.id, ...editForm });
        setDeck(prev => prev ? {
            ...prev,
            cards: prev.cards.map(c => c.id === updated.id ? updated : c)
        } : null);
        setEditingCard(null);
    } catch (e) { alert('Ошибка при обновлении'); }
  };

  if (loading) return <LoadingOverlay visible={true} />;
  if (!deck) return <div>Колода не найдена</div>;

  return (
    <Container size="md" py="xl">
      {/* HEADER */}
      <Box mb="md">
        <Button component={Link} to="/decks" variant="subtle" leftSection={<IconArrowLeft size={16}/>} color="gray" size="xs" pl={0}>
            Назад к списку
        </Button>
      </Box>

      <Group justify="space-between" align="flex-start" mb={30}>
           <div>
              <Title order={2} style={{ lineHeight: 1.2 }}>{deck.name}</Title>
              <Group gap="xs" mt={8}>
                  <Badge variant="dot" color="gray" size="sm">{deck.cards.length} слов</Badge>
                  {isStarted && (
                      <Badge variant="outline" color="gray" size="sm">Уровень {deck.currentLevel}</Badge>
                  )}
              </Group>
           </div>

           <Group>
               <ActionIcon variant="default" size="lg" radius="md" onClick={openSettings}>
                   <IconSettings size={20} />
               </ActionIcon>

               <Button 
                  visibleFrom="sm" size="sm" radius="md" color="blue" variant="light"
                  onClick={handleStartReview} disabled={deck.cards.length === 0}
               >
                  Начать тренировку
               </Button>
           </Group>
      </Group>

      <Button 
          hiddenFrom="sm" fullWidth size="md" radius="md" color="blue" variant="light" mb="xl"
          onClick={handleStartReview} disabled={deck.cards.length === 0}
       >
          Начать тренировку
       </Button>

      {/* GRAPH (Only if history exists) */}
      {isStarted && deck.deckHistories && deck.deckHistories.length > 0 && (
          <DeckHistoryChart data={deck.deckHistories} />
      )}

      {/* ADD FORM or LOCKED INFO */}
      {isStarted ? (
          <Paper withBorder p="xs" bg="gray.0" mb="xl" radius="md">
              <Group justify="center" gap="xs">
                  <IconLock size={14} color="gray" />
                  <Text size="xs" c="dimmed">
                      Редактирование заблокировано. <Anchor size="xs" c="dimmed" onClick={openSettings}>Сбросить прогресс</Anchor>, чтобы изменить состав.
                  </Text>
              </Group>
          </Paper>
      ) : (
          <Paper shadow="sm" radius="md" p="lg" withBorder mb={40}>
            <Title order={5} mb="md" c="dimmed">Добавить слово</Title>
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput ref={firstInputRef} label="Слово" placeholder="Apple" value={form.originalWord} onChange={(e) => handleInputChange('originalWord', e.currentTarget.value)} leftSection={<IconVocabulary size={16} />} data-autofocus variant="filled"/>
                <TextInput label="Перевод" placeholder="Яблоко" value={form.translation} onChange={(e) => handleInputChange('translation', e.currentTarget.value)} leftSection={<IconLanguage size={16} />} variant="filled" onKeyDown={(e) => { if(e.key === 'Enter' && !form.originalContext) handleAddCard() }}/>
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Контекст" placeholder="I eat an apple" value={form.originalContext} onChange={(e) => handleInputChange('originalContext', e.currentTarget.value)} leftSection={<IconBook size={16} />} size="sm" variant="filled"/>
                <TextInput label="Перевод примера" placeholder="Я ем яблоко" value={form.translationContext} onChange={(e) => handleInputChange('translationContext', e.currentTarget.value)} leftSection={<IconLanguage size={16} />} size="sm" variant="filled" onKeyDown={(e) => { if(e.key === 'Enter') handleAddCard() }}/>
              </SimpleGrid>
              <Group justify="flex-end" mt="xs">
                 <Button onClick={handleAddCard} loading={isAdding} leftSection={<IconPlus size={16}/>} variant="light" size="xs">Добавить</Button>
              </Group>
            </Stack>
          </Paper>
      )}

      {/* WORD LIST */}
      <Group justify="space-between" mb="md" align="center">
          <Title order={5} c="dimmed">Словарь</Title>
          {isStarted && (
              <Button variant="subtle" color="gray" size="xs" onClick={() => setIsRevealed(!isRevealed)}>
                  {isRevealed ? 'Скрыть' : 'Показать'}
              </Button>
          )}
      </Group>
      
      <Paper shadow="xs" radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" highlightOnHover striped>
          <Table.Thead bg="gray.1">
            <Table.Tr>
              <Table.Th style={{ textAlign: 'center' }}>Оригинал</Table.Th>
              <Table.Th style={{ textAlign: 'center' }}>Перевод</Table.Th>
              {!isStarted && <Table.Th w={80} />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {deck.cards.length === 0 ? (
               <Table.Tr><Table.Td colSpan={3} align="center" py="xl"><Text c="dimmed">Пусто</Text></Table.Td></Table.Tr>
            ) : (
              [...deck.cards].reverse().map((card) => (
                <Table.Tr key={card.id}>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <div style={{ filter: !isRevealed && isStarted ? 'blur(4px)' : 'none', transition: 'filter 0.2s' }}>
                        <Text fw={500} size="sm">{card.originalWord}</Text>
                        {card.originalContext && <Text size="xs" c="dimmed">{card.originalContext}</Text>}
                    </div>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <div style={{ filter: !isRevealed && isStarted ? 'blur(4px)' : 'none', transition: 'filter 0.2s' }}>
                        <Text size="sm">{card.translation}</Text>
                        {card.translationContext && <Text size="xs" c="dimmed">{card.translationContext}</Text>}
                    </div>
                  </Table.Td>
                  
                  {!isStarted && (
                      <Table.Td>
                          <Group gap={5} justify="center">
                              <ActionIcon variant="subtle" color="blue" size="sm" onClick={() => handleOpenEdit(card)}>
                                  <IconPencil size={16} />
                              </ActionIcon>
                              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleDeleteCard(card.id)}>
                                  <IconTrash size={16} />
                              </ActionIcon>
                          </Group>
                      </Table.Td>
                  )}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* SETTINGS MODAL */}
      <Modal opened={settingsOpen} onClose={closeSettings} title="Настройки колоды" centered>
          <Stack gap="md">
              <TextInput label="Название" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Select label="Стратегия" data={schedules} value={editScheduleId} onChange={setEditScheduleId} allowDeselect={false} />
              
              {!isStarted && (
                <TextInput label="Дата старта" type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} leftSection={<IconCalendar size={16}/>} />
              )}
              {isStarted && (
                <Text size="xs" c="dimmed">Дата зафиксирована. Сбросьте прогресс, чтобы изменить.</Text>
              )}

              <Paper withBorder p="sm" bg="red.0" mt="sm">
                  <Text size="xs" fw={700} c="red.9" mb="xs" tt="uppercase">Опасная зона</Text>
                  <Group grow>
                      <Button variant="white" color="orange" size="xs" onClick={handleResetProgress} leftSection={<IconRefresh size={14}/>}>Сбросить прогресс</Button>
                      <Button variant="white" color="red" size="xs" onClick={handleDeleteDeck} leftSection={<IconTrash size={14}/>}>Удалить колоду</Button>
                  </Group>
              </Paper>

              <Group justify="flex-end" mt="md">
                  <Button variant="default" onClick={closeSettings}>Отмена</Button>
                  <Button onClick={handleUpdateDeck}>Сохранить</Button>
              </Group>
          </Stack>
      </Modal>

      {/* EDIT CARD MODAL */}
      <Modal opened={!!editingCard} onClose={() => setEditingCard(null)} title="Редактировать слово" centered>
        <Stack gap="md">
            <TextInput label="Слово" value={editForm.originalWord} onChange={(e) => setEditForm({...editForm, originalWord: e.target.value})} />
            <TextInput label="Перевод" value={editForm.translation} onChange={(e) => setEditForm({...editForm, translation: e.target.value})} />
            <TextInput label="Контекст" value={editForm.originalContext} onChange={(e) => setEditForm({...editForm, originalContext: e.target.value})} />
            <TextInput label="Перевод контекста" value={editForm.translationContext} onChange={(e) => setEditForm({...editForm, translationContext: e.target.value})} />
            <Group justify="flex-end">
                <Button variant="default" onClick={() => setEditingCard(null)}>Отмена</Button>
                <Button onClick={handleSaveEdit}>Сохранить</Button>
            </Group>
        </Stack>
      </Modal>

    </Container>
  );
};

export default DeckDetailsPage;