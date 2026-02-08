import {
    Avatar,
    Badge,
    Button,
    Container,
    Group,
    LoadingOverlay,
    Modal, // Added Modal
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // Added hook
import {
    IconActivity,
    IconCards,
    IconLogout, IconPremiumRights,
    IconSchool,
    IconStar,
    IconVocabulary
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFullProfile } from '../../features/user/api';
import type { FullProfile } from '../../features/user/types';
import { apiClient } from '../../shared/api/client';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Logout Modal State
  const [logoutOpened, { open: openLogoutModal, close: closeLogoutModal }] = useDisclosure(false);

  useEffect(() => {
    getFullProfile()
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <LoadingOverlay visible={true} />;
  
  // If error loading profile, allow direct logout without modal (usually token issue)
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
                  <Badge 
                    variant="gradient" 
                    gradient={{ from: 'yellow', to: 'orange' }} 
                    leftSection={<IconStar size={12} fill="white" />}
                  >
                      Меценат
                  </Badge>
              );
          case 'premium':
              return (
                  <Badge 
                    variant="gradient" 
                    gradient={{ from: 'blue', to: 'cyan' }} 
                    leftSection={<IconPremiumRights size={12}/>}
                  >
                      Premium
                  </Badge>
              );
          default:
              return <Badge color="gray" variant="outline">Free Plan</Badge>;
      }
  };

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="xl">Профиль</Title>

      {/* 1. USER CARD */}
      <Paper withBorder p="xl" radius="md" mb={40} shadow="sm">
        <Group align="flex-start">
           <Avatar size={80} radius={80} color="blue" variant="light">
              {user.login?.slice(0, 2).toUpperCase() || 'U'}
           </Avatar>
           <div style={{ flex: 1 }}>
              <Text size="lg" fw={700}>{user.login}</Text>
              <Text c="dimmed" size="sm">{user.email}</Text>
              
              <Group mt="sm">
                  {renderStatusBadge()}
              </Group>
           </div>
           
           {user.status === 'free' && (
               <Button variant="light" color="orange" onClick={() => navigate('/payment')}>
                   Купить Premium
               </Button>
           )}
           {user.status === 'premium' && (
               <Button variant="subtle" size="xs" onClick={() => navigate('/payment')}>
                   Продлить
               </Button>
           )}
        </Group>
      </Paper>

      {/* 2. STATISTICS */}
      <Title order={4} mb="md">Ваш прогресс</Title>
      
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mb="xl">
          <Paper withBorder p="md" radius="md">
             <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconVocabulary size={20}/>
                </ThemeIcon>
                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Слов в колодах</Text>
                    <Text fw={700} size="xl">{stats.totalWordsLearning}</Text>
                </div>
             </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
             <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                    <IconSchool size={20}/>
                </ThemeIcon>
                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Выучено</Text>
                    <Text fw={700} size="xl" c="green.7">{stats.totalWordsMastered}</Text>
                </div>
             </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
             <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="grape">
                    <IconCards size={20}/>
                </ThemeIcon>
                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Колоды</Text>
                    <Group gap={5} align="baseline">
                        <Text fw={700} size="xl">{stats.activeDecksCount}</Text>
                        <Text size="xs" c="dimmed">актив</Text>
                        <Text fw={700} size="xl" ml="sm">{stats.archivedDecksCount}</Text>
                        <Text size="xs" c="dimmed">архив</Text>
                    </Group>
                </div>
             </Group>
          </Paper>

          <Paper withBorder p="md" radius="md">
             <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                    <IconActivity size={20}/>
                </ThemeIcon>
                <div>
                    <Text c="dimmed" size="xs" tt="uppercase" fw={700}>Тренировки</Text>
                    <Text fw={700} size="xl">{stats.totalReviews}</Text>
                </div>
             </Group>
          </Paper>
      </SimpleGrid>

      {/* 3. ACTIONS */}
      <Stack gap="sm">
          {/* Updated to open modal */}
          <Button 
             variant="subtle" 
             color="red" 
             fullWidth 
             leftSection={<IconLogout size={18}/>}
             onClick={openLogoutModal}
          >
             Выйти из аккаунта
          </Button>
      </Stack>

      {/* LOGOUT CONFIRMATION MODAL */}
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
              <Button variant="default" onClick={closeLogoutModal}>
                  Отмена
              </Button>
              <Button color="red" onClick={handleLogout}>
                  Выйти
              </Button>
          </Group>
      </Modal>

    </Container>
  );
};

export default ProfilePage;