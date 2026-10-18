import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import QuizScreen from "./pages/QuizScreen";
import AdminLoginScreen from "./pages/AdminLoginScreen";
import AdminPanel from "./pages/AdminPanel";
import AdminQuestions from "./pages/AdminQuestions";
import AddStudentScreen from "./pages/AddStudentScreen";
import AdminStudents from "./pages/AdminStudents";
import FinishScreen from "./pages/FinishScreen";
import AdminResults from "./pages/AdminResults";
import CompetitionReports from "./pages/CompetitionReports";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import CompetitionRoute from "./routes/CompetitionRoute";
import './App.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginScreen />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/finish" element={<FinishScreen />} />
            <Route element={<CompetitionRoute />}>
              <Route path="/quiz" element={<QuizScreen />} />
            </Route>
          </Route>

          <Route path="/admin-login" element={<AdminLoginScreen />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin-questions" element={<AdminQuestions />} />
          <Route path="/add-student" element={<AddStudentScreen />} />
          <Route path="/results" element={<AdminResults />} />
          <Route path="/reports" element={<CompetitionReports />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
