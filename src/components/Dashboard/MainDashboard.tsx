import React, { useState, useEffect } from 'react';
import { FolderOpen, CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';
import ClickableStatsCard from './ClickableStatsCard';
import StatsDetailModal from './StatsDetailModal';
import { useAuth } from '../../contexts/AuthContext';
import { usePrograms } from '../../contexts/ProgramContext';
import { Program } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

const MainDashboard: React.FC = () => {
  const { user } = useAuth();
  const { programs } = usePrograms();
  const { t } = useLanguage();
  const [financePrograms, setFinancePrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    programs: Program[];
    type: 'total' | 'approved' | 'submitted' | 'budget' | 'rejected' | 'budget_used' | 'remaining_budget';
  } | null>(null);

  // Fetch finance programs if user is finance role
  const fetchFinancePrograms = async () => {
  if (user?.role === 'Finance MMK' || user?.role === 'finance_officer') {
      setLoading(true);
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
              updatedAt: program.updated_at
            }));
            setFinancePrograms(mappedPrograms);
          }
        }
      } catch (error) {
        console.error('Error fetching finance programs:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFinancePrograms();
  }, [user?.role]);

  const userPrograms = user?.role === 'user' 
    ? programs.filter(p => p.userId === user.id)
        : user?.role === 'Finance MMK' || user?.role === 'finance_officer'
    ? financePrograms
    : programs;

  const stats = {
    totalPrograms: userPrograms.length,
    approvedPrograms: userPrograms.filter(p => p.status === 'approved').length,
    submittedPrograms: userPrograms.filter(p => p.status === 'submitted').length,
    totalBudget: userPrograms.reduce((sum, p) => sum + p.budget, 0),
    approvedBudget: userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0),
    submittedBudget: userPrograms.filter(p => p.status === 'submitted').reduce((sum, p) => sum + p.budget, 0)
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      queried: 'bg-orange-100 text-orange-800',
      answered_query: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      budget_deducted: 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      draft: 'Draft',
      submitted: 'Submitted',
      queried: 'Queried by Finance',
      answered_query: 'Query Answered',
      approved: 'Approved',
      rejected: 'Rejected',
      budget_deducted: 'Budget Deducted'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const handleCardClick = (type: 'total' | 'approved' | 'submitted' | 'budget' | 'rejected' | 'budget_used' | 'remaining_budget') => {
    let filteredPrograms: Program[] = [];
    let title = '';

    switch (type) {
      case 'total':
        filteredPrograms = userPrograms;
        title = 'Total Programs';
        break;
      case 'approved':
        filteredPrograms = userPrograms.filter(p => p.status === 'approved');
        title = 'Payment Completed Programs';
        break;
      case 'submitted':
        filteredPrograms = userPrograms.filter(p => p.status === 'submitted');
        title = 'Pending Programs';
        break;
      case 'rejected':
        filteredPrograms = userPrograms.filter(p => p.status === 'rejected');
        title = 'Rejected Programs';
        break;
      case 'budget':
        filteredPrograms = userPrograms;
        title = 'Total Expense';
        break;
      case 'budget_used':
        filteredPrograms = userPrograms.filter(p => p.status === 'approved');
        title = 'Budget Used';
        break;
      case 'remaining_budget':
        filteredPrograms = userPrograms.filter(p => p.status === 'approved');
        title = 'Remaining Budget';
        break;
    }

    setModalData({ title, programs: filteredPrograms, type });
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          {t('dashboard_summary')}
        </p>
      </div>

      {/* Top Row - Program Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <ClickableStatsCard
          title="Total Programs"
          value={stats.totalPrograms}
          icon={FolderOpen}
          color="blue"
          onClick={() => handleCardClick('total')}
        />
        <ClickableStatsCard
          title="Payment Completed Programs"
          value={userPrograms.filter(p => p.status === 'approved').length}
          icon={CheckCircle}
          color="green"
          onClick={() => handleCardClick('approved')}
        />
        <ClickableStatsCard
          title="Rejected Programs"
          value={userPrograms.filter(p => p.status === 'rejected').length}
          icon={XCircle}
          color="red"
          onClick={() => handleCardClick('rejected')}
        />
        <ClickableStatsCard
          title="Pending Programs"
          value={stats.submittedPrograms}
          icon={Clock}
          color="yellow"
          onClick={() => handleCardClick('submitted')}
        />
      </div>

      {/* Middle Row - Budget Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <ClickableStatsCard
          title="Total Expense"
          value={formatCurrency(stats.totalBudget)}
          subtitle="Available for programs"
          icon={DollarSign}
          color="blue"
          onClick={() => handleCardClick('budget')}
        />
        <ClickableStatsCard
          title="Budget Used"
          value={formatCurrency(userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0))}
          subtitle={`${stats.totalBudget > 0 ? ((userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0) / stats.totalBudget) * 100).toFixed(1) : '0.0'}% of total budget`}
          icon={FolderOpen}
          color="yellow"
          onClick={() => handleCardClick('budget_used')}
        />
        <ClickableStatsCard
          title="Remaining Budget"
          value={formatCurrency(Math.max(0, stats.totalBudget - userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0)))}
          subtitle={`Usage: ${stats.totalBudget > 0 ? ((userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0) / stats.totalBudget) * 100).toFixed(1) : '0.0'}% RM ${userPrograms.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.budget, 0).toLocaleString()} used`}
          icon={DollarSign}
          color="green"
          onClick={() => handleCardClick('remaining_budget')}
        />
      </div>



      {/* Recent Programs Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Programs</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Program Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userPrograms.slice(0, 5).map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{program.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(program.budget)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.recipientName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                      {getStatusText(program.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.submittedBy || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {program.submittedAt ? new Date(program.submittedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Detail Modal */}
      {modalData && (
        <StatsDetailModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setModalData(null);
          }}
          title={modalData.title}
          programs={modalData.programs}
          type={modalData.type}
        />
      )}
    </div>
  );
};

export default MainDashboard;