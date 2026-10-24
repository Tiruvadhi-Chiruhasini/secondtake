import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth';
import { ROLE_HOME } from './format';
import { AppLayout, RequireAuth, RequireRole } from './components/Layout';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import ViewerDashboard from './pages/ViewerDashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import ProducerDashboard from './pages/ProducerDashboard';
import Explorer from './pages/Explorer';
import MovieDetail from './pages/MovieDetail';
import Compare from './pages/Compare';
import Insights from './pages/Insights';
import RiskExplorer from './pages/RiskExplorer';
import Profile from './pages/Profile';

const Home = () => { const { user } = useAuth(); return <Navigate to={ROLE_HOME[user.role]} replace />; };

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/app" element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="viewer" element={<RequireRole role="viewer"><ViewerDashboard /></RequireRole>} />
          <Route path="director" element={<RequireRole role="director"><DirectorDashboard /></RequireRole>} />
          <Route path="producer" element={<RequireRole role="producer"><ProducerDashboard /></RequireRole>} />
          <Route path="movies" element={<Explorer />} />
          <Route path="movies/:id" element={<MovieDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="insights" element={<Insights />} />
          <Route path="risk" element={<RiskExplorer />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
