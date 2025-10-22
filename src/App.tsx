import React from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, login, signup, logout } = useAuth();

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      {user ? (
        <Dashboard user={user} onLogout={logout} />
      ) : (
        <Auth onLogin={login} onSignup={signup} />
      )}
    </div>
  );
}

export default App;
