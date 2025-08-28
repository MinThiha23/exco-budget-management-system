import React from 'react';
import { Program } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProgramChartProps {
  programs: Program[];
}

const ProgramChart: React.FC<ProgramChartProps> = ({ programs }) => {
  const { t } = useLanguage();
  
  const statusCounts = programs.reduce((acc, program) => {
    acc[program.status] = (acc[program.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusLabels = {
    draft: t('draft'),
    submitted: t('submitted'),
    queried: t('queried'),
    answered_query: t('query_answered'),
    approved: t('approved'),
    rejected: t('rejected'),
    budget_deducted: t('budget_deducted'),
    'in-progress': t('in_progress'),
    completed: t('completed')
  };

  const statusColors = {
    draft: '#64748b',
    submitted: '#3b82f6',
    queried: '#f59e0b',
    answered_query: '#fbbf24',
    approved: '#10b981',
    rejected: '#ef4444',
    budget_deducted: '#8b5cf6',
    'in-progress': '#3b82f6',
    completed: '#8b5cf6'
  };

  const total = programs.length;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('program_status')}</h3>
      
      <div className="space-y-4">
        {Object.entries(statusCounts).map(([status, count]) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: statusColors[status as keyof typeof statusColors] }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {statusLabels[status as keyof typeof statusLabels]}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900">{count}</span>
                <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{t('total_programs_dashboard')}</span>
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgramChart;