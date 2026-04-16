import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActionIcon, Box, Button, Group, Paper, RingProgress, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconBook, IconPlayerSkipForward, IconVolume } from '@tabler/icons-react';
import type { ReviewCard } from '../types';
import { speakEnglish } from '../../../shared/utils/tts';

interface Props {
  cards: ReviewCard[];
  onComplete: () => void;
  nextRoundLabel: string;
}

const DURATION = 7;

export const SentenceShowcase = ({ cards, onComplete, nextRoundLabel }: Props) => {
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [onComplete]);

  const progress = ((DURATION - timeLeft) / DURATION) * 100;

  // All cards shown — those without context fall back to the original word
  const cardsWithContext = cards;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Paper
          shadow="sm"
          radius="lg"
          p={{ base: 'md', sm: 'xl' }}
          withBorder
          style={{ backgroundColor: 'var(--mantine-color-cyan-light)', borderColor: 'var(--mantine-color-cyan-light-hover)' }}
        >
          {/* Header */}
          <Group justify="space-between" mb="xl" align="center">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                <IconBook size={20} />
              </ThemeIcon>
              <div>
                <Title order={4}>Примеры в контексте</Title>
                <Text size="xs" c="dimmed">Запомните слова в предложениях</Text>
              </div>
            </Group>

            <Group gap="sm" align="center">
              <RingProgress
                size={52}
                thickness={4}
                roundCaps
                sections={[{ value: progress, color: 'cyan' }]}
                label={
                  <Text ta="center" fw={700} fz="sm" c="cyan">
                    {timeLeft}
                  </Text>
                }
              />
              <Button
                variant="light"
                color="gray"
                size="xs"
                rightSection={<IconPlayerSkipForward size={14} />}
                onClick={() => {
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  onComplete();
                }}
              >
                {nextRoundLabel}
              </Button>
            </Group>
          </Group>

          {/* Cards */}
          <Stack gap="sm">
            {cardsWithContext.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.25 }}
              >
                <Paper
                  p="md"
                  radius="md"
                  withBorder
                  style={{
                    borderLeft: `3px solid ${card.originalContext ? 'var(--mantine-color-cyan-filled)' : 'var(--mantine-color-gray-4)'}`,
                    backgroundColor: 'var(--mantine-color-body)',
                  }}
                >
                  <Group gap="xs" align="flex-start" wrap="nowrap">
                    <ActionIcon
                      variant="subtle"
                      color="cyan"
                      size="sm"
                      radius="xl"
                      style={{ marginTop: 2, flexShrink: 0 }}
                      onClick={() => speakEnglish(card.originalContext || card.originalWord)}
                    >
                      <IconVolume size={14} />
                    </ActionIcon>
                    {card.originalContext ? (
                      <Text size="md" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                        {card.originalContext}
                      </Text>
                    ) : (
                      <Text size="lg" fw={700}>
                        {card.originalWord}
                      </Text>
                    )}
                  </Group>
                </Paper>
              </motion.div>
            ))}
          </Stack>

          {/* Footer progress bar */}
          <Box
            mt="xl"
            style={{
              height: 3,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'var(--mantine-color-default-border)',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                backgroundColor: 'var(--mantine-color-cyan-filled)',
                borderRadius: 2,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
          </Box>
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
};
