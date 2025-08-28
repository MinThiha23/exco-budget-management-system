import React from 'react';
import { X, Calendar, DollarSign, Users, Target, TrendingUp, FileText, User as UserIcon, Download, History } from 'lucide-react';
import { Program } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProgramDetailProps {
  program: Program;
  onClose: () => void;
  onEdit?: () => void;
}

const ProgramDetail: React.FC<ProgramDetailProps> = ({ program, onClose, onEdit }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: t('draft'),
      pending: t('pending'),
      approved: t('approved'),
      rejected: t('rejected'),
      'in-progress': t('in_progress'),
      completed: t('completed')
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
    if (!dateString) {
      return 'Invalid Date';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
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
  const [historyModal, setHistoryModal] = React.useState<{category: string; items: any[]} | null>(null);
  const [answerQueryModal, setAnswerQueryModal] = React.useState<{query: any; queryIndex: number} | null>(null);
  const [answerText, setAnswerText] = React.useState('');

  const openHistory = async (category: string) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getDocumentHistory&program_id=${program.id}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      if (data.success) {
        setHistoryModal({ category, items: data.history });
      } else {
        alert(data.error || 'Failed to load document history');
      }
    } catch (e) {
      alert('Failed to load document history');
    }
  };

  const handleAnswerQuery = (query: any, queryIndex: number) => {
    setAnswerQueryModal({ query, queryIndex });
    setAnswerText('');
  };

  const submitAnswer = async () => {
    if (!answerText.trim()) {
      alert('Please enter an answer');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=answerQuery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queryId: answerQueryModal?.query.id,
          answerText: answerText.trim(),
          programId: program.id
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Query answered successfully!');
        setAnswerQueryModal(null);
        setAnswerText('');
        // Refresh the program data or trigger a callback
        if (onEdit) {
          onEdit(); // This will refresh the program data
        }
      } else {
        alert(data.error || 'Failed to answer query');
      }
    } catch (error) {
      alert('Failed to answer query');
    }
  };



  return (
    <>
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{t('program_details')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{program.title}</h1>
                <p className="text-gray-600">{program.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(program.status)}`}>
                {getStatusText(program.status)}
              </span>
            </div>
          </div>

          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">{t('total_budget')}</p>
                  <p className="text-xl font-bold text-blue-900">{formatCurrency(program.budget)}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">{t('duration')}</p>
                  <p className="text-sm font-semibold text-green-900">
                    {formatDate(program.startDate)} - {formatDate(program.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">{t('recipient')}</p>
                  <p className="text-sm font-semibold text-purple-900">{program.recipientName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('department')}</p>
                  <p className="text-sm font-semibold text-gray-900">{program.department}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600 font-medium">{t('submitted_by')}</p>
                  <p className="text-sm font-semibold text-gray-900">{program.submittedBy}</p>
                </div>
              </div>
            </div>

            {program.letterReferenceNumber && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-gray-600" />
                                  <div>
                  <p className="text-sm text-gray-600 font-medium">{t('letter_reference_number')}</p>
                  <p className="text-sm font-semibold text-gray-900">{program.letterReferenceNumber}</p>
                </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              {t('overall_progress')}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('completion_rate')}</span>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              {t('program_objectives')}
            </h3>
            {program.objectives && program.objectives.length > 0 ? (
              <div className="space-y-3">
                {program.objectives.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{objective}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">{t('no_objectives_defined')}</p>
              </div>
            )}
          </div>

          {/* KPI Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('key_performance_indicators')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {program.kpi && Array.isArray(program.kpi) && program.kpi.map((kpi, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {typeof kpi === 'string' ? kpi : 'KPI'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {typeof kpi === 'string' ? t('in_progress') : t('not_available')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: '50%' }}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-green-600">
                      50%
                    </span>
                  </div>
                </div>
              ))}
              {(!program.kpi || !Array.isArray(program.kpi) || program.kpi.length === 0) && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  {t('no_kpis_defined')}
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              {t('documents')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {program.documents && program.documents.length > 0 ? (() => {
                const latestByCategory: Record<string, any> = {};
                const others: any[] = [];
                program.documents.forEach((d: any) => {
                  if (d && typeof d === 'object' && (d as any).category) {
                    latestByCategory[(d as any).category] = d;
                  } else {
                    others.push(d);
                  }
                });
                const currentDocs: any[] = [...Object.values(latestByCategory), ...others];
                return currentDocs.map((document, index) => {
                  const fileName = typeof document === 'string' ? document : document.originalName;
                  const storedName = typeof document === 'string' ? document : document.storedName;
                  const category = typeof document === 'string' ? undefined : (document as any).category;
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">{category || fileName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {category && (
                          <button className="text-gray-600 hover:text-gray-900 p-1 rounded" title="View History" onClick={() => openHistory(category)}>
                            <History className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            // Use the ACTUAL stored filename from the database, not the display name
                            const actualFilename = storedName || fileName;
                            const documentViewUrl = `${window.location.origin}/api/get_document.php?file=${encodeURIComponent(actualFilename)}`;
                            window.open(documentViewUrl, '_blank');
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })() : (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  {t('no_documents_uploaded')}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('timeline')}</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">{t('created')}:</span>
                  <span className="ml-2 text-gray-600">{formatDate(program.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('last_updated')}:</span>
                  <span className="ml-2 text-gray-600">{formatDate(program.updatedAt)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('start_date')}:</span>
                  <span className="ml-2 text-gray-600">{formatDate(program.startDate)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">{t('end_date')}:</span>
                  <span className="ml-2 text-gray-600">{formatDate(program.endDate)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Finance Information */}
          {(program.status === 'approved' || program.voucherNumber || program.eftNumber || program.rejectionReason || program.budgetDeducted || (program.budgetDeductions && program.budgetDeductions.length > 0) || (program.queries && program.queries.length > 0)) && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                {t('finance_information')}
              </h3>
              <div className="space-y-4">
                {/* Queries and Answers */}
                {program.queries && program.queries.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">{t('queries_and_answers')}</h4>
                    <div className="space-y-3">
                      {program.queries.map((query: any, index: number) => (
                        <div key={index} className="border-l-4 border-purple-400 pl-3">
                          <div className="space-y-2">
                            {/* Query */}
                            <div className="bg-white p-3 rounded-md">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">Query from {query.queried_by_name}</p>
                                  <p className="text-xs text-gray-500">{formatDate(query.query_date)}</p>
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  query.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {query.status === 'pending' ? t('pending') : t('answered')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900">{query.query_text}</p>
                            </div>
                            
                            {/* Answer Query Button for Pending Queries */}
                            {query.status === 'pending' && (
                              <div className="ml-4 mt-2">
                                <button
                                  onClick={() => handleAnswerQuery(query, index)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                >
                                  {t('answer_query')}
                                </button>
                              </div>
                            )}
                            
                            {/* Answer */}
                            {query.status === 'answered' && query.answer_text && (
                              <div className="bg-green-50 p-3 rounded-md ml-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{t('answer_from')} {query.answered_by_name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(query.answered_at)}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-900">{query.answer_text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Approval Information */}
                {program.status === 'approved' && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">{t('approval_details')}</h4>
                    <div className="space-y-2 text-sm">
                      {program.voucherNumber ? (
                        <div>
                          <span className="font-medium text-gray-700">{t('voucher_number')}:</span>
                          <span className="ml-2 text-gray-900">{program.voucherNumber}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-gray-700">{t('voucher_number')}:</span>
                          <span className="ml-2 text-gray-500 italic">{t('not_yet_provided_by_finance')}</span>
                        </div>
                      )}
                      {program.eftNumber ? (
                        <div>
                          <span className="font-medium text-gray-700">{t('eft_number')}:</span>
                          <span className="ml-2 text-gray-900">{program.eftNumber}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-gray-700">{t('eft_number')}:</span>
                          <span className="ml-2 text-gray-500 italic">{t('not_yet_provided_by_finance')}</span>
                        </div>
                      )}
                      {program.approvedBy && (
                        <div>
                          <span className="font-medium text-gray-700">{t('approved_by')}:</span>
                          <span className="ml-2 text-gray-900">{t('finance')}</span>
                        </div>
                      )}
                      {program.approvedAt && (
                        <div>
                          <span className="font-medium text-gray-700">{t('approved_date')}:</span>
                          <span className="ml-2 text-gray-900">{formatDate(program.approvedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Information */}
                {program.rejectionReason && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">{t('rejection_details')}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">{t('rejection_reason')}:</span>
                        <p className="mt-1 text-gray-900">{program.rejectionReason}</p>
                      </div>
                      {program.rejectedBy && (
                        <div>
                          <span className="font-medium text-gray-700">{t('rejected_by')}:</span>
                          <span className="ml-2 text-gray-900">{t('finance')}</span>
                        </div>
                      )}
                      {program.rejectedAt && (
                        <div>
                          <span className="font-medium text-gray-700">{t('rejected_date')}:</span>
                          <span className="ml-2 text-gray-900">{formatDate(program.rejectedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Budget Deductions */}
                {program.budgetDeductions && program.budgetDeductions.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">{t('budget_deductions')}</h4>
                    <div className="space-y-3">
                      {program.budgetDeductions.map((deduction, index) => (
                        <div key={index} className="border-l-4 border-yellow-400 pl-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                RM {deduction.deductionAmount.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{deduction.deductionReason}</p>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                              <div>{t('by')}: {deduction.deductedByName}</div>
                              <div>{formatDate(deduction.deductionDate)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {t('close')}
            </button>
            {/* Only show Edit Program button for non-finance users and draft/queried programs */}
            {onEdit && user?.role !== 'Finance MMK' && user?.role !== 'finance_officer' && 
             ['draft', 'queried'].includes(program.status) && (
              <button 
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {t('edit_program')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    {historyModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('document_history')} - {historyModal.category}</h3>
            <button onClick={() => setHistoryModal(null)} className="p-2 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-3">
            {historyModal.items.length === 0 ? (
              <p className="text-gray-600">{t('no_history_available')}</p>
            ) : (
              historyModal.items.map((h: any, index: number) => {
                // Map category to proper document title
                const getDocumentTitle = (category: string) => {
                  const titleMap: { [key: string]: string } = {
                    'Surat Akuan Pusat Khidmat': 'Surat Akuan Pusat Khidmat',
                    'Surat Kelulusan Pkn': 'Surat Kelulusan Pkn',
                    'Surat Program': 'Surat Program',
                    'Surat Exco': 'Surat Exco',
                    'Penyata Akaun Bank': 'Penyata Akaun Bank',
                    'Borang Daftar Kod': 'Borang Daftar Kod'
                  };
                  return titleMap[category] || category;
                };
                
                const isCurrentVersion = index === historyModal.items.length - 1;
                
                return (
                  <div key={h.id} className={`flex items-center justify-between p-3 rounded ${isCurrentVersion ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900">
                          Version {h.version} • {getDocumentTitle(h.category)} • {h.original_name || h.stored_name}
                        </div>
                        {isCurrentVersion && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t('current_version')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{h.uploaded_by_name ? `${t('by')} ${h.uploaded_by_name} • ` : ''}{new Date(h.uploaded_at).toLocaleString()}</div>
                    </div>
                    <button onClick={() => window.open(`${API_ENDPOINTS.DOWNLOAD}?file=${encodeURIComponent(h.stored_name)}`, '_blank')} className="text-blue-600 hover:text-blue-800 p-1 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    )}

    {/* Answer Query Modal */}
    {answerQueryModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl w-full max-w-2xl">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('answer_query')}</h3>
            <button onClick={() => setAnswerQueryModal(null)} className="p-2 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('query')}:</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{answerQueryModal.query.query_text}</p>
                <p className="text-xs text-gray-500 mt-1">{t('from')}: {answerQueryModal.query.queried_by_name} • {formatDate(answerQueryModal.query.query_date)}</p>
              </div>
            </div>
            <div>
              <label htmlFor="answerText" className="block text-sm font-medium text-gray-700 mb-2">
                {t('your_answer')}:
              </label>
              <textarea
                id="answerText"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('enter_answer_placeholder')}
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setAnswerQueryModal(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={submitAnswer}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {t('submit_answer')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default ProgramDetail;