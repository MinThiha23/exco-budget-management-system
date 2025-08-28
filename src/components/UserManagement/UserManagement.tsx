import React, { useState, useEffect } from 'react';
import { User as UserIcon, UserPlus, Edit, Trash2, Search, Filter, Eye, EyeOff } from 'lucide-react';
import { useUsers } from '../../contexts/UserContext';
import { useExcoUsers } from '../../contexts/ExcoUsersContext';
import { API_ENDPOINTS } from '../../config/api';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const { users, updateUser, deleteUser, toggleUserStatus, addUser, loading } = useUsers();
  const { updateExcoUser } = useExcoUsers();
  
  console.log('UserManagement component rendered with:', { users, loading });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as User['role'],
    location: '',
    password: ''
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'finance':
        return 'bg-purple-100 text-purple-800';
      case 'finance_officer':
        return 'bg-orange-100 text-orange-800';
      case 'super_admin':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user':
        return 'EXCO USER';
      case 'admin':
        return 'ADMIN';
      case 'finance':
        return 'FINANCE MMK';
      case 'finance_officer':
        return 'FINANCE OFFICER';
      case 'super_admin':
        return 'SUPER ADMIN';
      default:
        return role.toUpperCase();
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      try {
        await updateUser(editingUser.id, editingUser);
        
        // Also update EXCO Users data if this user is an EXCO user
        if (editingUser.role === 'user' && editingUser.email) {
          await updateExcoUser(editingUser.email, {
            name: editingUser.name,
            email: editingUser.email,
            phone: editingUser.phone || '',
            department: editingUser.department || ''
          });
        }
        
        setEditUserMessage(t('user_updated_successfully'));
        setEditUserMessageType('success');
        setEditingUser(null);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setEditUserMessage('');
        }, 3000);
      } catch (error) {
        setEditUserMessage(t('failed_to_update_user'));
        setEditUserMessageType('error');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setEditUserMessage('');
        }, 5000);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('delete_user_confirmation'))) {
      try {
        await deleteUser(userId);
        setEditUserMessage(t('user_deleted_successfully'));
        setEditUserMessageType('success');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setEditUserMessage('');
        }, 3000);
      } catch (error) {
        setEditUserMessage(t('failed_to_delete_user'));
        setEditUserMessageType('error');
        
        // Clear error message after 5 seconds
        setTimeout(() => {
          setEditUserMessage('');
        }, 5000);
      }
    }
  };

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addUserMessage, setAddUserMessage] = useState('');
  const [addUserMessageType, setAddUserMessageType] = useState<'success' | 'error'>('success');
  const [editUserMessage, setEditUserMessage] = useState('');
  const [editUserMessageType, setEditUserMessageType] = useState<'success' | 'error'>('success');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingUser(true);
    setAddUserMessage('');
    
    try {
      const userToAdd = {
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        location: newUser.location,
        password: newUser.password,
        department: newUser.location || 'Kedah State Government',
        position: newUser.role === 'admin' ? 'System Admin' : 
                 newUser.role === 'user' ? 'EXCO User' : 
                 newUser.role === 'finance' ? 'Finance MMK' : 'User'
      };
      await addUser(userToAdd);
      
      // Also update EXCO Users data if this is a new EXCO user
      if (userToAdd.role === 'user' && userToAdd.email) {
        try {
          await updateExcoUser(userToAdd.email, {
            name: userToAdd.name,
            email: userToAdd.email,
            phone: userToAdd.phone || '',
            department: userToAdd.department || '',
            position: userToAdd.position || 'EXCO User'
          });
        } catch (error) {
          console.error('Failed to update EXCO Users for new user:', error);
        }
      }
      
      const passwordUsed = userToAdd.password || 'password123';
      setAddUserMessage(`${t('user_added_successfully')}: ${passwordUsed}`);
      setAddUserMessageType('success');
      
      // Reset form
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'user' as User['role'],
        location: '',
        password: ''
      });
      setShowAddForm(false);
      
      // Clear success message after 5 seconds (longer to read password)
      setTimeout(() => {
        setAddUserMessage('');
      }, 5000);
    } catch (error) {
      setAddUserMessage(t('failed_to_add_user'));
      setAddUserMessageType('error');
    } finally {
      setIsAddingUser(false);
    }
  };

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const activeUsers = users.filter(u => u.isActive !== false).length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('user_management')}</h1>
          <p className="text-gray-600">{t('manage_system_users')}</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('add_user')}</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {addUserMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          addUserMessageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {addUserMessage}
        </div>
      )}
      
      {editUserMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          editUserMessageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {editUserMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('total_users')}</p>
              <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('admins')}</p>
              <p className="text-3xl font-bold text-blue-600">{adminUsers}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('active_users')}</p>
              <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('inactive_users')}</p>
              <p className="text-3xl font-bold text-red-600">{inactiveUsers}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('search_users_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">{t('all_roles')}</option>
                <option value="user">{t('exco_user')}</option>
                <option value="admin">{t('admin')}</option>
                <option value="Finance MMK">{t('finance_mmk')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{t('users')} ({filteredUsers.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('name')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('phone')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('created')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar.startsWith('http') ? user.avatar : `${API_ENDPOINTS.USERS.replace('/users.php', '')}/${user.avatar}`}
                            alt={user.name}
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
                        <div className={`h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center ${user.avatar ? 'hidden' : ''}`}>
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive !== false ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{user.createdAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900"
                        title={t('edit_user')}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('delete_user')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.isActive !== false}
                          onChange={async () => {
                            try {
                              await toggleUserStatus(user.id);
                              setEditUserMessage(t('user_status_updated_successfully'));
                              setEditUserMessageType('success');
                              
                              // Clear success message after 3 seconds
                              setTimeout(() => {
                                setEditUserMessage('');
                              }, 3000);
                            } catch (error) {
                              setEditUserMessage(t('failed_to_update_user_status'));
                              setEditUserMessageType('error');
                              
                              // Clear error message after 5 seconds
                              setTimeout(() => {
                                setEditUserMessage('');
                              }, 5000);
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('edit_user')}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value as User['role']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">{t('exco_user')}</option>
                    <option value="admin">{t('admin')}</option>
                    <option value="finance">{t('finance_mmk')}</option>
                    <option value="finance_officer">{t('finance_officer')}</option>
                    <option value="super_admin">{t('super_admin')}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {t('update_user')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('add_new_user')}</h3>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input
                    type="text"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as User['role']})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">{t('exco_user')}</option>
                    <option value="admin">{t('admin')}</option>
                    <option value="finance">{t('finance_mmk')}</option>
                    <option value="finance_officer">{t('finance_officer')}</option>
                    <option value="super_admin">{t('super_admin')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
                  <input
                    type="text"
                    value={newUser.location}
                    onChange={(e) => setNewUser({...newUser, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                    placeholder={t('password_placeholder')}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('password_description')}</p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className={`px-4 py-2 rounded-lg ${
                    isAddingUser 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isAddingUser ? t('adding') : t('add_user')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;