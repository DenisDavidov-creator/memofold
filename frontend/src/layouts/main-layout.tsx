import {
    ActionIcon,
    AppShell,
    Avatar,
    Badge,
    Burger,
    Button,
    Container,
    Drawer,
    Group,
    Indicator,
    Menu,
    Stack,
    Text,
    Title,
    Modal,
    useMantineColorScheme,
    useComputedColorScheme
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
    IconSun
} from '@tabler/icons-react';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useDraft } from '../app/providers/DraftProviders';
import { useReviewSession } from '../app/providers/ReviewProvider'; // Added this
import { getFullProfile } from '../features/user/api';
import { apiClient } from '../shared/api/client';

interface UserState {
    login: string;
    status: 'free' | 'premium' | 'lifetime';
}

export const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Global State
    const { draftCards } = useDraft();
    const { isSessionActive } = useReviewSession(); // Check if user is in ReviewTable
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
    // UI State
    const [opened, { toggle, close }] = useDisclosure(); // Mobile drawer
    const [logoutOpened, { open: openLogoutModal, close: closeLogoutModal }] = useDisclosure(false);
    
    // Navigation Guard State
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

                setUser({
                    login: decoded.login || 'User',
                    status: status
                });
            } catch (e) {}
        }

        getFullProfile().then(data => {
            setUser({
                login: data.user.login,
                status: data.user.status as any
            });
        }).catch(() => {});
    }, []);

    // --- Navigation Logic ---

    const handleProtectedNavigation = (to: string) => {
        if (isSessionActive) {
            setPendingPath(to);
            openNavWarning();
        } else {
            navigate(to);
            close(); // Close drawer if open
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

    const NavItem = ({ to, label, icon: Icon }: any) => {
        const isActive = location.pathname.startsWith(to);
        return (
            <Button 
                variant={isActive ? 'light' : 'subtle'} 
                color={isActive ? 'blue' : 'gray'}
                leftSection={<Icon size={18} />}
                onClick={() => handleProtectedNavigation(to)} // Guarded
                fullWidth={false}
            >
                {label}
            </Button>
        );
    };

    const renderBadge = () => {
        if (user?.status === 'lifetime') return <Badge size="xs" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>Pro+</Badge>;
        if (user?.status === 'premium') return <Badge size="xs" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Pro</Badge>;
        return <Badge size="xs" color="gray" variant="outline">Free</Badge>;
    };

    return (
        <>
            <AppShell header={{ height: 60 }} padding={0}>
                <AppShell.Header>
                    <Container size="lg" h="100%">
                        <Group h="100%" px="md" justify="space-between">
                            
                            <Group>
                                <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
                                <Title 
                                    order={3} 
                                    style={{ cursor: 'pointer', userSelect: 'none' }} 
                                    onClick={() => handleProtectedNavigation('/decks')} // Guarded
                                >
                                    Memofold
                                </Title>
                                <Group ml="xl" gap="xs" visibleFrom="md">
                                    <NavItem to="/decks" label="Колоды" icon={IconCards} />
                                    <NavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
                                    <NavItem to="/schedules" label="Расписания" icon={IconClock} />
                                </Group>
                            </Group>

                            <Group>
                                <ActionIcon
                                    onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                                    variant="default"
                                    size="lg"
                                    aria-label="Toggle color scheme"
                                    radius="md"
                                >
                                    {computedColorScheme === 'light' ? (
                                        <IconMoon size={20} stroke={1.5} />
                                    ) : (
                                        <IconSun size={20} stroke={1.5} />
                                    )}
                                </ActionIcon>
                                <Indicator 
                                    label={draftCards.length} 
                                    size={16} 
                                    disabled={draftCards.length === 0} 
                                    color="red" 
                                    offset={4}
                                >
                                    <ActionIcon 
                                        variant="light" 
                                        size="lg" 
                                        color="orange"
                                        onClick={() => handleProtectedNavigation('/deck-builder')} // Guarded
                                        title="Конструктор колоды"
                                    >
                                        <IconBasket size={20} />
                                    </ActionIcon>
                                </Indicator>

                                <Menu shadow="md" width={200} position="bottom-end" withArrow>
                                    <Menu.Target>
                                        <ActionIcon variant="transparent" size="lg" radius="xl" visibleFrom="sm">
                                            <Avatar color="blue" radius="xl" size={32}>
                                                {user?.login?.slice(0, 2).toUpperCase()}
                                            </Avatar>
                                        </ActionIcon>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Menu.Label>Аккаунт</Menu.Label>
                                        <Menu.Item 
                                            leftSection={<IconUser size={16}/>} 
                                            onClick={() => handleProtectedNavigation('/profile')} // Guarded
                                            rightSection={renderBadge()}
                                        >
                                            Профиль
                                        </Menu.Item>
                                        
                                        {user?.status === 'free' && (
                                            <Menu.Item 
                                                leftSection={<IconPremiumRights size={16}/>} 
                                                color="orange"
                                                style={{ fontWeight: 600 }}
                                                onClick={() => handleProtectedNavigation('/payment')} // Guarded
                                            >
                                                Купить Premium
                                            </Menu.Item>
                                        )}

                                        <Menu.Divider />
                                        <Menu.Item color="red" leftSection={<IconLogout size={16}/>} onClick={openLogoutModal}>
                                            Выйти
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>

                        </Group>
                    </Container>
                </AppShell.Header>

                <Drawer opened={opened} onClose={close} size="xs" title="Меню">
                    <Stack gap="sm">
                        <Group mb="md" onClick={() => handleProtectedNavigation('/profile')} style={{ cursor: 'pointer' }}>
                            <Avatar color="blue" radius="xl" size="md">
                                {user?.login?.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1 }}>
                                <Text size="sm" fw={500}>{user?.login}</Text>
                                <Text size="xs" c="dimmed" fw={700}>
                                    {user?.status === 'lifetime' ? 'Lifetime Support' : user?.status === 'premium' ? 'Premium Plan' : 'Free Plan'}
                                </Text>
                            </div>
                        </Group>
                        
                        <NavItem to="/decks" label="Колоды" icon={IconCards} />
                        <NavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
                        <NavItem to="/schedules" label="Расписания" icon={IconClock} />
                        
                        <div style={{ height: 1, background: '#eee', margin: '10px 0' }} />
                        
                        <Button color="red" variant="subtle" leftSection={<IconLogout size={18}/>} onClick={openLogoutModal}>
                            Выйти
                        </Button>
                    </Stack>
                </Drawer>

                <AppShell.Main pt="md" pb="xl" px={{ base: 0, sm: 'md' }}>
                    <Outlet /> 
                </AppShell.Main>
            </AppShell>

            {/* MODAL: Navigation Warning */}
            <Modal 
                opened={navWarningOpened} 
                onClose={closeNavWarning} 
                title="Прервать тренировку?" 
                centered 
                size="sm"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Stack>
                    <Group wrap="nowrap" align="flex-start">
                        <IconAlertTriangle size={36} color="orange" style={{ flexShrink: 0 }} />
                        <Text size="sm">
                            Вы находитесь в процессе тренировки. Если вы уйдете сейчас, прогресс этого сеанса будет потерян.
                        </Text>
                    </Group>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeNavWarning}>
                            Остаться
                        </Button>
                        <Button color="red" onClick={confirmNavigation}>
                            Прервать и уйти
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* MODAL: Logout Confirmation */}
            <Modal 
                opened={logoutOpened} 
                onClose={closeLogoutModal} 
                title="Подтверждение выхода" 
                centered 
                size="sm"
            >
                <Text size="sm" mb="lg">
                    Вы действительно хотите выйти из аккаунта?
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeLogoutModal}>Отмена</Button>
                    <Button color="red" onClick={handleLogout}>Выйти</Button>
                </Group>
            </Modal>
        </>
    );
};