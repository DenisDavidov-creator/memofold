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
    .replace(/\s*\(.*?\)\s*/g, "") // Удаляет скобки и текст внутри
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ""); // Удаляет пунктуацию
};

export interface CardSessionStats {
  cardId: number;
  isCorrect: boolean;
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
  
  // State: [cardId][stepId] -> value
  const [answers, setAnswers] = useState<Record<number, Record<number, string>>>({});
  const [validation, setValidation] = useState<Record<number, Record<number, boolean>>>({});
  
  // Stats
  const [examResults, setExamResults] = useState<Record<number, boolean>>({});
  const [sessionStats, setSessionStats] = useState<Record<number, { attempts: number, fails: number }>>({});
  
  const [isChecking, setIsChecking] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // --- Step Logic ---
  const baseStep = REVIEW_STEPS[activeStepIndex];
  const currentStep = {
      ...baseStep,
      sourceKey: primaryDirection ? baseStep.sourceKey : baseStep.targetKey,
      targetKey: primaryDirection ? baseStep.targetKey : baseStep.sourceKey,
  };

  const isLastStep = activeStepIndex === REVIEW_STEPS.length - 1;
  const progress = ((activeStepIndex + (isChecking ? 1 : 0)) / REVIEW_STEPS.length) * 100;
  
  // Can finish early only if passed exam (step > 0)
  const canFinishEarly = activeStepIndex > 0;

  // Auto-focus
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
    const newValidation: Record<number, Record<number, boolean>> = {};
    const newStats = { ...sessionStats };

    cards.forEach((card) => {
      const userInput = answers[card.id]?.[currentStep.id] || '';
      const correctAnswer = String(card[currentStep.targetKey] || ''); 
      const isCorrect = normalize(userInput) === normalize(correctAnswer);
      
      if (!newValidation[card.id]) newValidation[card.id] = {};
      newValidation[card.id][currentStep.id] = isCorrect;

      // Stats
      if (!newStats[card.id]) newStats[card.id] = { attempts: 0, fails: 0 };
      newStats[card.id].attempts += 1;
      if (!isCorrect) newStats[card.id].fails += 1;
    });

    setValidation((prev) => ({ ...prev, ...newValidation }));
    setSessionStats(newStats);
    setIsChecking(true);
    
    // Exam Snapshot (Step 0)
    if (activeStepIndex === 0) {
      const resultsSnapshot: Record<number, boolean> = {};
      cards.forEach(card => {
          // If correct on first try (step 0) -> true
          resultsSnapshot[card.id] = newValidation[card.id][currentStep.id] || false;
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

  // --- Render Row (Mobile) ---
  const renderRowContent = (card: ReviewCard, index: number, isMobile: boolean) => {
    const isCorrect = validation[card.id]?.[currentStep.id];
    
    const contextKey = currentStep.sourceKey === 'originalWord' ? 'originalContext' : 'translationContext';
    const contextText = card[contextKey];

    return (
      <>
        {/* Top: Word + Icons */}
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

        {/* Center: Input */}
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

        {/* Bottom: Answer (Mobile Only) */}
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
      
      {/* Header */}
      <Box mb={{ base: 20, sm: 30 }}>
        <Group justify="space-between" mb={10}>
            <Title order={4} c="dark">{currentStep.label}</Title>
            <Badge variant="light" color="gray" size="lg">{activeStepIndex + 1} / {REVIEW_STEPS.length}</Badge>
        </Group>
        <Progress value={progress} size="sm" radius="xl" color="cyan" />
      </Box>

      {/* --- Mobile View --- */}
      <Stack gap="sm" hiddenFrom="sm">
        {cards.map((card, index) => (
           <Card key={card.id} radius="md" p="md" bg="white" withBorder>
              {renderRowContent(card, index, true)}
           </Card>
        ))}
      </Stack>

      {/* --- Desktop View --- */}
      <ScrollArea visibleFrom="sm">
        <Table verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead>
            <Table.Tr>
              <Table.Th w="40%" c="dimmed">СЛОВО</Table.Th>
              <Table.Th c="dimmed">ВАШ ОТВЕТ</Table.Th>
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {cards.map((card, index) => {
              // Исправлено: доступ по [currentStep.id]
              const isCorrect = validation[card.id]?.[currentStep.id];
              
              return (
                <Table.Tr key={card.id}>
                  <Table.Td>
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
                        
                        {/* Correct Answer (Desktop) */}
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
        {/* Early Finish Button */}
        {canFinishEarly ? (
            <Button 
                variant="subtle" color="orange" 
                leftSection={<IconFlag size={18}/>}
                onClick={finishSession}
            >
                Завершить
            </Button>
        ) : (
            <div /> 
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