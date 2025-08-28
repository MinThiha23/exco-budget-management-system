import React, { useState } from 'react';
import { Bell, Settings, LogOut, User as UserIcon, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationDropdown from '../Notifications/NotificationDropdown';
import SettingsModal from '../Settings/SettingsModal';
import { API_ENDPOINTS } from '../../config/api';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ms' : 'en';
    setLanguage(newLanguage);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/kedah-logo-png.png" 
              alt="Kedah State Government Logo" 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                // Fallback to default if image fails to load
                console.log('Logo failed to load, using fallback');
                e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Coat_of_arms_of_Kedah.svg/200px-Coat_of_arms_of_Kedah.svg.png";
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-blue-900 dark:text-white">
                {t('program_management_system')}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-200">{t('kedah_state_government')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Language Toggle Button */}
          <button 
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title={language === 'en' ? 'Switch to Bahasa Malaysia' : 'Switch to English'}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === 'en' ? 'EN' : 'MS'}
            </span>
          </button>

          <NotificationDropdown />
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
            {user?.avatar ? (
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={`${API_ENDPOINTS.AUTH.replace('/auth.php', '')}/${user.avatar}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </header>
  );
};

export default Header;