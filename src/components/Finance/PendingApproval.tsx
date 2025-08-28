import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, Eye, DollarSign } from 'lucide-react';
import ProgramDetail from '../Programs/ProgramDetail';
import { Program } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

const PendingApproval: React.FC = () => {
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Fetch finance programs (only submitted and beyond, no drafts)
  const fetchFinancePrograms = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getFinancePrograms`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Map backend data to frontend format
          const mappedPrograms = (data.programs || []).map((program: any) => ({
            id: program.id.toString(),
            title: program.title,
            description: program.description,
            department: program.department,
            recipientName: program.recipient_name,
            budget: parseFloat(program.budget),
            startDate: program.start_date,
            endDate: program.end_date,
            status: program.status,
            userId: program.user_id.toString(),
            submittedBy: program.submitted_by || program.user_name,
            submittedAt: program.submitted_at,
            objectives: Array.isArray(program.objectives) ? program.objectives : [],
            kpi: Array.isArray(program.kpi) ? program.kpi : [],
            documents: Array.isArray(program.documents) ? program.documents : (program.documents ? [program.documents] : []),
            createdAt: program.created_at,
            updatedAt: program.updated_at,
            letterReferenceNumber: program.letter_reference_number || program.reference_number
          }));
          setPrograms(mappedPrograms);
        }
      }
    } catch (error) {
      console.error('Error fetching finance programs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancePrograms();
  }, []);

  // Filter programs that are submitted (pending approval)
  const pendingPrograms = programs.filter(p => p.status === 'submitted');

  const filteredPrograms = pendingPrograms.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const handleApprove = async (programId: string) => {
    if (window.confirm(t('approve_program_confirmation'))) {
      try {
        const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=approveProgram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            programId: programId,
            voucherNumber: 'VOUCHER-' + Date.now(),
            eftNumber: 'EFT-' + Date.now()
          }),
        });

        if (response.ok) {
          alert(t('program_approved_successfully'));
          fetchFinancePrograms(); // Refresh the list
        } else {
          alert(t('failed_to_approve_program'));
        }
      } catch (error) {
        console.error('Error approving program:', error);
        alert(t('error_approving_program'));
      }
    }
  };

  const handleReject = async (programId: string) => {
    if (window.confirm(t('reject_program_confirmation'))) {
      try {
        const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=rejectProgram`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            programId: programId,
            rejectionReason: t('rejected_by_finance_review')
          }),
        });

        if (response.ok) {
          alert(t('program_rejected_successfully'));
          fetchFinancePrograms(); // Refresh the list
        } else {
          alert(t('failed_to_reject_program'));
        }
      } catch (error) {
        console.error('Error rejecting program:', error);
        alert(t('error_rejecting_program'));
      }
    }
  };

  const totalPendingBudget = pendingPrograms.reduce((sum, p) => sum + p.budget, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('program_approval_title')}</h1>
        <p className="text-gray-600">{t('program_approval_subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('pending_programs')}</p>
              <p className="text-3xl font-bold text-yellow-600">{pendingPrograms.length}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('total_pending_budget')}</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalPendingBudget)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('search_programs')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Pending Programs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('pending_approval')} ({filteredPrograms.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredPrograms.map((program) => (
            <div key={program.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{program.title}</h4>
                  <p className="text-gray-600 mb-3">{program.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">{t('budget')}:</span>
                      <span className="ml-2 text-gray-600 font-semibold">{formatCurrency(program.budget)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('recipient')}:</span>
                      <span className="ml-2 text-gray-600">{program.recipientName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('reference_number')}:</span>
                      <span className="ml-2 text-gray-600">{program.letterReferenceNumber || '-'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{t('date')}:</span>
                      <span className="ml-2 text-gray-600">{formatDate(program.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedProgram(program)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('view_details')}</span>
                    </button>
                    <button
                      onClick={() => handleApprove(program.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{t('approve')}</span>
                    </button>
                    <button
                      onClick={() => handleReject(program.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{t('reject')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPrograms.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('no_pending_programs')}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? t('no_programs_match_search')
                : t('all_programs_reviewed')
              }
            </p>
          </div>
        )}
      </div>

      {selectedProgram && (
        <ProgramDetail
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}
    </div>
  );
};

export default PendingApproval;