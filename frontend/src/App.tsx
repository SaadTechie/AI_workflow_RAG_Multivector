import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminUploadPage } from './pages/admin/AdminUploadPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const App: React.FC = () => {
  const { token, login, register } = useAuthContext();

  return (
    <Routes>
      <Route path="/login" 
             element={token ? <Navigate to="/chat" replace /> : <AuthPage onLogin={login} onRegister={register} />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
      </Route>

      <Route element={<ProtectedRoute requireRole="admin" />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/upload" element={<AdminUploadPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
};

export default App;