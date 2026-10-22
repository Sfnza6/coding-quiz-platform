import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomeScreen from './HomeScreen';
import { studentApi } from '../services/apiClient';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../services/apiClient', () => ({ studentApi: { getCompetitionStatus: jest.fn() } }));
jest.mock('../auth/AuthContext', () => ({ useAuth: () => ({
  student: { id: 'ready-test', name: 'Test student' }, token: 'test', logout: jest.fn(),
  setActiveCompetitionId: jest.fn(), clearFinishedCompetition: jest.fn(),
}) }));
jest.mock('../i18n/LocaleContext', () => ({ useLocale: () => ({direction:'rtl'}), tr: (text) => text }));
jest.mock('../components/InstitutionBrand', () => () => null);

let handlers;
const originalEventSource = global.EventSource;
beforeEach(() => {
  sessionStorage.clear();
  handlers = {};
  global.EventSource = class {
    addEventListener(name, callback) { handlers[name] = callback; }
    close() {}
  };
});
afterEach(() => { global.EventSource = originalEventSource; jest.clearAllMocks(); });
function showHome() { render(<HomeScreen />); }
test('ready student enters automatically only when competition starts', async () => {
  let active = false;
  studentApi.getCompetitionStatus.mockImplementation(async () => ({ competition: { id: active ? 12 : null, is_active: active, remaining_seconds: active ? 60 : 0, student_status: 'assigned' } }));
  showHome();
  fireEvent.click(await screen.findByRole('button', { name: 'استعداد' }));
  expect(mockNavigate).not.toHaveBeenCalledWith('/quiz', expect.anything());
  active = true;
  handlers.changed();
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/quiz', { replace: true }));
  expect(sessionStorage.getItem('student-ready:ready-test')).toBeNull();
});
test('late student sees start button and can enter manually', async () => {
  studentApi.getCompetitionStatus.mockResolvedValue({ competition: { id: 12, is_active: true, remaining_seconds: 60, student_status: 'assigned' } });
  showHome();
  fireEvent.click(await screen.findByRole('button', { name: 'ابدأ التحدي' }));
  expect(mockNavigate).toHaveBeenCalledWith('/quiz');
});
