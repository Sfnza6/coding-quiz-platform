import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuizScreen from "./QuizScreen";
import { studentApi } from "../services/apiClient";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    token: "test-token",
    markCompetitionFinished: jest.fn(),
    setActiveCompetitionId: jest.fn(),
  }),
}));
jest.mock("../i18n/LocaleContext", () => ({
  tr: (value) => value,
  useLocale: () => ({ direction: "rtl", locale: "ar" }),
}));
jest.mock("../components/InstitutionBrand", () => () => null);
jest.mock("../services/apiClient", () => ({
  studentApi: {
    getCompetitionStatus: jest.fn(),
    getQuestions: jest.fn(),
    getActivity: jest.fn(),
    finalizeCompetition: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  studentApi.getCompetitionStatus.mockResolvedValue({ competition: { id: 9, is_active: true, remaining_seconds: 600 } });
  studentApi.getQuestions.mockResolvedValue({ questions: [{ id: 4, title: "مسألة تجريبية", language: "cpp" }] });
  studentApi.getActivity.mockResolvedValue({ solved_question_ids: [4], attempts: [] });
  studentApi.finalizeCompetition.mockResolvedValue({ status: "success" });
});

test("restores accepted progress and requires confirmation before finalizing", async () => {
  render(<QuizScreen />);
  await waitFor(() => expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1"));

  fireEvent.click(screen.getByRole("button", { name: "إنهاء التحدي وإرسال الحلول" }));
  expect(screen.getByRole("dialog", { name: "تأكيد إنهاء التحدي" })).toBeInTheDocument();
  expect(studentApi.finalizeCompetition).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "العودة للحل" }));
  expect(studentApi.finalizeCompetition).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "إنهاء التحدي وإرسال الحلول" }));
  fireEvent.click(screen.getByRole("button", { name: "تأكيد الإنهاء" }));
  await waitFor(() => expect(studentApi.finalizeCompetition).toHaveBeenCalledTimes(1));
});
