import React, { useState } from 'react';
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Send, 
  Wallet, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface StatusTimelineProps {
  program: any;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const StatusTimeline: React.FC<StatusTimelineProps> = ({ 
  program, 
  isExpanded = false, 
  onToggle 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-5 h-5" />;
      case 'submitted':
      case 'under_review':
        return <Clock className="w-5 h-5" />;
      case 'queried':
        return <AlertCircle className="w-5 h-5" />;
      case 'answered_query':
        return <CheckCircle className="w-5 h-5" />;
      case 'approved':
        return <Send className="w-5 h-5" />;
      case 'mmk_accepted':
        return <CheckCircle className="w-5 h-5" />;
      case 'payment_in_progress':
        return <Clock className="w-5 h-5" />;
      case 'payment_completed':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
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

  const getStatusDate = (status: string) => {
    const state = getStatusState(status);
    
    // If the stage is completed, show "Done" instead of trying to find a date
    if (state === 'completed') {
      return 'Done';
    }
    
    // If it's the current stage, show the actual date or "Current"
    if (state === 'current') {
      switch (status) {
        case 'draft':
          return program.createdAt ? new Date(program.createdAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        case 'submitted':
          return program.submittedAt ? new Date(program.submittedAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        case 'queried':
          return program.queries && program.queries.length > 0 ? 
            new Date(program.queries[0].query_date).toLocaleString('ms-MY', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'Current';
        case 'answered_query':
          return program.queries && program.queries.length > 0 && program.queries[0].answered_at ? 
            new Date(program.queries[0].answered_at).toLocaleString('ms-MY', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : 'Current';
        case 'approved':
          return program.approvedAt ? new Date(program.approvedAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        case 'mmk_accepted':
          return program.mmkAcceptedAt ? new Date(program.mmkAcceptedAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        case 'payment_in_progress':
          return program.paymentStartedAt ? new Date(program.paymentStartedAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        case 'payment_completed':
          return program.paymentCompletedAt ? new Date(program.paymentCompletedAt).toLocaleString('ms-MY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) : 'Current';
        default:
          return 'Current';
      }
    }
    
    // For pending stages, show "Pending"
    return 'Pending';
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

  if (!isExpanded) {
    return (
      <div className="border-t border-gray-200 bg-blue-50">
        <button
          onClick={onToggle}
          className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
        >
          <span className="text-sm font-medium text-blue-700">📊 Status Timeline (Click to expand)</span>
          <ChevronRight className="w-4 h-4 text-blue-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-blue-50">
      <button
        onClick={onToggle}
        className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
      >
        <span className="text-sm font-medium text-blue-700">📊 Status Timeline</span>
        <ChevronDown className="w-4 h-4 text-blue-500" />
      </button>
      
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-4 overflow-x-auto pb-4">
          {statuses.map((status, index) => {
            const state = getStatusState(status);
            const isLast = index === statuses.length - 1;
            
            return (
              <div key={status} className="flex items-center">
                <div className={`flex flex-col items-center ${state === 'completed' ? 'text-green-600' : state === 'current' ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    state === 'completed' ? 'bg-green-100 border-green-500' :
                    state === 'current' ? 'bg-blue-100 border-blue-500' :
                    'bg-gray-100 border-gray-300'
                  }`}>
                    {getStatusIcon(status)}
                  </div>
                  <div className="mt-2 text-xs font-medium text-center max-w-20">
                    {getStatusLabel(status)}
                  </div>
                  <div className="mt-1 text-xs text-center max-w-24">
                    {getStatusDate(status)}
                  </div>
                  {state === 'current' && (
                    <div className="mt-1 text-xs font-medium text-blue-600">
                      Current
                    </div>
                  )}
                </div>
                
                {!isLast && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    state === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* EFT Details Section */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <Wallet className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">EFT Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Voucher No.:</span>
              <span className="ml-2 font-medium">{program.voucherNumber || 'Not Available'}</span>
            </div>
            <div>
              <span className="text-gray-500">EFT No.:</span>
              <span className="ml-2 font-medium">{program.eftNumber || 'Not Available'}</span>
            </div>
            <div>
              <span className="text-gray-500">EFT Date:</span>
              <span className="ml-2 font-medium">
                {program.eftNumber ? new Date(program.updatedAt).toLocaleDateString('ms-MY') : 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
