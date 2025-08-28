import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Grid, List, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import ProgramCard from './ProgramCard';
import ProgramTable from './ProgramTable';
import ProgramDetail from './ProgramDetail';
import ProgramForm from './ProgramForm';
import Pagination from '../Finance/Pagination';

import { Program } from '../../types';
import { usePrograms } from '../../contexts/ProgramContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { API_ENDPOINTS } from '../../config/api';

interface Query {
  id: number;
  program_id: number;
  program_title: string;
  program_status: string;
  queried_by_name: string;
  answered_by_name: string | null;
  query_text: string;
  answer_text: string | null;
  query_date: string;
  answered_at: string | null;
  status: 'pending' | 'answered';
}

const MyPrograms: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { programs, updateProgram, deleteProgram, refreshPrograms } = usePrograms();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [queries, setQueries] = useState<Query[]>([]);
  const [showQueries, setShowQueries] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [programToSubmit, setProgramToSubmit] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Filter programs to show only user's own programs
  const userPrograms = programs.filter(p => p.userId === user?.id);
  


  const filteredPrograms = userPrograms.filter(program => {
    const matchesSearch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrograms = filteredPrograms.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
    // Only allow editing of draft and queried programs
    if (!['draft', 'queried'].includes(program.status)) {
      alert('This program can only be edited when it is in draft or queried status.');
      return;
    }
    setEditingProgram(program);
  };

  const handleDeleteProgram = async (programId: string) => {
    // Find the program to delete
    const program = userPrograms.find(p => p.id === programId);
    if (program) {
      // Prevent deletion of non-draft programs
      if (program.status !== 'draft') {
        alert('Only draft programs can be deleted.');
        return;
      }
      setProgramToDelete(program);
      setShowDeleteConfirmModal(true);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;
    
    try {
      await deleteProgram(programToDelete.id);
      console.log('Program deleted successfully');
      // Close the modal
      setShowDeleteConfirmModal(false);
      setProgramToDelete(null);
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const handleSubmitProgram = async (programId: string) => {
    // Find the program to submit
    const program = userPrograms.find(p => p.id === programId);
    if (program) {
      // Prevent submission of non-draft programs
      if (program.status !== 'draft') {
        alert('Only draft programs can be submitted for review.');
        return;
      }
      setProgramToSubmit(program);
      setShowSubmitConfirmModal(true);
    }
  };

  const confirmSubmitProgram = async () => {
    if (!programToSubmit) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          program_id: programToSubmit.id,
          user_id: user?.id,
          submitted_by: user?.name
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Program submitted successfully for finance review!');
        // Refresh the programs list
        await refreshPrograms();
        // Close the modal
        setShowSubmitConfirmModal(false);
        setProgramToSubmit(null);
      } else {
        alert('Failed to submit program: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting program:', error);
      alert('Failed to submit program. Please try again.');
    }
  };

  const handleCreateProgram = () => {
    setShowCreateForm(true);
  };

  // Fetch queries for the current user
  const fetchQueries = async () => {
    try {
              const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?action=getUserQueries&user_id=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setQueries(data.queries || []);
        }
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    }
  };

  // Load queries when component mounts or when showQueries changes
  useEffect(() => {
    if (showQueries && user?.id) {
      fetchQueries();
    }
  }, [showQueries, user?.id]);

  const handleAnswerQuery = async () => {
    if (!selectedQuery || !answerText.trim()) {
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
          queryId: selectedQuery.id,
          answerText: answerText.trim()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Query answered successfully!');
        setShowAnswerModal(false);
        setAnswerText('');
        setSelectedQuery(null);
        // Refresh queries and programs
        await fetchQueries();
        await refreshPrograms();
      } else {
        alert('Failed to answer query: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error answering query:', error);
      alert('Failed to answer query. Please try again.');
    }
  };



  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Programs</h1>
          <p className="text-gray-600">
            Manage and monitor your registered programs
          </p>
        </div>
        <button 
          onClick={handleCreateProgram}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Program</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{userPrograms.length}</p>
            <p className="text-sm text-gray-600">Total Programs</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {userPrograms.filter(p => p.status === 'approved').length}
            </p>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {userPrograms.filter(p => p.status === 'submitted' || p.status === 'queried' || p.status === 'answered_query').length}
            </p>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {userPrograms.filter(p => p.status === 'rejected').length}
            </p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>
      </div>

      {/* Queries Section */}
      <div className="bg-white rounded-xl p-6 mb-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Finance Queries
            {queries.filter(q => q.status === 'pending').length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
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

        {showQueries && (
          <div className="space-y-4">
            {queries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No queries from finance yet.</p>
            ) : (
              queries.map(query => (
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
                        <strong>Query from:</strong> {query.queried_by_name} • {new Date(query.query_date).toLocaleDateString()}
                      </p>
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <p className="text-sm text-gray-900">{query.query_text}</p>
                      </div>
                      
                      {query.status === 'answered' && query.answer_text && (
                        <div className="bg-green-50 p-3 rounded-md">
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Your Answer:</strong> {new Date(query.answered_at!).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-900">{query.answer_text}</p>
                        </div>
                      )}
                    </div>
                    
                    {query.status === 'pending' && (
                      <button
                        onClick={() => {
                          setSelectedQuery(query);
                          setAnswerText('');
                          setShowAnswerModal(true);
                        }}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      >
                        Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
          {currentPrograms.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              userRole={user?.role}
              onView={() => setSelectedProgram(program)}
              onEdit={() => handleEditProgram(program)}
              onDelete={() => handleDeleteProgram(program.id)}
              onSubmit={() => handleSubmitProgram(program.id)}
            />
          ))}
        </div>
      ) : (
        <ProgramTable
          programs={currentPrograms}
          onView={(program) => setSelectedProgram(program)}
          onEdit={(program) => handleEditProgram(program)}
          onDelete={(programId) => handleDeleteProgram(programId)}
          onSubmit={(program) => handleSubmitProgram(program.id)}
          onAction={(program, action) => {
            // Handle any additional actions if needed
            console.log('Action:', action, 'for program:', program.id);
          }}
          userRole={user?.role}
          startIndex={startIndex}
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPrograms.length}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setCurrentPage}
      />

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
              : 'You haven\'t registered any programs yet'
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
              await updateProgram(editingProgram.id, updatedProgram);
              setEditingProgram(null);
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

      {/* Answer Query Modal */}
      {showAnswerModal && selectedQuery && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Answer Finance Query
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Program: <span className="font-medium">{selectedQuery.program_title}</span>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Query from: <span className="font-medium">{selectedQuery.queried_by_name}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finance Query
                </label>
                <div className="bg-gray-50 p-3 rounded-md mb-3">
                  <p className="text-sm text-gray-900">{selectedQuery.query_text}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Enter your answer to the finance query..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAnswerModal(false);
                    setAnswerText('');
                    setSelectedQuery(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnswerQuery}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && programToSubmit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Submit Program for Review
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to submit the program "{programToSubmit.title}" for review?
                </p>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">This will:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Change the program status to "Under Review"</li>
                    <li>• Send the program to Finance for approval</li>
                    <li>• Lock the program from further editing</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSubmitConfirmModal(false);
                    setProgramToSubmit(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmitProgram}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && programToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Program
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Are you sure you want to delete the program "{programToDelete.title}"?
                </p>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">This action will:</p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Permanently remove the program</li>
                    <li>• Delete all associated data and documents</li>
                    <li>• Cannot be undone</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setProgramToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProgram}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPrograms;