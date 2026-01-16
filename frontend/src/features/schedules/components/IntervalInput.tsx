import { useState, useEffect } from 'react';
import { Group, NumberInput, Select } from '@mantine/core';


interface Props {
  valueMinutes: number;
  onChange: (minutes: number) => void;
}

const UNITS = [
    {value: 'min', label: 'Минуты'},
    {value: 'hour', label: 'Часов'},
    {value: 'day', label: 'Дней'}
]

export const IntervalInput = ({ valueMinutes, onChange }: Props) => {
  // Локальный стейт для отображения (например: 5 часов)
  const [amount, setAmount] = useState<number | string>(0);
  const [unit, setUnit] = useState<string>('min');

  // При загрузке конвертируем минуты обратно в красивый вид (опционально)
  useEffect(() => {
    if (valueMinutes >= 1440 && valueMinutes % 1440 === 0) {
      setAmount(valueMinutes / 1440);
      setUnit('day');
    } else if (valueMinutes >= 60 && valueMinutes % 60 === 0) {
      setAmount(valueMinutes / 60);
      setUnit('hour');
    } else {
      setAmount(valueMinutes);
      setUnit('min');
    }
  }, []);

  // При изменении инпутов пересчитываем в минуты и отдаем родителю
  const handleChange = (newAmount: number | string, newUnit: string) => {
    setAmount(newAmount);
    setUnit(newUnit);

    const val = Number(newAmount) || 0;
    let totalMinutes = val;

    if (newUnit === 'hour') totalMinutes = val * 60;
    if (newUnit === 'day') totalMinutes = val * 1440; // 60 * 24

    onChange(totalMinutes);
  };

  return (
    <Group gap="xs" grow>
      <NumberInput 
        value={amount} 
        onChange={(val) => handleChange(val, unit)} 
        min={1} 
        placeholder="Число"
      />
      <Select 
        value={unit} 
        onChange={(val) => handleChange(amount, val || 'min')} 
        data={UNITS} 
        allowDeselect={false}
      />
    </Group>
  );
};