import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function CompetitionRoute() {
  const { activeCompetitionId, hasFinishedCompetition } = useAuth();

  if (hasFinishedCompetition(activeCompetitionId)) {
    return <Navigate to="/finish" replace />;
  }

  return <Outlet />;
}
