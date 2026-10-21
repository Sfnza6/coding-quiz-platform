import { fireEvent, render, screen } from '@testing-library/react';
import LanguageSwitcher from './components/LanguageSwitcher';
import { LocaleProvider, tr, useLocale } from './i18n/LocaleContext';

function SampleCopy() {
  const { direction } = useLocale();
  return <div dir={direction}><h1>{tr('مرحبًا بعودتك')}</h1></div>;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.pushState({}, '', '/');
});

test('switches the interface language and direction, and saves the choice', () => {
  render(<LocaleProvider><LanguageSwitcher /><SampleCopy /></LocaleProvider>);
  expect(screen.getByRole('heading', { name: 'مرحبًا بعودتك' })).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');

  fireEvent.click(screen.getByRole('button', { name: 'English' }));
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(document.documentElement.lang).toBe('en');
  expect(document.documentElement.dir).toBe('ltr');
  expect(localStorage.getItem('coding-quiz-locale')).toBe('en');

  fireEvent.click(screen.getByRole('button', { name: 'العربية' }));
  expect(screen.getByRole('heading', { name: 'مرحبًا بعودتك' })).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('rtl');
});

test('restores the saved language on a new mount', () => {
  localStorage.setItem('coding-quiz-locale', 'en');
  render(<LocaleProvider><LanguageSwitcher /><SampleCopy /></LocaleProvider>);
  expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  expect(document.documentElement.dir).toBe('ltr');
});
