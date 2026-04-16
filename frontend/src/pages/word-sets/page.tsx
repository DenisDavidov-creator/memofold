import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Card,
    CloseButton,
    Container,
    Group,
    Modal,
    SimpleGrid,
    Skeleton,
    Stack,
    Tabs,
    Text,
    TextInput,
    ThemeIcon,
    Title,
    Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFolder, IconPlus, IconSearch, IconUser, IconWorld } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import type { WordSet } from '../../features/word-sets/types';
import { createWordSet, getWordSets } from '../../features/word-sets/api';

const WordSetsPage = () => {
    const navigate = useNavigate();

    const [sets, setSets] = useState<WordSet[]>([]);
    const [activeTab, setActiveTab] = useState<string | null>('my');
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [opened, { open, close }] = useDisclosure(false);
    const [newName, setNewName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        setLoading(true);
        getWordSets(activeTab as 'my' | 'public')
            .then((data) => {
                const list = data || [];
                list.sort((a: any, b: any) => {
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    return 0;
                });
                setSets(list);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [activeTab]);

    const handleCreate = async () => {
        if (!newName) return;
        setIsCreating(true);
        try {
            const newSet = await createWordSet({ name: newName, isPublic: false });
            setSets((prev) => [...prev, newSet]);
            setNewName('');
            close();
        } catch (e) {
            alert('Ошибка создания');
        } finally {
            setIsCreating(false);
        }
    };

    const handleTabChange = (value: string | null) => {
        setActiveTab(value);
        setSearch('');
    };

    const filteredSets = sets.filter((set: any) => {
        if (!search) return true;
        const query = search.toLowerCase();
        return (
            set.name.toLowerCase().includes(query) ||
            (set.userName ? set.userName.toLowerCase().includes(query) : false)
        );
    });

    const SkeletonCard = () => (
        <Card shadow="sm" padding="lg" radius="xl" withBorder>
            <Skeleton height={40} width={40} radius="md" mb="md" />
            <Skeleton height={18} mb="xs" radius="md" />
            <Skeleton height={14} width="50%" radius="md" />
        </Card>
    );

    return (
        <Container size="lg" py="xl">
            <Group justify="space-between" mb="xl">
                <Title order={2} fw={800}>Библиотека</Title>
                {activeTab === 'my' && (
                    <Button leftSection={<IconPlus size={18} />} onClick={open} radius="xl">
                        Создать набор
                    </Button>
                )}
            </Group>

            <Tabs value={activeTab} onChange={handleTabChange} mb="md">
                <Tabs.List>
                    <Tabs.Tab value="my" leftSection={<IconFolder size={15} />}>Мои наборы</Tabs.Tab>
                    <Tabs.Tab value="public" leftSection={<IconWorld size={15} />}>Публичные</Tabs.Tab>
                </Tabs.List>
            </Tabs>

            <TextInput
                placeholder={activeTab === 'public' ? 'Поиск по названию или автору...' : 'Поиск по названию...'}
                leftSection={<IconSearch size={16} />}
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                rightSection={search ? <CloseButton onClick={() => setSearch('')} /> : null}
                mb="xl"
                radius="xl"
            />

            {loading ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </SimpleGrid>
            ) : filteredSets.length === 0 ? (
                <Box py={80} style={{ textAlign: 'center' }}>
                    <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="lg">
                        <IconFolder size={32} />
                    </ThemeIcon>
                    <Text size="lg" fw={600} mb="xs">
                        {search ? 'Ничего не найдено' : 'Список пуст'}
                    </Text>
                    <Text c="dimmed" size="sm" mb="xl">
                        {search
                            ? 'Попробуйте другой запрос'
                            : activeTab === 'my'
                            ? 'Создайте свой первый набор слов'
                            : 'Публичных наборов пока нет'
                        }
                    </Text>
                    {!search && activeTab === 'my' && (
                        <Button radius="xl" leftSection={<IconPlus size={16} />} onClick={open}>
                            Создать набор
                        </Button>
                    )}
                </Box>
            ) : (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                    {filteredSets.map((set, i) => {
                        const isSystem = (set as any).isDefault;
                        const userName = (set as any).userName;

                        return (
                            <motion.div
                                key={set.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                                transition={{ delay: i * 0.04, duration: 0.2 }}
                                style={{ cursor: 'pointer' }}
                                onClick={() => navigate(`/word-sets/${set.id}`)}
                            >
                                <Card shadow="sm" padding="lg" radius="xl" withBorder h="100%">
                                    <Stack gap="sm">
                                        <ThemeIcon
                                            color={activeTab === 'my' ? 'orange' : 'blue'}
                                            variant="light"
                                            size={44}
                                            radius="xl"
                                        >
                                            {activeTab === 'my' ? <IconFolder size={22} /> : <IconWorld size={22} />}
                                        </ThemeIcon>

                                        <Text fw={700} size="md" lineClamp={2}>{set.name}</Text>

                                        <Group gap="xs">
                                            <Badge variant="light" color="gray" size="sm">
                                                {set.cardsCount || 0} слов
                                            </Badge>

                                            {isSystem && (
                                                <Badge color="orange" variant="light" size="sm">
                                                    System
                                                </Badge>
                                            )}

                                            {activeTab === 'public' && userName && (
                                                <Badge
                                                    variant="light"
                                                    color="gray"
                                                    size="sm"
                                                    leftSection={<IconUser size={10} />}
                                                >
                                                    {userName}
                                                </Badge>
                                            )}
                                        </Group>
                                    </Stack>
                                </Card>
                            </motion.div>
                        );
                    })}
                </SimpleGrid>
            )}

            <Modal opened={opened} onClose={close} title="Новый набор слов" centered radius="xl">
                <TextInput
                    label="Название"
                    placeholder="Например: Топ 100 глаголов"
                    data-autofocus
                    value={newName}
                    onChange={(e) => setNewName(e.currentTarget.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                    radius="xl"
                />
                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={close} radius="xl">Отмена</Button>
                    <Button onClick={handleCreate} loading={isCreating} radius="xl">Создать</Button>
                </Group>
            </Modal>
        </Container>
    );
};

export default WordSetsPage;
