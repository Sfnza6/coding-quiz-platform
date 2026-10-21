import { API_BASE_URL, API_ENDPOINTS } from "../config/api";

function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok || data.status === "error") {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function authHeaders(token, extra = {}) {
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function postForm(endpoint, payload, token) {
  const response = await fetch(buildUrl(endpoint), {
    method: "POST",
    headers: authHeaders(token, {
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: new URLSearchParams(payload).toString(),
  });

  return parseResponse(response);
}

export async function postMultipart(endpoint, formData, token) {
  const response = await fetch(buildUrl(endpoint), {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });

  return parseResponse(response);
}

export async function getJson(endpoint, token) {
  const response = await fetch(buildUrl(endpoint), {
    headers: authHeaders(token),
  });

  return parseResponse(response);
}

export const studentApi = {
  login: (studentId, password) =>
    postForm(API_ENDPOINTS.login, {
      student_id: studentId,
      password,
    }),

  me: (token) => getJson(API_ENDPOINTS.me, token),

  getCompetitionStatus: (token) =>
    getJson(API_ENDPOINTS.competitionStatus, token),

  getResult: (token, sessionId) =>
    getJson(`/get_student_result.php${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ""}`, token),

  getQuestions: (token) => getJson(API_ENDPOINTS.questions, token),

  getActivity: (token, sessionId) =>
    getJson(`${API_ENDPOINTS.studentActivity}?session_id=${encodeURIComponent(sessionId)}`, token),

  getHistory: (token) => getJson(API_ENDPOINTS.studentHistory, token),

  submitSolution: ({ token, questionId, sourceFile, language }) => {
    const formData = new FormData();
    formData.append("question_id", questionId);
    formData.append("language", language);
    formData.append("source_file", sourceFile);
    return postMultipart(API_ENDPOINTS.submitSolution, formData, token);
  },

  finalizeCompetition: (token) =>
    postForm(API_ENDPOINTS.finalizeCompetition, {}, token),
};
