import React, { useState } from 'react';
import { 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  FileText,
  ArrowLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Program } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { useLanguage } from '../../contexts/LanguageContext';

interface ModernUserProgramsViewProps {
  selectedExcoUser: any;
  filteredPrograms: Program[];
  onBack: () => void;
  onView: (program: Program) => void;
  onAction: (program: Program, action: 'query' | 'approve' | 'reject' | 'deduct') => void;
  userRole?: string;
}

const ModernUserProgramsView: React.FC<ModernUserProgramsViewProps> = ({
  selectedExcoUser,
  filteredPrograms,
  onBack,
  onView,
  onAction,
  userRole
}) => {
  const { t } = useLanguage();
  const [expandedTimelines, setExpandedTimelines] = useState<Set<string>>(new Set());

  const toggleTimeline = (programId: string) => {
    const newExpanded = new Set(expandedTimelines);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedTimelines(newExpanded);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      queried: 'bg-orange-100 text-orange-800',
      answered_query: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      budget_deducted: 'bg-purple-100 text-purple-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: 'Draft',
      submitted: t('submitted'),
      queried: 'Queried by Finance',
      answered_query: 'Query Answered',
      approved: 'Approved',
      rejected: 'Rejected',
      budget_deducted: 'Budget Deducted',
      'in-progress': 'In Progress',
      completed: 'Completed'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  // Timeline functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'submitted':
      case 'under_review':
        return <FileText className="w-4 h-4" />;
      case 'queried':
        return <MessageSquare className="w-4 h-4" />;
      case 'answered_query':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'mmk_accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'payment_in_progress':
        return <DollarSign className="w-4 h-4" />;
      case 'payment_completed':
        return <CheckCircle className="w-4 h-4" />;
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

  const getStatusState = (status: string, programStatus: string) => {
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

    const currentStatusIndex = statusOrder.indexOf(programStatus);
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
    <div className="p-6">
      {/* User Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedExcoUser.name}
            </h2>
            <p className="text-gray-600">{selectedExcoUser.department}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Programs</div>
            <div className="text-2xl font-bold text-blue-600">{selectedExcoUser.total_programs || 0}</div>
          </div>
        </div>
        
        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Budget</p>
                <p className="text-2xl font-bold">RM 10,000</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Expense</p>
                <p className="text-2xl font-bold">RM {selectedExcoUser.total_expense ? selectedExcoUser.total_expense.toLocaleString() : '0'}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Remaining Budget</p>
                <p className="text-2xl font-bold">RM {selectedExcoUser.remaining_budget ? selectedExcoUser.remaining_budget.toLocaleString() : '10,000'}</p>
              </div>
              <DollarSign className="w-8 h-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back_to_exco_users')}</span>
        </button>
      </div>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
          <p className="text-gray-600">This user hasn't created any programs yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              {/* Status Badge */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                  {getStatusText(program.status)}
                </span>
              </div>
              
              {/* Program Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {program.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {program.description}
                    </p>
                  </div>
                </div>

                {/* Program Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Budget</span>
                    <span className="text-sm font-semibold text-gray-900">
                      RM {program.budget?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Recipient</span>
                    <span className="text-sm font-medium text-gray-900">
                      {program.recipientName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Reference</span>
                    <span className="text-sm font-medium text-gray-900">
                      {program.letterReferenceNumber || 'N/A'}
                    </span>
                  </div>
                  {program.voucherNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Voucher</span>
                      <span className="text-sm font-medium text-green-600">
                        {program.voucherNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onView(program)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    {hasPermission(userRole as any, 'canQueryProgram') && (
                      <button
                        onClick={() => onAction(program, 'query')}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Query Program"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission(userRole as any, 'canApproveProgram') && (
                      <button
                        onClick={() => onAction(program, 'approve')}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approve Program"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {hasPermission(userRole as any, 'canRejectProgram') && (
                      <button
                        onClick={() => onAction(program, 'reject')}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Reject Program"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Timeline Section */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => toggleTimeline(program.id)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-600">📊 Status Timeline</span>
                    {expandedTimelines.has(program.id) ? (
                      <ChevronDown className="w-4 h-4 text-blue-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                  
                  {expandedTimelines.has(program.id) && (
                    <div className="mt-3 space-y-2">
                      {statuses.map((status, index) => {
                        const state = getStatusState(status, program.status);
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModernUserProgramsView;
