import { useState, useRef, useEffect } from 'react';
import { 
  Table, TextInput, Button, Paper, Group, Text, Badge, Progress, Title, 
  Popover, ActionIcon, ScrollArea, Stack, Card, Box 
} from '@mantine/core';
import { IconBulb, IconCheck, IconX, IconFlag } from '@tabler/icons-react';
import type { ReviewCard } from '../types'; 
import { REVIEW_STEPS } from '../constants';

const normalize = (str: string) => {
  return str
    .replace(/\s*\(.*?\)\s*/g, "") // Удаляет скобки и текст внутри (вместе с пробелами вокруг)
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""); // Удаляет остальную пунктуацию
};

// Интерфейс статистики (то, что отдаем наружу)
export interface CardSessionStats {
  cardId: number;
  isCorrect: boolean; // Финальный вердикт (сдал/не сдал)
  attempts: number;
  fails: number;
}

interface Props {
  cards: ReviewCard[];
  onFinish: (results: CardSessionStats[]) => void;
  primaryDirection: boolean;
}

export const ReviewTable = ({ cards, primaryDirection, onFinish }: Props) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Record<number, string>>>({});
  const [validation, setValidation] = useState<Record<number, Record<number, boolean>>>({});
  
  // Статистика сессии
  const [examResults, setExamResults] = useState<Record<number, boolean>>({}); // Зачетка (первый шаг)
  const [sessionStats, setSessionStats] = useState<Record<number, { attempts: number, fails: number }>>({});
  
  const [isChecking, setIsChecking] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // --- ЛОГИКА ШАГОВ С УЧЕТОМ НАПРАВЛЕНИЯ ---
  const baseStep = REVIEW_STEPS[activeStepIndex];
  
  // Если direction=true (прямое) -> берем как есть
  // Если direction=false (обратное) -> меняем source/target местами (только для шагов перевода)
  const currentStep = {
      ...baseStep,
      sourceKey: primaryDirection ? baseStep.sourceKey : baseStep.targetKey,
      targetKey: primaryDirection ? baseStep.targetKey : baseStep.sourceKey,
      // Placeholder можно тоже менять, если заморочиться
  };

  const isLastStep = activeStepIndex === REVIEW_STEPS.length - 1;
  const progress = ((activeStepIndex + (isChecking ? 1 : 0)) / REVIEW_STEPS.length) * 100;

  // Автофокус
  useEffect(() => {
    if (!isChecking && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [activeStepIndex, isChecking]);

  const handleInputChange = (cardId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [cardId]: { ...prev[cardId], [currentStep.id]: value },
    }));
  };

  const handleCheck = () => {
    const newValidation: Record<number, boolean> = {};
    const newStats = { ...sessionStats };

    cards.forEach((card) => {
      const userInput = answers[card.id]?.[currentStep.id] || '';
      const correctAnswer = String(card[currentStep.targetKey] || ''); 
      const isCorrect = normalize(userInput) === normalize(correctAnswer);
      
      newValidation[card.id] = isCorrect; // Для UI (зеленый/красный)

      // --- СБОР СТАТИСТИКИ ---
      if (!newStats[card.id]) newStats[card.id] = { attempts: 0, fails: 0 };
      newStats[card.id].attempts += 1;
      if (!isCorrect) newStats[card.id].fails += 1;
    });

    setValidation(newValidation); // Заменяем, а не мержим (чтобы сбросить старые шаги)
    setSessionStats(newStats);
    setIsChecking(true);
    
    // ЭКЗАМЕН (Шаг 0): Сохраняем результат "Сдал/Не сдал" для SRS
    if (activeStepIndex === 0) {
      const resultsSnapshot: Record<number, boolean> = {};
      cards.forEach(card => {
          // Если ответил верно с первой попытки (или в рамках экзамена) -> true
          resultsSnapshot[card.id] = newValidation[card.id] || false;
      });
      setExamResults(resultsSnapshot);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishSession = () => {
      const finalResults: CardSessionStats[] = cards.map(card => {
        const stats = sessionStats[card.id] || { attempts: 0, fails: 0 };
        return {
            cardId: card.id,
            // Если экзамен (шаг 0) еще не пройден, считаем Failed
            isCorrect: examResults[card.id] ?? false,
            attempts: stats.attempts,
            fails: stats.fails
        };
      });
      onFinish(finalResults);
  };

  const handleNext = () => {
    if (isLastStep) {
      finishSession();
    } else {
      setIsChecking(false);
      setActiveStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Можно ли завершить досрочно? (Только если прошли Экзамен)
  const canFinishEarly = activeStepIndex > 0;

  // --- Рендер содержимого ---
  const renderRowContent = (card: ReviewCard, index: number, isMobile: boolean) => {
    const isCorrect = validation[card.id];
    
    // Контекст зависит от того, что мы сейчас показываем (Вопрос)
    const contextKey = currentStep.sourceKey === 'originalWord' ? 'originalContext' : 'translationContext';
    const contextText = card[contextKey];

    return (
      <>
        {/* ВЕРХ: Слово + Иконки */}
        <Group justify="space-between" mb={isMobile ? 5 : 0} align="center">
          <Group gap="xs">
             <Text fw={600} size={isMobile ? "md" : "lg"} c="dark" style={{ lineHeight: 1.2 }}>
               {String(card[currentStep.sourceKey] || '')}
             </Text>
             
             {contextText && (
                <Popover width={isMobile ? 250 : 300} position="bottom" withArrow shadow="md">
                  <Popover.Target>
                    <ActionIcon variant="transparent" color="yellow" size="sm">
                      <IconBulb size={18} />
                    </ActionIcon>
                  </Popover.Target>
                  <Popover.Dropdown bg="yellow.0" style={{ border: '1px solid #fcc419' }}>
                    <Text size="sm" fs="italic" c="dark">{contextText}</Text>
                  </Popover.Dropdown>
                </Popover>
             )}
          </Group>

          {isMobile && isChecking && (
             isCorrect 
               ? <IconCheck color="teal" size={22} />
               : <IconX color="red" size={22} />
          )}
        </Group>

        {/* ЦЕНТР: Инпут */}
        <TextInput
          ref={index === 0 ? firstInputRef : null}
          placeholder={currentStep.placeholder}
          value={answers[card.id]?.[currentStep.id] || ''}
          onChange={(e) => handleInputChange(card.id, e.currentTarget.value)}
          disabled={isChecking}
          size="md"
          variant="filled"
          mt={isMobile ? 5 : 0}
          styles={{
            input: {
              backgroundColor: isChecking 
                  ? (isCorrect ? '#e6fffa' : '#fff5f5') : '#f8f9fa',
              color: isChecking 
                  ? (isCorrect ? '#2b8a3e' : '#c92a2a') : '#000',
              fontWeight: 500,
              border: isChecking ? `1px solid ${isCorrect ? '#20c997' : '#ff8787'}` : '1px solid transparent',
              height: isMobile ? 48 : undefined
            }
          }}
        />

        {/* НИЗ: Ответ (Мобилка) */}
        {isMobile && isChecking && !isCorrect && (
           <Text c="red" size="sm" mt={5} fw={600}>
              {String(card[currentStep.targetKey] || '')}
           </Text>
        )}
      </>
    );
  };

  return (
    <Paper shadow="sm" radius="md" p={{ base: 'sm', sm: 'xl' }} withBorder bg="white">
      
      {/* Шапка */}
      <Box mb={{ base: 20, sm: 30 }}>
        <Group justify="space-between" mb={10}>
            <Title order={4} c="dark">{currentStep.label}</Title>
            <Badge variant="light" color="gray" size="lg">{activeStepIndex + 1} / {REVIEW_STEPS.length}</Badge>
        </Group>
        <Progress value={progress} size="sm" radius="xl" color="cyan" />
      </Box>

      {/* --- МОБИЛЬНАЯ ВЕРСИЯ --- */}
      <Stack gap="sm" hiddenFrom="sm">
        {cards.map((card, index) => (
           <Card key={card.id} radius="md" p="md" bg="white" withBorder>
              {renderRowContent(card, index, true)}
           </Card>
        ))}
      </Stack>

      {/* --- ДЕСКТОП ВЕРСИЯ --- */}
      <ScrollArea visibleFrom="sm">
        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="40%" c="dimmed">СЛОВО</Table.Th>
              <Table.Th c="dimmed">ВАШ ОТВЕТ</Table.Th>
              {/* Пустая колонка для иконок результата, если нужно */}
              <Table.Th w="50px"></Table.Th>
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {cards.map((card, index) => {
              const isCorrect = validation[card.id];
              return (
                <Table.Tr key={card.id}>
                  <Table.Td>
                     {/* Слово + Лампочка */}
                     {(() => {
                        const contextKey = currentStep.sourceKey === 'originalWord' ? 'originalContext' : 'translationContext';
                        const contextText = card[contextKey];
                        return (
                            <Group gap="xs">
                                <Text fw={600} size="lg" c="dark">
                                    {String(card[currentStep.sourceKey] || '')}
                                </Text>
                                {contextText && (
                                    <Popover width={300} position="right" withArrow shadow="md">
                                    <Popover.Target>
                                        <ActionIcon variant="transparent" color="yellow" size="sm">
                                        <IconBulb size={18} />
                                        </ActionIcon>
                                    </Popover.Target>
                                    <Popover.Dropdown bg="yellow.0" style={{ border: '1px solid #fcc419' }}>
                                        <Text size="sm" fs="italic">{contextText}</Text>
                                    </Popover.Dropdown>
                                    </Popover>
                                )}
                            </Group>
                        );
                     })()}
                  </Table.Td>

                  <Table.Td>
                      <Group gap="xs" wrap="nowrap" align="center">
                        <TextInput
                          ref={index === 0 ? firstInputRef : null}
                          placeholder={currentStep.placeholder}
                          value={answers[card.id]?.[currentStep.id] || ''}
                          onChange={(e) => handleInputChange(card.id, e.currentTarget.value)}
                          disabled={isChecking}
                          size="md"
                          variant="filled"
                          style={{ flex: 1, minWidth: 150 }}
                          styles={{
                            input: {
                              backgroundColor: isChecking 
                                  ? (isCorrect ? '#e6fffa' : '#fff5f5') : '#f8f9fa',
                              color: isChecking 
                                  ? (isCorrect ? '#2b8a3e' : '#c92a2a') : '#000',
                              fontWeight: 500
                            }
                          }}
                        />
                        
                        {/* ПРАВИЛЬНЫЙ ОТВЕТ (СПРАВА) */}
                        {isChecking && !isCorrect && (
                           <Badge 
                              color="red" variant="light" size="lg" radius="sm"
                              style={{ textTransform: 'none', fontWeight: 700 }}
                           >
                              {String(card[currentStep.targetKey] || '')}
                           </Badge>
                        )}
                      </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group justify="space-between" mt={30}>
        {/* Кнопка досрочного завершения */}
        {canFinishEarly ? (
            <Button 
                variant="subtle" color="orange" 
                leftSection={<IconFlag size={18}/>}
                onClick={finishSession}
            >
                Завершить
            </Button>
        ) : (
            <div /> // Пустой блок для выравнивания
        )}

        <Button 
          size="lg" 
          maw={400}
          onClick={isChecking ? handleNext : handleCheck}
          color={'cyan'}
          radius="xl"
          style={{ flex: 1, maxWidth: 400 }}
        >
          {isChecking 
            ? (isLastStep ? 'Завершить 🏁' : 'Далее →') 
            : 'Проверить'
          }
        </Button>
      </Group>
    </Paper>
  );
};