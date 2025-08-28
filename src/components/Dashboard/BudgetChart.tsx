import React from 'react';
import { Program } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface BudgetChartProps {
  programs: Program[];
}

const BudgetChart: React.FC<BudgetChartProps> = ({ programs }) => {
  const { t } = useLanguage();
  
  const budgetByDepartment = programs.reduce((acc, program) => {
    if (program.status === 'approved' || program.status === 'in-progress') {
      acc[program.department] = (acc[program.department] || 0) + program.budget;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = Object.values(budgetByDepartment).reduce((sum, budget) => sum + budget, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
  ];

  const departments = Object.entries(budgetByDepartment).map(([dept, budget], index) => ({
    department: dept,
    budget,
    percentage: totalBudget > 0 ? (budget / totalBudget) * 100 : 0,
    color: colors[index % colors.length]
  }));

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('budget_allocation_by_department')}</h3>
      
      <div className="space-y-4">
        {departments.map(({ department, budget, percentage, color }) => (
          <div key={department}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{department}</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(budget)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: color 
                }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{t('total_allocation')}</span>
          <span className="text-lg font-bold text-blue-600">{formatCurrency(totalBudget)}</span>
        </div>
      </div>
    </div>
  );
};

export default BudgetChart;