import React from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  DollarSign, 
  BarChart3, 
  Settings,
  FileText,
  UserCheck,
  Clock,
  CheckCircle,
  TrendingUp,
  Building,
  MessageSquare,
  HelpCircle,
  Users2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';



interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getMenuItems = () => {
    // Debug: Log the user role to see what we're getting
    console.log('Current user role:', user?.role);
    console.log('User object:', user);
    
    if (user?.role === 'user') {
      return [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'my-programs', label: t('my_programs'), icon: FolderOpen },
        { id: 'create-program', label: t('register_program'), icon: FileText },
        { id: 'my-status', label: t('my_status'), icon: Clock },
        { id: 'queries', label: t('query_management'), icon: HelpCircle },
        // Hide EXCO Users directory for regular users per requirement
        { id: 'messaging', label: t('messages'), icon: MessageSquare },
        { id: 'profile', label: t('profile'), icon: Settings }
      ];
    }

    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'exco-users', label: t('exco_users'), icon: Users2 },
        { id: 'all-programs', label: t('all_programs'), icon: FolderOpen },
        { id: 'users', label: t('user_management'), icon: Users },
        { id: 'status', label: t('status_tracking'), icon: BarChart3 },
        { id: 'messaging', label: t('messages'), icon: MessageSquare },
        { id: 'profile', label: t('profile'), icon: Settings }
      ];
    }

    // Support multiple finance role variations
    if (user?.role && (user.role.includes('finance') || user.role.includes('Finance'))) {
      return [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'exco-users', label: t('exco_users'), icon: Users2 },
        { id: 'program-management', label: t('program_management'), icon: FolderOpen },
        { id: 'pending-approval', label: t('program_approval'), icon: UserCheck },
        { id: 'approved-programs', label: t('approved_programs'), icon: CheckCircle },
        { id: 'budget-tracking', label: t('budget_tracking'), icon: DollarSign },
        { id: 'financial-reports', label: t('financial_reports'), icon: TrendingUp },
        { id: 'messaging', label: t('messages'), icon: MessageSquare },
        { id: 'profile', label: t('profile'), icon: Settings }
      ];
    }

    if (user?.role === 'finance_officer') {
      return [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'exco-users', label: t('exco_users'), icon: Users2 },
        { id: 'program-management', label: t('program_management'), icon: FolderOpen },
        { id: 'approved-programs', label: t('approved_programs'), icon: CheckCircle },
        { id: 'budget-tracking', label: t('budget_tracking'), icon: DollarSign },
        { id: 'financial-reports', label: t('financial_reports'), icon: TrendingUp },
        { id: 'messaging', label: t('messages'), icon: MessageSquare },
        { id: 'profile', label: t('profile'), icon: Settings }
      ];
    }

    if (user?.role === 'super_admin') {
      return [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'exco-users', label: t('exco_users'), icon: Users2 },
        { id: 'all-programs', label: t('all_programs'), icon: FolderOpen },
        { id: 'users', label: t('user_management'), icon: Users },
        { id: 'status', label: t('status_tracking'), icon: BarChart3 },
        { id: 'financial-reports', label: t('financial_reports'), icon: TrendingUp },
        { id: 'messaging', label: t('messages'), icon: MessageSquare },
        { id: 'profile', label: t('profile'), icon: Settings }
      ];
    }

    return [
      { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
      { id: 'profile', label: t('profile'), icon: Settings }
    ];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="bg-blue-900 dark:bg-gray-900 text-white w-64 min-h-screen shadow-xl">
      <div className="p-6">

        <h2 className="text-xl font-bold mb-8 text-white">{t('main_menu')}</h2>
        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-800 dark:bg-gray-700 text-white shadow-lg'
                    : 'text-blue-100 dark:text-gray-100 hover:bg-blue-800 dark:hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="whitespace-nowrap text-base font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;