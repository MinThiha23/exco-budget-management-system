import React, { useState } from 'react';
import { Search, Filter, Plus, Grid, List } from 'lucide-react';
import ProgramCard from './ProgramCard';
import ProgramTable from './ProgramTable';
import ProgramDetail from './ProgramDetail';
import ProgramForm from './ProgramForm';

import { Program } from '../../types';
import { usePrograms } from '../../contexts/ProgramContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const ProgramList: React.FC = () => {
  const { user } = useAuth();
  const { programs, updateProgram, deleteProgram } = usePrograms();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');


  const userPrograms = user?.role === 'user' 
    ? programs.filter(p => p.userId === user.id)
    : programs;

  const filteredPrograms = userPrograms.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Under Review' },
    { value: 'queried', label: 'Query' },
    { value: 'answered_query', label: 'Query Answered' },
    { value: 'approved', label: 'Complete and can be sent to MMK office' },
    { value: 'mmk_accepted', label: 'Document Accepted by MMK Office' },
    { value: 'payment_in_progress', label: 'Payment in Progress' },
    { value: 'payment_completed', label: 'Payment Completed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
  };

  const handleDeleteProgram = async (programId: string) => {
    if (window.confirm('Are you sure you want to delete this charity program?')) {
      try {
        await deleteProgram(programId);
        console.log('Program deleted successfully');
      } catch (error) {
        console.error('Error deleting program:', error);
        alert('Failed to delete program. Please try again.');
      }
    }
  };

  const handleSubmitProgram = (program: Program) => {
    console.log('handleSubmitProgram called with program:', program);
    console.log('Program status:', program.status);
    console.log('Program ID:', program.id);
    
    // Enhanced browser confirm dialog that looks professional
    const confirmed = window.confirm(
      `Submit Program for Review\n\n` +
      `Are you sure you want to submit the program "${program.title}" for review?\n\n` +
      `This will:\n` +
      `• Change the program status to "Submitted"\n` +
      `• Send the program to Finance for approval\n` +
      `• Lock the program from further editing\n\n` +
      `Click OK to submit, Cancel to keep as draft.`
    );
    
    if (confirmed) {
      console.log('User confirmed submission');
      // Directly submit the program
      handleDirectSubmit(program);
    } else {
      console.log('User cancelled submission');
    }
  };

  const handleDirectSubmit = async (program: Program) => {
    console.log('handleDirectSubmit called for program:', program);
    console.log('Current program status:', program.status);
    
    try {
      // Update program status to submitted
      const updateData: Partial<Program> = {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      };
      console.log('Updating program with data:', updateData);
      
      await updateProgram(program.id, updateData);
      
      console.log('Program updated successfully');
      alert(`Program "${program.title}" has been submitted successfully!`);
      
      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Error submitting program:', error);
      alert('Failed to submit program. Please try again.');
    }
  };

  const handleCreateProgram = () => {
    setShowCreateForm(true);
  };



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'user' ? 'My Programs' : 'All Programs'}
          </h1>
          <p className="text-gray-600">
            Manage and monitor registered programs
          </p>
        </div>
        {user?.role === 'user' && (
          <button 
            onClick={handleCreateProgram}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Program</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
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

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              onView={() => setSelectedProgram(program)}
              onEdit={() => handleEditProgram(program)}
              onDelete={() => handleDeleteProgram(program.id)}
              onSubmit={() => handleSubmitProgram(program)}
              userRole={user?.role}
            />
          ))}
        </div>
      ) : (
        <ProgramTable
          programs={filteredPrograms}
          onView={(program) => setSelectedProgram(program)}
          onEdit={(program) => handleEditProgram(program)}
          onDelete={(programId) => handleDeleteProgram(programId)}
          onSubmit={(program) => handleSubmitProgram(program)}
          onAction={(program, action) => {
            // Handle any additional actions if needed
            console.log('Action:', action, 'for program:', program.id);
          }}
          userRole={user?.role}
        />
      )}

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Programs Found
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try changing your search criteria or filters'
              : 'No programs have been registered yet'
            }
          </p>
        </div>
      )}

      {selectedProgram && (
        <ProgramDetail
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
          onEdit={() => {
            setEditingProgram(selectedProgram);
            setSelectedProgram(null);
          }}

        />
      )}

      {editingProgram && (
        <ProgramForm
          program={editingProgram}
          onClose={() => setEditingProgram(null)}
          onSave={async (updatedProgram) => {
            try {
              if (updatedProgram) {
                await updateProgram(editingProgram.id, updatedProgram);
                setEditingProgram(null);
              }
            } catch (error) {
              console.error('Error updating program:', error);
              // Don't close the form if update failed
            }
          }}
        />
      )}

      {showCreateForm && (
        <ProgramForm
          onClose={() => setShowCreateForm(false)}
          onSave={() => setShowCreateForm(false)}
        />
      )}


    </div>
  );
};

export default ProgramList;