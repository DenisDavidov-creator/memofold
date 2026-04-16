import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Group,
    SimpleGrid,
    Skeleton,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import {
    IconArchive,
    IconCards,
    IconClock,
    IconPlayerPlay,
    IconPlus,
    IconPremiumRights,
    IconRepeat,
    IconArrowRight,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDecks } from '../../features/decks/api';
import type { Deck } from '../../features/decks/types';

interface UserState {
    status: 'free' | 'premium' | 'lifetime';
}

const DeckListPage = () => {
    const navigate = useNavigate();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>('active');
    const [isPremium, setIsPremium] = useState('');

    useEffect(() => {
        setLoading(true);
        const isArchived = activeTab === 'archive';

        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                let status: UserState['status'] = 'free';
                if (decoded.status) status = decoded.status;
                else if (decoded.isPremium) status = 'premium';
                setIsPremium(status);
            } catch (e) {}
        }

        getDecks(isArchived)
            .then((data) => setDecks(data || []))
            .catch(() => setDecks([]))
            .finally(() => setLoading(false));
    }, [activeTab]);

    const now = new Date();
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const isArchiveTab = activeTab === 'archive';

    const getDiffMs = (dateStr?: string) => {
        if (!dateStr) return -1;
        return new Date(dateStr).getTime() - now.getTime();
    };

    const getTimeLabel = (dateStr?: string) => {
        const diffMs = getDiffMs(dateStr);
        if (diffMs <= 0) return { text: 'Готово', color: 'teal', variant: 'light' as const };
        const diffMins = Math.ceil(diffMs / (60 * 1000));
        if (diffMins < 60) return { text: `${diffMins} мин`, color: 'orange', variant: 'light' as const };
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        if (diffHours < 24) return { text: `Через ${diffHours} ч`, color: 'blue', variant: 'light' as const };
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays === 1) return { text: 'Завтра', color: 'gray', variant: 'outline' as const };
        if (diffDays < 7) return { text: `Через ${diffDays} дн`, color: 'gray', variant: 'outline' as const };
        return {
            text: new Date(dateStr!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
            color: 'gray',
            variant: 'outline' as const,
        };
    };

    const dueDecks = isArchiveTab ? [] : decks.filter(d => getDiffMs(d.nextReviewDate) <= ONE_HOUR_MS);
    const futureDecks = isArchiveTab ? decks : decks.filter(d => getDiffMs(d.nextReviewDate) > ONE_HOUR_MS);

    dueDecks.sort((a, b) => getDiffMs(a.nextReviewDate) - getDiffMs(b.nextReviewDate));
    futureDecks.sort((a, b) => getDiffMs(a.nextReviewDate) - getDiffMs(b.nextReviewDate));

    const DeckCard = ({ deck, isTopList }: { deck: Deck; isTopList: boolean }) => {
        const { text, color, variant } = getTimeLabel(deck.nextReviewDate);
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/decks/${deck.id}`)}
            >
                <Card shadow="sm" padding="lg" radius="xl" withBorder h="100%">
                    <Stack justify="space-between" h="100%" gap="sm">
                        <div>
                            <Group justify="space-between" mb="xs" align="flex-start">
                                <Text fw={700} size="md" lineClamp={2} style={{ flex: 1 }}>
                                    {deck.name}
                                </Text>
                                {isArchiveTab ? (
                                    <Badge color="gray" variant="outline" leftSection={<IconArchive size={11} />}>
                                        Архив
                                    </Badge>
                                ) : (
                                    <Badge
                                        color={color}
                                        variant={variant}
                                        leftSection={getDiffMs(deck.nextReviewDate) > 0 ? <IconClock size={11} /> : null}
                                    >
                                        {text}
                                    </Badge>
                                )}
                            </Group>

                            <Group gap="xs">
                                <Badge variant="light" color="gray" size="sm">
                                    {deck.cardsCount || 0} карт
                                </Badge>
                                {!isArchiveTab && (deck.currentLevel || 0) > 0 && (
                                    <Badge variant="light" color="orange" size="sm" leftSection={<IconRepeat size={10} />}>
                                        Lv {deck.currentLevel}
                                    </Badge>
                                )}
                            </Group>
                        </div>

                        <Button
                            fullWidth
                            radius="xl"
                            size="sm"
                            variant={!isArchiveTab && isTopList ? 'filled' : 'light'}
                            color={!isArchiveTab && isTopList ? 'cyan' : 'gray'}
                            rightSection={<IconArrowRight size={14} />}
                        >
                            {isArchiveTab ? 'Просмотр' : isTopList ? 'Начать повторение' : 'Открыть'}
                        </Button>
                    </Stack>
                </Card>
            </motion.div>
        );
    };

    const SkeletonCard = () => (
        <Card shadow="sm" padding="lg" radius="xl" withBorder>
            <Skeleton height={20} mb="md" radius="md" />
            <Skeleton height={14} width="60%" mb="lg" radius="md" />
            <Skeleton height={34} radius="xl" />
        </Card>
    );

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={2} fw={800}>Мои колоды</Title>
                <Button
                    onClick={() => navigate('/deck-builder')}
                    leftSection={<IconPlus size={18} />}
                    radius="xl"
                >
                    Новая колода
                </Button>
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
                <Tabs.List>
                    <Tabs.Tab value="active" leftSection={<IconPlayerPlay size={15} />}>
                        Обучение
                    </Tabs.Tab>
                    <Tabs.Tab value="archive" leftSection={<IconArchive size={15} />}>
                        Архив
                    </Tabs.Tab>
                </Tabs.List>
            </Tabs>

            {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </SimpleGrid>
            ) : decks.length === 0 ? (
                <Box py={80} style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="lg">
                        <IconCards size={32} />
                    </ThemeIcon>
                    <Text size="lg" fw={600} mb="xs">
                        {isArchiveTab ? 'Архив пуст' : 'Нет активных колод'}
                    </Text>
                    <Text c="dimmed" size="sm" mb="xl">
                        {isArchiveTab
                            ? 'Завершённые колоды будут отображаться здесь'
                            : 'Создайте первую колоду, чтобы начать обучение'}
                    </Text>
                    {!isArchiveTab && (
                        <Button onClick={() => navigate('/deck-builder')} radius="xl" leftSection={<IconPlus size={16} />}>
                            Создать первую колоду
                        </Button>
                    )}
                </Box>
            ) : (
                <>
                    {activeTab === 'active' && dueDecks.length > 0 && (
                        <div style={{ marginBottom: 48 }}>
                            <Group gap="xs" mb="md">
                                <ThemeIcon size="sm" radius="md" color="teal" variant="light">
                                    <IconPlayerPlay size={12} />
                                </ThemeIcon>
                                <Text fw={700} size="sm" c="teal">
                                    Готовы к повторению
                                </Text>
                            </Group>
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                                {dueDecks.map(deck => <DeckCard key={deck.id} deck={deck} isTopList={true} />)}
                            </SimpleGrid>
                        </div>
                    )}

                    {(futureDecks.length > 0 || isArchiveTab) && (
                        <div>
                            {activeTab === 'active' && dueDecks.length > 0 && (
                                <Divider my="xl" label="Ожидают" labelPosition="center" />
                            )}
                            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                                {(isArchiveTab ? decks : futureDecks).map(deck => (
                                    <DeckCard key={deck.id} deck={deck} isTopList={false} />
                                ))}
                            </SimpleGrid>
                        </div>
                    )}

                    {isPremium === 'free' && (
                        <Alert
                            variant="light"
                            color="cyan"
                            title="Хотите больше?"
                            mt="xl"
                            icon={<IconPremiumRights />}
                            style={{ cursor: 'pointer', borderRadius: 16 }}
                            onClick={() => navigate('/payment')}
                        >
                            Снимите ограничения на создание колод.{' '}
                            <strong>Подробнее →</strong>
                        </Alert>
                    )}
                </>
            )}
        </Container>
    );
};

export default DeckListPage;
