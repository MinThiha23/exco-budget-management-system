import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Program } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface FinanceProgramReviewProps {
  program: Program;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}

const FinanceProgramReview: React.FC<FinanceProgramReviewProps> = ({
  program,
  onClose,
  onAction
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDeductForm, setShowDeductForm] = useState(false);

  
  const [queryText, setQueryText] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [eftNumber, setEftNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('');
  const [deductionReason, setDeductionReason] = useState('');


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

  const handleQuery = () => {
    if (!queryText.trim()) {
      alert('Please enter a query');
      return;
    }
    onAction('query', { query_text: queryText });
    setQueryText('');
    setShowQueryForm(false);
  };

  const handleApprove = () => {
    if (!voucherNumber.trim() || !eftNumber.trim()) {
      alert('Please enter both Voucher Number and EFT Number');
      return;
    }
    onAction('approve', { voucher_number: voucherNumber, eft_number: eftNumber });
    setVoucherNumber('');
    setEftNumber('');
    setShowApproveForm(false);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    onAction('reject', { rejection_reason: rejectionReason });
    setRejectionReason('');
    setShowRejectForm(false);
  };

  const handleDeductBudget = () => {
    if (!deductionAmount || !deductionReason.trim()) {
      alert('Please enter both deduction amount and reason');
      return;
    }
    const amount = parseFloat(deductionAmount);
    if (isNaN(amount) || amount <= 0 || amount > program.budget) {
      alert('Please enter a valid deduction amount');
      return;
    }
    onAction('deduct_budget', { 
      deduction_amount: amount, 
      deduction_reason: deductionReason 
    });
    setDeductionAmount('');
    setDeductionReason('');
    setShowDeductForm(false);
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Finance Review - {program.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Program Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Program Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Title:</span> {program.title}</p>
              <p><span className="font-medium">Description:</span> {program.description}</p>
              <p><span className="font-medium">Department:</span> {program.department}</p>
              <p><span className="font-medium">Recipient:</span> {program.recipientName}</p>
              <p><span className="font-medium">Budget:</span> {formatCurrency(program.budget)}</p>
              <p><span className="font-medium">Duration:</span> {formatDate(program.startDate)} - {formatDate(program.endDate)}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  program.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                  program.status === 'queried' ? 'bg-orange-100 text-orange-800' :
                  program.status === 'answered_query' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {program.status === 'submitted' ? t('submitted') :
                   program.status === 'queried' ? 'Queried' :
                   program.status === 'answered_query' ? 'Query Answered' :
                   program.status}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Objectives & KPIs</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-gray-700">Objectives:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  {program.objectives?.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700">KPIs:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                  {program.kpi?.map((kpi, index) => (
                    <li key={index}>{kpi}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        {program.documents && program.documents.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {program.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    {typeof doc === 'string' ? doc : doc.originalName}
                  </span>
                  <button
                    onClick={() => {
                      const fileName = typeof doc === 'string' ? doc : doc.storedName;
                      window.open(`${API_ENDPOINTS.DOWNLOAD}?file=${encodeURIComponent(fileName)}`, '_blank');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Queries */}
        {program.queries && program.queries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{t('query_history')}</h3>
            <div className="space-y-3">
              {program.queries.map((query, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Query by {query.queried_by_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(query.query_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{query.query_text}</p>
                  {query.answer_text && (
                    <div className="bg-green-50 p-2 rounded">
                      <span className="text-sm font-medium text-gray-700">
                        Answer by {query.answered_by_name}:
                      </span>
                      <p className="text-sm text-gray-600 mt-1">{query.answer_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}



        {/* Finance Actions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">{t('finance')}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => setShowQueryForm(true)}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md transition-colors"
            >
              {t('query_program')}
            </button>
            <button
              onClick={() => setShowApproveForm(true)}
              className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
            >
              {t('approve')}
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
            >
              {t('reject')}
            </button>
            <button
              onClick={() => setShowDeductForm(true)}
              className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
            >
              {t('budget')}
            </button>

          </div>
        </div>

        {/* Query Form */}
        {showQueryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">{t('add_query')}</h3>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder={t('query_message')}
                className="w-full p-3 border rounded-md mb-4 h-32"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleQuery}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                >
                  Submit Query
                </button>
                <button
                  onClick={() => setShowQueryForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Form */}
        {showApproveForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Approve Program</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  placeholder="Voucher Number"
                  className="w-full p-3 border rounded-md"
                />
                <input
                  type="text"
                  value={eftNumber}
                  onChange={(e) => setEftNumber(e.target.value)}
                  placeholder="EFT Number"
                  className="w-full p-3 border rounded-md"
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowApproveForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Form */}
        {showRejectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Reject Program</h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border rounded-md mb-4 h-32"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deduct Budget Form */}
        {showDeductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Deduct Budget</h3>
              <div className="space-y-3">
                <input
                  type="number"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  placeholder="Deduction Amount"
                  className="w-full p-3 border rounded-md"
                  max={program.budget}
                />
                <textarea
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  placeholder="Enter deduction reason..."
                  className="w-full p-3 border rounded-md h-24"
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleDeductBudget}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Deduct Budget
                </button>
                <button
                  onClick={() => setShowDeductForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default FinanceProgramReview; 