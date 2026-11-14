import { Navigate, Route, Routes } from 'react-router-dom';
import { DemoProvider, useDemo } from './DemoProvider';
import Shell from '../components/layout/Shell';
import AuthPage from '../pages/auth/AuthPage';
import ProfilePage from '../pages/profile/ProfilePage';
import DiscoveryPage from '../pages/discovery/DiscoveryPage';

function AppRoutes() {
  const { state } = useDemo();
  return <Routes>
    <Route path="/login" element={state.session ? <Navigate to="/discover" replace /> : <AuthPage key="login" />} />
    <Route path="/register" element={state.session ? <Navigate to="/discover" replace /> : <AuthPage key="signup" signup />} />
    <Route element={state.session ? <Shell /> : <Navigate to="/login" replace />}>
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/discover" element={<DiscoveryPage />} />
      <Route path="/chat" element={<h1>Trò chuyện</h1>} />
      <Route path="/notifications" element={<h1>Thông báo</h1>} />
    </Route>
    <Route path="*" element={<Navigate to={state.session ? '/discover' : '/login'} replace />} />
  </Routes>;
}
export default function App() { return <DemoProvider><AppRoutes /></DemoProvider>; }
