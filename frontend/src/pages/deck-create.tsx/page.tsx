import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, Title, Button, Group, TextInput, Paper, 
  Table, Text, Stack, SimpleGrid, Select, Badge, Box, ActionIcon 
} from '@mantine/core';
import { 
  IconTrash, IconArrowLeft, IconVocabulary, IconLanguage, 
  IconBook, IconPlus, IconCalendar, IconSettings 
} from '@tabler/icons-react';

import { useDraft } from '../../app/providers/DraftProviders';
import { GetSchedules } from '../../features/schedules/api';
import { createDeckWithCards } from '../../features/decks/api';


const CreateDeckPage = () => {
  const navigate = useNavigate();
  const { draftCards, removeFromDraft, clearDraft, addToDraft } = useDraft();
  
  // Данные новой колоды
  const [deckName, setDeckName] = useState('');
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<{ value: string, label: string }[]>([]);
  
  // Дата старта: берем только YYYY-MM-DD
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Форма добавления слов
  const [form, setForm] = useState({
    originalWord: '',
    translation: '',
    originalContext: '',
    translationContext: ''
  });
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {  
    GetSchedules().then(data => {
      setSchedules(data.map(s => ({ value: String(s.id), label: s.name })));
      if (data.length > 0) setScheduleId(String(data[0].id));
    });
  }, []);

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
         // Превращаем дату обратно в ISO формат д ля бэкенда (начало дня)
         nextReviewDate: new Date(startDate).toISOString() 
      });

      clearDraft();
      navigate('/decks'); 
    } catch (error: any) {
      console.log(error.response);
      
      if (error.response) {
        const body = await error.response.json();
         const msg = body.error;
         
         console.log('BODY:', body)
        if (msg === 'free_limit_words_exceeded') {
            alert('Лимит слов (7 шт) превышен! Перейдите на Premium.');
        } else if (msg === 'free_limit_decks_exceeded') {
            alert('Лимит колод на сегодня исчерпан.');
        } else {
            alert(`Ошибка: ${msg}`);
        }
            } else {
        console.error(error);
        alert('Ошибка сети или сервера');
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
      <Paper shadow="sm" radius="md" p="xl" withBorder mb="xl" bg="gray.0">
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
                bg="white"
             />
             <Select 
                label="Стратегия" 
                data={schedules} 
                value={scheduleId} 
                onChange={setScheduleId}
                allowDeselect={false}
                required
                variant="filled"
             />
             <TextInput
                label="Дата старта"
                type="date" // <--- Только дата
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                leftSection={<IconCalendar size={16}/>}
                variant="filled"
             />
          </SimpleGrid>
      </Paper>

      {/* 2. ФОРМА ДОБАВЛЕНИЯ */}
   <Paper shadow="sm" radius="lg" p="xl" withBorder mb={40}>
        <Title order={4} mb="md" c="dimmed">Новая карточка</Title>
        
        <Stack gap="md">
          {/* Ряд 1: Основные слова */}
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput 
              ref={firstInputRef}
              label="Слово" 
              placeholder="Apple" 
              value={form.originalWord}
              onChange={(e) => handleInputChange('originalWord', e.currentTarget.value)}
              leftSection={<IconVocabulary size={16} />}
              data-autofocus
              variant="filled" // Делает инпут чуть серым, выделяя его на белом фоне
            />
            <TextInput 
              label="Перевод" 
              placeholder="Яблоко" 
              value={form.translation}
              onChange={(e) => handleInputChange('translation', e.currentTarget.value)}
              leftSection={<IconLanguage size={16} />}
              variant="filled"
              // Обработка Enter для быстрой отправки
              onKeyDown={(e) => { if(e.key === 'Enter' && !form.originalContext) handleAddCard() }}
            />
          </SimpleGrid>

          {/* Ряд 2: Контекст (Опционально) */}
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

      <Paper shadow="xs" radius="md" withBorder overflow="hidden" mb={40}>
         <Table verticalSpacing="sm" highlightOnHover striped>
            <Table.Thead bg="gray.1">
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

      {/* 4. СТАНДАРТНАЯ КНОПКА (Внизу) */}
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

    </Container>
  );
};

export default CreateDeckPage;