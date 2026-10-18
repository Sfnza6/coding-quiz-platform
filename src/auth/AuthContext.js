import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { studentApi } from "../services/apiClient";

const STORAGE_KEYS = {
  token: "student-token",
  student: "student-profile",
  finishedCompetition: "student-finished-competition",
  activeCompetition: "student-active-competition",
};

const AuthContext = createContext(null);

function readStoredStudent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.student);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.token));
  const [student, setStudent] = useState(readStoredStudent);
  const [activeCompetitionId, setActiveCompetitionIdState] = useState(() =>
    localStorage.getItem(STORAGE_KEYS.activeCompetition)
  );

  const login = useCallback(async ({ studentId, password }) => {
    const data = await studentApi.login(studentId, password);
    const nextToken = data.token;
    const nextStudent = data.student || {
      id: studentId,
      name: data.student_name || "Student",
    };

    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    localStorage.setItem(STORAGE_KEYS.student, JSON.stringify(nextStudent));
    sessionStorage.removeItem(STORAGE_KEYS.finishedCompetition);
    localStorage.removeItem(STORAGE_KEYS.activeCompetition);
    setToken(nextToken);
    setStudent(nextStudent);
    setActiveCompetitionIdState(null);

    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.student);
    localStorage.removeItem(STORAGE_KEYS.activeCompetition);
    sessionStorage.removeItem(STORAGE_KEYS.finishedCompetition);
    setToken(null);
    setStudent(null);
    setActiveCompetitionIdState(null);
  }, []);

  const setActiveCompetitionId = useCallback((competitionId) => {
    if (!competitionId) return;
    const normalizedId = String(competitionId);
    localStorage.setItem(STORAGE_KEYS.activeCompetition, normalizedId);
    setActiveCompetitionIdState(normalizedId);
  }, []);

  const markCompetitionFinished = useCallback(
    (competitionId) => {
      const normalizedId = competitionId || activeCompetitionId;
      if (!normalizedId) return;
      sessionStorage.setItem(STORAGE_KEYS.finishedCompetition, String(normalizedId));
    },
    [activeCompetitionId]
  );

  const clearFinishedCompetition = useCallback((competitionId) => {
    const finishedId = sessionStorage.getItem(STORAGE_KEYS.finishedCompetition);
    if (!competitionId || finishedId === String(competitionId) || finishedId === "1") {
      sessionStorage.removeItem(STORAGE_KEYS.finishedCompetition);
    }
  }, []);

  const hasFinishedCompetition = useCallback(
    (competitionId) => {
      const normalizedId = competitionId || activeCompetitionId;
      if (!normalizedId) return false;
      return sessionStorage.getItem(STORAGE_KEYS.finishedCompetition) === String(normalizedId);
    },
    [activeCompetitionId]
  );

  const value = useMemo(
    () => ({
      token,
      student,
      isAuthenticated: Boolean(token && student),
      login,
      logout,
      activeCompetitionId,
      setActiveCompetitionId,
      markCompetitionFinished,
      clearFinishedCompetition,
      hasFinishedCompetition,
    }),
    [
      token,
      student,
      login,
      logout,
      activeCompetitionId,
      setActiveCompetitionId,
      markCompetitionFinished,
      clearFinishedCompetition,
      hasFinishedCompetition,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
