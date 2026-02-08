import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Button, Group, Paper, Text, 
  SimpleGrid, List, ThemeIcon, Modal, Stack, SegmentedControl, Badge, TextInput, LoadingOverlay 
} from '@mantine/core';
import { 
  IconCheck, IconCreditCard, IconX, IconCalendar, 
  IconCrown, IconInfinity, IconAlertCircle 
} from '@tabler/icons-react';
import type { FullProfile } from '../../features/user/types';
import { getFullProfile } from '../../features/user/api';
import { apiClient } from '../../shared/api/client';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // Загрузка оплаты
  const [pageLoading, setPageLoading] = useState(true); // Загрузка профиля
  
  // Modal States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  
  // Данные пользователя
  const [user, setUser] = useState<FullProfile['user'] | null>(null);
  
  const [billing, setBilling] = useState('month'); 
  const [selectedPlan, setSelectedPlan] = useState<{ id: string, price: string } | null>(null);

  // 1. Загружаем профиль
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
        
        // Close payment modal first
        setPaymentModalOpen(false);
        // Open Success Modal
        setSuccessModalOpen(true);

    } catch (e) {
        setPaymentModalOpen(false);
        setErrorModalOpen(true);
    } finally {
        setLoading(false);
    }
  };

  const handleSuccessClose = () => {
      setSuccessModalOpen(false);
      navigate('/profile');
      window.location.reload(); // Reload to update user status from Free to Premium
  };

  const openPaymentModal = (planId: string, price: string) => {
      setSelectedPlan({ id: planId, price });
      setPaymentModalOpen(true);
  };

  const Feature = ({ children }: { children: React.ReactNode }) => (
      <List.Item icon={<ThemeIcon color="teal" size={20} radius="xl"><IconCheck size={12} /></ThemeIcon>}>{children}</List.Item>
  );
  const Limit = ({ children }: { children: React.ReactNode }) => (
      <List.Item icon={<ThemeIcon color="red" size={20} radius="xl" variant="light"><IconX size={12} /></ThemeIcon>} c="dimmed">{children}</List.Item>
  );

  if (pageLoading) return <LoadingOverlay visible={true} />;

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
          
          <SegmentedControl 
             mt="lg" size="md" value={billing} onChange={setBilling}
             data={[
                 { label: 'Ежемесячно', value: 'month' },
                 { label: 'Ежегодно (-30%)', value: 'year' },
             ]}
          />
      </Stack>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg" mb={40}>
          
          {/* 1. FREE */}
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

          {/* 2. PREMIUM */}
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
                  disabled={isLifetime}
                  onClick={() => openPaymentModal(billing, billing === 'month' ? '199 ₽' : '1490 ₽')}
              >
                  {isLifetime ? 'Включено' : isPremium ? 'Продлить' : 'Оформить'}
              </Button>
          </Paper>

          {/* 3. LIFETIME */}
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

      {/* 1. PAYMENT MODAL */}
      <Modal 
          opened={paymentModalOpen} 
          onClose={() => setPaymentModalOpen(false)} 
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

      {/* 2. SUCCESS MODAL */}
      <Modal 
          opened={successModalOpen} 
          onClose={handleSuccessClose} 
          title="Успешно!" 
          centered
          withCloseButton={false}
      >
          <Stack align="center" gap="md">
             <ThemeIcon size={80} radius="xl" color="green" variant="light">
                 <IconCheck size={50} />
             </ThemeIcon>
             <Title order={3} ta="center">Оплата прошла успешно!</Title>
             <Text ta="center" c="dimmed">
                 Спасибо за поддержку. Теперь вам доступны все возможности Premium.
             </Text>
             <Button fullWidth onClick={handleSuccessClose} mt="sm">
                 Отлично!
             </Button>
          </Stack>
      </Modal>

      {/* 3. ERROR MODAL */}
      <Modal 
          opened={errorModalOpen} 
          onClose={() => setErrorModalOpen(false)} 
          title="Ошибка транзакции" 
          centered
      >
          <Stack align="center">
             <ThemeIcon size={60} radius="xl" color="red" variant="light">
                 <IconAlertCircle size={40} />
             </ThemeIcon>
             <Text ta="center">
                 Не удалось провести оплату. Пожалуйста, проверьте данные карты или попробуйте позже.
             </Text>
             <Button variant="default" onClick={() => setErrorModalOpen(false)}>
                 Закрыть
             </Button>
          </Stack>
      </Modal>

    </Container>
  );
};

export default PaymentPage;