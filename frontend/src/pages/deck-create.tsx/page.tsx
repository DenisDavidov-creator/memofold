import {
   ActionIcon,
   Badge, Box,
   Button,
   Container,
   Group,
   Modal,
   Paper,
   Select,
   SimpleGrid,
   Stack,
   Table, Text,
   TextInput,
   Title,
} from '@mantine/core';
import {
   IconArrowLeft,
   IconBook,
   IconCalendar,
   IconLanguage,
   IconPlus,
   IconSettings,
   IconTrash,
   IconVocabulary,
   IconCrown
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useDraft } from '../../app/providers/DraftProviders';
import { createDeckWithCards } from '../../features/decks/api';
import { GetSchedules } from '../../features/schedules/api';
import { useReviewSession } from '../../app/providers/ReviewProvider';

const CreateDeckPage = () => {
  const navigate = useNavigate();
  const { setSessionActive } = useReviewSession();
  const { draftCards, removeFromDraft, clearDraft, addToDraft } = useDraft();
  
  // Данные новой колоды
  const [deckName, setDeckName] = useState('');
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<{ value: string, label: string }[]>([]);
  
  // Дата старта
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State
  const [errorModalOpened, setErrorModalOpened] = useState(false);
  const [errorContent, setErrorContent] = useState({ title: '', message: '' });
  const [showPremiumButton, setShowPremiumButton] = useState(false);

  // Форма добавления слов
  const [form, setForm] = useState({
    originalWord: '',
    translation: '',
    originalContext: '',
    translationContext: ''
  });
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSessionActive(false); // Деактивируем флаг сессии
    
    GetSchedules().then(data => {
      setSchedules(data.map(s => ({ value: String(s.id), label: s.name })));
      if (data.length > 0) setScheduleId(String(data[0].id));
    });
  }, [setSessionActive]);

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCard = () => {
    if (!form.originalWord || !form.translation) return;

    addToDraft([{
       originalWord: form.originalWord,
       translation: form.translation,
       originalContext: form.originalContext,
       translationContext: form.translationContext
    }]);

    setForm({ originalWord: '', translation: '', originalContext: '', translationContext: '' });
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const showError = (title: string, message: string, isPremiumNeeded: boolean = false) => {
      setErrorContent({ title, message });
      setShowPremiumButton(isPremiumNeeded);
      setErrorModalOpened(true);
  };

  const handleCreate = async () => {
    if (!deckName || !scheduleId) return;
    setIsSubmitting(true);

    const existingIds = draftCards.filter(c => c.id).map(c => Number(c.id));
    const newCards = draftCards.filter(c => !c.id).map(c => ({
        originalWord: c.originalWord,
        translation: c.translation,
        originalContext: c.originalContext,
        translationContext: c.translationContext
    }));

    try {
      await createDeckWithCards({
         name: deckName,
         scheduleId: Number(scheduleId),
         existingCardIds: existingIds,
         newCards: newCards,
         nextReviewDate: new Date(startDate).toISOString() 
      });

      clearDraft();
      navigate('/decks'); 
    } catch (error: any) {
      if (error.response) {
        const body = await error.response.json();
        const msg = body.error;
        if (msg === 'free_limit_words_exceeded') {
            showError('Лимит превышен', 'Лимит слов (7 шт) превышен! Перейдите на Premium, чтобы создавать большие колоды.', true);
        } else if (msg === 'free_limit_decks_exceeded') {
            showError('Лимит исчерпан', 'Лимит колод на сегодня исчерпан. Обновите тариф для безлимитного доступа.', true);
        } else {
            showError('Ошибка', `Произошла ошибка: ${msg}`, false);
        }
      } else {
        showError('Ошибка сети', 'Не удалось связаться с сервером.', false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="md" py="xl">
       <Box mb="md">
        <Button component={Link} to="/decks" variant="subtle" leftSection={<IconArrowLeft size={16}/>} color="gray" size="xs" pl={0}>Отмена</Button>
      </Box>

      <Title order={2} mb="lg">Новая колода</Title>

      {/* 1. НАСТРОЙКИ */}
      <Paper 
        shadow="sm" 
        radius="md" 
        p="xl" 
        withBorder 
        mb="xl" 
        style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}
      >
          <Group mb="md">
             <IconSettings size={20} style={{ opacity: 0.5 }} />
             <Text fw={500}>Основные настройки</Text>
          </Group>
          
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
             <TextInput 
                label="Название" 
                placeholder="Урок №1" 
                required 
                value={deckName} 
                onChange={(e) => setDeckName(e.target.value)} 
                data-autofocus
                variant="filled"
                styles={{ input: { backgroundColor: 'var(--mantine-color-body)' } }}
             />
             <Select 
                label="Стратегия" 
                data={schedules} 
                value={scheduleId} 
                onChange={setScheduleId}
                allowDeselect={false}
                required
                variant="filled"
                styles={{ input: { backgroundColor: 'var(--mantine-color-body)' } }}
             />
             <TextInput
                label="Дата старта"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftSection={<IconCalendar size={16}/>}
                variant="filled"
                styles={{ input: { backgroundColor: 'var(--mantine-color-body)' } }}
             />
          </SimpleGrid>
      </Paper>

      {/* 2. ФОРМА ДОБАВЛЕНИЯ */}
      <Paper shadow="sm" radius="lg" p="xl" withBorder mb={40}>
        <Title order={4} mb="md" c="dimmed">Новая карточка</Title>
        
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput 
              ref={firstInputRef}
              label="Слово" 
              placeholder="Apple" 
              value={form.originalWord}
              onChange={(e) => handleInputChange('originalWord', e.currentTarget.value)}
              leftSection={<IconVocabulary size={16} />}
              variant="filled" 
            />
            <TextInput 
              label="Перевод" 
              placeholder="Яблоко" 
              value={form.translation}
              onChange={(e) => handleInputChange('translation', e.currentTarget.value)}
              leftSection={<IconLanguage size={16} />}
              variant="filled"
              onKeyDown={(e) => { if(e.key === 'Enter' && !form.originalContext) handleAddCard() }}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput 
              label="Контекст (Пример)" 
              placeholder="I eat an apple" 
              value={form.originalContext}
              onChange={(e) => handleInputChange('originalContext', e.currentTarget.value)}
              leftSection={<IconBook size={16} />}
              size="sm"
              variant="filled"
            />
            <TextInput 
              label="Перевод примера" 
              placeholder="Я ем яблоко" 
              value={form.translationContext}
              onChange={(e) => handleInputChange('translationContext', e.currentTarget.value)}
              leftSection={<IconLanguage size={16} />}
              size="sm"
              variant="filled"
              onKeyDown={(e) => { if(e.key === 'Enter') handleAddCard() }}
            />
          </SimpleGrid>

          <Group justify="flex-end" mt="xs">
             <Button 
                onClick={handleAddCard} 
                loading={isSubmitting} 
                leftSection={<IconPlus size={18}/>}
                variant="light"
             >
                Добавить
             </Button>
          </Group>
        </Stack>
      </Paper>

      {/* 3. СПИСОК */}
      <Group justify="space-between" mb="sm" align="flex-end">
          <Title order={4}>Итоговый список ({draftCards.length})</Title>
          {draftCards.length > 0 && (
             <Button variant="subtle" color="red" size="xs" onClick={clearDraft}>Очистить</Button>
          )}
      </Group>

      <Paper shadow="xs" radius="md" withBorder style={{ overflow: 'hidden' }} mb={40}>
         <Table verticalSpacing="sm" highlightOnHover striped>
            <Table.Thead style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}>
               <Table.Tr>
                  <Table.Th>Слово</Table.Th>
                  <Table.Th>Перевод</Table.Th>
                  <Table.Th w={50}></Table.Th>
               </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
               {draftCards.length === 0 ? (
                  <Table.Tr><Table.Td colSpan={3} align="center" py="xl"><Text c="dimmed">Список пуст</Text></Table.Td></Table.Tr>
               ) : (
                  [...draftCards].reverse().map((card, i) => (
                     <Table.Tr key={i}>
                        <Table.Td>
                           <Text fw={600}>{card.originalWord}</Text>
                           {!card.id && <Badge size="xs" color="cyan" variant="outline" ml={5}>New</Badge>}
                           {card.originalContext && <Text size="xs" c="dimmed" mt={1}>{card.originalContext}</Text>}
                        </Table.Td>
                        <Table.Td>
                            <Text>{card.translation}</Text>
                            {card.translationContext && <Text size="xs" c="dimmed" mt={1}>{card.translationContext}</Text>}
                        </Table.Td>
                        <Table.Td>
                           <ActionIcon color="red" variant="subtle" onClick={() => removeFromDraft(card.originalWord)}>
                              <IconTrash size={16}/>
                           </ActionIcon>
                        </Table.Td>
                     </Table.Tr>
                  ))
               )}
            </Table.Tbody>
         </Table>
      </Paper>

      <Group justify="flex-end" mt="xl" mb="xl">
          <Button 
              size="md" 
              onClick={handleCreate} 
              disabled={!deckName || !scheduleId || draftCards.length === 0} 
              loading={isSubmitting}
          >
              Создать колоду
          </Button>
      </Group>

      {/* MODAL */}
      <Modal 
        opened={errorModalOpened} 
        onClose={() => setErrorModalOpened(false)} 
        title={errorContent.title} 
        centered
      >
          <Text size="sm" mb="lg">
              {errorContent.message}
          </Text>
          <Group justify="flex-end">
              <Button variant="default" onClick={() => setErrorModalOpened(false)}>
                  {showPremiumButton ? 'Отмена' : 'Понятно'}
              </Button>
              
              {showPremiumButton && (
                  <Button 
                    component={Link} 
                    to="/payment" 
                    color="yellow" 
                    leftSection={<IconCrown size={16} />}
                  >
                      Купить Premium
                  </Button>
              )}
          </Group>
      </Modal>

    </Container>
  );
};

export default CreateDeckPage;