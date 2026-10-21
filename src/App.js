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
import StudentProfileScreen from "./pages/StudentProfileScreen";
import AdminResults from "./pages/AdminResults";
import CompetitionReports from "./pages/CompetitionReports";
import AdminLayout from "./components/AdminLayout";
import { AuthProvider } from "./auth/AuthContext";
import { LocaleProvider } from "./i18n/LocaleContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import CompetitionRoute from "./routes/CompetitionRoute";
import './App.css';


function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginScreen />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/finish" element={<FinishScreen />} />
              <Route path="/profile" element={<StudentProfileScreen />} />
              <Route element={<CompetitionRoute />}>
                <Route path="/quiz" element={<QuizScreen />} />
              </Route>
            </Route>

            <Route path="/admin-login" element={<AdminLoginScreen />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/students" element={<AdminStudents />} />
              <Route path="/admin-questions" element={<AdminQuestions />} />
              <Route path="/add-student" element={<AddStudentScreen />} />
              <Route path="/results" element={<AdminResults />} />
              <Route path="/reports" element={<CompetitionReports />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LocaleProvider>
  );
}

export default App;
