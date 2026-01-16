import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Title, Button, Card, Text, Badge, Group, SimpleGrid, 
  LoadingOverlay, Container, ThemeIcon, Stack, Divider, Tabs, 
  Alert
} from '@mantine/core';
import { IconPlus, IconCards, IconClock, IconRepeat, IconArchive, IconPlayerPlay, IconCalendarTime, IconPremiumRights } from '@tabler/icons-react';
import type { Deck } from '../../features/decks/types';
import { getDecks } from '../../features/decks/api';
import { jwtDecode } from 'jwt-decode';

interface UserState {
    login: string;
    status: 'free' | 'premium' | 'lifetime'; // New type
}

const DeckListPage = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('active');
  const [isPremium, setIsPremium] = useState("");

  useEffect(() => {
    setLoading(true);
    const isArchived = activeTab === 'archive';
    
    const token = localStorage.getItem('accessToken');
    if (token) {
        try {
            const decoded: any = jwtDecode(token);
            // Map old boolean is_premium to new status if backend not updated yet
            let status: UserState['status'] = 'free';
            if (decoded.status) status = decoded.status;
            else if (decoded.isPremium) status = 'premium'; // Fallback

            setIsPremium(status);
        } catch (e) {}
    }

    getDecks(isArchived)
      .then((data) => setDecks(data || []))
      .catch((err) => { console.error(err); setDecks([]); })
      .finally(() => setLoading(false));
      
  }, [activeTab]);

  const now = new Date();

  // Хелпер: Разница времени
  const getDiffMs = (dateStr?: string) => {
    if (!dateStr) return -1;
    return new Date(dateStr).getTime() - now.getTime();
  };

  // Хелпер: Красивое время и цвета
  const getTimeLabel = (dateStr?: string) => {
    const diffMs = getDiffMs(dateStr);
    
    // 1. Готово (Время вышло) -> Мягкий зеленый
    if (diffMs <= 0) return { text: 'Готово', color: 'teal', variant: 'light' };
    
    // 2. Меньше часа -> Оранжевый
    const diffMins = Math.ceil(diffMs / (60 * 1000));
    if (diffMins < 60) return { text: `${diffMins} мин`, color: 'orange', variant: 'light' };

    // 3. Часы -> Синий
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    if (diffHours < 24) return { text: `Через ${diffHours} ч`, color: 'blue', variant: 'light' };

    // 4. Дни -> Серый контур
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return { text: 'Завтра', color: 'gray', variant: 'outline' };
    if (diffDays < 7) return { text: `Через ${diffDays} дн`, color: 'gray', variant: 'outline' };

    return { 
        text: new Date(dateStr!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), 
        color: 'gray',
        variant: 'outline'
    };
  };

  const ONE_HOUR_MS = 60 * 60 * 1000;
  const isArchiveTab = activeTab === 'archive';

  // Фильтрация
  const dueDecks = isArchiveTab ? [] : decks.filter(d => getDiffMs(d.nextReviewDate) <= ONE_HOUR_MS);
  const futureDecks = isArchiveTab ? decks : decks.filter(d => getDiffMs(d.nextReviewDate) > ONE_HOUR_MS);

  // Сортировка
  dueDecks.sort((a, b) => getDiffMs(a.nextReviewDate) - getDiffMs(b.nextReviewDate));
  futureDecks.sort((a, b) => getDiffMs(a.nextReviewDate) - getDiffMs(b.nextReviewDate));


  // --- КОМПОНЕНТ КАРТОЧКИ ---
  const DeckCard = ({ deck, isTopList }: { deck: Deck, isTopList: boolean }) => {
    const { text, color, variant } = getTimeLabel(deck.nextReviewDate);
    
    return (
      <Card 
          key={deck.id} 
          shadow="sm" padding="lg" radius="md" withBorder
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onClick={() => navigate(`/decks/${deck.id}`)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
      >
          {/* ВЕРХ: Имя + Статус */}
          <Group justify="space-between" mb="xs" align="flex-start">
              <Text fw={600} size="lg" lineClamp={2} style={{ flex: 1 }}>
                  {deck.name}
              </Text>
              
              {isArchiveTab ? (
                  <Badge color="gray" variant="outline" leftSection={<IconArchive size={12}/>}>Архив</Badge>
              ) : (
                  <Badge color={color} variant={variant} leftSection={getDiffMs(deck.nextReviewDate) > 0 && <IconClock size={12}/>}>
                      {text}
                  </Badge>
              )}
          </Group>

          {/* СЕРЕДИНА: Инфо */}
          <Group gap="xs" mb="lg">
               <Badge variant="outline" color="gray" size="xs">
                  {deck.cardsCount || 0} карт
               </Badge>
               
               {/* УРОВЕНЬ (Вернул старый стиль) */}
               {!isArchiveTab && (deck.currentLevel || 0) > 0 && (
                   <Badge variant="outline" color="orange" size="xs" leftSection={<IconRepeat size={10}/>}>
                       Lv {deck.currentLevel}
                   </Badge>
               )}
          </Group>

          {/* НИЗ: Кнопка */}
          <Button 
              fullWidth radius="md" size="sm"
              // Если в Топ-списке (Готовы или Скоро) -> Синяя кнопка "Начать"
              // Иначе -> Серая кнопка "Открыть"
              variant={!isArchiveTab && isTopList ? "filled" : "light"} 
              color={!isArchiveTab && isTopList ? "blue" : "gray"}
          >
              {isArchiveTab ? 'Просмотр' : (isTopList ? 'Начать повторение' : 'Открыть')}
          </Button>
      </Card>
    );
  };

  if (loading) return <LoadingOverlay visible={true} />;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Мои колоды</Title>
        <Button onClick={() => navigate('/deck-builder')} leftSection={<IconPlus size={18}/>}> 
          Новая колода
        </Button>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="active" leftSection={<IconPlayerPlay size={16}/>}>Обучение</Tabs.Tab>
          <Tabs.Tab value="archive" leftSection={<IconArchive size={16}/>}>Архив</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {decks.length === 0 ? (
         <Stack align="center" py={50}>
            <Text c="dimmed">{isArchiveTab ? 'Архив пуст' : 'Активных колод нет'}</Text>
            {!isArchiveTab && <Button mt="md" onClick={() => navigate('/deck-builder')}>Создать первую</Button>}
         </Stack>
      ) : (
         <>
            {/* СЕКЦИЯ 1: ГОТОВЫ К ПОВТОРЕНИЮ (< 1 часа) */}
            {activeTab === 'active' && dueDecks.length > 0 && (
                <div style={{ marginBottom: 50 }}>
                    <Title order={4} mb="md" c="blue">Готовы к повторению</Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {dueDecks.map(deck => <DeckCard key={deck.id} deck={deck} isTopList={true} />)}
                    </SimpleGrid>
                </div>
            )}

            {/* СЕКЦИЯ 2: ОЖИДАЮТ */}
            {(futureDecks.length > 0 || activeTab === 'archive') && (
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
            {isPremium === "free" && (
                <Alert 
                    variant="light" color="blue" title="Хотите больше?" mt="xl" 
                    icon={<IconPremiumRights/>}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/payment')}
                >
                    Снимите ограничения на создание колод. <b>Подробнее →</b>
                </Alert>
            )}
         </>
      )}
      
    </Container>
  );
};

export default DeckListPage;