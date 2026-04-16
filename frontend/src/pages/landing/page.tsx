import {
    Badge,
    Box,
    Button,
    Container,
    Group,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Paper,
} from '@mantine/core';
import {
    IconBrain,
    IconCards,
    IconChartBar,
    IconChevronRight,
    IconArrowRight,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewSession } from '../../app/providers/ReviewProvider';

const LandingPage = () => {
    const navigate = useNavigate();
    const { setSessionActive } = useReviewSession();

    useEffect(() => {
        setSessionActive(false);
        const token = localStorage.getItem('accessToken');
        if (token) navigate('/decks');
    }, [navigate, setSessionActive]);

    return (
        <Box>
            {/* HERO */}
            <Container size="md" py={{ base: 80, md: 140 }}>
                <Stack align="center" gap="xl">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge
                            variant="light"
                            color="cyan"
                            size="lg"
                            radius="xl"
                            mb="lg"
                            style={{ display: 'block', textAlign: 'center' }}
                        >
                            Метод интервального повторения
                        </Badge>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        style={{ textAlign: 'center' }}
                    >
                        <Title
                            order={1}
                            style={{ lineHeight: 1.1, fontWeight: 900 }}
                            fz={{ base: 44, xs: 56, md: 76 }}
                        >
                            Запоминайте слова{' '}
                            <Text span c="cyan" inherit>
                                навсегда
                            </Text>
                        </Title>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        style={{ textAlign: 'center' }}
                    >
                        <Text c="dimmed" size="lg" ta="center" maw={560} mx="auto" lh={1.7}>
                            Минималистичный сервис для изучения английского языка.
                            Метод «Гармошка» и умные интервальные повторения — учите меньше, запоминайте больше.
                        </Text>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        style={{ width: '100%' }}
                    >
                        <Group justify="center" mt="md" w="100%">
                            <Button
                                size="xl"
                                radius="xl"
                                onClick={() => navigate('/register')}
                                rightSection={<IconChevronRight size={20} />}
                                w={{ base: '100%', xs: 'auto' }}
                            >
                                Начать учиться
                            </Button>
                            <Button
                                size="xl"
                                radius="xl"
                                variant="default"
                                onClick={() => navigate('/login')}
                                w={{ base: '100%', xs: 'auto' }}
                            >
                                Войти
                            </Button>
                        </Group>
                    </motion.div>
                </Stack>
            </Container>

            {/* HOW IT WORKS */}
            <Box
                py={{ base: 70, md: 110 }}
                style={{ backgroundColor: 'var(--mantine-color-default-hover)' }}
            >
                <Container size="lg">
                    <Stack align="center" mb={60}>
                        <Badge variant="outline" color="gray" size="md" radius="xl">
                            Как это работает
                        </Badge>
                        <Title order={2} ta="center" fz={{ base: 28, md: 36 }}>
                            Три принципа эффективного запоминания
                        </Title>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing={32}>
                        {[
                            {
                                icon: IconCards,
                                color: 'cyan',
                                title: 'Активное вспоминание',
                                description:
                                    'Пишите перевод сами, а не выбирайте из вариантов. Это заставляет мозг работать и формирует нейронные связи.',
                            },
                            {
                                icon: IconBrain,
                                color: 'violet',
                                title: 'Умные интервалы',
                                description:
                                    'Система сама скажет, когда пора повторить слово, чтобы оно попало в долгосрочную память.',
                            },
                            {
                                icon: IconChartBar,
                                color: 'teal',
                                title: 'Работа над ошибками',
                                description:
                                    'Сложные слова автоматически собираются в отдельный список для дополнительной проработки.',
                            },
                        ].map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                            >
                                <Paper p="xl" radius="xl" withBorder shadow="sm" h="100%">
                                    <ThemeIcon size={52} radius="xl" variant="light" color={f.color} mb="lg">
                                        <f.icon size={26} />
                                    </ThemeIcon>
                                    <Text fz="lg" fw={700} mb="sm">
                                        {f.title}
                                    </Text>
                                    <Text c="dimmed" lh={1.6} size="sm">
                                        {f.description}
                                    </Text>
                                </Paper>
                            </motion.div>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* CTA SECTION */}
            <Box py={{ base: 70, md: 100 }}>
                <Container size="sm">
                    <Paper
                        p={{ base: 'xl', md: 48 }}
                        radius="xl"
                        style={{
                            background: 'linear-gradient(135deg, var(--mantine-color-cyan-light), var(--mantine-color-blue-light))',
                            border: '1px solid var(--mantine-color-cyan-outline)',
                            textAlign: 'center',
                        }}
                    >
                        <Title order={2} mb="md">
                            Готовы начать?
                        </Title>
                        <Text c="dimmed" mb="xl" size="md">
                            Регистрация занимает 30 секунд. Первые колоды — бесплатно.
                        </Text>
                        <Button
                            size="lg"
                            radius="xl"
                            rightSection={<IconArrowRight size={18} />}
                            onClick={() => navigate('/register')}
                        >
                            Создать аккаунт
                        </Button>
                    </Paper>
                </Container>
            </Box>

            {/* FOOTER */}
            <Box
                py="lg"
                style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
            >
                <Container size="lg">
                    <Group justify="space-between" align="center">
                        <Group gap={6}>
                            <Text fw={800} size="lg" style={{ letterSpacing: -0.5 }}>
                                <Text span c="cyan" inherit>Memo</Text>fold
                            </Text>
                            <Badge variant="outline" color="gray" size="xs">
                                v1.0
                            </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                            © 2026 Denis Davidov
                        </Text>
                    </Group>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
