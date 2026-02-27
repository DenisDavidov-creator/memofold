import {
    Badge,
    Box,
    Button,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import {
    IconBrain, IconCards, IconChartBar, IconChevronRight
} from '@tabler/icons-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewSession } from '../../app/providers/ReviewProvider';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setSessionActive } = useReviewSession();

  useEffect(() => {
      // Сбрасываем флаг сессии при заходе на лендинг
      setSessionActive(false);

      const token = localStorage.getItem('accessToken');
      if (token) {
          navigate('/decks');
      }
  }, [navigate, setSessionActive]);

  return (
    <Box>
      {/* 1. HERO SECTION */}
      <Container size="md" py={{ base: 60, md: 120 }}>
        <Stack align="center" gap="xl">
            
            <Title 
                order={1} 
                style={{ lineHeight: 1.1, fontWeight: 900, textAlign: 'center' }}
                fz={{ base: 42, xs: 50, md: 72 }}
            >
                Запоминайте слова <br/>
                <Text span c="blue" inherit>навсегда</Text>
            </Title>
            
            <Text c="dimmed" size="lg" ta="center" maw={600} mx="auto">
                Минималистичный сервис для изучения английского языка. 
                Метод «Гармошка» и умные интервальные повторения.
            </Text>

            <Group justify="center" mt="lg" w="100%">
                <Button 
                    size="xl" 
                    radius="xl" 
                    onClick={() => navigate('/register')} 
                    rightSection={<IconChevronRight size={20}/>}
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
        </Stack>
      </Container>

      {/* 2. FEATURES */}
      <Box style={{ backgroundColor: 'var(--mantine-color-default-hover)' }} py={{ base: 60, md: 100 }}>
          <Container size="lg">
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
                  <Feature 
                      icon={IconCards} 
                      title="Активное вспоминание" 
                      description="Пишите перевод сами, а не выбирайте из вариантов. Это заставляет мозг работать и формирует нейронные связи."
                  />
                  <Feature 
                      icon={IconBrain} 
                      title="Умные интервалы" 
                      description="Система сама скажет, когда пора повторить слово, чтобы оно попало в долгосрочную память."
                  />
                  <Feature 
                      icon={IconChartBar} 
                      title="Работа над ошибками" 
                      description="Сложные слова автоматически собираются в отдельный список для дополнительной проработки."
                  />
              </SimpleGrid>
          </Container>
      </Box>

      {/* 3. FOOTER */}
      <Box py="xl" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Container size="lg">
              <Group justify="space-between" align="center">
                  <Group gap="xs">
                      <Text fw={800} size="lg" c="blue" style={{ letterSpacing: -0.5 }}>Memofold</Text>
                      <Badge variant="outline" color="gray" size="xs">v1.0</Badge>
                  </Group>
                  <Text size="xs" c="dimmed">© 2026 Denis Davidov</Text>
              </Group>
          </Container>
      </Box>
    </Box>
  );
};

// Компонент фичи
const Feature = ({ icon: Icon, title, description }: any) => (
    <Paper p="lg" radius="md" withBorder shadow="sm">
        <ThemeIcon size={48} radius="md" variant="light" color="blue" mb="md">
            <Icon size={24} />
        </ThemeIcon>
        <Text fz="lg" fw={700} mb="xs">{title}</Text>
        <Text c="dimmed" lh={1.5} size="sm">{description}</Text>
    </Paper>
);

export default LandingPage;