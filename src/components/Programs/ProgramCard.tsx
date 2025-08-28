import React, { useState } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { Program } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProgramCardProps {
  program: Program;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  onSubmit?: () => void;
  showActions?: boolean;
  userRole?: string;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ 
  program, 
  onEdit, 
  onView, 
  onDelete,
  onSubmit,
  showActions = true,
  userRole = 'user'
}) => {
  const { t } = useLanguage();
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);
  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      queried: 'bg-orange-100 text-orange-800',
      answered_query: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      mmk_accepted: 'bg-indigo-100 text-indigo-800',
      payment_in_progress: 'bg-purple-100 text-purple-800',
      payment_completed: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Under Review',
      queried: 'Query',
      answered_query: 'Query Answered',
      approved: 'Complete and can be sent to MMK office',
      mmk_accepted: 'Document Accepted by MMK Office',
      payment_in_progress: 'Payment in Progress',
      payment_completed: 'Payment Completed',
      rejected: 'Rejected',
      'in-progress': 'In Progress',
      completed: 'Completed'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateProgress = () => {
    // Check if kpi exists and is an array
    if (!program.kpi || !Array.isArray(program.kpi) || program.kpi.length === 0) return 0;
    
    const totalProgress = program.kpi.reduce((sum, kpi) => {
      // Check if kpi has the expected structure
      if (typeof kpi === 'string') {
        // If kpi is a string (like "Children supported: 190"), return 50% as default
        return sum + 50;
      }
      
      // If kpi is an object with target and current properties
      if (kpi && typeof kpi === 'object' && 'target' in kpi && 'current' in kpi) {
        const kpiObj = kpi as { target: number; current: number };
        const progress = kpiObj.target > 0 ? (kpiObj.current / kpiObj.target) * 100 : 0;
        return sum + Math.min(progress, 100);
      }
      
      // Default progress for unknown kpi format
      return sum + 50;
    }, 0);
    
    return Math.round(totalProgress / program.kpi.length);
  };

  const progress = calculateProgress();

  // Timeline functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'submitted':
      case 'under_review':
        return <Calendar className="w-4 h-4" />;
      case 'queried':
        return <TrendingUp className="w-4 h-4" />;
      case 'answered_query':
        return <FileText className="w-4 h-4" />;
      case 'approved':
        return <TrendingUp className="w-4 h-4" />;
      case 'mmk_accepted':
        return <FileText className="w-4 h-4" />;
      case 'payment_in_progress':
        return <Calendar className="w-4 h-4" />;
      case 'payment_completed':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Under Review';
      case 'queried':
        return 'Query';
      case 'answered_query':
        return 'Query Answered';
      case 'approved':
        return 'Send to MMK';
      case 'mmk_accepted':
        return 'Document Accepted';
      case 'payment_in_progress':
        return 'Payment in Progress';
      case 'payment_completed':
        return 'Payment Completed';
      default:
        return status;
    }
  };

  const getStatusState = (status: string) => {
    const statusOrder = [
      'draft',
      'submitted', 
      'queried',
      'answered_query',
      'approved',
      'mmk_accepted',
      'payment_in_progress',
      'payment_completed'
    ];

    const currentStatusIndex = statusOrder.indexOf(program.status);
    const thisStatusIndex = statusOrder.indexOf(status);

    if (thisStatusIndex < currentStatusIndex) {
      return 'completed';
    } else if (thisStatusIndex === currentStatusIndex) {
      return 'current';
    } else {
      return 'pending';
    }
  };

  const statuses = [
    'draft',
    'submitted',
    'queried', 
    'answered_query',
    'approved',
    'mmk_accepted',
    'payment_in_progress',
    'payment_completed'
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 hover:border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs text-gray-500">ID: {program.id}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {program.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {program.description}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
          {getStatusText(program.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(program.budget)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-xs text-gray-500">Duration</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(program.startDate)} - {formatDate(program.endDate)}
            </p>
          </div>
        </div>
      </div>
      
      {program.letterReferenceNumber && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Reference Number</p>
              <p className="text-sm font-medium text-gray-900">
                {program.letterReferenceNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-semibold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Users className="w-3 h-3" />
          <span>{program.department}</span>
        </div>
        {showActions && (
          <div className="flex space-x-2">
            {/* View button - always available for viewing program details */}
            <button
              onClick={onView}
              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              View
            </button>
            
            {/* Submit button - only for draft programs */}
            {hasPermission(userRole as any, 'canSubmitProgram') && userRole === 'user' && program.status === 'draft' && (
              <button
                onClick={onSubmit}
                className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
              >
                Submit
              </button>
            )}
            
            {/* Edit button - only for draft and queried programs */}
            {hasPermission(userRole as any, 'canEditProgram') && userRole === 'user' && 
             ['draft', 'queried'].includes(program.status) && (
              <button
                onClick={onEdit}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  program.status === 'draft' 
                    ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' 
                    : 'bg-orange-100 hover:bg-orange-200 text-orange-700'
                }`}
                title={program.status === 'draft' ? 'Edit Program' : 'Edit Program (Submitted)'}
              >
                Edit
              </button>
            )}
            
            {/* Delete button - only for draft programs */}
            {hasPermission(userRole as any, 'canDeleteProgram') && userRole === 'user' && program.status === 'draft' && onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Status Timeline Section */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <button
          onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
          className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
        >
          <span className="text-sm font-medium text-blue-600">📊 Status Timeline</span>
          {isTimelineExpanded ? (
            <ChevronDown className="w-4 h-4 text-blue-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-500" />
          )}
        </button>
        
        {isTimelineExpanded && (
          <div className="mt-3 space-y-2">
            {statuses.map((status, index) => {
              const state = getStatusState(status);
              return (
                <div key={status} className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    state === 'completed' ? 'bg-green-100 border-green-500' :
                    state === 'current' ? 'bg-blue-100 border-blue-500' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-700">
                      {getStatusLabel(status)}
                    </div>
                    <div className={`text-xs ${
                      state === 'completed' ? 'text-green-600' : 
                      state === 'current' ? 'text-blue-600' : 
                      'text-gray-400'
                    }`}>
                      {state === 'completed' ? 'Done' : 
                       state === 'current' ? 'Current' : 
                       'Pending'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramCard;