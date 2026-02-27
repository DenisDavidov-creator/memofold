import { useState, useRef, useEffect } from 'react';
import { 
  Table, TextInput, Button, Paper, Group, Text, Badge, Progress, Title, 
  Popover, ActionIcon, ScrollArea, Stack, Card, Box, Modal,
} from '@mantine/core';
import { IconBulb, IconCheck, IconX, IconFlag, IconAlertTriangle } from '@tabler/icons-react';
import type { ReviewCard } from '../types'; 
import { REVIEW_STEPS } from '../constants';

const normalize = (str: string) => {
  let clean = str
    .replace(/\s*\(.*?\)\s*/g, "")
    .toLowerCase()
    .trim();

  const homoglyphs: Record<string, string> = {
      'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y', 
      'А': 'a', 'С': 'c', 'Е': 'e', 'О': 'o', 'Р': 'p', 'Х': 'x', 'У': 'y'
  };
  
  clean = clean.split('').map(char => homoglyphs[char] || char).join('');

  return clean
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .replace(/\s+/g, " "); 
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const [answers, setAnswers] = useState<Record<number, Record<number, string>>>({});
  const [validation, setValidation] = useState<Record<number, Record<number, boolean>>>({});
  const [examResults, setExamResults] = useState<Record<number, boolean>>({});
  const [sessionStats, setSessionStats] = useState<Record<number, { attempts: number, fails: number }>>({});
  
  const [isChecking, setIsChecking] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const baseStep = REVIEW_STEPS[activeStepIndex];
  const currentStep = {
      ...baseStep,
      sourceKey: primaryDirection ? baseStep.sourceKey : baseStep.targetKey,
      targetKey: primaryDirection ? baseStep.targetKey : baseStep.sourceKey,
  };

  const isLastStep = activeStepIndex === REVIEW_STEPS.length - 1;
  const progress = ((activeStepIndex + (isChecking ? 1 : 0)) / REVIEW_STEPS.length) * 100;
  const canFinishEarly = activeStepIndex > 0;

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

      if (!newStats[card.id]) newStats[card.id] = { attempts: 0, fails: 0 };
      newStats[card.id].attempts += 1;
      if (!isCorrect) newStats[card.id].fails += 1;
    });

    setValidation((prev) => ({ ...prev, ...newValidation }));
    setSessionStats(newStats);
    setIsChecking(true);
    
    if (activeStepIndex === 0) {
      const resultsSnapshot: Record<number, boolean> = {};
      cards.forEach(card => {
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

  // Helper для стилизации инпутов (поддержка Dark Mode)
  const getInputStyles = (isCorrect: boolean | undefined) => {
    if (!isChecking) return {};
    return {
      input: {
        backgroundColor: isCorrect ? 'var(--mantine-color-teal-light)' : 'var(--mantine-color-red-light)',
        color: isCorrect ? 'var(--mantine-color-teal-filled)' : 'var(--mantine-color-red-filled)',
        borderColor: isCorrect ? 'var(--mantine-color-teal-outline)' : 'var(--mantine-color-red-outline)',
        fontWeight: 600,
      }
    };
  };

  return (
    <Paper shadow="sm" radius="md" p={{ base: 'sm', sm: 'xl' }} withBorder>
      
      <Modal 
        opened={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        title="Завершить тренировку?"
        centered
      >
        <Stack gap="md">
          <Group wrap="nowrap">
            <IconAlertTriangle size={30} color="var(--mantine-color-orange-filled)" />
            <Text size="sm">Вы уверены? Текущий прогресс будет сохранен в историю.</Text>
          </Group>
          <Group justify="flex-end">
            <Button variant="light" color="gray" onClick={() => setIsConfirmOpen(false)}>Отмена</Button>
            <Button color="orange" onClick={finishSession}>Завершить</Button>
          </Group>
        </Stack>
      </Modal>

      <Box mb={30}>
        <Group justify="space-between" mb={10}>
            <Title order={4}>{currentStep.label}</Title>
            <Badge variant="light" color="gray" size="lg">{activeStepIndex + 1} / {REVIEW_STEPS.length}</Badge>
        </Group>
        <Progress value={progress} size="sm" radius="xl" color="cyan" animated={!isChecking} />
      </Box>

      {/* --- Mobile View --- */}
      <Stack gap="sm" hiddenFrom="sm">
        {cards.map((card, index) => {
           const isCorrect = validation[card.id]?.[currentStep.id];
           const contextKey = currentStep.sourceKey === 'originalWord' ? 'originalContext' : 'translationContext';
           const contextText = card[contextKey];

           return (
            <Card key={card.id} radius="md" p="md" withBorder>
                <Group justify="space-between" mb={5}>
                    <Group gap="xs">
                        <Text fw={600}>{String(card[currentStep.sourceKey] || '')}</Text>
                        {contextText && (
                            <Popover width={250} position="bottom" withArrow shadow="md">
                                <Popover.Target>
                                    <ActionIcon variant="transparent" color="yellow" size="sm"><IconBulb size={18} /></ActionIcon>
                                </Popover.Target>
                                <Popover.Dropdown style={{ backgroundColor: 'var(--mantine-color-yellow-light)' }}>
                                  <Text size="xs" c="var(--mantine-color-yellow-filled-hover)">{contextText}</Text>
                                </Popover.Dropdown>
                            </Popover>
                        )}
                    </Group>
                    {isChecking && (isCorrect ? <IconCheck color="var(--mantine-color-teal-filled)" /> : <IconX color="var(--mantine-color-red-filled)" />)}
                </Group>
                
                <TextInput
                    ref={index === 0 ? firstInputRef : null}
                    placeholder={currentStep.placeholder}
                    value={answers[card.id]?.[currentStep.id] || ''}
                    onChange={(e) => handleInputChange(card.id, e.currentTarget.value)}
                    disabled={isChecking}
                    variant="filled"
                    styles={getInputStyles(isCorrect)}
                />

                {isChecking && !isCorrect && (
                   <Text c="red" size="sm" mt={5} fw={600}>{String(card[currentStep.targetKey] || '')}</Text>
                )}
            </Card>
           )
        })}
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
              const isCorrect = validation[card.id]?.[currentStep.id];
              const contextKey = currentStep.sourceKey === 'originalWord' ? 'originalContext' : 'translationContext';
              const contextText = card[contextKey];

              return (
                <Table.Tr key={card.id}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                        <Text fw={600} size="lg">{String(card[currentStep.sourceKey] || '')}</Text>
                        {contextText && (
                            <Popover width={300} position="bottom" withArrow shadow="md">
                                <Popover.Target>
                                    <ActionIcon variant="transparent" color="yellow" size="sm"><IconBulb size={18} /></ActionIcon>
                                </Popover.Target>
                                <Popover.Dropdown style={{ backgroundColor: 'var(--mantine-color-yellow-light)' }}>
                                  <Text size="sm" c="var(--mantine-color-yellow-filled-hover)">{contextText}</Text>
                                </Popover.Dropdown>
                            </Popover>
                        )}
                    </Group>
                  </Table.Td>

                  <Table.Td>
                      <Group gap="xs" wrap="nowrap" align="center">
                        <TextInput
                          ref={index === 0 ? firstInputRef : null}
                          style={{ flex: 1 }}
                          placeholder={currentStep.placeholder}
                          value={answers[card.id]?.[currentStep.id] || ''}
                          onChange={(e) => handleInputChange(card.id, e.currentTarget.value)}
                          disabled={isChecking}
                          size="md"
                          variant="filled"
                          styles={getInputStyles(isCorrect)}
                        />
                        
                        {isChecking && !isCorrect && (
                           <Badge color="red" variant="light" size="lg" radius="sm" style={{ textTransform: 'none' }}>
                              {String(card[currentStep.targetKey] || '')}
                           </Badge>
                        )}
                        {isChecking && isCorrect && <IconCheck color="var(--mantine-color-teal-filled)" size={20} />}
                      </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Group justify="space-between" mt={30}>
        {canFinishEarly ? (
            <Button variant="subtle" color="orange" leftSection={<IconFlag size={18}/>} onClick={() => setIsConfirmOpen(true)}>
                Завершить
            </Button>
        ) : <div />}

        <Button 
          size="lg" 
          onClick={isChecking ? handleNext : handleCheck}
          color="cyan"
          radius="xl"
          style={{ flex: 1, maxWidth: 400 }}
        >
          {isChecking ? (isLastStep ? 'Завершить 🏁' : 'Далее →') : 'Проверить'}
        </Button>
      </Group>
    </Paper>
  );
};