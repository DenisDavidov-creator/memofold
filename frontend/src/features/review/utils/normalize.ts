/**
 * Нормализует строку для сравнения ответов.
 * Убирает скобки, знаки препинания, пробелы и заменяет
 * кириллические омоглифы на их латинские эквиваленты.
 */
const HOMOGLYPHS: Record<string, string> = {
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'х': 'x', 'у': 'y',
  'А': 'a', 'С': 'c', 'Е': 'e', 'О': 'o', 'Р': 'p', 'Х': 'x', 'У': 'y',
};

export const normalize = (str: string): string =>
  str
    .replace(/\s*\(.*?\)\s*/g, '')
    .toLowerCase()
    .trim()
    .split('')
    .map(char => HOMOGLYPHS[char] ?? char)
    .join('')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ');
