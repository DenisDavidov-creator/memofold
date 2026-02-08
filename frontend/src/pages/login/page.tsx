import { Anchor, Button, Container, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const data = await login({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      navigate('/decks');
    } catch (err) {
      alert('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Container size={420} my={60}>
      <Title ta="center" order={2} style={{ fontFamily: 'Greycliff CF, sans-serif' }}>
        С возвращением!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Войдите, чтобы продолжить тренировку
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput 
          label="Email" 
          placeholder="ваш@email.com" 
          required 
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <PasswordInput 
          label="Пароль" 
          placeholder="Ваш пароль" 
          required 
          mt="md" 
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        
        <Button fullWidth mt="xl" onClick={handleLogin} loading={loading}>
          Войти
        </Button>
      </Paper>

      <Text ta="center" mt="md">
        Нет аккаунта?{' '}
        <Anchor w={700} onClick={() => navigate('/register')}>
          Зарегистрироваться
        </Anchor>
      </Text>
    </Container>
  );
};

export default LoginPage;