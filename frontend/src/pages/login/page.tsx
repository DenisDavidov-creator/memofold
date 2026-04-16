import {
    Anchor,
    Box,
    Button,
    Container,
    Divider,
    Paper,
    PasswordInput,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/api';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Заполните все поля');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const data = await login({ email, password });
            localStorage.setItem('accessToken', data.accessToken);
            notifications.show({
                title: 'Добро пожаловать!',
                message: 'Вы успешно вошли в аккаунт',
                color: 'teal',
            });
            navigate('/decks');
        } catch (err) {
            setError('Неверный email или пароль');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleLogin();
    };

    return (
        <Box
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--mantine-color-body)',
            }}
        >
            <Container size={420} w="100%">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Text
                        ta="center"
                        fw={800}
                        fz={28}
                        mb={4}
                        style={{ letterSpacing: -0.5 }}
                    >
                        <Text span c="cyan" inherit>Memo</Text>fold
                    </Text>

                    <Title ta="center" order={2} fw={700} mb={6}>
                        С возвращением
                    </Title>
                    <Text c="dimmed" size="sm" ta="center" mb="xl">
                        Войдите, чтобы продолжить тренировку
                    </Text>

                    <Paper withBorder shadow="sm" p="xl" radius="xl">
                        <TextInput
                            label="Email"
                            placeholder="ваш@email.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            error={error && !email ? ' ' : undefined}
                            size="md"
                        />
                        <PasswordInput
                            label="Пароль"
                            placeholder="Ваш пароль"
                            required
                            mt="md"
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                            onKeyDown={handleKeyDown}
                            error={error && !password ? ' ' : undefined}
                            size="md"
                        />

                        {error && (
                            <Text c="red" size="sm" mt="sm" ta="center">
                                {error}
                            </Text>
                        )}

                        <Button
                            fullWidth
                            mt="xl"
                            size="md"
                            radius="xl"
                            onClick={handleLogin}
                            loading={loading}
                        >
                            Войти
                        </Button>

                        <Divider my="lg" label="или" labelPosition="center" />

                        <Text ta="center" size="sm">
                            Нет аккаунта?{' '}
                            <Anchor fw={600} onClick={() => navigate('/register')}>
                                Зарегистрироваться
                            </Anchor>
                        </Text>
                    </Paper>
                </motion.div>
            </Container>
        </Box>
    );
};

export default LoginPage;
