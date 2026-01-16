import { Anchor, Button, Container, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../../features/auth/api";

const RegisterPage = () => {

    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    
    const [email, setEmail] = useState('')
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')

    const handleRegister = async () => {
        if (!email || !login || !password) return

        setLoading(true)
        try {
            const data = await register({email, login, password})

        if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken)
        } else {
            alert('Регистрация успешна. Теперь войдите')
            navigate('/login')
        }
        } catch (err) {
            alert('Ошибка при регистрации')
        } finally {
            setLoading(false)
        }
    }

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
        />
        
        <TextInput 
          label="Логин (Имя пользователя)" 
          placeholder="ivan_ivanov" 
          required 
          mt="md"
          value={login}
          onChange={(e) => setLogin(e.currentTarget.value)}
        />
        
        <PasswordInput 
          label="Пароль" 
          placeholder="Придумайте надежный пароль" 
          required 
          mt="md" 
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        
        <Button fullWidth mt="xl" onClick={handleRegister} loading={loading}>
          Зарегистрироваться
        </Button>
      </Paper>

      <Text ta="center" mt="md">
        Уже есть аккаунт?{' '}
        <Anchor w={700} onClick={() => navigate('/login')}>
          Войти
        </Anchor>
      </Text>
    </Container>
  );
};

export default RegisterPage