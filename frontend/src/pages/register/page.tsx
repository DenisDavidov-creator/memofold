import { Anchor, Button, Container, Group, Modal, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../features/auth/api";
import { IconCheck } from '@tabler/icons-react';

const RegisterPage = () => {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [email, setEmail] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState(''); // 1. New field state
    
    // UI State
    const [error, setError] = useState('');
    const [successModalOpened, setSuccessModalOpened] = useState(false); // 2. Modal state

    const handleRegister = async () => {
        setError('');

        // 3. Validation
        if (!email || !login || !password || !repeatPassword) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== repeatPassword) {
            setError('Пароли не совпадают');
            return;
        }


        setLoading(true);
        try {
            const data = await register({email, login, password});

            if (data.accessToken) {
                // If the backend logs the user in immediately
                localStorage.setItem('accessToken', data.accessToken);
                navigate('/'); 
            } else {
                // 4. Show Success Modal instead of alert
                setSuccessModalOpened(true);
            }
        } catch (err: any) {
            console.error(err);
            // Handle specific backend errors if needed
            setError(err.response?.data?.message || 'Ошибка при регистрации. Возможно, email или логин уже заняты.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccessModalOpened(false);
        navigate('/login');
    };

    return (
    <Container size={420} my={60}>
      <Title ta="center" order={2} style={{ fontFamily: 'Greycliff CF, sans-serif' }}>
        Добро пожаловать!
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Создайте аккаунт, чтобы начать обучение
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <TextInput 
          label="Email" 
          placeholder="student@university.ru" 
          required 
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={error && !email}
        />
        
        <TextInput 
          label="Логин (Имя пользователя)" 
          placeholder="ivan_ivanov" 
          required 
          mt="md"
          value={login}
          onChange={(e) => setLogin(e.currentTarget.value)}
          error={error && !login}
        />
        
        <PasswordInput 
          label="Пароль" 
          placeholder="Придумайте надежный пароль" 
          required 
          mt="md" 
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          error={error && !password}
        />

        {/* 5. Repeat Password Input */}
        <PasswordInput 
          label="Повторите пароль" 
          placeholder="Введите пароль еще раз" 
          required 
          mt="md" 
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.currentTarget.value)}
          error={error === 'Пароли не совпадают'}
        />
        
        {/* Error Message */}
        {error && (
            <Text c="red" size="sm" ta="center" mt="md">
                {error}
            </Text>
        )}
        
        <Button fullWidth mt="xl" onClick={handleRegister} loading={loading}>
          Зарегистрироваться
        </Button>
      </Paper>

      <Text ta="center" mt="md">
        Уже есть аккаунт?{' '}
        <Anchor component="button" type="button" onClick={() => navigate('/login')}>
          Войти
        </Anchor>
      </Text>

      {/* 6. Success Modal */}
      <Modal 
        opened={successModalOpened} 
        onClose={handleCloseSuccess} 
        title="Регистрация успешна" 
        centered
        withCloseButton={false}
      >
          <Group justify="center" mb="md">
              <IconCheck size={40} color="green" />
          </Group>
          <Text ta="center" mb="lg">
              Аккаунт успешно создан! Теперь вы можете войти, используя свои учетные данные.
          </Text>
          <Button fullWidth onClick={handleCloseSuccess}>
              Перейти к входу
          </Button>
      </Modal>

    </Container>
  );
};

export default RegisterPage;