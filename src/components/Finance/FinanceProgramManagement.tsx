import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Program } from '../../types';
import { hasPermission } from '../../utils/permissions';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  FileText,
  Calendar,
  User,
  AlertCircle,
  Grid,
  List,
  ArrowLeft
} from 'lucide-react';
import ModernUserProgramsView from './ModernUserProgramsView';
import Pagination from './Pagination';
import StatusTimeline from '../Programs/StatusTimeline';


interface FinanceProgramManagementProps {}

const FinanceProgramManagement: React.FC<FinanceProgramManagementProps> = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [excoUsers, setExcoUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [actionType, setActionType] = useState<'query' | 'approve' | 'reject' | 'deduct' | 'accept_document' | null>(null);
  const [actionData, setActionData] = useState({
    query: '',
    voucherNumber: '',
    eftNumber: '',
    rejectionReason: '',
    deductionAmount: '',
    deductionReason: '',

  });
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedUserForExpense, setSelectedUserForExpense] = useState<any>(null);
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [showRemainingBudgetModal, setShowRemainingBudgetModal] = useState(false);
  const [selectedUserForRemainingBudget, setSelectedUserForRemainingBudget] = useState<any>(null);
  const [newRemainingBudgetAmount, setNewRemainingBudgetAmount] = useState('');
  const [queries, setQueries] = useState<any[]>([]);
  const [showQueries, setShowQueries] = useState(false);
  const [viewType, setViewType] = useState<'users' | 'programs'>('users');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExcoUser, setSelectedExcoUser] = useState<any>(null);
  const [userProgramView, setUserProgramView] = useState<'list' | 'modern'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [expandedTimelines, setExpandedTimelines] = useState<Set<string>>(new Set());

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const toggleTimeline = (programId: string) => {
    const newExpanded = new Set(expandedTimelines);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedTimelines(newExpanded);
  };

  useEffect(() => {
    fetchFinancePrograms();
  }, []);

  // Fetch EXCO users after programs are loaded so we can count them
  useEffect(() => {
    if (programs.length > 0) {
      fetchExcoUsers();
    }
  }, [programs]);

  const fetchExcoUsers = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.EXCO_USERS}`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Handle both "users" and "excoUsers" response formats
          const users = data.users || data.excoUsers || [];
          
          // Count programs for each user
          const usersWithProgramCounts = users.map((excoUser: any) => {
            // Count total programs for this user - use more precise matching
            const userPrograms = programs.filter(program => {
              if (!program.submittedBy) return false;
              
              // Extract the main name part from EXCO user (before the titles)
              const excoNameParts = excoUser.name.split(',').map((part: string) => part.trim());
              const mainExcoName = excoNameParts[0]; // "YB. Encik Wong Chia Zhen"
              
              // Extract the main name part from submitted_by (before the titles)
              const submittedNameParts = program.submittedBy.split(',').map((part: string) => part.trim());
              const mainSubmittedName = submittedNameParts[0]; // "YB. Prof. Dr. Haim Hilman Bin Abdullah"
              
              // Clean names for comparison (remove titles and extra spaces)
              const cleanExcoName = mainExcoName.replace(/^(YB\.|YAB|Dato'|Seri|Haji|Hajah|Prof\.|Dr\.|Tuan|Puan)\s+/gi, '').trim();
              const cleanSubmittedName = mainSubmittedName.replace(/^(YB\.|YAB|Dato'|Seri|Haji|Hajah|Prof\.|Dr\.|Tuan|Puan)\s+/gi, '').trim();
              
              // Only match if the cleaned names are exactly the same
              return cleanExcoName === cleanSubmittedName;
            });
            
            const totalPrograms = userPrograms.length;
            const pendingPrograms = userPrograms.filter(p => p.status === 'submitted').length;
            const totalExpense = userPrograms.reduce((sum, p) => sum + (p.budget || 0), 0);
            const remainingBudget = 10000 - totalExpense; // Default budget minus expenses
            
            return {
              ...excoUser,
              total_programs: totalPrograms,
              pending_programs: pendingPrograms,
              total_expense: totalExpense,
              remaining_budget: Math.max(0, remainingBudget)
            };
          });
          
          setExcoUsers(usersWithProgramCounts);
        }
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  const fetchQueries = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getFinanceQueries`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQueries(data.queries || []);
        }
      }
    } catch (error) {
      // Handle error silently or show user-friendly message
    }
  };

  useEffect(() => {
    if (showQueries) {
      fetchQueries();
    }
  }, [showQueries]);

  const fetchFinancePrograms = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getFinancePrograms&t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
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
            voucherNumber: program.voucher_number,
            eftNumber: program.eft_number,
            letterReferenceNumber: program.letter_reference_number || program.reference_number,
            approvedBy: program.approver_name,
            approvedAt: program.approved_at,
            rejectedBy: program.rejector_name,
            rejectedAt: program.rejected_at,
            rejectionReason: program.rejection_reason,
            budgetDeducted: program.budget_deducted,
            queries: (program.queries || []).map((query: any) => ({
              queryText: query.query_text,
              queriedByName: query.queried_by_name,
              queryDate: query.query_date,
              answerText: query.answer_text,
              answeredByName: query.answered_by_name,
              answeredAt: query.answered_at,
              status: query.status
            })),
            budgetDeductions: (program.budget_deductions || []).map((deduction: any) => ({
              deductionAmount: parseFloat(deduction.deduction_amount),
              deductionReason: deduction.deduction_reason,
              deductedByName: deduction.deducted_by_name,
              deductionDate: deduction.deduction_date
            }))
                      }));
            setPrograms(mappedPrograms);
          }
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleView = (program: Program) => {
    setSelectedProgram(program);
    setShowViewModal(true);
  };

  const handleAction = (program: Program, type: 'query' | 'approve' | 'reject' | 'deduct' | 'accept_document') => {
    setSelectedProgram(program);
    setActionType(type);
    setShowActionModal(true);
    setActionData({
      query: '',
      voucherNumber: '',
      eftNumber: '',
      rejectionReason: '',
      deductionAmount: '',
      deductionReason: '',

    });
  };

  const submitAction = async () => {
    if (!selectedProgram) return;

    try {
      let endpoint = '';
      let payload: any = { programId: selectedProgram.id };

      switch (actionType) {
        case 'query':
          endpoint = 'createQuery';
          payload.query = actionData.query;
          payload.queried_by = user?.id || 1;
          break;
        case 'approve':
          endpoint = 'approveProgram';
          payload.voucherNumber = actionData.voucherNumber;
          payload.eftNumber = actionData.eftNumber;
          break;
        case 'reject':
          endpoint = 'rejectProgram';
          payload.rejectionReason = actionData.rejectionReason;
          break;
        case 'deduct':
          endpoint = 'deductBudget';
          payload.amount = actionData.deductionAmount;
          payload.reason = actionData.deductionReason;
          break;
        case 'accept_document':
          endpoint = 'acceptDocument';
          break;

      }

      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowActionModal(false);
          fetchFinancePrograms();
        }
      }
    } catch (error) {
      // Handle error silently
    }
  };

  const handleEditExpense = (user: any) => {
    setSelectedUserForExpense(user);
    setNewExpenseAmount(user.total_expense ? user.total_expense.toString() : '0');
    setShowExpenseModal(true);
  };

  const handleEditRemainingBudget = (user: any) => {
    setSelectedUserForRemainingBudget(user);
    setNewRemainingBudgetAmount(user.remaining_budget ? user.remaining_budget.toString() : '10000');
    setShowRemainingBudgetModal(true);
  };

  const submitExpenseUpdate = async () => {
    if (!selectedUserForExpense || !newExpenseAmount) return;

    try {
      const amount = parseFloat(newExpenseAmount);
      if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid expense amount');
        return;
      }

      // Update the user's expense in the local state
      const updatedUsers = excoUsers.map(u => {
        if (u.id === selectedUserForExpense.id) {
          const newTotalExpense = amount;
          const newRemainingBudget = Math.max(0, 10000 - newTotalExpense);
          return {
            ...u,
            total_expense: newTotalExpense,
            remaining_budget: newRemainingBudget
          };
        }
        return u;
      });

      setExcoUsers(updatedUsers);
      setShowExpenseModal(false);
      setSelectedUserForExpense(null);
      setNewExpenseAmount('');

      // Here you could also make an API call to update the expense in the database
      // For now, we're just updating the local state
      alert(`Expense updated successfully for ${selectedUserForExpense.name}`);
    } catch (error) {
      alert('Failed to update expense');
    }
  };

  const submitRemainingBudgetUpdate = async () => {
    if (!selectedUserForRemainingBudget || !newRemainingBudgetAmount) return;

    try {
      const amount = parseFloat(newRemainingBudgetAmount);
      if (isNaN(amount) || amount < 0) {
        alert('Please enter a valid remaining budget amount');
        return;
      }

      // Update the user's remaining budget in the local state
      const updatedUsers = excoUsers.map(u => {
        if (u.id === selectedUserForRemainingBudget.id) {
          const newRemainingBudget = amount;
          const newTotalExpense = Math.max(0, 10000 - newRemainingBudget);
          return {
            ...u,
            remaining_budget: newRemainingBudget,
            total_expense: newTotalExpense
          };
        }
        return u;
      });

      setExcoUsers(updatedUsers);
      setShowRemainingBudgetModal(false);
      setSelectedUserForRemainingBudget(null);
      setNewRemainingBudgetAmount('');

      // Here you could also make an API call to update the remaining budget in the database
      // For now, we're just updating the local state
      alert(`Remaining budget updated successfully for ${selectedUserForRemainingBudget.name}`);
    } catch (error) {
      alert('Failed to update remaining budget');
    }
  };

  // Filter programs based on search and status
  const filteredPrograms = programs.filter(program => {
    const matchesSearch = searchTerm === '' || 
                         program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (program.submittedBy && program.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrograms = filteredPrograms.slice(startIndex, endIndex);

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'submitted', label: 'Under Review' },
    { value: 'queried', label: 'Query' },
    { value: 'answered_query', label: 'Query Answered' },
    { value: 'approved', label: 'Complete and can be sent to MMK office' },
    { value: 'mmk_accepted', label: 'Document Accepted by MMK Office' },
    { value: 'payment_in_progress', label: 'Payment in Progress' },
    { value: 'payment_completed', label: 'Payment Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('program_management_title')}</h1>
        <p className="text-gray-600 dark:text-gray-200">{t('program_management_subtitle')}</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('pending_review')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {programs.filter(p => p.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('queried')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {programs.filter(p => p.status === 'queried').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('approved')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {programs.filter(p => p.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('rejected')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {programs.filter(p => p.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
             </div>

      {/* View Type Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('view_options')}</h2>
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewType('users')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewType === 'users' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('exco_users_budgets')}
              </button>
              <button
                onClick={() => setViewType('programs')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  viewType === 'programs' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('program_list')}
              </button>
            </div>
          </div>
        </div>
             </div>

       {/* Queries Section */}
       <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
         <div className="px-6 py-4 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold text-gray-900 flex items-center">
               <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              {t('program_queries')}
               {queries.filter(q => q.status === 'pending').length > 0 && (
                 <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                   {queries.filter(q => q.status === 'pending').length} Pending
                 </span>
               )}
             </h2>
             <button
               onClick={() => setShowQueries(!showQueries)}
               className="text-blue-600 hover:text-blue-800 text-sm font-medium"
             >
               {showQueries ? 'Hide Queries' : 'Show Queries'}
             </button>
           </div>
         </div>

         {showQueries && (
           <div className="p-6">
             {queries.length === 0 ? (
               <p className="text-gray-500 text-center py-4">No queries found.</p>
             ) : (
               <div className="space-y-4">
                 {queries.map(query => (
                   <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <div className="flex items-center space-x-2 mb-2">
                           <h3 className="font-medium text-gray-900">{query.program_title}</h3>
                           <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                             query.status === 'pending' 
                               ? 'bg-yellow-100 text-yellow-800' 
                               : 'bg-green-100 text-green-800'
                           }`}>
                             {query.status === 'pending' ? 'Pending Answer' : 'Answered'}
                           </span>
                         </div>
                         <p className="text-sm text-gray-600 mb-2">
                           <strong>Program Owner:</strong> {query.program_owner_name} • 
                           <strong>Query from:</strong> {query.queried_by_name} • {new Date(query.query_date).toLocaleDateString()}
                         </p>
                         <div className="bg-gray-50 p-3 rounded-md mb-3">
                           <p className="text-sm text-gray-900">{query.query_text}</p>
                         </div>
                         
                         {query.status === 'answered' && query.answer_text && (
                           <div className="bg-green-50 p-3 rounded-md">
                             <p className="text-sm text-gray-600 mb-1">
                               <strong>Answer from {query.program_owner_name}:</strong> {new Date(query.answered_at).toLocaleDateString()}
                             </p>
                             <p className="text-sm text-gray-900">{query.answer_text}</p>
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
         )}
      </div>

      {/* Conditional Content Based on View Type */}
      {viewType === 'users' ? (
        /* EXCO Users Budgets Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('exco_users_budgets')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('exco_users_budgets_subtitle')}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('total_programs')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('pending_programs')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('total_expense')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('remaining_budget')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {excoUsers.map((excoUser) => (
                  <tr key={excoUser.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{excoUser.name}</div>
                      <div className="text-sm text-gray-500">{excoUser.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {excoUser.total_programs || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {excoUser.pending_programs || 0}
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2">
                         <span>RM {excoUser.total_expense ? excoUser.total_expense.toLocaleString() : '0.00'}</span>
                         {hasPermission(user?.role as any, 'canDeductBudget') && (
                           <button
                             onClick={() => handleEditExpense(excoUser)}
                             className="text-blue-600 hover:text-blue-900 flex items-center"
                             title={t('edit_expense')}
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                             </svg>
                           </button>
                         )}
                       </div>
                     </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center space-x-2">
                         <span>RM {excoUser.remaining_budget ? excoUser.remaining_budget.toLocaleString() : '0.00'}</span>
                         {hasPermission(user?.role as any, 'canDeductBudget') && (
                           <button
                             onClick={() => handleEditRemainingBudget(excoUser)}
                             className="text-green-600 hover:text-green-900 flex items-center"
                             title={t('edit_remaining_budget')}
                           >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                             </svg>
                           </button>
                         )}
                       </div>
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setViewType('programs');
                          setSelectedExcoUser(excoUser);
                          setUserProgramView('modern');
                          // Filter programs for this specific user
                          setSearchTerm(excoUser.name);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title={t('view_user_programs')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Programs List */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{t('programs_for_review')}</h2>
                {selectedExcoUser && (
                  <p className="text-sm text-gray-600 mt-1">
                    {t('programs_for')} {selectedExcoUser.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setViewType('users');
                  setSelectedExcoUser(null);
                  setUserProgramView('list');
                  setSearchTerm('');
                }}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('back_to_exco_users')}</span>
              </button>
            </div>
       </div>

       {/* Search and Filter Controls */}
         <div className="px-6 py-4 border-b border-gray-200">
           <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
             <div className="relative flex-1 max-w-md">
               <input
                 type="text"
                  placeholder={t('search_programs')}
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               />
             </div>
             <div className="flex items-center space-x-4">
               {userProgramView === 'modern' ? (
                 <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                   <button
                     onClick={() => setUserProgramView('list')}
                     className="bg-white text-blue-600 shadow-sm p-2 rounded-md transition-colors"
                   >
                     <List className="w-4 h-4" />
                   </button>
                   <button
                     className="bg-blue-600 text-white shadow-sm p-2 rounded-md transition-colors"
                   >
                     <Grid className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
               <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                 <button
                   onClick={() => setViewMode('card')}
                   className={`p-2 rounded-md transition-colors ${
                     viewMode === 'card' 
                       ? 'bg-white text-blue-600 shadow-sm' 
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
                 >
                   <Grid className="w-4 h-4" />
                 </button>
                 <button
                   onClick={() => setViewMode('table')}
                   className={`p-2 rounded-md transition-colors ${
                     viewMode === 'table' 
                       ? 'bg-white text-blue-600 shadow-sm' 
                       : 'text-gray-600 hover:text-gray-900'
                   }`}
                 >
                   <List className="w-4 h-4" />
                 </button>
               </div>
               )}
               <div className="flex items-center space-x-2">
                 <select
                   value={statusFilter}
                   onChange={(e) => setStatusFilter(e.target.value)}
                   className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   {statusOptions.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
             </div>
           </div>
         </div>
       </div>

                    {/* Programs Display */}
                    {userProgramView === 'modern' && selectedExcoUser ? (
                      <ModernUserProgramsView
                        selectedExcoUser={selectedExcoUser}
                        filteredPrograms={currentPrograms}
                        onBack={() => {
                          setViewType('users');
                          setSelectedExcoUser(null);
                          setUserProgramView('list');
                          setSearchTerm('');
                        }}
                        onView={handleView}
                        onAction={handleAction}
                        userRole={user?.role}
                      />
                                            ) : currentPrograms.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                                  ? t('no_programs_match_search')
                                  : t('no_programs_available')
              }
            </p>
          </div>
                                ) : viewMode === 'card' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                            {currentPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{program.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{program.description?.substring(0, 100)}...</p>
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm text-gray-500">ID: {program.id}</span>
                      <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{t('by')}: {program.submittedBy || 'N/A'}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {program.submittedAt ? new Date(program.submittedAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                      {getStatusText(program.status)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(program)}
                    className="text-blue-600 hover:text-blue-900 flex items-center"
                      title={t('view')}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {hasPermission(user?.role as any, 'canQueryProgram') && (
                    <button
                      onClick={() => handleAction(program, 'query')}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                        title={t('query')}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission(user?.role as any, 'canApproveProgram') && (
                    <button
                      onClick={() => handleAction(program, 'approve')}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                        title={t('approve')}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission(user?.role as any, 'canRejectProgram') && (
                    <button
                      onClick={() => handleAction(program, 'reject')}
                      className="text-red-600 hover:text-red-900 flex items-center"
                        title={t('reject')}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission(user?.role as any, 'canDeductBudget') && (
                    <button
                      onClick={() => handleAction(program, 'deduct')}
                      className="text-purple-600 hover:text-purple-900 flex items-center"
                        title={t('deduct_budget')}
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                  )}
                  {user?.role === 'Finance MMK' && program.status === 'approved' && (
                    <button
                      onClick={() => handleAction(program, 'accept_document')}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      title="Accept document (skip MMK review)"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Program Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget (RM)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      EXCO Letter Reference Number
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
                      EFT Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPrograms.map((program, index) => (
                  <React.Fragment key={program.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{program.title}</div>
                          <div className="text-sm text-gray-500">{program.description?.substring(0, 50)}...</div>
                          </div>
                          <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.budget?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.recipientName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {program.letterReferenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                          {getStatusText(program.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.voucherNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.eftNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {program.eftNumber ? new Date(program.updatedAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(program)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                              title={t('view')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {hasPermission(user?.role as any, 'canQueryProgram') && (
                            <button
                              onClick={() => handleAction(program, 'query')}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                                title={t('query')}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission(user?.role as any, 'canApproveProgram') && (
                            <button
                              onClick={() => handleAction(program, 'approve')}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title={t('approve')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission(user?.role as any, 'canRejectProgram') && (
                            <button
                              onClick={() => handleAction(program, 'reject')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                                title={t('reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          {hasPermission(user?.role as any, 'canDeductBudget') && (
                            <button
                              onClick={() => handleAction(program, 'deduct')}
                              className="text-purple-600 hover:text-purple-900 flex items-center"
                                title={t('deduct_budget')}
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          {user?.role === 'Finance MMK' && program.status === 'approved' && (
                            <button
                              onClick={() => handleAction(program, 'accept_document')}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              title="Accept document (skip MMK review)"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={11} className="p-0">
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
          
        )}
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPrograms.length}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
        />
      </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Program Details: {selectedProgram.title}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{t('basic_information')}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('title')}:</label>
                        <p className="text-sm text-gray-900">{selectedProgram.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('description')}:</label>
                        <p className="text-sm text-gray-900">{selectedProgram.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('department')}:</label>
                        <p className="text-sm text-gray-900">{selectedProgram.department}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('recipient_name')}:</label>
                        <p className="text-sm text-gray-900">{selectedProgram.recipientName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('budget')}:</label>
                        <p className="text-sm text-gray-900">RM {selectedProgram.budget?.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('status')}:</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProgram.status)}`}>
                          {getStatusText(selectedProgram.status)}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('reference_number')}:</label>
                        <p className="text-sm text-gray-900">{selectedProgram.letterReferenceNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">{t('timeline')}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('start_date')}:</label>
                        <p className="text-sm text-gray-900">
                          {selectedProgram.startDate ? new Date(selectedProgram.startDate).toLocaleDateString() : t('not_available')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('end_date')}:</label>
                        <p className="text-sm text-gray-900">
                          {selectedProgram.endDate ? new Date(selectedProgram.endDate).toLocaleDateString() : t('not_available')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">{t('submitted_at')}:</label>
                        <p className="text-sm text-gray-900">
                          {selectedProgram.submittedAt ? new Date(selectedProgram.submittedAt).toLocaleDateString() : t('not_available')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Objectives and KPIs */}
                <div className="space-y-4">
                  <div>
                     <h4 className="text-lg font-medium text-gray-900 mb-2">{t('objectives')}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedProgram.objectives && selectedProgram.objectives.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedProgram.objectives.map((objective, index) => (
                            <li key={index} className="text-sm text-gray-900">{objective}</li>
                          ))}
                        </ul>
                      ) : (
                         <p className="text-sm text-gray-500">{t('no_objectives_defined')}</p>
                      )}
                    </div>
                  </div>

                  <div>
                     <h4 className="text-lg font-medium text-gray-900 mb-2">{t('key_performance_indicators')}</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedProgram.kpi && selectedProgram.kpi.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {selectedProgram.kpi.map((kpi, index) => (
                            <li key={index} className="text-sm text-gray-900">{kpi}</li>
                          ))}
                        </ul>
                      ) : (
                         <p className="text-sm text-gray-500">{t('no_kpis_defined')}</p>
                      )}
                    </div>
                  </div>

                                       {/* Documents Section */}
                   <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{t('documents')}</h4>
                     <div className="bg-gray-50 p-4 rounded-lg">
                       {selectedProgram.documents && selectedProgram.documents.length > 0 ? (
                          <div className="space-y-2">
                            {selectedProgram.documents.map((document, index) => {
                              const documentName = typeof document === 'string' ? document : document.originalName || 'Document';
                              let documentUrl = typeof document === 'string' ? document : document.storedName || '';
                              

                              
                               return (
                                <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm text-gray-900">{documentName}</span>
                                                                     <div className="flex space-x-2">
                                     <button
                                       onClick={() => {
                                         // Use the ACTUAL stored filename from the database, not the display name
                                         const actualFilename = typeof document === 'string' ? document : document.storedName || '';
                                         const documentViewUrl = `${window.location.origin}/api/get_document.php?file=${encodeURIComponent(actualFilename)}`;
                                         window.open(documentViewUrl, '_blank');
                                       }}
                                       className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                     >
                                       {t('view')}
                                     </button>
                                     
                                   </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t('no_documents_uploaded')}</p>
                        )}
                   </div>
                </div>
              </div>

                 {/* Queries Section */}
                 <div>
                   <h4 className="text-lg font-medium text-gray-900 mb-2">{t('queries')}</h4>
                   <div className="bg-gray-50 p-4 rounded-lg">
                     {selectedProgram.queries && selectedProgram.queries.length > 0 ? (
                         <div className="space-y-3">
                         {selectedProgram.queries.map((query, index) => (
                           <div key={index} className="border rounded p-3 bg-white">
                                   <div className="flex justify-between items-start mb-2">
                               <span className="text-sm font-medium text-gray-700">
                                 Query by {query.queriedByName}
                               </span>
                               <span className="text-xs text-gray-500">
                                 {new Date(query.queryDate).toLocaleDateString()}
                               </span>
                                     </div>
                             <p className="text-sm text-gray-600 mb-2">{query.queryText}</p>
                             {query.answerText && query.answeredAt && (
                               <div className="bg-green-50 p-2 rounded">
                                 <span className="text-sm font-medium text-gray-700">
                                   Answer by {query.answeredByName}:
                                 </span>
                                 <p className="text-sm text-gray-600 mt-1">{query.answerText}</p>
                                 <span className="text-xs text-gray-500">
                                   {new Date(query.answeredAt).toLocaleDateString()}
                                     </span>
                                   </div>
                             )}
                             </div>
                           ))}
                         </div>
                     ) : (
                       <p className="text-sm text-gray-500">{t('no_queries')}</p>
                     )}
                             </div>
                             </div>
                             </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedProgram && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'query' && t('query_program')}
                  {actionType === 'approve' && t('approve_program')}
                  {actionType === 'reject' && t('reject_program')}
                  {actionType === 'deduct' && t('deduct_budget')}
              </h3>
                <button
                  onClick={() => setShowActionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

                             {actionType === 'query' && (
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('query_message')}
                   </label>
                   <textarea
                     value={actionData.query}
                     onChange={(e) => setActionData({...actionData, query: e.target.value})}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     rows={4}
                     placeholder="Enter your query..."
                   />
                 </div>
               )}

              {actionType === 'approve' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voucher Number
                    </label>
                    <input
                      type="text"
                      value={actionData.voucherNumber}
                      onChange={(e) => setActionData({...actionData, voucherNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter voucher number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EFT Number
                    </label>
                    <input
                      type="text"
                      value={actionData.eftNumber}
                      onChange={(e) => setActionData({...actionData, eftNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter EFT number"
                    />
                  </div>
                </div>
              )}

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={actionData.rejectionReason}
                    onChange={(e) => setActionData({...actionData, rejectionReason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Enter rejection reason..."
                  />
                </div>
              )}

              {actionType === 'deduct' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deduction Amount (RM)
                    </label>
                    <input
                      type="number"
                      value={actionData.deductionAmount}
                      onChange={(e) => setActionData({...actionData, deductionAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deduction Reason
                    </label>
                    <textarea
                      value={actionData.deductionReason}
                      onChange={(e) => setActionData({...actionData, deductionReason: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter deduction reason..."
                    />
                  </div>
                </div>
              )}



              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAction}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

             {/* Expense Edit Modal */}
       {showExpenseModal && selectedUserForExpense && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-gray-900">
                   Edit Total Expense
                 </h3>
                 <button
                   onClick={() => setShowExpenseModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               <div className="mb-4">
                 <p className="text-sm text-gray-600 mb-2">
                   User: <span className="font-medium">{selectedUserForExpense.name}</span>
                 </p>
                 <p className="text-sm text-gray-700 mb-2">
                   Department: <span className="font-medium">{selectedUserForExpense.department}</span>
                 </p>
               </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                   Current Total Expense
                  </label>
                 <p className="text-lg font-semibold text-gray-900">
                   RM {selectedUserForExpense.total_expense ? selectedUserForExpense.total_expense.toLocaleString() : '0.00'}
                 </p>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   New Total Expense (RM)
                 </label>
                 <input
                   type="number"
                   value={newExpenseAmount}
                   onChange={(e) => setNewExpenseAmount(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Enter new expense amount"
                   min="0"
                   step="0.01"
                  />
                </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   New Remaining Budget
                 </label>
                 <p className="text-lg font-semibold text-blue-600">
                   RM {newExpenseAmount ? Math.max(0, 10000 - parseFloat(newExpenseAmount)).toLocaleString() : '10,000.00'}
                 </p>
               </div>

               <div className="flex justify-end space-x-3">
                <button
                   onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                   onClick={submitExpenseUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                   Update Expense
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Remaining Budget Edit Modal */}
       {showRemainingBudgetModal && selectedUserForRemainingBudget && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
             <div className="mt-3">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-gray-900">
                   Edit Remaining Budget
                 </h3>
                 <button
                   onClick={() => setShowRemainingBudgetModal(false)}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               
               <div className="mb-4">
                 <p className="text-sm text-gray-600 mb-2">
                   User: <span className="font-medium">{selectedUserForRemainingBudget.name}</span>
                 </p>
                 <p className="text-sm text-gray-600 mb-2">
                   Department: <span className="font-medium">{selectedUserForRemainingBudget.department}</span>
                 </p>
               </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Current Remaining Budget
                 </label>
                 <p className="text-lg font-semibold text-gray-900">
                   RM {selectedUserForRemainingBudget.remaining_budget ? selectedUserForRemainingBudget.remaining_budget.toLocaleString() : '10,000.00'}
                 </p>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   New Remaining Budget (RM)
                 </label>
                 <input
                   type="number"
                   value={newRemainingBudgetAmount}
                   onChange={(e) => setNewRemainingBudgetAmount(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                   placeholder="Enter new remaining budget amount"
                   min="0"
                   step="0.01"
                 />
               </div>

               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   New Total Expense
                 </label>
                 <p className="text-lg font-semibold text-green-600">
                   RM {newRemainingBudgetAmount ? Math.max(0, 10000 - parseFloat(newRemainingBudgetAmount)).toLocaleString() : '0.00'}
                 </p>
               </div>

               <div className="flex justify-end space-x-3">
                 <button
                   onClick={() => setShowRemainingBudgetModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={submitRemainingBudgetUpdate}
                   className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                 >
                   Update Remaining Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceProgramManagement; 
