import {
    ActionIcon,
    AppShell,
    Avatar,
    Badge,
    Burger,
    Button,
    Container,
    Divider,
    Drawer,
    Group,
    Indicator,
    Menu,
    Stack,
    Text,
    Title,
    Modal,
    useMantineColorScheme,
    useComputedColorScheme,
    UnstyledButton,
    Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBasket,
    IconCards,
    IconClock,
    IconLibrary,
    IconLogout,
    IconPremiumRights,
    IconUser,
    IconAlertTriangle,
    IconMoon,
    IconSun,
    IconChevronDown,
} from '@tabler/icons-react';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useDraft } from '../app/providers/DraftProviders';
import { useReviewSession } from '../app/providers/ReviewProvider';
import { getFullProfile } from '../features/user/api';
import { apiClient } from '../shared/api/client';

interface UserState {
    login: string;
    status: 'free' | 'premium' | 'lifetime';
}

export const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { draftCards } = useDraft();
    const { isSessionActive } = useReviewSession();
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const [opened, { toggle, close }] = useDisclosure();
    const [logoutOpened, { open: openLogoutModal, close: closeLogoutModal }] = useDisclosure(false);
    const [navWarningOpened, { open: openNavWarning, close: closeNavWarning }] = useDisclosure(false);
    const [pendingPath, setPendingPath] = useState<string | null>(null);
    const [user, setUser] = useState<UserState | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                let status: UserState['status'] = 'free';
                if (decoded.status) status = decoded.status;
                else if (decoded.is_premium) status = 'premium';
                setUser({ login: decoded.login || 'User', status });
            } catch (e) {}
        }

        getFullProfile().then(data => {
            setUser({ login: data.user.login, status: data.user.status as any });
        }).catch(() => {});
    }, []);

    const handleProtectedNavigation = (to: string) => {
        if (isSessionActive) {
            setPendingPath(to);
            openNavWarning();
        } else {
            navigate(to);
            close();
        }
    };

    const confirmNavigation = () => {
        if (pendingPath) {
            navigate(pendingPath);
            setPendingPath(null);
        }
        closeNavWarning();
        close();
    };

    const handleLogout = async () => {
        try {
            await apiClient.post('logout');
        } catch (e) {
            console.error('Logout failed on server', e);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('memofold_draft');
            closeLogoutModal();
            navigate('/login');
        }
    };

    const NavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => {
        const isActive = location.pathname.startsWith(to);
        return (
            <UnstyledButton
                onClick={() => handleProtectedNavigation(to)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    color: isActive
                        ? 'var(--mantine-color-cyan-6)'
                        : 'var(--mantine-color-dimmed)',
                    backgroundColor: isActive
                        ? 'var(--mantine-color-cyan-light)'
                        : 'transparent',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                }}
            >
                <Icon size={17} />
                {label}
            </UnstyledButton>
        );
    };

    const MobileNavItem = ({ to, label, icon: Icon }: { to: string; label: string; icon: any }) => {
        const isActive = location.pathname.startsWith(to);
        return (
            <UnstyledButton
                onClick={() => handleProtectedNavigation(to)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 10,
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 15,
                    color: isActive ? 'var(--mantine-color-cyan-6)' : 'var(--mantine-color-text)',
                    backgroundColor: isActive ? 'var(--mantine-color-cyan-light)' : 'transparent',
                    width: '100%',
                    transition: 'background-color 0.15s ease',
                }}
            >
                <Icon size={20} />
                {label}
            </UnstyledButton>
        );
    };

    const renderBadge = () => {
        if (user?.status === 'lifetime') return <Badge size="xs" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>Pro+</Badge>;
        if (user?.status === 'premium') return <Badge size="xs" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Pro</Badge>;
        return <Badge size="xs" color="gray" variant="outline">Free</Badge>;
    };

    return (
        <>
            <AppShell
                header={{ height: 58 }}
                padding={0}
                styles={{
                    header: {
                        borderBottom: '1px solid var(--mantine-color-default-border)',
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'color-mix(in srgb, var(--mantine-color-body) 90%, transparent)',
                    }
                }}
            >
                <AppShell.Header>
                    <Container size="lg" h="100%">
                        <Group h="100%" justify="space-between">

                            <Group gap="xs">
                                <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
                                <UnstyledButton
                                    onClick={() => handleProtectedNavigation('/decks')}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                >
                                    <Title order={3} style={{ letterSpacing: -0.5, userSelect: 'none' }}>
                                        <Text span c="cyan" inherit>Memo</Text>fold
                                    </Title>
                                </UnstyledButton>
                                <Group ml="xl" gap={4} visibleFrom="md">
                                    <NavItem to="/decks" label="Колоды" icon={IconCards} />
                                    <NavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
                                    <NavItem to="/schedules" label="Расписания" icon={IconClock} />
                                </Group>
                            </Group>

                            <Group gap="xs">
                                <ActionIcon
                                    onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                                    variant="subtle"
                                    color="gray"
                                    size="lg"
                                    radius="md"
                                    aria-label="Toggle color scheme"
                                >
                                    {computedColorScheme === 'light'
                                        ? <IconMoon size={18} stroke={1.5} />
                                        : <IconSun size={18} stroke={1.5} />
                                    }
                                </ActionIcon>

                                <Indicator
                                    label={draftCards.length}
                                    size={16}
                                    disabled={draftCards.length === 0}
                                    color="red"
                                    offset={4}
                                >
                                    <ActionIcon
                                        variant="subtle"
                                        color="orange"
                                        size="lg"
                                        radius="md"
                                        onClick={() => handleProtectedNavigation('/deck-builder')}
                                        title="Конструктор колоды"
                                    >
                                        <IconBasket size={18} />
                                    </ActionIcon>
                                </Indicator>

                                <Menu shadow="lg" width={210} position="bottom-end" withArrow arrowPosition="center">
                                    <Menu.Target>
                                        <UnstyledButton
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '4px 10px',
                                                borderRadius: 8,
                                                border: '1px solid var(--mantine-color-default-border)',
                                                backgroundColor: 'var(--mantine-color-body)',
                                            }}
                                        >
                                            <Avatar color="cyan" radius="xl" size={28} variant="light">
                                                {user?.login?.slice(0, 2).toUpperCase()}
                                            </Avatar>
                                            <Text size="sm" fw={500} visibleFrom="sm">{user?.login}</Text>
                                            <IconChevronDown size={14} color="var(--mantine-color-dimmed)" />
                                        </UnstyledButton>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Box px="sm" py="xs">
                                            <Text size="xs" c="dimmed" fw={600} tt="uppercase">Аккаунт</Text>
                                        </Box>
                                        <Menu.Item
                                            leftSection={<IconUser size={15}/>}
                                            onClick={() => handleProtectedNavigation('/profile')}
                                            rightSection={renderBadge()}
                                        >
                                            Профиль
                                        </Menu.Item>

                                        {user?.status === 'free' && (
                                            <Menu.Item
                                                leftSection={<IconPremiumRights size={15}/>}
                                                color="orange"
                                                fw={600}
                                                onClick={() => handleProtectedNavigation('/payment')}
                                            >
                                                Купить Premium
                                            </Menu.Item>
                                        )}

                                        <Menu.Divider />
                                        <Menu.Item color="red" leftSection={<IconLogout size={15}/>} onClick={openLogoutModal}>
                                            Выйти
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>
                        </Group>
                    </Container>
                </AppShell.Header>

                <Drawer
                    opened={opened}
                    onClose={close}
                    size="xs"
                    withCloseButton={false}
                    padding="lg"
                >
                    <Group justify="space-between" mb="xl">
                        <Title order={4}>
                            <Text span c="cyan" inherit>Memo</Text>fold
                        </Title>
                        <ActionIcon variant="subtle" color="gray" onClick={close} radius="md">
                            <IconAlertTriangle size={0} />
                        </ActionIcon>
                    </Group>

                    <UnstyledButton
                        onClick={() => handleProtectedNavigation('/profile')}
                        style={{ width: '100%', marginBottom: 20 }}
                    >
                        <Group p="sm" style={{ borderRadius: 10, border: '1px solid var(--mantine-color-default-border)' }}>
                            <Avatar color="cyan" radius="xl" size="md" variant="light">
                                {user?.login?.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={600}>{user?.login}</Text>
                                <Text size="xs" c="dimmed">
                                    {user?.status === 'lifetime' ? 'Lifetime Support' : user?.status === 'premium' ? 'Premium Plan' : 'Free Plan'}
                                </Text>
                            </div>
                            {renderBadge()}
                        </Group>
                    </UnstyledButton>

                    <Stack gap={4}>
                        <MobileNavItem to="/decks" label="Колоды" icon={IconCards} />
                        <MobileNavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
                        <MobileNavItem to="/schedules" label="Расписания" icon={IconClock} />
                    </Stack>

                    <Divider my="lg" />

                    <Stack gap={4}>
                        <UnstyledButton
                            onClick={() => handleProtectedNavigation('/deck-builder')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: 15,
                                color: 'var(--mantine-color-orange-6)',
                                width: '100%',
                            }}
                        >
                            <Indicator label={draftCards.length} size={14} disabled={draftCards.length === 0} color="red">
                                <IconBasket size={20} />
                            </Indicator>
                            Конструктор
                        </UnstyledButton>

                        <UnstyledButton
                            onClick={openLogoutModal}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                borderRadius: 10,
                                fontSize: 15,
                                color: 'var(--mantine-color-red-6)',
                                width: '100%',
                            }}
                        >
                            <IconLogout size={20} />
                            Выйти
                        </UnstyledButton>
                    </Stack>
                </Drawer>

                <AppShell.Main pb="xl" px={{ base: 0, sm: 'md' }}>
                    <Outlet />
                </AppShell.Main>
            </AppShell>

            {/* Navigation Warning Modal */}
            <Modal
                opened={navWarningOpened}
                onClose={closeNavWarning}
                title="Прервать тренировку?"
                centered
                size="sm"
            >
                <Stack>
                    <Group wrap="nowrap" align="flex-start">
                        <IconAlertTriangle size={32} color="var(--mantine-color-orange-filled)" style={{ flexShrink: 0 }} />
                        <Text size="sm">
                            Вы находитесь в процессе тренировки. Если вы уйдете сейчас, прогресс этого сеанса будет потерян.
                        </Text>
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNavWarning}>Остаться</Button>
                        <Button color="red" onClick={confirmNavigation}>Прервать и уйти</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Logout Confirmation Modal */}
            <Modal
                opened={logoutOpened}
                onClose={closeLogoutModal}
                title="Подтверждение выхода"
                centered
                size="sm"
            >
                <Text size="sm" mb="lg">Вы действительно хотите выйти из аккаунта?</Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeLogoutModal}>Отмена</Button>
                    <Button color="red" onClick={handleLogout}>Выйти</Button>
                </Group>
            </Modal>
        </>
    );
};
