export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost/coding_quiz";

export const API_ENDPOINTS = {
  login: "/student_login.php",
  me: "/student_me.php",
  competitionStatus: "/student_competition_status.php",
  questions: "/get_student_questions.php",
  submitSolution: "/submit_solution.php",
  finalizeCompetition: "/finalize_competition.php",
};
