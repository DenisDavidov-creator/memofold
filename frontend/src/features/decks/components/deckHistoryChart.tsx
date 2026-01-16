import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Text, Group } from '@mantine/core';
import type { HistoryItem } from '../types';


export const DeckHistoryChart = ({ data }: { data: HistoryItem[] }) => {
  if (!data || data.length < 2) return null; // Не рисуем, если данных мало

  // Форматируем данные для графика
  const chartData = data.map(item => ({
    date: new Date(item.reviewDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    accuracy: item.accuracy
  }));

  return (
    <Paper withBorder p="md" radius="md" mb="xl">
      <Text size="sm" fw={500} mb="lg">История успеваемости</Text>
      <div style={{ height: 200, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#228be6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#228be6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip 
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value}%`, 'Точность']}
            />
            <Area 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#228be6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAccuracy)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Paper>
  );
};