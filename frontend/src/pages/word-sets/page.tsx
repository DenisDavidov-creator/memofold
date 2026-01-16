import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Button, Group, TextInput, Modal, 
  SimpleGrid, Card, Text, Badge, LoadingOverlay, Tabs, ThemeIcon 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFolder, IconPlus, IconWorld, IconUser } from '@tabler/icons-react';
import type { WordSet } from '../../features/word-sets/types';
import { createWordSet, getWordSets } from '../../features/word-sets/api';

const WordSetsPage = () => {
  const navigate = useNavigate();
  
  const [sets, setSets] = useState<WordSet[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('my'); 
  const [loading, setLoading] = useState(true);
  
  const [opened, { open, close }] = useDisclosure(false);
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setLoading(true);
    getWordSets(activeTab as 'my' | 'public')
      .then((data) => {
        const list = data || [];
        
        // СОРТИРОВКА: Системные (isDefault) поднимаем вверх
        list.sort((a: any, b: any) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return 0;
        });
        
        setSets(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleCreate = async () => {
    if (!newName) return;
    setIsCreating(true);
    try {
      const newSet = await createWordSet({ name: newName, isPublic: false });
      // Добавляем новый набор в конец списка (так как он точно не системный)
      setSets((prev) => [...prev, newSet]); 
      setNewName('');
      close();
    } catch (e) {
      alert('Ошибка создания');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return <LoadingOverlay visible={true} />;

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title order={2}>Библиотека</Title>
        {activeTab === 'my' && (
            <Button leftSection={<IconPlus size={18}/>} onClick={open}>Создать набор</Button>
        )}
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
        <Tabs.List>
          <Tabs.Tab value="my" leftSection={<IconUser size={16}/>}>Мои наборы</Tabs.Tab>
          <Tabs.Tab value="public" leftSection={<IconWorld size={16}/>}>Публичные</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {sets.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">Список пуст.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {sets.map((set) => {
             const isSystem = (set as any).isDefault;

             return (
                <Card 
                  key={set.id} 
                  shadow="sm" 
                  padding="lg" 
                  radius="md" 
                  withBorder
                  style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                  onClick={() => navigate(`/word-sets/${set.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                >
                  <Group justify="space-between" mb="xs">
                     <ThemeIcon 
                        color={activeTab === 'my' ? 'orange' : 'blue'} 
                        variant="light" size="lg" radius="md"
                     >
                        {activeTab === 'my' ? <IconFolder size={20} /> : <IconWorld size={20} />}
                     </ThemeIcon>
                  </Group>
    
                  <Text fw={600} size="lg" mt="sm" truncate>{set.name}</Text>
                  
                  <Group mt="md" gap="xs">
                     <Badge variant="dot" color="gray">{set.cardsCount || 0} слов</Badge>
                     {/* Бейджик оставил, чтобы отличать системные, но стиль спокойный */}
                     {isSystem && <Badge color="orange" variant="light" size="xs">System</Badge>}
                     {activeTab === 'public' && <Badge variant="outline" color="gray">#{set.userId}</Badge>}
                  </Group>
                </Card>
             );
          })}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={close} title="Новый набор слов">
        <TextInput 
          label="Название" 
          placeholder="Например: Топ 100 глаголов" 
          data-autofocus 
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
        />
        <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Отмена</Button>
            <Button onClick={handleCreate} loading={isCreating}>Создать</Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default WordSetsPage;