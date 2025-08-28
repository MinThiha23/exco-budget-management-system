import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Program } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface RecentActivityProps {
  programs: Program[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ programs }) => {
  const { t } = useLanguage();
  
  const recentPrograms = programs
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: t('draft'),
      pending: t('pending_review'),
      approved: t('approved'),
      rejected: t('rejected'),
      'in-progress': t('in_progress'),
      completed: t('completed')
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('recent_activity')}</h3>
      
      <div className="space-y-4">
        {recentPrograms.map((program) => (
          <div key={program.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            {getStatusIcon(program.status)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {program.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getStatusText(program.status)} • {formatDate(program.updatedAt)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {program.department}
              </p>
            </div>
          </div>
        ))}
      </div>

      {recentPrograms.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{t('no_recent_activity')}</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;