import {
    Avatar,
    Badge,
    Button,
    Container,
    Group,
    LoadingOverlay,
    Modal,
    Paper,
    SimpleGrid,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconActivity,
    IconCards,
    IconLogout,
    IconPremiumRights,
    IconSchool,
    IconStar,
    IconVocabulary,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullProfile } from '../../features/user/api';
import type { FullProfile } from '../../features/user/types';
import { apiClient } from '../../shared/api/client';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<FullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [logoutOpened, { open: openLogoutModal, close: closeLogoutModal }] = useDisclosure(false);

    useEffect(() => {
        getFullProfile()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = async () => {
        try {
            await apiClient.post('logout');
        } catch (e) {}
        finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('memofold_draft');
            closeLogoutModal();
            navigate('/login');
        }
    };

    if (loading) return <LoadingOverlay visible />;

    if (!data) return (
        <Container size="sm" py="xl">
            <Text c="red" ta="center">Ошибка загрузки профиля</Text>
            <Button fullWidth onClick={handleLogout} mt="md" variant="light" color="red">Выйти</Button>
        </Container>
    );

    const { user, stats } = data;

    const renderStatusBadge = () => {
        switch (user.status) {
            case 'lifetime':
                return (
                    <Badge variant="gradient" gradient={{ from: 'yellow', to: 'orange' }} leftSection={<IconStar size={12} fill="white" />}>
                        Меценат
                    </Badge>
                );
            case 'premium':
                return (
                    <Badge variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} leftSection={<IconPremiumRights size={12} />}>
                        Premium
                    </Badge>
                );
            default:
                return <Badge color="gray" variant="outline">Free Plan</Badge>;
        }
    };

    const statItems = [
        {
            icon: IconVocabulary,
            color: 'blue',
            label: 'Слов в колодах',
            value: stats.totalWordsLearning,
        },
        {
            icon: IconSchool,
            color: 'teal',
            label: 'Выучено',
            value: stats.totalWordsMastered,
            valueColor: 'teal',
        },
        {
            icon: IconCards,
            color: 'violet',
            label: 'Активных колод',
            value: stats.activeDecksCount,
        },
        {
            icon: IconActivity,
            color: 'orange',
            label: 'Тренировок',
            value: stats.totalReviews,
        },
    ];

    return (
        <Container size="sm" py="xl">
            <Title order={2} fw={800} mb="xl">Профиль</Title>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                {/* User Card */}
                <Paper withBorder p="xl" radius="xl" mb="xl" shadow="sm">
                    <Group align="center" justify="space-between" wrap="wrap" gap="md">
                        <Group>
                            <Avatar size={72} radius="xl" color="cyan" variant="light">
                                {user.login?.slice(0, 2).toUpperCase() || 'U'}
                            </Avatar>
                            <div>
                                <Text size="xl" fw={800}>{user.login}</Text>
                                <Text c="dimmed" size="sm" mb="xs">{user.email}</Text>
                                {renderStatusBadge()}
                            </div>
                        </Group>

                        {user.status === 'free' && (
                            <Button variant="light" color="orange" radius="xl" leftSection={<IconPremiumRights size={16} />} onClick={() => navigate('/payment')}>
                                Купить Premium
                            </Button>
                        )}
                        {user.status === 'premium' && (
                            <Button variant="subtle" size="sm" radius="xl" color="blue" onClick={() => navigate('/payment')}>
                                Продлить
                            </Button>
                        )}
                    </Group>
                </Paper>

                {/* Mastery ring + stats */}
                <Paper withBorder p="xl" radius="xl" mb="xl" shadow="sm">
                    <Text fw={700} size="lg" mb="lg">Ваш прогресс</Text>

                    <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="md">
                        {statItems.map((item, i) => (
                            <motion.div
                                key={item.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.25 }}
                            >
                                <Paper withBorder p="md" radius="xl">
                                    <Group>
                                        <ThemeIcon size="lg" radius="md" variant="light" color={item.color}>
                                            <item.icon size={18} />
                                        </ThemeIcon>
                                        <div>
                                            <Text c="dimmed" size="xs" tt="uppercase" fw={700}>{item.label}</Text>
                                            <Text fw={800} size="xl" c={item.valueColor}>{item.value}</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </motion.div>
                        ))}
                    </SimpleGrid>
                </Paper>

                {/* Actions */}
                <Button
                    variant="light"
                    color="red"
                    fullWidth
                    radius="xl"
                    size="md"
                    leftSection={<IconLogout size={18} />}
                    onClick={openLogoutModal}
                >
                    Выйти из аккаунта
                </Button>
            </motion.div>

            <Modal opened={logoutOpened} onClose={closeLogoutModal} title="Подтверждение выхода" centered size="sm">
                <Text size="sm" mb="lg">Вы действительно хотите выйти из аккаунта?</Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeLogoutModal}>Отмена</Button>
                    <Button color="red" onClick={handleLogout}>Выйти</Button>
                </Group>
            </Modal>
        </Container>
    );
};

export default ProfilePage;
