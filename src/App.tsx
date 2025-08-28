import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProgramProvider } from './contexts/ProgramContext';
import { UserProvider } from './contexts/UserContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ExcoUsersProvider } from './contexts/ExcoUsersContext';
import LoginForm from './components/Auth/LoginForm';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import MainDashboard from './components/Dashboard/MainDashboard';
import MyPrograms from './components/Programs/MyPrograms';
import MyStatus from './components/Programs/MyStatus';
import ProgramList from './components/Programs/ProgramList';
import UserManagement from './components/UserManagement/UserManagement';
import StatusTracking from './components/StatusTracking/StatusTracking';
import Profile from './components/Profile/Profile';
import PendingApproval from './components/Finance/PendingApproval';
import ApprovedPrograms from './components/Finance/ApprovedPrograms';
import BudgetTracking from './components/Finance/BudgetTracking';
import FinancialReports from './components/Finance/FinancialReports';
import FinanceProgramManagement from './components/Finance/FinanceProgramManagement';
import ProgramForm from './components/Programs/ProgramForm';
import QueryManagement from './components/Programs/QueryManagement';
import ExcoUsers from './components/ExcoUsers/ExcoUsers';
import Messaging from './components/Messaging/Messaging';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Initialize theme on app load
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (settings.theme === 'auto') {
        // Auto theme based on system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <MainDashboard />;
      case 'my-programs':
        return (
          <ErrorBoundary>
            <MyPrograms />
          </ErrorBoundary>
        );
      case 'my-status':
        return <MyStatus />;
      case 'queries':
        return (
          <ErrorBoundary>
            <QueryManagement />
          </ErrorBoundary>
        );
      case 'all-programs':
      case 'programs':
        return (
          <ErrorBoundary>
            <ProgramList />
          </ErrorBoundary>
        );
      case 'users':
        return <UserManagement />;
      case 'status':
        return <StatusTracking />;
      case 'profile':
        return <Profile />;
      case 'create-program':
        setShowCreateForm(true);
        setActiveTab('my-programs');
        return (
          <ErrorBoundary>
            <MyPrograms />
          </ErrorBoundary>
        );
      case 'program-management':
        return <FinanceProgramManagement />;
      case 'pending-approval':
        return <PendingApproval />;
      case 'approved-programs':
        return <ApprovedPrograms />;
      case 'budget-tracking':
        return <BudgetTracking />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'exco-users':
        return <ExcoUsers />;
      case 'messaging':
        return <Messaging />;
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {renderContent()}
          {showCreateForm && (
            <ProgramForm
              onClose={() => setShowCreateForm(false)}
              onSave={() => setShowCreateForm(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <ProgramProvider>
            <UserProvider>
              <ExcoUsersProvider>
                <AppContent />
              </ExcoUsersProvider>
            </UserProvider>
          </ProgramProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;