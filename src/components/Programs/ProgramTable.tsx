import React, { useState } from 'react';
import { Eye, Edit, Trash2, FileText, CheckCircle } from 'lucide-react';
import { Program } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { useLanguage } from '../../contexts/LanguageContext';
import StatusTimeline from './StatusTimeline';

interface ProgramTableProps {
  programs: Program[];
  onView: (program: Program) => void;
  onEdit: (program: Program) => void;
  onDelete: (programId: string) => Promise<void>;
  onSubmit?: (program: Program) => void;
  onAction?: (program: Program, action: string) => void;
  userRole?: string;
  startIndex?: number;
}

const ProgramTable: React.FC<ProgramTableProps> = ({ 
  programs, 
  onView, 
  onEdit, 
  onDelete,
  onSubmit,
  onAction,
  userRole = 'user',
  startIndex = 0
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Program Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget (RM)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Voucher No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EFT No.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EFT & Voucher<br />Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Documents
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {programs.map((program, index) => (
              <React.Fragment key={program.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{startIndex + index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{program.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {program.title}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {program.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{program.recipientName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(program.budget)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.letterReferenceNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                      {getStatusText(program.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.voucherNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.eftNumber || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {program.voucherNumber && program.eftNumber ? 
                        formatDateTime(program.updatedAt) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{program.documents.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(program.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onView(program)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {program.status === 'draft' && onSubmit && (
                        <button
                          onClick={() => onSubmit(program)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="Submit Program"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission(userRole as any, 'canEditProgram') && 
                       ['draft', 'queried'].includes(program.status) && (
                        <button
                          onClick={() => onEdit(program)}
                          className={`p-1 rounded ${
                            program.status === 'draft' 
                              ? 'text-blue-600 hover:text-blue-900' 
                              : 'text-orange-600 hover:text-orange-900'
                          }`}
                          title={program.status === 'draft' ? 'Edit Program' : 'Edit Program (Submitted)'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission(userRole as any, 'canDeleteProgram') && program.status === 'draft' && onDelete && (
                        <button
                          onClick={() => onDelete(program.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {userRole === 'finance' && program.status === 'approved' && onAction && (
                        <button
                          onClick={() => onAction(program, 'accept_document')}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Accept document (skip MMK review)"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td colSpan={13} className="p-0">
                    <StatusTimeline
                      program={program}
                      isExpanded={expandedTimelines.has(program.id)}
                      onToggle={() => toggleTimeline(program.id)}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProgramTable;