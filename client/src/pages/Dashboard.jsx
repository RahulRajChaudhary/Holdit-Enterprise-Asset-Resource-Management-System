import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <main className="min-h-svh bg-gray-50 p-8">
     
      <div>hello from dashboard</div>
    </main>
  );
}

export default Dashboard;
