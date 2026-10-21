import { isEnglishName, suggestEnglishName } from './englishStudentName';

test('suggests common English spellings and requires a Latin name for the report', () => {
  expect(suggestEnglishName('محمد علي')).toBe('Mohammed Ali');
  expect(suggestEnglishName('أحمد بن سالم')).toBe('Ahmed Bin Salem');
  expect(isEnglishName('Mohammed Ali')).toBe(true);
  expect(isEnglishName('محمد علي')).toBe(false);
});
