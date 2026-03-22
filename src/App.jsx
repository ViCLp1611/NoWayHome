import { useState } from 'react';
import { Header } from '@/views/components/Header';
import { HomePage } from '@/views/pages/HomePage';
import { LoginPage } from '@/views/pages/LoginPage';
import { RegisterPage } from '@/views/pages/RegisterPage';
import { ProfilePage } from '@/views/pages/ProfilePage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen">
      <Header 
        onNavigate={handleNavigate} 
        currentPage={currentPage}
        isLoggedIn={isLoggedIn}
      />
      
      {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />}
      {currentPage === 'register' && <RegisterPage onNavigate={handleNavigate} onLogin={handleLogin} />}
      {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} onLogout={handleLogout} />}
    </div>
  );
}
