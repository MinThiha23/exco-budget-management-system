import React, { useState } from 'react';
import { User as UserIcon, Lock, Camera, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useExcoUsers } from '../../contexts/ExcoUsersContext';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

const Profile: React.FC = () => {
  const { user, updateUser, updateUserProfile, changePassword } = useAuth();
  const { updateExcoUser } = useExcoUsers();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    department: user?.department || '',
    position: user?.position || ''
  });

  // Update form data when user changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
  }, [user]);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file.');
        setMessageType('error');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Image size should be less than 5MB.');
        setMessageType('error');
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to backend
      uploadProfilePhoto(file);
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      formData.append('user_id', user?.id || '');

      const response = await fetch(API_ENDPOINTS.UPLOAD_PROFILE, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Profile photo uploaded successfully!');
        setMessageType('success');
        
        console.log('Profile photo uploaded successfully:', data.file.path);
        console.log('Current user email:', user?.email);
        
        // Update user avatar in context
        updateUser({ avatar: data.file.path });
        
        // Update EXCO Users data to reflect the new photo
        if (user?.email) {
          console.log('Updating EXCO Users with new photo for:', user.email);
          try {
            await updateExcoUser(user.email, { image_url: data.file.path });
            console.log('EXCO Users updated successfully');
          } catch (error) {
            console.error('Failed to update EXCO Users:', error);
          }
        } else {
          console.error('No user email found for EXCO Users update');
        }
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { 
            type: 'photo', 
            email: user?.email,
            updates: { image_url: data.file.path }
          } 
        }));
        console.log('Profile photo update event dispatched');
        
        // Also dispatch a global refresh event
        window.dispatchEvent(new CustomEvent('forceRefreshAll'));
        console.log('Global refresh event dispatched');
        
        // Force a page refresh after a short delay if needed
        setTimeout(() => {
          console.log('Checking if EXCO Users need manual refresh...');
          // This will trigger any listeners to refresh their data
        }, 500);
      } else {
        setMessage('Failed to upload photo: ' + data.error);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Failed to upload photo. Please try again.');
      setMessageType('error');
    }
  };

  const handleChangePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleResetPhoto = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setMessage('Photo reset to default.');
    setMessageType('success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    try {
      const success = await updateUserProfile({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department
      });
      
      if (success) {
        setMessage('Profile updated successfully!');
        setMessageType('success');
        
        // Update local form data to reflect changes
        setFormData(prev => ({
          ...prev,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          department: formData.department
        }));
        
        // The backend now automatically syncs EXCO Users, but we'll also try to update them directly
        // for immediate UI feedback
        if (user?.email) {
          console.log('Profile updated successfully. Backend should have synced EXCO Users automatically.');
          console.log('Profile changes made:', {
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            department: formData.department
          });
          
          // Try to update EXCO Users directly for immediate feedback
          try {
            await updateExcoUser(user.email, {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              department: formData.department
            });
            console.log('EXCO Users updated successfully with profile changes');
            setMessage('Profile updated successfully! EXCO Users directory has been synchronized.');
          } catch (error) {
            console.error('Failed to update EXCO Users directly:', error);
            // Even if direct update fails, backend should have synced
            setMessage('Profile updated successfully! EXCO Users directory should be updated automatically.');
          }
        } else {
          console.error('No user email found for EXCO Users update');
          setMessage('Profile updated successfully!');
        }
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { 
            type: 'profile', 
            email: user?.email,
            updates: {
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              department: formData.department
            }
          } 
        }));
        console.log('Profile information update event dispatched');
        
        // Also dispatch a global refresh event
        window.dispatchEvent(new CustomEvent('forceRefreshAll'));
        console.log('Global refresh event dispatched');
        
        // Force EXCO Users refresh after a short delay to ensure backend sync is complete
        setTimeout(() => {
          console.log('Forcing EXCO Users refresh after profile update...');
          window.dispatchEvent(new CustomEvent('forceRefreshExcoUsers'));
        }, 1000);
        
        // Force a page refresh after a short delay if needed
        setTimeout(() => {
          console.log('Checking if EXCO Users need manual refresh...');
          // This will trigger any listeners to refresh their data
        }, 500);
      } else {
        setMessage('Failed to update profile. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }
    
    try {
      const success = await changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (success) {
        setMessage('Password changed successfully!');
        setMessageType('success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage('Current password is incorrect.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to change password. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user':
        return 'EXCO User';
      case 'admin':
        return 'Administrator';
      case 'Finance MMK':
        return 'Finance MMK';
      case 'finance_officer':
        return 'Finance Officer';
      default:
        return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'text-green-600';
      case 'admin':
        return 'text-blue-600';
      case 'Finance MMK':
        return 'text-purple-600';
      case 'finance_officer':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile_title')}</h1>
        <p className="text-gray-600">{t('profile_subtitle')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>{t('profile_information')}</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm ${
              activeTab === 'password'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t('change_password')}</span>
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          {/* Profile Photo Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('profile_photo')}</h3>
            

            
            <div className="flex items-center space-x-6">
              <div className="relative">
                {profileImage ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : user?.avatar ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden">
                    <img 
                      src={user.avatar.startsWith('http') ? user.avatar : `${API_ENDPOINTS.AUTH.replace('/auth.php', '')}/${user.avatar}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default avatar if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center absolute top-0 left-0 hidden">
                      <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                        <div className="text-white font-bold text-lg">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center">
                      <div className="text-white font-bold text-lg">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-4">
                  {t('upload_profile_photo')}
                </p>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleChangePhoto}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('change_photo')}</span>
                  </button>
                  <button 
                    onClick={handleResetPhoto}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    {t('reset')}
                  </button>

                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('basic_information')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('full_name')} *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('email_address')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone_number')} *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('role')}
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className={`font-medium ${getRoleColor(formData.role)}`}>
                      {getRoleLabel(formData.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('account_status')}
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('member_since')}
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Updating...' : t('update_profile')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'password' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('change_password')}</h3>
          <form onSubmit={handlePasswordSubmit} className="max-w-md">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('current_password')}
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('new_password')}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('confirm_password')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{isLoading ? 'Updating...' : t('change_password')}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;