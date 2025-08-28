import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications, isLoading } = useNotifications();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const toggleNotificationExpansion = (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const isNotificationExpanded = (notificationId: number) => {
    return expandedNotifications.has(notificationId);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm(t('delete_notification_confirm'))) {
      await deleteNotification(notificationId);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (window.confirm(t('delete_all_notifications_confirm'))) {
      await deleteAllNotifications();
      setShowDeleteConfirm(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const parseCreatedAt = (s: string) => {
    // Normalize MySQL 'YYYY-MM-DD HH:MM:SS' to ISO-like local format
    if (s && !s.includes('T')) return new Date(s.replace(' ', 'T'));
    return new Date(s);
  };

  const formatTime = (dateString: string) => {
    const date = parseCreatedAt(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffInMinutes < 1 && diffInMinutes > -10) return t('just_now');
    if (diffInMinutes < 60) return `${diffInMinutes}${t('minutes_ago')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}${t('hours_ago')}`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('notifications')}</h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  {t('delete_all')}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  {t('mark_all_read')}
                </button>
              )}
            </div>
          </div>

          {/* Delete All Confirmation */}
          {showDeleteConfirm && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">{t('delete_all_notifications_question')}</p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDeleteAllNotifications}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t('yes_delete_all')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">{t('loading_notifications')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>{t('no_notifications')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                                 <div
                   key={notification.id}
                   onClick={() => handleNotificationClick(notification.id)}
                   className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 group ${
                     !notification.is_read ? 'bg-blue-50' : ''
                   }`}
                 >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                                             <div className="flex items-center justify-between">
                         <h4 className={`text-sm font-medium ${
                           !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                         }`}>
                           {notification.title}
                         </h4>
                         <div className="flex items-center space-x-2">
                           <span className="text-xs text-gray-500">
                             {formatTime(notification.created_at)}
                           </span>
                           <button
                             onClick={(e) => handleDeleteNotification(notification.id, e)}
                             className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                             title="Delete notification"
                           >
                             ×
                           </button>
                         </div>
                       </div>
                      <div className="mt-1">
                        <p className={`text-sm text-gray-600 ${
                          isNotificationExpanded(notification.id) ? '' : 'line-clamp-2'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.message.length > 60 && (
                          <button
                            onClick={(e) => toggleNotificationExpansion(notification.id, e)}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium underline"
                          >
                            {isNotificationExpanded(notification.id) ? t('show_less') : t('show_more')}
                          </button>
                        )}
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
              >
                {t('view_all_notifications')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 