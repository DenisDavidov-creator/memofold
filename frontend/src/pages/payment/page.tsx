import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Button, Group, Paper, Text, 
  SimpleGrid, List, ThemeIcon, Modal, Stack, SegmentedControl, Badge, TextInput, LoadingOverlay 
} from '@mantine/core';
import { IconCheck, IconCreditCard, IconX, IconCalendar, IconCrown, IconInfinity } from '@tabler/icons-react';
import type { FullProfile } from '../../features/user/types';
import { getFullProfile } from '../../features/user/api';
import { apiClient } from '../../shared/api/client';


const PaymentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Загрузка оплаты
  const [pageLoading, setPageLoading] = useState(true); // Загрузка профиля
  const [modalOpen, setModalOpen] = useState(false);
  
  // Данные пользователя для проверки текущего плана
  const [user, setUser] = useState<FullProfile['user'] | null>(null);
  
  const [billing, setBilling] = useState('month'); 
  const [selectedPlan, setSelectedPlan] = useState<{ id: string, price: string } | null>(null);

  // 1. Загружаем профиль, чтобы узнать текущий статус
  useEffect(() => {
    getFullProfile()
      .then(data => setUser(data.user))
      .catch(console.error)
      .finally(() => setPageLoading(false));
  }, []);

  const handleBuy = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
        // Эмуляция задержки банка
        await new Promise(r => setTimeout(r, 1500));
        
        // Отправка на бэк
        await apiClient.post('payment/mock', { json: { planId: selectedPlan.id } });
        
        setModalOpen(false);
        alert('🎉 Оплата прошла успешно! Спасибо за поддержку.');
        navigate('/profile');
        window.location.reload(); 
    } catch (e) {
        alert('Ошибка оплаты');
    } finally {
        setLoading(false);
    }
  };

  const openPaymentModal = (planId: string, price: string) => {
      setSelectedPlan({ id: planId, price });
      setModalOpen(true);
  };

  const Feature = ({ children }: { children: React.ReactNode }) => (
      <List.Item icon={<ThemeIcon color="teal" size={20} radius="xl"><IconCheck size={12} /></ThemeIcon>}>{children}</List.Item>
  );
  const Limit = ({ children }: { children: React.ReactNode }) => (
      <List.Item icon={<ThemeIcon color="red" size={20} radius="xl" variant="light"><IconX size={12} /></ThemeIcon>} c="dimmed">{children}</List.Item>
  );

  if (pageLoading) return <LoadingOverlay visible={true} />;

  // --- ЛОГИКА СТАТУСОВ ---
  const isFree = user?.status === 'free';
  const isPremium = user?.status === 'premium';
  const isLifetime = user?.status === 'lifetime';

  return (
    <Container size="lg" py={60}>
      <Stack align="center" mb={50} gap="xs">
          <Badge variant="light" size="lg" color="blue">Premium Доступ</Badge>
          <Title order={1} ta="center">Снимите ограничения</Title>
          <Text c="dimmed" ta="center" maw={500}>
              Учите язык эффективно без лимитов на создание колод и количество слов.
          </Text>
          
          {/* Переключатель Месяц/Год */}
          <SegmentedControl 
             mt="lg" size="md" value={billing} onChange={setBilling}
             data={[
                 { label: 'Ежемесячно', value: 'month' },
                 { label: 'Ежегодно (-30%)', value: 'year' },
             ]}
          />
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb={40}>
          
          {/* 1. БЕСПЛАТНЫЙ ПЛАН */}
          <Paper withBorder p="xl" radius="md">
              <Text ta="center" fw={700} mb="xs" c="dimmed">СТАРТ</Text>
              <Text ta="center" size="2rem" fw={700} mb="xl">0 ₽</Text>
              
              <List spacing="md" size="sm" center>
                  <Feature>Интервальное повторение</Feature>
                  <Feature>Доступ к библиотеке</Feature>
                  <Limit>Максимум 7 слов в колоде</Limit>
                  <Limit>1 новая колода в день</Limit>
              </List>
              
              <Button fullWidth mt={30} variant="default" disabled>
                  {isFree ? 'Ваш текущий план' : 'Базовый'}
              </Button>
          </Paper>

          {/* 2. PREMIUM (Подписка) */}
        <Paper 
            withBorder p="xl" radius="md" shadow="md" 
            style={{ borderColor: '#228be6', borderWidth: 2, position: 'relative' }}
          >
              {isPremium && (
                  <Badge color="blue" style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }}>
                      АКТИВЕН
                  </Badge>
              )}
              
              <Text ta="center" c="blue" fw={700} mb="xs">PREMIUM</Text>
              <Text ta="center" size="3rem" fw={700} lh={1}>
                  {billing === 'month' ? '199 ₽' : '1490 ₽'}
              </Text>
              <Text ta="center" c="dimmed" size="sm" mb="xl">
                  {billing === 'month' ? '/ месяц' : '/ год'}
              </Text>
              
              <List spacing="md" size="sm" center>
                  <Feature><b>Безлимитные</b> колоды</Feature>
                  <Feature><b>Любое</b> количество слов</Feature>
                  <Feature>Авто-сборка "Сложных"</Feature>
                  <Feature>Приоритетная поддержка</Feature>
              </List>
              
              <Button 
                  fullWidth mt={30} size="md" color="blue"
                  // Разрешаем нажимать, даже если isPremium (для продления)
                  disabled={isLifetime}
                  onClick={() => openPaymentModal(billing, billing === 'month' ? '199 ₽' : '1490 ₽')}
              >
                  {isLifetime ? 'Включено' : isPremium ? 'Продлить' : 'Оформить'}
              </Button>
          </Paper>

          {/* 3. LIFETIME (Навсегда) */}
          <Paper 
            withBorder p="xl" radius="md" 
            bg={isLifetime ? "orange.0" : "gray.0"}
            style={isLifetime ? { borderColor: 'orange' } : undefined}
          >
              <Text ta="center" fw={700} mb="xs" c="orange">НАВСЕГДА</Text>
              <Text ta="center" size="2rem" fw={700} mb="xl">2990 ₽</Text>
              
              <List spacing="md" size="sm" center>
                  <Feature>Все функции Premium</Feature>
                  <Feature>Один платеж</Feature>
                  <Feature><b>Вечный</b> доступ</Feature>
                  <Feature>Статус "Меценат"</Feature>
              </List>
              
              <Button 
                  fullWidth mt={30} 
                  variant={isLifetime ? "filled" : "outline"} 
                  color="orange" 
                  // Отключаем ТОЛЬКО если уже куплен Лайфтайм. 
                  // Если просто Премиум - кнопку оставляем активной (апгрейд).
                  disabled={isLifetime}
                  onClick={() => openPaymentModal('lifetime', '2990 ₽')}
                  leftSection={isLifetime ? <IconCrown size={18}/> : <IconInfinity size={18}/>}
              >
                  {isLifetime ? 'Уже куплено' : 'Купить навсегда'}
              </Button>
          </Paper>
      </SimpleGrid>

      <Text ta="center" size="xs" c="dimmed">
          Безопасная оплата через ЮKassa (Эмуляция).
          {isPremium && " Ваша подписка активна."}
          {isLifetime && " Вы — почетный меценат проекта!"}
      </Text>

      {/* МОДАЛКА ОПЛАТЫ */}
      <Modal 
          opened={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title={`Оплата: ${selectedPlan?.price}`} 
          centered
      >
          <Stack>
              <TextInput label="Номер карты" placeholder="0000 0000 0000 0000" leftSection={<IconCreditCard size={16}/>} />
              <Group grow>
                  <TextInput label="Срок действия" placeholder="MM/YY" leftSection={<IconCalendar size={16}/>} />
                  <TextInput label="CVC/CVV" placeholder="123" type="password" maxLength={3} />
              </Group>
              <Button onClick={handleBuy} loading={loading} fullWidth mt="md" color="green" size="lg">
                  Оплатить {selectedPlan?.price}
              </Button>
          </Stack>
      </Modal>

    </Container>
  );
};

export default PaymentPage;