import {
    Anchor,
    Box,
    Button,
    Container,
    Divider,
    Modal,
    Paper,
    PasswordInput,
    Text,
    TextInput,
    Title,
    ThemeIcon,
    Stack,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../features/auth/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [loginVal, setLoginVal] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');

    const [error, setError] = useState('');
    const [successModalOpened, setSuccessModalOpened] = useState(false);

    const handleRegister = async () => {
        setError('');

        if (!email || !loginVal || !password || !repeatPassword) {
            setError('Пожалуйста, заполните все поля');
            return;
        }

        if (password !== repeatPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            const data = await register({ email, login: loginVal, password });

            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
                navigate('/');
            } else {
                setSuccessModalOpened(true);
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                'Ошибка при регистрации. Возможно, email или логин уже заняты.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccessModalOpened(false);
        navigate('/login');
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
                        Добро пожаловать
                    </Title>
                    <Text c="dimmed" size="sm" ta="center" mb="xl">
                        Создайте аккаунт, чтобы начать обучение
                    </Text>

                    <Paper withBorder shadow="sm" p="xl" radius="xl">
                        <TextInput
                            label="Email"
                            placeholder="student@university.ru"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.currentTarget.value)}
                            size="md"
                        />

                        <TextInput
                            label="Логин"
                            placeholder="ivan_ivanov"
                            required
                            mt="md"
                            value={loginVal}
                            onChange={(e) => setLoginVal(e.currentTarget.value)}
                            size="md"
                        />

                        <PasswordInput
                            label="Пароль"
                            placeholder="Придумайте надежный пароль"
                            required
                            mt="md"
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                            size="md"
                        />

                        <PasswordInput
                            label="Повторите пароль"
                            placeholder="Введите пароль ещё раз"
                            required
                            mt="md"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.currentTarget.value)}
                            error={error === 'Пароли не совпадают' ? 'Пароли не совпадают' : undefined}
                            size="md"
                        />

                        {error && error !== 'Пароли не совпадают' && (
                            <Text c="red" size="sm" ta="center" mt="md">
                                {error}
                            </Text>
                        )}

                        <Button
                            fullWidth
                            mt="xl"
                            size="md"
                            radius="xl"
                            onClick={handleRegister}
                            loading={loading}
                        >
                            Зарегистрироваться
                        </Button>

                        <Divider my="lg" label="или" labelPosition="center" />

                        <Text ta="center" size="sm">
                            Уже есть аккаунт?{' '}
                            <Anchor fw={600} component="button" onClick={() => navigate('/login')}>
                                Войти
                            </Anchor>
                        </Text>
                    </Paper>
                </motion.div>
            </Container>

            <Modal
                opened={successModalOpened}
                onClose={handleCloseSuccess}
                title="Регистрация успешна"
                centered
                withCloseButton={false}
                radius="xl"
            >
                <Stack align="center" py="md">
                    <ThemeIcon size={64} radius="xl" color="teal" variant="light">
                        <IconCheck size={32} />
                    </ThemeIcon>
                    <Text ta="center" size="md" fw={500}>
                        Аккаунт успешно создан!
                    </Text>
                    <Text ta="center" size="sm" c="dimmed">
                        Теперь вы можете войти, используя свои учетные данные.
                    </Text>
                    <Button fullWidth radius="xl" mt="sm" onClick={handleCloseSuccess}>
                        Перейти к входу
                    </Button>
                </Stack>
            </Modal>
        </Box>
    );
};

export default RegisterPage;
