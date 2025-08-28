import React, { useState, useEffect } from 'react';
import { Search, User as UserIcon, Phone, Mail, Building, MapPin, Eye, RefreshCw, Bell, Users } from 'lucide-react';
import './ExcoUsers.css';
import ExcoUserProfile from './ExcoUserProfile';
import { useExcoUsers } from '../../contexts/ExcoUsersContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_ENDPOINTS } from '../../config/api';
import { useNotifications } from '../../contexts/NotificationContext';

interface ExcoUser {
  id: number;
  name: string;
  title: string;
  role: string;
  image_url: string;
  email: string;
  phone: string;
  department: string;
  position: string;
}

const ExcoUsers: React.FC = () => {
  const { t } = useLanguage();
  const { excoUsers, loading, refreshExcoUsers } = useExcoUsers();
  const { fetchNotifications } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ExcoUser | null>(null);
  const [viewMode, setViewMode] = useState<'directory' | 'portfolio' | 'pusat-khidmat'>('directory');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationUser, setNotificationUser] = useState<ExcoUser | null>(null);

  // Listen for profile update events from other components
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update event received in EXCO Users:', event.detail);
      console.log('Forcing EXCO Users refresh...');
      
      // Force immediate refresh
      refreshExcoUsers();
      
      // Also add a small delay and refresh again to ensure data is updated
      setTimeout(() => {
        console.log('Delayed refresh to ensure data consistency...');
        refreshExcoUsers();
      }, 1000);
    };

    // Listen for custom events when profiles are updated
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    
    // Also listen for any storage changes (in case profile updates are stored)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authUser' || e.key === 'profileUpdated') {
        console.log('Storage change detected, refreshing EXCO Users...');
        refreshExcoUsers();
      }
    };
    
    // Listen for global refresh events
    const handleGlobalRefresh = () => {
      console.log('Global refresh event received, refreshing EXCO Users...');
      refreshExcoUsers();
    };
    
    // Listen for specific EXCO Users refresh events
    const handleExcoUsersRefresh = () => {
      console.log('EXCO Users specific refresh event received, refreshing...');
      refreshExcoUsers();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('forceRefreshAll', handleGlobalRefresh);
    window.addEventListener('forceRefreshExcoUsers', handleExcoUsersRefresh);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('forceRefreshAll', handleGlobalRefresh);
      window.removeEventListener('forceRefreshExcoUsers', handleExcoUsersRefresh);
    };
  }, [refreshExcoUsers]);

  // Add a periodic refresh to ensure data stays current
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic refresh of EXCO Users data...');
      refreshExcoUsers();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshExcoUsers]);

  const filteredUsers = excoUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePortfolioClick = (user: ExcoUser) => {
    setSelectedUser(user);
    setViewMode('portfolio');
    // Update URL hash to prevent 404 on browser back button
    window.location.hash = `user-${user.id}-portfolio`;
  };

  const handlePusatKhidmatClick = (user: ExcoUser) => {
    setSelectedUser(user);
    setViewMode('pusat-khidmat');
    // Update URL hash to prevent 404 on browser back button
    window.location.hash = `user-${user.id}-pusat-khidmat`;
  };

  // State for user notifications
  const [userNotifications, setUserNotifications] = useState<{[key: string]: any[]}>({});
  
  // State for tracking read notifications (persisted in localStorage)
  const [readNotifications, setReadNotifications] = useState<{[key: string]: Set<number>}>({});
  
  // Load read notifications from localStorage on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('excoReadNotifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        const converted: {[key: string]: Set<number>} = {};
        Object.keys(parsed).forEach(key => {
          converted[key] = new Set(parsed[key]);
        });
        setReadNotifications(converted);
      }
    } catch (error) {
      console.error('Error loading read notifications from localStorage:', error);
    }
  }, []);
  
  // Save read notifications to localStorage whenever they change
  const saveReadNotifications = (newReadNotifications: {[key: string]: Set<number>}) => {
    try {
      const converted: {[key: string]: number[]} = {};
      Object.keys(newReadNotifications).forEach(key => {
        converted[key] = Array.from(newReadNotifications[key]);
      });
      localStorage.setItem('excoReadNotifications', JSON.stringify(converted));
    } catch (error) {
      console.error('Error saving read notifications to localStorage:', error);
    }
  };

  // Handle browser back button navigation
  useEffect(() => {
    const handlePopState = () => {
      // If user navigates back using browser button, return to directory
      setSelectedUser(null);
      setViewMode('directory');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch real program status notifications for each EXCO user when component loads
  useEffect(() => {
    const fetchAllUserNotifications = async () => {
      const notificationsMap: {[key: string]: any[]} = {};
      
      for (const user of excoUsers) {
        // Only fetch notifications if user has actual database notifications
        const userNotifs = await fetchUserNotifications(user);
        if (userNotifs.length > 0) {
          notificationsMap[user.id] = userNotifs;
        }
        // If no real notifications found, don't add any fake ones
      }
      
      setUserNotifications(notificationsMap);
    };

    if (excoUsers.length > 0) {
      fetchAllUserNotifications();
    }
  }, [excoUsers]);

  // Fetch real program data and generate notifications based on actual programs
  const fetchUserNotifications = async (user: ExcoUser) => {
    try {
      // Fetch all programs from the database
      const response = await fetch(`https://exco.kesug.com/api/programs.php`);
      const data = await response.json();
      
      console.log(`=== DEBUG: Fetching notifications for ${user.name} ===`);
      console.log('All programs data:', data);
      
      if (data.success && data.programs) {
        console.log(`Total programs in database: ${data.programs.length}`);
        
        // Find programs submitted by this EXCO user using more flexible name matching
        const userPrograms = data.programs.filter((program: any) => {
          if (!program.submitted_by) {
            console.log(`Program ${program.title} has no submitted_by field`);
            return false;
          }
          
          console.log(`Checking program: ${program.title} submitted by: "${program.submitted_by}"`);
          
          // Extract the main name part from EXCO user (before the titles)
          const excoNameParts = user.name.split(',').map((part: string) => part.trim());
          const mainExcoName = excoNameParts[0]; // "YAB Dato'Seri Haji Muhammad Sanusi bin Md Nor"
          
          // Extract the main name part from submitted_by (before the titles)
          const submittedNameParts = program.submitted_by.split(',').map((part: string) => part.trim());
          const mainSubmittedName = submittedNameParts[0]; // "YB. Prof. Dr. Haim Hilman Bin Abdullah"
          
          console.log(`EXCO name: "${mainExcoName}" vs Program submitted by: "${mainSubmittedName}"`);
          
          // Comprehensive name cleaning function
          const cleanName = (name: string) => {
            return name
              .replace(/^(YAB|YB)\s*\.?\s*/i, '') // Remove YAB/YB
              .replace(/^(Dato'|Dato'Seri|Prof\.|Dr\.|Ustaz|Ustazah|Hjh\.|Haji|Tuan)\s*/gi, '') // Remove all titles
              .replace(/\s+(bin|binti)\s+/gi, ' ') // Remove bin/binti
              .replace(/\s+/g, ' ') // Normalize multiple spaces
              .toLowerCase()
              .trim();
          };
          
          const cleanExcoName = cleanName(mainExcoName);
          const cleanSubmittedName = cleanName(mainSubmittedName);
          
          console.log(`Clean EXCO name: "${cleanExcoName}" vs Clean submitted name: "${cleanSubmittedName}"`);
          

          
          // Use EXACT match only - no partial matching to prevent false positives
          const isMatch = cleanExcoName === cleanSubmittedName;
          
          console.log(`Match result: ${isMatch}`);
          
          return isMatch;
        });
        
        console.log(`Found ${userPrograms.length} programs for ${user.name}:`, userPrograms);
        
        if (userPrograms.length > 0) {
          // Generate real notifications based on actual program statuses
          const notifications = userPrograms.map((program: any) => {
            let title = '';
            let message = '';
            let type = 'info';
            
            switch (program.status) {
              case 'draft':
                title = 'New Program Created';
                message = `Your program '${program.title}' has been successfully created and is now in draft status.`;
                type = 'info';
                break;
              case 'under_review':
                title = 'Program Status Changed';
                message = `Your program '${program.title}' status changed to Under Review`;
                type = 'info';
                break;
              case 'approved':
                title = 'Program Status Changed';
                message = `Your program '${program.title}' status changed to Approved`;
                type = 'success';
                break;
              case 'rejected':
                title = 'Program Status Changed';
                message = `Your program '${program.title}' status changed to Rejected`;
                type = 'error';
                break;
              case 'queried':
              case 'answered_query':
                title = 'Program Status Changed';
                message = `Your program '${program.title}' status changed to Queried`;
                type = 'warning';
                break;
              default:
                title = 'Program Status Changed';
                message = `Your program '${program.title}' status changed to ${program.status}`;
                type = 'info';
            }
            
            // Use appropriate timestamp based on program status
            let timestamp = program.created_at;
            if (program.status !== 'draft' && program.submitted_at) {
              timestamp = program.submitted_at;
            }
            
            return {
              type,
              title,
              message,
              time: formatTime(timestamp || new Date().toISOString()),
              color: getNotificationColor(type),
              is_read: readNotifications[user.id]?.has(program.id) || false,
              id: program.id
            };
          });
          
          // Sort by time (most recent first) and limit to 4
          return notifications
            .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
            .slice(0, 4);
        }
      }
      
      console.log(`No programs found for EXCO user ${user.name}`);
      return [];
    } catch (error) {
      console.error('Error fetching user programs:', error);
      return [];
    }
  };

  // Helper function to get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'green';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'query':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  // Format time helper function
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Generate realistic program status notifications for EXCO users
  const generateUserNotifications = (user: ExcoUser) => {
    // Return cached notifications if available
    if (userNotifications[user.id]) {
      return userNotifications[user.id];
    }
    
    // If no cached notifications and no real notifications found, return empty array
    // This means the user has no programs and should show no notifications
    return [];
  };

  // Get notification count for a user (only unread notifications)
  const getNotificationCount = (user: ExcoUser) => {
    // Return unread notification count if available, otherwise fallback
    if (userNotifications[user.id]) {
      return userNotifications[user.id].filter(notification => !notification.is_read).length;
    }
    return generateUserNotifications(user).filter(notification => !notification.is_read).length;
  };

  const handleNotificationClick = (user: ExcoUser) => {
    setNotificationUser(user);
    setShowNotificationModal(true);
  };

  const handleBackToDirectory = () => {
    setSelectedUser(null);
    setViewMode('directory');
    // Clear URL hash when going back to directory
    window.location.hash = '';
  };

  if (selectedUser) {
    return <ExcoUserProfile user={selectedUser} onBack={handleBackToDirectory} viewMode={viewMode} />;
  }

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('loading_exco_users')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('exco_users_directory')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
            View all EXCO users and their contact information
          </p>
          {/* User Count Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700 shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            {filteredUsers.length} users
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-4 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
                placeholder="Search EXCO members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-lg placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => {
                console.log('Manual refresh button clicked');
                refreshExcoUsers();
              }}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center space-x-2 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              title="Force Refresh EXCO Users Data"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* EXCO Users Grid - Beautiful Modern Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group">
              {/* User Image with Notification Badge */}
              <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600">
                <div className="absolute inset-0 flex items-center justify-center">
                {user.image_url ? (
                  <img
                      src={user.image_url.startsWith('http') ? user.image_url : `/api/${user.image_url}`}
                    alt={user.name}
                      className="w-32 h-32 object-cover object-top rounded-full border-0 group-hover:scale-105 transition-transform duration-300"
                      style={{ 
                        objectPosition: 'center 20%',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none'
                      }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                  <div 
                    className={`w-32 h-32 rounded-full border-0 bg-gray-200 dark:bg-gray-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 ${user.image_url ? 'hidden' : ''}`}
                    style={{ 
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none'
                    }}
                  >
                    <UserIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                
                                 {/* Notification Badge */}
                 <div className="absolute top-4 right-4">
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleNotificationClick(user);
                     }}
                     className="relative group"
                     title="View notifications"
                   >
                     <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 group-hover:scale-110">
                       <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-md group-hover:bg-red-600 transition-colors">
                       {getNotificationCount(user)}
                     </span>
                   </button>
                </div>
              </div>

              {/* User Information */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 line-clamp-2 leading-relaxed">
                  {user.title}
                </p>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handlePortfolioClick(user)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    Portfolio
                  </button>
                  <button
                    onClick={() => handlePusatKhidmatClick(user)}
                    className="w-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    Service Center
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No EXCO members found' : 'No EXCO members available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Try adjusting your search terms' : 'Please check back later'}
            </p>
          </div>
        )}

                 {/* Loading State */}
         {loading && (
           <div className="text-center py-16">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
             <p className="text-gray-600">Loading EXCO users...</p>
           </div>
         )}
       </div>

       {/* Notification Modal */}
       {showNotificationModal && notificationUser && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
             {/* Modal Header */}
             <div className="p-6 border-b border-gray-200">
               <div className="flex items-center justify-between">
                 <h3 className="text-xl font-bold text-gray-900">Notifications</h3>
                 <button
                   onClick={() => setShowNotificationModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               <p className="text-sm text-gray-600 mt-1">
                 Notifications for {notificationUser.name}
               </p>
             </div>

                         {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* User-Specific Notifications */}
                {generateUserNotifications(notificationUser).map((notification, index) => {
                  const getNotificationStyle = (color: string) => {
                    switch (color) {
                      case 'blue':
                        return {
                          container: 'bg-blue-50 border-blue-200',
                          icon: 'bg-blue-100',
                          iconColor: 'text-blue-600',
                          timeColor: 'text-blue-600'
                        };
                      case 'green':
                        return {
                          container: 'bg-green-50 border-green-200',
                          icon: 'bg-green-100',
                          iconColor: 'text-green-600',
                          timeColor: 'text-green-600'
                        };
                      case 'yellow':
                        return {
                          container: 'bg-yellow-50 border-yellow-200',
                          icon: 'bg-yellow-100',
                          iconColor: 'text-yellow-600',
                          timeColor: 'text-yellow-600'
                        };
                      case 'red':
                        return {
                          container: 'bg-red-50 border-red-200',
                          icon: 'bg-red-100',
                          iconColor: 'text-red-600',
                          timeColor: 'text-red-600'
                        };
                      default:
                        return {
                          container: 'bg-gray-50 border-gray-200',
                          icon: 'bg-gray-100',
                          iconColor: 'text-gray-600',
                          timeColor: 'text-gray-600'
                        };
                    }
                  };
                  
                  const style = getNotificationStyle(notification.color);
                  
                  return (
                    <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg border ${style.container}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.icon}`}>
                        {notification.type === 'success' && (
                          <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {notification.type === 'info' && (
                          <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {(notification.type === 'warning' || notification.type === 'query') && (
                          <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {notification.type === 'urgent' && (
                          <svg className={`w-4 h-4 ${style.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                        <p className={`text-xs mt-1 ${style.timeColor}`}>{notification.time}</p>
                      </div>
                    </div>
                  );
                })}
                
                {/* No notifications message */}
                {generateUserNotifications(notificationUser).length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications available</p>
          </div>
        )}
      </div>

               {/* Modal Actions */}
               <div className="mt-6 flex justify-end space-x-3">
                 <button
                   onClick={() => setShowNotificationModal(false)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                 >
                   Close
                 </button>
                 <button
                   onClick={async () => {
                     try {
                       // Mark all notifications as read for this EXCO user
                       if (notificationUser) {
                         // Find the regular user account for this EXCO user
                         const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS}`, {
                           method: 'POST',
                           headers: {
                             'Content-Type': 'application/json',
                           },
                           body: JSON.stringify({
                             action: 'mark_all_read',
                             user_id: notificationUser.id
                           })
                         });
                         
                         const data = await response.json();
                         if (data.success) {
                           // Mark all notifications as read and persist to localStorage
                           const currentNotifications = userNotifications[notificationUser.id] || [];
                           const notificationIds = currentNotifications.map(n => n.id);
                           
                           setReadNotifications(prev => {
                             const updated = { ...prev };
                             updated[notificationUser.id] = new Set([
                               ...(updated[notificationUser.id] || []),
                               ...notificationIds
                             ]);
                             saveReadNotifications(updated);
                             return updated;
                           });
                           
                           // Update the cached notifications to reflect read status
                           setUserNotifications(prev => {
                             const updated = { ...prev };
                             if (updated[notificationUser.id]) {
                               updated[notificationUser.id] = updated[notificationUser.id].map(notification => ({
                                 ...notification,
                                 is_read: true
                               }));
                             }
                             return updated;
                           });
                           
                           // Refresh the EXCO users data to reflect the changes
                           refreshExcoUsers();
                           
                           // Also refresh the main notification dropdown
                           await fetchNotifications();
                           
                           // Close the modal
                           setShowNotificationModal(false);
                         }
                       }
                     } catch (error) {
                       console.error('Error marking all notifications as read:', error);
                     }
                   }}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                 >
                   Mark All Read
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default ExcoUsers; 