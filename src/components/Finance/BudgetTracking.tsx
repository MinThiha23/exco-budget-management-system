import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Program } from '../../types';
import { API_ENDPOINTS } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

const BudgetTracking: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

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
            updatedAt: program.updated_at
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

  const approvedPrograms = programs.filter(p => p.status === 'approved');
  const submittedPrograms = programs.filter(p => p.status === 'submitted');
  const rejectedPrograms = programs.filter(p => p.status === 'rejected');
  // Treat any non-approved and non-rejected program as pending (e.g., submitted, queried, answered_query)
  const pendingPrograms = programs.filter(p => p.status !== 'approved' && p.status !== 'rejected');

  const totalBudget = programs.reduce((sum, p) => sum + p.budget, 0);
  const approvedBudget = approvedPrograms.reduce((sum, p) => sum + p.budget, 0);
  const submittedBudget = submittedPrograms.reduce((sum, p) => sum + p.budget, 0);
  const rejectedBudget = rejectedPrograms.reduce((sum, p) => sum + p.budget, 0);
  const pendingBudget = pendingPrograms.reduce((sum, p) => sum + p.budget, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const budgetByDepartment = programs.reduce((acc, program) => {
    if (program.status === 'approved') {
      acc[program.department] = (acc[program.department] || 0) + program.budget;
    }
    return acc;
  }, {} as Record<string, number>);

  const departmentEntries = Object.entries(budgetByDepartment).map(([dept, budget]) => ({
    department: dept,
    budget,
    percentage: approvedBudget > 0 ? (budget / approvedBudget) * 100 : 0
  }));

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('budget_tracking_title')}</h1>
        <p className="text-gray-600">{t('budget_tracking_subtitle')}</p>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('total_budget')}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('approved_budget')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(approvedBudget)}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('submitted_budget')}</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(submittedBudget)}</p>
            </div>
            <div className="bg-yellow-500 p-3 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('rejected_budget')}</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(rejectedBudget)}</p>
            </div>
            <div className="bg-red-500 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Allocation by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('budget_allocation_by_department')}</h3>
          
          <div className="space-y-4">
            {departmentEntries.map(({ department, budget, percentage }) => (
              <div key={department}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{department}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(budget)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>

          {departmentEntries.length === 0 && (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No approved programs yet</p>
            </div>
          )}
        </div>

        {/* Budget Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('budget_summary')}</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">{t('approved_programs_budget')}</p>
                <p className="text-xs text-green-600">{approvedPrograms.length} programs</p>
              </div>
              <p className="text-lg font-bold text-green-700">{formatCurrency(approvedBudget)}</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-800">{t('pending_programs_budget')}</p>
                <p className="text-xs text-yellow-600">{pendingPrograms.length} programs</p>
              </div>
              <p className="text-lg font-bold text-yellow-700">{formatCurrency(pendingBudget)}</p>
            </div>

            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-800">{t('rejected_programs_budget')}</p>
                <p className="text-xs text-red-600">{rejectedPrograms.length} programs</p>
              </div>
              <p className="text-lg font-bold text-red-700">{formatCurrency(rejectedBudget)}</p>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">{t('total_budget_requested')}</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracking;