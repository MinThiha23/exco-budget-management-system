import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Search, Plus, Users, FileText, Image, Paperclip } from 'lucide-react';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Message {
  id: number;
  sender_id: number;
  message_text: string;
  message_type: 'text' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

interface Conversation {
  id: number;
  title: string;
  type: 'direct' | 'group' | 'program';
  program_id?: number;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
  participants: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const Messaging: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [chatTitle, setChatTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      // Auto-bootstrap direct convos for finance <-> users
      autoBootstrapConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.MESSAGING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getConversations',
          user_id: user?.id,
          user_role: user?.role
        })
      });

      const data = await response.json();
      if (data.success) {
        // Filter conversations based on user role
        let filteredConversations = data.conversations;
        
        if (user?.role === 'user') {
          // Regular users only see conversations with finance roles
          filteredConversations = data.conversations.filter((conv: Conversation) => {
            // Check if any participant is a finance role
            return conv.participants.some((participant: any) => 
              participant.role === 'finance' || 
              participant.role === 'finance_officer' ||
              participant.role === 'super_admin'
            );
          });
        }
        
        setConversations(filteredConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoBootstrapConversations = async () => {
    try {
      // For regular users, only bootstrap conversation with finance team
      if (user?.role === 'user') {
        const response = await fetch(API_ENDPOINTS.MESSAGING + '?action=bootstrapFinanceConversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user_id: user?.id,
            user_role: user?.role 
          })
        });
        await response.json();
      } else {
        // For finance roles and admin, bootstrap all conversations
        const response = await fetch(API_ENDPOINTS.MESSAGING + '?action=bootstrapDirectConversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actor_id: user?.id })
        });
        await response.json();
      }
    } catch (e) {
      // Non-fatal
      console.error('Bootstrap conversations failed:', e);
    } finally {
      await fetchConversations();
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.MESSAGING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getMessages',
          conversation_id: conversationId,
          user_id: user?.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;

    try {
      const response = await fetch(API_ENDPOINTS.MESSAGING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message_text: newMessage.trim(),
          message_type: 'text'
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        fetchConversations(); // Refresh conversation list to update last message
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const searchUsers = async (term: string) => {
    if (!term.trim() || !user?.id) return;

    try {
      const response = await fetch(API_ENDPOINTS.MESSAGING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'searchUsers',
          search_term: term,
          current_user_id: user.id,
          user_role: user?.role
        })
      });

      const data = await response.json();
      if (data.success) {
        let filteredUsers = data.users;
        
        // For regular users, only show finance team members
        if (user?.role === 'user') {
          filteredUsers = data.users.filter((user: any) => 
            user.role === 'finance' || 
            user.role === 'finance_officer' ||
            user.role === 'super_admin'
          );
        }
        
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const createConversation = async () => {
    if (!chatTitle.trim() || selectedUsers.length === 0 || !user?.id) return;

    try {
      const participants = [user.id, ...selectedUsers.map(u => u.id)];
      
      const response = await fetch(API_ENDPOINTS.MESSAGING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createConversation',
          title: chatTitle.trim(),
          type: selectedUsers.length === 1 ? 'direct' : 'group',
          created_by: user.id,
          participants: participants
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowNewChat(false);
        setChatTitle('');
        setSelectedUsers([]);
        setSearchResults([]);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'direct' && conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(p => Number(p.id) !== Number(user?.id));
      return otherParticipant?.name || conversation.title;
    }
    return conversation.title;
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (conversation.last_message) {
      return conversation.last_message.length > 30 
        ? conversation.last_message.substring(0, 30) + '...' 
        : conversation.last_message;
    }
    return 'No messages yet';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Please log in to access messaging</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title={user?.role === 'user' ? 'Start chat with Finance Team' : 'Start new chat'}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {user?.role === 'user' 
                    ? 'No finance conversations yet. Start a chat with the finance team!' 
                    : 'No conversations yet. Start a new chat!'}
                </p>
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {getConversationSubtitle(conversation)}
                    </p>
                    {conversation.last_message_time && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(conversation.last_message_time)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getConversationTitle(selectedConversation)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedConversation.participants.length} {t('participants')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Users className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${Number(message.sender_id) === Number(user?.id) ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      Number(message.sender_id) === Number(user?.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.sender_name}
                      </span>
                      <span className="text-xs opacity-75">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{message.message_text}</p>
                    {message.message_type === 'file' && message.file_name && (
                      <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-xs">{message.file_name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t('type_message_placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={1}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('select_conversation')}</h3>
              <p className="text-gray-500">{t('choose_conversation_message')}</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.role === 'user' ? t('chat_with_finance_team') : t('new_conversation')}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('conversation_title')}
                </label>
                <input
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  placeholder={t('enter_conversation_title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {user?.role === 'user' ? t('search_finance_team') : user?.role?.includes('finance') ? t('search_users') : t('search_users')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={user?.role === 'user' ? t('search_finance_team_placeholder') : user?.role?.includes('finance') ? t('search_users_placeholder') : t('search_users_placeholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      searchUsers(e.target.value);
                    }}
                  />
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        if (!selectedUsers.find(u => u.id === user.id)) {
                          setSelectedUsers([...selectedUsers, user]);
                        }
                      }}
                      className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selected_users')}
                  </label>
                  <div className="space-y-2">
                    {selectedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">{user.name}</span>
                        </div>
                        <button
                          onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setChatTitle('');
                    setSelectedUsers([]);
                    setSearchResults([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={createConversation}
                  disabled={!chatTitle.trim() || selectedUsers.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  {t('create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
