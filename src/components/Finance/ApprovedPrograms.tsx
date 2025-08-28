import React, { useState } from 'react';
import { Search, CheckCircle, Eye, DollarSign } from 'lucide-react';
import { usePrograms } from '../../contexts/ProgramContext';
import ProgramDetail from '../Programs/ProgramDetail';
import { Program } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const ApprovedPrograms: React.FC = () => {
  const { t } = useLanguage();
  const { programs } = usePrograms();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Filter programs that are approved
  const approvedPrograms = programs.filter(p => p.status === 'approved');

  const filteredPrograms = approvedPrograms.filter(program => {
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

  const totalApprovedBudget = approvedPrograms.reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('approved_programs_title')}</h1>
        <p className="text-gray-600">{t('approved_programs_subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('approved_programs')}</p>
              <p className="text-3xl font-bold text-green-600">{approvedPrograms.length}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{t('total_approved_budget')}</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalApprovedBudget)}</p>
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

      {/* Approved Programs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('approved_programs')} ({filteredPrograms.length})
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
                      <span className="font-medium text-gray-700">{t('approved_date')}:</span>
                      <span className="ml-2 text-gray-600">{formatDate(program.updatedAt)}</span>
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
              {t('no_approved_programs')}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? t('no_programs_match_search')
                : t('no_programs_approved_yet')
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

export default ApprovedPrograms;