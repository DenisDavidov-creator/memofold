import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Container,
    Group,
    LoadingOverlay,
    Modal,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAlertTriangle, IconConfetti, IconFlag2 } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useReviewSession } from '../../app/providers/ReviewProvider';
import { getDeckById } from '../../features/decks/api';
import { submitReview } from '../../features/review/api';
import { ReviewTable, type CardSessionStats } from '../../features/review/components/review-table';
import type { ReviewCard } from '../../features/review/types';
import { markCardsAsHard } from '../../features/word-sets/api';

const DeckReviewPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const { setSessionActive } = useReviewSession();
    const [exitModalOpened, { open: openExitModal, close: closeExitModal }] = useDisclosure(false);

    const [cards, setCards] = useState<ReviewCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [showResults, setShowResults] = useState(false);
    const [sessionResults, setSessionResults] = useState<CardSessionStats[]>([]);
    const [selectedForHard, setSelectedForHard] = useState<number[]>([]);

    const primaryDirection = location.state?.primaryDirection ?? true;

    useEffect(() => {
        setSessionActive(true);
        return () => setSessionActive(false);
    }, [setSessionActive]);

    useEffect(() => {
        const passedCards = location.state?.cards as ReviewCard[];
        if (passedCards && passedCards.length > 0) {
            setCards(passedCards);
            setLoading(false);
        } else if (id) {
            getDeckById(id)
                .then((deck) => setCards(deck.cards as unknown as ReviewCard[]))
                .catch(() => setError('Ошибка загрузки.'))
                .finally(() => setLoading(false));
        }
    }, [id, location.state]);

    const handleFinishSession = async (results: CardSessionStats[]) => {
        setIsSubmitting(true);
        setSessionResults(results);

        const reallyHardIds = results
            .filter(r => r.attempts > 0 && r.fails / r.attempts >= 0.5)
            .map(r => r.cardId);

        setSelectedForHard(reallyHardIds);

        const isTestMode = location.state?.isArchived;

        if (!isTestMode && id) {
            try {
                const apiResults = results.map(r => ({ cardId: r.cardId, isCorrect: r.isCorrect }));
                await submitReview(id, { results: apiResults });
            } catch (e) {
                console.error('Ошибка сохранения результатов');
            }
        }

        setIsSubmitting(false);
        setShowResults(true);
        setSessionActive(false);
    };

    const handleFinalExit = async () => {
        if (selectedForHard.length > 0) {
            setIsSubmitting(true);
            try {
                await markCardsAsHard(selectedForHard);
            } catch (e) {
                console.error('Не удалось сохранить сложные');
            }
        }
        navigate(`/decks/${id}`);
    };

    const handleConfirmExit = () => {
        setSessionActive(false);
        navigate(`/decks/${id}`);
    };

    const toggleSelection = (cardId: number) => {
        setSelectedForHard(prev =>
            prev.includes(cardId) ? prev.filter(i => i !== cardId) : [...prev, cardId]
        );
    };

    const toggleAll = () => {
        if (selectedForHard.length === sessionResults.length) setSelectedForHard([]);
        else setSelectedForHard(sessionResults.map(r => r.cardId));
    };

    if (loading) return <LoadingOverlay visible zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />;

    // --- RESULTS SCREEN ---
    if (showResults) {
        const perfectCount = sessionResults.filter(r => r.fails === 0).length;
        const errorCount = sessionResults.filter(r => r.fails > 0).length;
        const totalCount = sessionResults.length;
        const accuracy = totalCount > 0 ? Math.round((perfectCount / totalCount) * 100) : 0;

        return (
            <Container size="sm" py={60}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                >
                    <Paper withBorder p="xl" radius="xl" shadow="sm">
                        <Stack align="center" mb="xl">
                            <ThemeIcon
                                size={72}
                                radius="xl"
                                variant="light"
                                color={accuracy >= 80 ? 'teal' : accuracy >= 50 ? 'orange' : 'red'}
                            >
                                {accuracy >= 80 ? (
                                    <IconConfetti size={36} />
                                ) : (
                                    <IconFlag2 size={36} />
                                )}
                            </ThemeIcon>
                            <Title order={2} ta="center">
                                {accuracy >= 80 ? 'Отлично!' : accuracy >= 50 ? 'Неплохо' : 'Продолжайте'}
                            </Title>
                            <Text c="dimmed" ta="center" size="sm">
                                Тренировка завершена
                            </Text>
                        </Stack>

                        <SimpleGrid cols={3} mb="xl" spacing="md">
                            <Paper
                                withBorder p="md" radius="xl"
                                style={{
                                    textAlign: 'center',
                                    borderColor: 'var(--mantine-color-teal-outline)',
                                    backgroundColor: 'var(--mantine-color-teal-light)',
                                }}
                            >
                                <Text fz={32} fw={800} c="teal" lh={1}>{perfectCount}</Text>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mt={4}>Идеально</Text>
                            </Paper>

                            <Paper
                                withBorder p="md" radius="xl"
                                style={{
                                    textAlign: 'center',
                                    borderColor: errorCount > 0 ? 'var(--mantine-color-red-outline)' : 'var(--mantine-color-default-border)',
                                    backgroundColor: errorCount > 0 ? 'var(--mantine-color-red-light)' : undefined,
                                }}
                            >
                                <Text fz={32} fw={800} c={errorCount > 0 ? 'red' : 'dimmed'} lh={1}>{errorCount}</Text>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mt={4}>С ошибками</Text>
                            </Paper>

                            <Paper
                                withBorder p="md" radius="xl"
                                style={{
                                    textAlign: 'center',
                                    borderColor: 'var(--mantine-color-cyan-outline)',
                                    backgroundColor: 'var(--mantine-color-cyan-light)',
                                }}
                            >
                                <Text fz={32} fw={800} c="cyan" lh={1}>{accuracy}%</Text>
                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mt={4}>Точность</Text>
                            </Paper>
                        </SimpleGrid>

                        <Text c="dimmed" mb="md" ta="center" size="sm">
                            Отмеченные слова будут добавлены в «Сложные»
                        </Text>

                        <Paper withBorder radius="xl" style={{ overflow: 'hidden' }} mb="xl">
                            <Table highlightOnHover>
                                <Table.Thead style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}>
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
                                        <Table.Th style={{ textAlign: 'right' }}>Ошибки</Table.Th>
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
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: isError ? 'var(--mantine-color-red-light-hover)' : undefined,
                                                }}
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
                                                    <Text fw={500} size="sm">{card.originalWord}</Text>
                                                    <Text size="xs" c="dimmed">{card.translation}</Text>
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>
                                                    {isError ? (
                                                        <Badge color="red" variant="light">{res.fails}</Badge>
                                                    ) : (
                                                        <Badge color="teal" variant="light" size="xs">OK</Badge>
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
                            onClick={handleFinalExit}
                            loading={isSubmitting}
                            color={selectedForHard.length > 0 ? 'orange' : 'cyan'}
                        >
                            {selectedForHard.length > 0
                                ? `Сохранить сложные (${selectedForHard.length}) и выйти`
                                : 'Завершить'}
                        </Button>
                    </Paper>
                </motion.div>
            </Container>
        );
    }

    // --- TRAINING SCREEN ---
    return (
        <Container size="md" px={{ base: 0, sm: 'md' }} py={{ base: 'xs', sm: 'xl' }}>
            <Modal
                opened={exitModalOpened}
                onClose={closeExitModal}
                title="Прервать тренировку?"
                centered
            >
                <Stack>
                    <Group wrap="nowrap" align="flex-start">
                        <ThemeIcon color="orange" variant="light" size="lg" radius="md">
                            <IconAlertTriangle size={20} />
                        </ThemeIcon>
                        <Text size="sm">
                            Ваш прогресс в текущей сессии будет потерян. Вы уверены, что хотите выйти?
                        </Text>
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeExitModal}>Отмена</Button>
                        <Button color="red" onClick={handleConfirmExit}>Выйти</Button>
                    </Group>
                </Stack>
            </Modal>

            <Button
                variant="subtle"
                size="xs"
                mb="md"
                color="gray"
                ml={{ base: 'md', sm: 0 }}
                onClick={openExitModal}
            >
                ← Выйти
            </Button>

            {error ? (
                <Alert variant="light" color="red" title="Ошибка" m="md">{error}</Alert>
            ) : cards.length > 0 ? (
                <ReviewTable
                    cards={cards}
                    onFinish={handleFinishSession}
                    primaryDirection={primaryDirection}
                />
            ) : (
                <Alert variant="light" color="blue" title="Пусто" m="md">В этой колоде нет слов.</Alert>
            )}
            <LoadingOverlay visible={isSubmitting} overlayProps={{ blur: 2 }} />
        </Container>
    );
};

export default DeckReviewPage;
