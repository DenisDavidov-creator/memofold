import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Container, Title, Button, Group, TextInput, Paper, 
  Table, Text, LoadingOverlay, Stack, Badge, Box, SimpleGrid, 
  ActionIcon, Modal, Switch, Checkbox, Transition, SegmentedControl, ThemeIcon, FileButton 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconVocabulary, IconLanguage, IconBook, IconPlus, IconArrowLeft, 
  IconSettings, IconTrash, IconBasket, IconDownload, 
  IconFiles, IconUpload, IconPencil 
} from '@tabler/icons-react';
import * as XLSX from 'xlsx';

import type { WordSetDetails} from '../../features/word-sets/types';
import { deleteCard, deleteWordSet, getWordSetById, updateWordSet, copyWordSet, addCardsToSet } from '../../features/word-sets/api';
import { createCard, updateCard } from '../../features/decks/api';
import { useDraft } from '../../app/providers/DraftProviders';
import type { Card } from '../../features/decks/types';
import { getCurrentUserId } from '../../shared/utils/auth';


const WordSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Data States
  const [set, setSet] = useState<WordSetDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // UI States
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [filterMode, setFilterMode] = useState<string>('all');
  
  // Settings Local State
  const [isPublic, setIsPublic] = useState(false);
  const [setName, setSetName] = useState('');

  // Draft Logic
  const { addToDraft, isInDraft } = useDraft();
  const [selectedCards, setSelectedCards] = useState<number[]>([]);

  // Forms
  const [form, setForm] = useState({
    originalWord: '',
    translation: '',
    originalContext: '',
    translationContext: ''
  });
  
  // Edit State
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState({
    originalWord: '',
    translation: '',
    originalContext: '',
    translationContext: ''
  });

  // Auth Check
  const currentUserId = getCurrentUserId();
  const isOwner = set && currentUserId && set.userId === currentUserId;

  // 1. LOAD DATA
  useEffect(() => {
    if (!id) return;
    
    getWordSetById(id)
      .then((data) => {
        setSet(data);
        setIsPublic(data.isPublic);
        setSetName(data.name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // 2. FILTERING
  const filteredCards = (set?.cards || []).filter((card: any) => {
      const isLearning = Boolean(card.isLearning);
      if (filterMode === 'new') return !isLearning;
      if (filterMode === 'learning') return isLearning;
      return true;
  });

  // --- HANDLERS ---

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleRow = (cardId: number) => {
    setSelectedCards((current) =>
      current.includes(cardId) ? current.filter((id) => id !== cardId) : [...current, cardId]
    );
  };

  const toggleAll = () => {
    const visibleIds = filteredCards.map(c => c.id);
    const allSelected = visibleIds.every(id => selectedCards.includes(id));

    if (allSelected) {
        setSelectedCards(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
        setSelectedCards(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleAddToDraft = () => {
    const cardsToAdd = set?.cards
      .filter(c => selectedCards.includes(c.id))
      .map(c => ({
        id: isOwner ? c.id : undefined, 
        originalWord: c.originalWord,
        translation: c.translation,
        originalContext: c.originalContext,
        translationContext: c.translationContext,
        sourceSetId: Number(id)
      }));

    if (cardsToAdd && cardsToAdd.length > 0) {
      addToDraft(cardsToAdd);
      setSelectedCards([]); 
    }
  };

  const handleImport = async (file: File | null) => {
      if (!file || !id) return;
      setIsImporting(true);
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as any[][];
          
          const newCards = jsonData
              .filter(row => row && row.length >= 2 && row[0] && row[1])
              .map(row => ({
                  originalWord: String(row[0]).trim(),
                  translation: String(row[1]).trim(),
                  originalContext: row[2] ? String(row[2]).trim() : '',
                  translationContext: row[3] ? String(row[3]).trim() : ''
              }));

          if (newCards.length > 0 && confirm(`Найдено ${newCards.length} слов. Импортировать?`)) {
              await addCardsToSet({ wordSetId: Number(id), cards: newCards });
              window.location.reload();
          }
      } catch (e) { alert('Ошибка импорта'); } finally { setIsImporting(false); }
  };

  const handleAddCard = async () => {
    if (!set || !form.originalWord || !form.translation) return;
    setIsAdding(true);
    try {
      const newCard = await createCard({ wordSetId: Number(id), ...form } as any);
      const cardWithStatus = { ...newCard, isLearning: false };
      setSet(prev => prev ? { ...prev, cards: [...prev.cards, cardWithStatus] } : null);
      setForm({ originalWord: '', translation: '', originalContext: '', translationContext: '' });
      setTimeout(() => firstInputRef.current?.focus(), 100);
    } catch (err) { alert('Ошибка добавления'); } finally { setIsAdding(false); }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('Удалить слово?')) return;
    try {
        await deleteCard({ cardId, wordSetId: Number(id) });
        setSet(prev => prev ? { ...prev, cards: prev.cards.filter(c => c.id !== cardId) } : null);
        setSelectedCards(prev => prev.filter(id => id !== cardId));
    } catch (e) { alert('Ошибка удаления'); }
  };

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
          setSet(prev => prev ? {
              ...prev,
              cards: prev.cards.map(c => c.id === updated.id ? { ...updated, isLearning: (c as any).isLearning } : c)
          } : null);
          setEditingCard(null);
      } catch (e) { alert('Ошибка обновления'); }
  };

  const handleCopySet = async () => {
      if (!confirm('Копировать набор себе?')) return;
      try {
          const newSet = await copyWordSet(Number(id));
          navigate(`/word-sets/${newSet.id}`);
      } catch (e) { alert('Ошибка копирования'); }
  };

  const handleUpdateSet = async () => {
    if (!id) return;
    try {
        const updated = await updateWordSet(Number(id), { name: setName, isPublic });
        setSet(prev => prev ? { ...prev, name: updated.name, isPublic: updated.isPublic } : null);
        closeSettings();
    } catch (e) { alert('Ошибка обновления'); }
  };

  const handleDeleteSet = async () => {
    if (!id || !confirm('Удалить набор?')) return;
    try {
        await deleteWordSet(Number(id));
        navigate('/word-sets');
    } catch (e) { alert('Ошибка удаления'); }
  };

  if (loading) return <LoadingOverlay visible={true} />;
  if (!set) return <div>Набор не найден</div>;

  const isSystemSet = (set as any).isDefault; 
  const isEmpty = !set || set.cards.length === 0;

  return (
    <Container size="md" py="xl">
      <Box mb="md">
        <Button component={Link} to="/word-sets" variant="subtle" leftSection={<IconArrowLeft size={16}/>} color="gray" size="xs" pl={0}>
            Библиотека
        </Button>
      </Box>

      {/* HEADER */}
      <Group justify="space-between" mb="xl" align="flex-start">
         <div>
            <Title order={2}>
                {set.name} 
                {isSystemSet && <Badge ml="sm" color="orange" variant="light">Системный</Badge>}
            </Title>
            <Group gap="xs" mt={5}>
                <Badge variant="light" color="blue" size="lg">{set.cards.length} слов</Badge>
                {set.isPublic ? <Badge color="green" variant="outline">Публичный</Badge> : <Badge color="gray" variant="outline">Приватный</Badge>}
                {!isOwner && <Badge color="gray" variant="dot">Автор #{set.userId}</Badge>}
            </Group>
         </div>
         
         <Group>
             <Transition mounted={selectedCards.length > 0} transition="pop" duration={200}>
                {(styles) => (
                    <Button style={styles} color="red" variant="light" leftSection={<IconBasket size={18}/>} onClick={handleAddToDraft}>
                        В корзину ({selectedCards.length})
                    </Button>
                )}
             </Transition>

             {!isOwner && <Button variant="light" leftSection={<IconDownload size={18}/>} onClick={handleCopySet}>Копировать</Button>}
             {isOwner && <Button variant="default" onClick={openSettings} leftSection={<IconSettings size={18}/>}>Настройки</Button>}
         </Group>
      </Group>

      {/* ADD FORM */}
      {isOwner && filterMode !== 'learning' && (
          <Paper shadow="sm" radius="lg" p="xl" withBorder mb={40}>
            <Group justify="space-between" mb="md">
                <Title order={4} c="dimmed">Добавить слово</Title>
                <FileButton onChange={handleImport} accept=".xlsx,.csv">
                    {(props) => (
                        <Button {...props} variant="subtle" size="xs" loading={isImporting} leftSection={<IconUpload size={14}/>}>
                            Импорт из Excel
                        </Button>
                    )}
                </FileButton>
            </Group>

            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput ref={firstInputRef} label="Слово" placeholder='Apple' value={form.originalWord} onChange={(e) => handleInputChange('originalWord', e.currentTarget.value)} leftSection={<IconVocabulary size={16} />} data-autofocus variant="filled"/>
                <TextInput label="Перевод" placeholder='Яблоко' value={form.translation} onChange={(e) => handleInputChange('translation', e.currentTarget.value)} leftSection={<IconLanguage size={16} />} variant="filled" onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}/>
              </SimpleGrid>
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Контекст" placeholder='I eat apples' value={form.originalContext} onChange={(e) => handleInputChange('originalContext', e.currentTarget.value)} leftSection={<IconBook size={16} />} size="sm" variant="filled"/>
                <TextInput label="Перевод конт." placeholder='Я ем яблоки' value={form.translationContext} onChange={(e) => handleInputChange('translationContext', e.currentTarget.value)} leftSection={<IconLanguage size={16} />} size="sm" variant="filled" onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}/>
              </SimpleGrid>
              <Group justify="flex-end" mt="xs">
                 <Button onClick={handleAddCard} loading={isAdding} leftSection={<IconPlus size={18}/>} variant="light" color="blue">Добавить</Button>
              </Group>
            </Stack>
          </Paper>
      )}

      {/* FILTERS */}
      <Group justify="space-between" mb="md" align="center">
          <Title order={4} c="dimmed">Словарь</Title>
          <SegmentedControl 
              value={filterMode} onChange={setFilterMode}
              data={[{ label: 'Все', value: 'all' }, { label: 'Новые', value: 'new' }, { label: 'Учу', value: 'learning' }]}
          />
      </Group>

      {/* TABLE */}
      <Paper shadow="xs" radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" highlightOnHover striped>
          <Table.Thead bg="gray.1">
            <Table.Tr>
              <Table.Th w={40}><Checkbox onChange={toggleAll} checked={filteredCards.length > 0 && filteredCards.every(c => selectedCards.includes(c.id))} indeterminate={selectedCards.length > 0 && !filteredCards.every(c => selectedCards.includes(c.id))} /></Table.Th>
              <Table.Th>Слово</Table.Th>
              <Table.Th>Перевод</Table.Th>
              {isOwner && <Table.Th w={80} />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCards.length === 0 ? (
               <Table.Tr><Table.Td colSpan={isOwner ? 4 : 3} align="center" py={50}>
                    <Stack align="center" gap="xs">
                        <ThemeIcon color="gray" variant="light" size="xl" radius="md"><IconFiles size={24}/></ThemeIcon>
                        <Text fw={500} c="dimmed">Нет слов в этой категории.</Text>
                    </Stack>
               </Table.Td></Table.Tr>
            ) : (
              [...filteredCards].reverse().map((card: any) => {
                const alreadyInDraft = isInDraft(card.originalWord);
                const isLearning = Boolean(card.isLearning);

                return (
                    <Table.Tr key={card.id} bg={alreadyInDraft ? 'blue.0' : (isLearning ? 'green.0' : undefined)}>
                        <Table.Td><Checkbox checked={selectedCards.includes(card.id)} onChange={() => toggleRow(card.id)} /></Table.Td>
                        <Table.Td>
                            <Text fw={600}>{card.originalWord}</Text>
                            {card.originalContext && <Text size="xs" c="dimmed">{card.originalContext}</Text>}
                            <Group gap={5} mt={2}>
                                {alreadyInDraft && <Badge size="xs" variant="filled">В корзине</Badge>}
                                {isLearning && <Badge size="xs" color="green" variant="light">Учу</Badge>}
                            </Group>
                        </Table.Td>
                        <Table.Td>
                            <Text>{card.translation}</Text>
                            {card.translationContext && <Text size="xs" c="dimmed">{card.translationContext}</Text>}
                        </Table.Td>
                        
                        {isOwner && (
                            <Table.Td>
                                <Group gap={5}>
                                    <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(card)}>
                                        <IconPencil size={18} />
                                    </ActionIcon>
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteCard(card.id)}>
                                        <IconTrash size={18} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        )}
                    </Table.Tr>
                );
              })
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* EDIT MODAL */}
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

      {/* SETTINGS MODAL */}
      {isOwner && (
          <Modal opened={settingsOpened} onClose={closeSettings} title="Настройки">
              <TextInput label="Название" value={setName} onChange={(e) => setSetName(e.currentTarget.value)} mb="md"/>
              
              <Paper withBorder p="md" radius="md" mb="xl" bg={isSystemSet || isEmpty ? "gray.0" : undefined}>
                 <Group justify="space-between">
                    <div>
                        <Text fw={500}>Публичный доступ</Text>
                        <Text size="xs" c="dimmed">
                            {isSystemSet ? "Системные наборы нельзя публиковать." : isEmpty ? "Добавьте слова, чтобы опубликовать." : "Виден всем пользователям."}
                        </Text>
                    </div>
                    <Switch checked={isPublic} onChange={(e) => setIsPublic(e.currentTarget.checked)} disabled={isSystemSet || (isEmpty && !isPublic)} />
                 </Group>
              </Paper>

              <Group justify="space-between">
                  {!isSystemSet ? (
                      <Button color="red" variant="subtle" leftSection={<IconTrash size={16}/>} onClick={handleDeleteSet}>Удалить</Button>
                  ) : <div />}
                  <Button onClick={handleUpdateSet}>Сохранить</Button>
              </Group>
          </Modal>
      )}
    </Container>
  );
};

export default WordSetDetailsPage;