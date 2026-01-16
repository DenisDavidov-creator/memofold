import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Container, LoadingOverlay, Button, Alert, Paper, Title, Text, Stack, 
  Table, Checkbox, Badge, Group, SimpleGrid 
} from '@mantine/core';
import type { ReviewCard } from '../../features/review/types';
import { ReviewTable, type CardSessionStats } from '../../features/review/components/review-table';
import { submitReview } from '../../features/review/api';
import { getDeckById } from '../../features/decks/api';
import { markCardsAsHard } from '../../features/word-sets/api';

const DeckReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Результаты
  const [showResults, setShowResults] = useState(false);
  const [sessionResults, setSessionResults] = useState<CardSessionStats[]>([]);
  const [selectedForHard, setSelectedForHard] = useState<number[]>([]); 

  const primaryDirection = location.state?.primaryDirection ?? true;

  // 1. ЗАГРУЗКА
  useEffect(() => { 
    const passedCards = location.state?.cards as ReviewCard[];
    
    if (passedCards && passedCards.length > 0) {
      setCards(passedCards);
      setLoading(false);
    } else {
      console.warn('Load by ID...');
      if (id) {
        getDeckById(id)
        .then((deck) => setCards(deck.cards as unknown as ReviewCard[]))
        .catch(() => setError('Ошибка загрузки.'))
        .finally(() => setLoading(false));
      }
    }
  }, [id, location.state]);
  
  // 2. ФИНИШ
  const handleFinishSession = async (results: CardSessionStats[]) => {
    setIsSubmitting(true);
    setSessionResults(results);
    
    // АВТО-ВЫБОР "СЛОЖНЫХ":
    // Выбираем только те, где процент ошибок >= 50%
    const reallyHardIds = results
        .filter(r => r.attempts > 0 && (r.fails / r.attempts) >= 0.5)
        .map(r => r.cardId);
        
    setSelectedForHard(reallyHardIds);
    
    // Отправка на сервер (если не тест)
    const isTestMode = location.state?.isArchived;
    
    if (!isTestMode && id) {
      try {
        const apiResults = results.map(r => ({ cardId: r.cardId, isCorrect: r.isCorrect }));
        await submitReview(id, { results: apiResults });
      } catch (e) { alert('Ошибка сохранения (сеть)'); }
    }
      
    setIsSubmitting(false);
    setShowResults(true); 
  };

  // 3. ВЫХОД
  const handleExit = async () => {
      if (selectedForHard.length > 0) {
          setIsSubmitting(true);
          try {
              await markCardsAsHard(selectedForHard);
          } catch (e) { alert('Не удалось сохранить сложные'); }
      }
      navigate(`/decks/${id}`);
  };

  const toggleSelection = (cardId: number) => {
      setSelectedForHard(prev => prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]);
  };

  const toggleAll = () => {
      if (selectedForHard.length === sessionResults.length) setSelectedForHard([]);
      else setSelectedForHard(sessionResults.map(r => r.cardId));
  };

  if (loading) return <LoadingOverlay visible={true} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />;
    
  // --- UI: РЕЗУЛЬТАТЫ ---
  if (showResults) {
      const perfectCount = sessionResults.filter(r => r.fails === 0).length;
      const errorCount = sessionResults.filter(r => r.fails > 0).length;

      return (
        <Container size="sm" py={60}>
              <Paper withBorder p="xl" radius="lg" shadow="sm">
                  <Title order={2} mb="xl" ta="center">Тренировка завершена</Title>
                  
                  {/* КАРТОЧКИ МЕТРИК (Вместо % показываем кол-во) */}
                  <SimpleGrid cols={2} mb={40} spacing="lg">
                      <Paper withBorder p="md" radius="md" style={{ textAlign: 'center', borderColor: '#40c057' }}>
                          <Text fz={36} fw={700} c="green" lh={1}>
                              {perfectCount}
                          </Text>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mt={5}>Идеально</Text>
                      </Paper>

                      <Paper withBorder p="md" radius="md" style={{ textAlign: 'center', borderColor: errorCount > 0 ? '#fa5252' : '#e9ecef' }}>
                          <Text fz={36} fw={700} c={errorCount > 0 ? "red" : "gray"} lh={1}>
                              {errorCount}
                          </Text>
                          <Text size="xs" c="dimmed" tt="uppercase" fw={700} mt={5}>С ошибками</Text>
                      </Paper>
                  </SimpleGrid>

                  <Text c="dimmed" mb="md" ta="center" size="sm">
                      Отмеченные слова будут добавлены в "Сложные" для повторения.
                  </Text>

                  {/* ТАБЛИЦА */}
                  <Paper withBorder radius="md" overflow="hidden" mb="xl">
                      <Table highlightOnHover>
                          <Table.Thead bg="gray.0">
                              <Table.Tr>
                                  <Table.Th w={40}>
                                      <Checkbox 
                                          checked={selectedForHard.length > 0 && selectedForHard.length === sessionResults.length}
                                          indeterminate={selectedForHard.length > 0 && selectedForHard.length < sessionResults.length}
                                          onChange={toggleAll}
                                          color="orange"
                                      />
                                  </Table.Th>
                                  <Table.Th>Слово</Table.Th>
                                  <Table.Th style={{textAlign: 'right'}}>Ошибки</Table.Th>
                              </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                              {sessionResults.map(res => {
                                  const card = cards.find(c => c.id === res.cardId);
                                  if (!card) return null;
                                  
                                  const isError = res.fails > 0;
                                  const isSelected = selectedForHard.includes(res.cardId);
                                  
                                  return (
                                      <Table.Tr 
                                        key={res.cardId} 
                                        bg={isError ? 'red.0' : undefined}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => toggleSelection(res.cardId)}
                                      >
                                          <Table.Td onClick={(e) => e.stopPropagation()}>
                                              <Checkbox 
                                                  checked={isSelected}
                                                  onChange={() => toggleSelection(res.cardId)}
                                                  color="orange"
                                              />
                                          </Table.Td>
                                          <Table.Td>
                                              <Text fw={500}>{card.originalWord}</Text>
                                              <Text size="xs" c="dimmed">{card.translation}</Text>
                                          </Table.Td>
                                          <Table.Td style={{textAlign: 'right'}}>
                                              {isError ? (
                                                  <Badge color="red" variant="light">{res.fails}</Badge>
                                              ) : (
                                                  <Badge color="green" variant="light" size="xs">OK</Badge>
                                              )}
                                          </Table.Td>
                                      </Table.Tr>
                                  );
                              })}
                          </Table.Tbody>
                      </Table>
                  </Paper>

                  <Button 
                      size="lg" 
                      radius="xl" 
                      fullWidth 
                      onClick={handleExit}
                      loading={isSubmitting}
                      color={selectedForHard.length > 0 ? "orange" : "blue"}
                  >
                      {selectedForHard.length > 0 
                          ? `Сохранить сложные (${selectedForHard.length}) и выйти` 
                          : 'Завершить'}
                  </Button>
              </Paper>
          </Container>
      );
  }

  // --- UI: ТРЕНИРОВКА ---
  return (
    <Container size="md" px={{ base: 0, sm: 'md' }} py={{ base: 'xs', sm: 'xl' }}>
      <Link to={`/decks/${id}`} style={{ textDecoration: 'none' }}>
         <Button variant="subtle" size="xs" mb="md" color="gray" ml={{ base: 'md', sm: 0 }}>
            ← Выйти
         </Button>
      </Link>

      {error ? (
        <Alert variant="light" color="red" title="Ошибка" m="md">{error}</Alert>
      ) : (
        cards.length > 0 ? (
             <ReviewTable 
               cards={cards} 
               onFinish={handleFinishSession}
               primaryDirection={primaryDirection} 
             />
        ) : (
             <Alert variant="light" color="blue" title="Пусто" m="md">В этой колоде нет слов.</Alert>
        )
      )}
      <LoadingOverlay visible={isSubmitting} />
    </Container>
  );
};

export default DeckReviewPage;