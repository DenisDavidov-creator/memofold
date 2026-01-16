import { useState, useEffect } from 'react';
import { 
  AppShell, Group, Burger, Button, Title, Container, 
  Indicator, ActionIcon, Drawer, Stack, NavLink, Avatar, Menu, Text, Badge 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  IconBasket, IconCards, IconLibrary, IconClock, IconLogout, 
  IconUser, IconPremiumRights, IconChevronDown, IconStar 
} from '@tabler/icons-react';
import { jwtDecode } from 'jwt-decode';

import { logout } from '../features/auth/api';
import { useDraft } from '../app/providers/DraftProviders';
import { getFullProfile } from '../features/user/api';
import { apiClient } from '../shared/api/client';


interface UserState {
    login: string;
    status: 'free' | 'premium' | 'lifetime'; // New type
}

export const MainLayout = () => {
  const [opened, { toggle, close }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { draftCards } = useDraft();

  const [user, setUser] = useState<UserState | null>(null);

  useEffect(() => {
    // Option 1: Try to get from Token first (Fast)
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const decoded: any = jwtDecode(token);
            // Map old boolean is_premium to new status if backend not updated yet
            let status: UserState['status'] = 'free';
            if (decoded.status) status = decoded.status;
            else if (decoded.is_premium) status = 'premium'; // Fallback

            setUser({
                login: decoded.login || 'User',
                status: status
            });
        } catch (e) {}
    }

    // Option 2 (Better): Fetch fresh profile in background to update status
    getFullProfile().then(data => {
        setUser({
            login: data.user.login,
            status: data.user.status as any
        });
    }).catch(() => {});
  }, []);

    const handleLogout = async () => {
        try {
            // 1. Отправляем запрос на бэк (чтобы удалить куку и запись в БД)
            await apiClient.post('logout'); // Убедись, что эндпоинт правильный (api/logout или auth/logout)
        } catch (e) {
            console.error('Logout failed on server', e);
            // Даже если ошибка сети, всё равно чистим локально
        } finally {
            // 2. Чистим локально
            localStorage.removeItem('accessToken');
            // 3. Редирект
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
        onClick={() => { navigate(to); close(); }}
        fullWidth={false}
      >
        {label}
      </Button>
    );
  };

  // Helper to render Badge
  const renderBadge = () => {
      if (user?.status === 'lifetime') return <Badge size="xs" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>Pro+</Badge>;
      if (user?.status === 'premium') return <Badge size="xs" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>Pro</Badge>;
      return <Badge size="xs" color="gray" variant="outline">Free</Badge>;
  };

  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" px="md" justify="space-between">
            
            <Group>
                <Burger opened={opened} onClick={toggle} hiddenFrom="md" size="sm" />
                <Title order={3} style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => navigate('/decks')}>
                    Memofold
                </Title>
                <Group ml="xl" gap="xs" visibleFrom="md">
                   <NavItem to="/decks" label="Колоды" icon={IconCards} />
                   <NavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
                   <NavItem to="/schedules" label="Расписания" icon={IconClock} />
                </Group>
            </Group>

            <Group>
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
                      onClick={() => navigate('/deck-builder')}
                      title="Конструктор колоды"
                   >
                      <IconBasket size={20} />
                   </ActionIcon>
                </Indicator>

                <Menu shadow="md" width={200} position="bottom-end" withArrow>
                    <Menu.Target>
                        <ActionIcon 
                            variant="transparent" 
                            size="lg" 
                            radius="xl"
                            visibleFrom="sm"
                        >
                            <Avatar color="blue" radius="xl" size={32}>
                                {user?.login?.slice(0, 2).toUpperCase()}
                            </Avatar>
                        </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                        <Menu.Label>Аккаунт</Menu.Label>
                        <Menu.Item 
                            leftSection={<IconUser size={16}/>} 
                            onClick={() => navigate('/profile')}
                            rightSection={renderBadge()}
                        >
                            Профиль
                        </Menu.Item>
                        
                        {/* Show "Buy Premium" ONLY if Free */}
                        {user?.status === 'free' && (
                            <Menu.Item 
                                leftSection={<IconPremiumRights size={16}/>} 
                                color="orange"
                                style={{ fontWeight: 600 }}
                                onClick={() => navigate('/payment')}
                            >
                                Купить Premium
                            </Menu.Item>
                        )}

                        <Menu.Divider />
                        <Menu.Item 
                            color="red" 
                            leftSection={<IconLogout size={16}/>}
                            onClick={handleLogout}
                        >
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
            <Group mb="md" onClick={() => { navigate('/profile'); close(); }} style={{ cursor: 'pointer' }}>
                <Avatar color="blue" radius="xl" size="md">
                    {user?.login?.slice(0, 2).toUpperCase()}
                </Avatar>
                <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>{user?.login}</Text>
                    {user?.status === 'lifetime' ? (
                        <Text size="xs" c="orange" fw={700}>Lifetime Support</Text>
                    ) : user?.status === 'premium' ? (
                        <Text size="xs" c="blue" fw={700}>Premium Plan</Text>
                    ) : (
                        <Text size="xs" c="dimmed">Free Plan</Text>
                    )}
                </div>
            </Group>
            
            <NavItem to="/decks" label="Колоды" icon={IconCards} />
            <NavItem to="/word-sets" label="Библиотека" icon={IconLibrary} />
            <NavItem to="/schedules" label="Расписания" icon={IconClock} />
            
            <div style={{ height: 1, background: '#eee', margin: '10px 0' }} />
            
            <Button color="red" variant="subtle" leftSection={<IconLogout size={18}/>} onClick={handleLogout}>
                Выйти
            </Button>
         </Stack>
      </Drawer>

      <AppShell.Main pt="md" pb="xl" px={{ base: 0, sm: 'md' }}>
        <Outlet /> 
      </AppShell.Main>
    </AppShell>
  );
};