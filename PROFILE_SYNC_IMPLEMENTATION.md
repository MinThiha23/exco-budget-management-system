# Profile-EXCO Users Synchronization System

## Overview
This system automatically synchronizes user profile updates across the Profile component and the EXCO Users directory, ensuring that when any user (Admin, Finance, or EXCO User) updates their profile information, those changes are immediately reflected in the EXCO Users tab.

## How It Works

### 1. **EXCO Users Context (`ExcoUsersContext.tsx`)**
- **Purpose**: Centralized state management for EXCO users data
- **Functions**:
  - `fetchExcoUsers()`: Retrieves EXCO users from the backend
  - `refreshExcoUsers()`: Refreshes the data from server
  - `updateExcoUser(email, updates)`: Updates a specific EXCO user's information

### 2. **Profile Component Integration**
- **Photo Updates**: When a user uploads a new profile photo, it automatically updates the EXCO Users directory
- **Information Updates**: When a user updates their name, email, phone, or department, it syncs to EXCO Users
- **Event Dispatching**: Custom events are dispatched to notify other components of changes

### 3. **User Management Integration**
- **Admin Updates**: When admin users update other users' profiles, EXCO Users are also updated
- **New User Creation**: When new EXCO users are added, they automatically appear in the EXCO Users directory

### 4. **Real-time Synchronization**
- **Custom Events**: Uses browser custom events to notify components of profile changes
- **Immediate Updates**: Local state is updated immediately for better UX
- **Server Consistency**: Data is refreshed from the server to ensure consistency

## Implementation Details

### Profile Updates Trigger EXCO Users Updates
```typescript
// In Profile.tsx
const handleSubmit = async (e: React.FormEvent) => {
  // ... profile update logic
  
  // Update EXCO Users data
  if (user?.email) {
    await updateExcoUser(user.email, {
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      department: formData.department
    });
  }
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('profileUpdated', { 
    detail: { type: 'profile', email: user?.email, updates: {...} }
  }));
};
```

### EXCO Users Listen for Updates
```typescript
// In ExcoUsers.tsx
useEffect(() => {
  const handleProfileUpdate = (event: CustomEvent) => {
    console.log('Profile update event received:', event.detail);
    refreshExcoUsers();
  };

  window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
  
  return () => {
    window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  };
}, [refreshExcoUsers]);
```

### Admin User Management Syncs with EXCO Users
```typescript
// In UserManagement.tsx
const handleUpdateUser = async (e: React.FormEvent) => {
  // ... user update logic
  
  // Also update EXCO Users if this is an EXCO user
  if (editingUser.role === 'user' && editingUser.email) {
    await updateExcoUser(editingUser.email, {
      name: editingUser.name,
      email: editingUser.email,
      phone: editingUser.phone || '',
      department: editingUser.department || ''
    });
  }
};
```

## What Gets Synchronized

### ✅ **Profile Photo Changes**
- New profile photos are immediately visible in EXCO Users directory
- Avatar updates sync across all views

### ✅ **Personal Information**
- **Name**: Updates across Profile and EXCO Users
- **Email**: Synchronized between systems
- **Phone**: Contact information stays current
- **Department**: Organizational changes reflected

### ✅ **Role-based Updates**
- **Admin Users**: Can update any user's profile and see changes in EXCO Users
- **Finance Users**: Profile changes sync to EXCO Users directory
- **EXCO Users**: Self-updates appear immediately in directory

## Benefits

1. **Real-time Updates**: Changes appear instantly across all components
2. **Data Consistency**: Profile and EXCO Users always show the same information
3. **Better User Experience**: No need to manually refresh or navigate between tabs
4. **Role-based Access**: Different user roles can update profiles with proper synchronization
5. **Automatic Sync**: No manual intervention required

## Testing the System

### To Test Profile Photo Synchronization:
1. Go to Profile tab
2. Upload a new profile photo
3. Navigate to EXCO Users tab
4. Verify the new photo appears immediately

### To Test Information Synchronization:
1. Go to Profile tab
2. Update name, email, phone, or department
3. Navigate to EXCO Users tab
4. Verify the updated information appears

### To Test Admin Updates:
1. Login as Admin user
2. Go to User Management
3. Edit an EXCO user's profile
4. Navigate to EXCO Users tab
5. Verify the changes appear

## Console Logging

The system includes comprehensive console logging for debugging:
- Profile update events
- EXCO Users update operations
- Custom event dispatching
- Synchronization status

Check the browser console to monitor the synchronization process.

## Technical Notes

- **Event-driven Architecture**: Uses custom DOM events for component communication
- **Context-based State Management**: Centralized state management with React Context
- **Async Operations**: All updates are handled asynchronously for better performance
- **Error Handling**: Includes fallback mechanisms if synchronization fails
- **TypeScript Support**: Fully typed for better development experience

## Future Enhancements

1. **Real-time WebSocket Updates**: For multi-user environments
2. **Conflict Resolution**: Handle simultaneous updates from multiple users
3. **Audit Trail**: Track all profile changes and who made them
4. **Bulk Updates**: Support for updating multiple users simultaneously
5. **Offline Support**: Queue updates when offline and sync when reconnected
