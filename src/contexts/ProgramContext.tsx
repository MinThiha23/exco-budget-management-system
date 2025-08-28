import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Program } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from './AuthContext';

interface ProgramContextType {
  programs: Program[];
  addProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  getProgram: (id: string) => Program | undefined;
  updateProgramStatus: (id: string, status: Program['status']) => Promise<void>;
  refreshPrograms: () => Promise<void>;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const ProgramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch programs from backend on component mount and when user changes
  useEffect(() => {
    if (user) {
      // Clear programs when user changes
      setPrograms([]);
      setLoading(true);
      fetchPrograms();
    } else {
      // Clear programs when no user
      setPrograms([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPrograms = async () => {
    try {
      // Add cache-busting parameter
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?t=${timestamp}`);
      const data = await response.json();
      
      if (data.success && data.programs) {
        
        // Convert backend program format to frontend format
        const convertedPrograms: Program[] = data.programs.map((program: any) => {
          const converted = {
            id: program.id.toString(),
            title: program.title,
            description: program.description,
            department: program.department,
            recipientName: program.recipient_name,
            budget: parseFloat(program.budget),
            startDate: program.start_date,
            endDate: program.end_date,
            letterReferenceNumber: program.letter_reference_number,
            status: program.status as Program['status'],
            userId: program.user_id.toString(),
            submittedBy: program.submitted_by,
            objectives: Array.isArray(program.objectives) ? program.objectives : [],
            kpi: Array.isArray(program.kpi) ? program.kpi : [],
            documents: Array.isArray(program.documents) ? program.documents : [],
            createdAt: program.created_at,
            updatedAt: program.updated_at,
            voucherNumber: program.voucher_number,
            eftNumber: program.eft_number,
            approvedBy: program.approver_name,
            approvedAt: program.approved_at,
            rejectedBy: program.rejector_name,
            rejectedAt: program.rejected_at,
            rejectionReason: program.rejection_reason,
            budgetDeducted: program.budget_deducted ? parseFloat(program.budget_deducted) : undefined,
            queries: program.queries || [],

            budgetDeductions: (program.budget_deductions || []).map((deduction: any) => ({
              id: deduction.id.toString(),
              programId: deduction.program_id.toString(),
              deductedBy: deduction.deducted_by.toString(),
              deductedByName: deduction.deducted_by_name,
              deductionAmount: parseFloat(deduction.deduction_amount),
              deductionReason: deduction.deduction_reason,
              deductionDate: deduction.deduction_date
            }))
          };
          return converted;
        });
        
        setPrograms(convertedPrograms);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const addProgram = async (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Documents being sent:', programData.documents);
      
      const requestBody = {
        action: 'create',
        ...programData,
        user_id: programData.userId,
        recipient_name: programData.recipientName,
        start_date: programData.startDate,
        end_date: programData.endDate,
        letter_reference_number: programData.letterReferenceNumber,
        submitted_by: programData.submittedBy,
        objectives: JSON.stringify(programData.objectives),
        kpi_data: JSON.stringify(programData.kpi),
        documents: JSON.stringify(programData.documents)
      };
      
      console.log('Request body being sent:', requestBody);
      
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Backend response for addProgram:', data);
      
      if (data.success) {
        console.log('Program added successfully, refreshing list...');
        // Refresh programs list
        await fetchPrograms();
      } else {
        console.error('Failed to add program:', data.error);
      }
    } catch (error) {
      console.error('Error adding program:', error);
    }
  };

  const updateProgram = async (id: string, updates: Partial<Program>) => {
    try {
      console.log('Updating program with ID:', id, 'Updates:', updates);
      
      // Convert frontend field names to backend field names
      const backendUpdates: any = {};
      
      if (updates.title !== undefined) backendUpdates.title = updates.title;
      if (updates.description !== undefined) backendUpdates.description = updates.description;
      if (updates.department !== undefined) backendUpdates.department = updates.department;
      if (updates.recipientName !== undefined) backendUpdates.recipient_name = updates.recipientName;
      if (updates.budget !== undefined) backendUpdates.budget = updates.budget;
      if (updates.startDate !== undefined) backendUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) backendUpdates.end_date = updates.endDate;
      if (updates.letterReferenceNumber !== undefined) backendUpdates.letter_reference_number = updates.letterReferenceNumber;
      if (updates.submittedBy !== undefined) backendUpdates.submitted_by = updates.submittedBy;
      if (updates.objectives !== undefined) backendUpdates.objectives = updates.objectives;
      if (updates.kpi !== undefined) backendUpdates.kpi = updates.kpi;
      if (updates.documents !== undefined) backendUpdates.documents = updates.documents;
      
      // Add required fields for backend
      backendUpdates.id = id;
      backendUpdates.user_id = user?.id;
      backendUpdates.action = 'update';
      
      console.log('Backend update data:', backendUpdates);
      
      // Use FormData via POST to avoid InfinityFree blocking JSON/PUT
      const form = new FormData();
      Object.entries(backendUpdates).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'object') {
          form.append(k, JSON.stringify(v));
        } else {
          form.append(k, String(v));
        }
      });
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}`, {
        method: 'POST',
        body: form
      });

      const data = await response.json();
      console.log('Backend response for updateProgram:', data);
      
      if (data.success) {
        console.log('Program updated successfully, updating local state...');
        
        // Convert backend program format to frontend format
        const updatedProgram = data.program ? {
          id: data.program.id.toString(),
          title: data.program.title,
          description: data.program.description,
          department: data.program.department,
          recipientName: data.program.recipient_name,
          budget: parseFloat(data.program.budget),
          startDate: data.program.start_date,
          endDate: data.program.end_date,
          letterReferenceNumber: data.program.letter_reference_number,
          status: data.program.status,
          userId: data.program.user_id.toString(),
          submittedBy: data.program.submitted_by,
          objectives: Array.isArray(data.program.objectives) ? data.program.objectives : [],
          kpi: Array.isArray(data.program.kpi) ? data.program.kpi : [],
          documents: Array.isArray(data.program.documents) ? data.program.documents : [],
          createdAt: data.program.created_at,
          updatedAt: data.program.updated_at
        } : null;
        
        // Update local state with the response data
        setPrograms(prev => prev.map(program => 
          program.id === id 
            ? (updatedProgram || { ...program, ...updates, updatedAt: new Date().toISOString() })
            : program
        ));
      } else {
        console.error('Failed to update program:', data.error);
        throw new Error(data.error || 'Failed to update program');
      }
    } catch (error) {
      console.error('Error updating program:', error);
      // Log the actual response for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      throw error;
    }
  };

  const deleteProgram = async (id: string) => {
    try {
      console.log('Deleting program with ID:', id);
      
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Backend response for deleteProgram:', data);
      
      if (data.success) {
        console.log('Program deleted successfully, updating local state...');
        // Update local state
        setPrograms(prev => prev.filter(program => program.id !== id));
      } else {
        console.error('Failed to delete program:', data.error);
        throw new Error(data.error || 'Failed to delete program');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  };

  const getProgram = (id: string) => {
    return programs.find(program => program.id === id);
  };

  const updateProgramStatus = async (id: string, status: Program['status']) => {
    try {
      // Check if user is admin before allowing status change
      if (user?.role !== 'admin') {
        console.error('Only administrators can change program status');
        return;
      }

      // Use FormData via POST
      const statusForm = new FormData();
      statusForm.append('id', id);
      statusForm.append('status', status);
      statusForm.append('user_id', String(user.id));
      statusForm.append('action', 'update');
      const response = await fetch(`${API_ENDPOINTS.PROGRAMS}`, {
        method: 'POST',
        body: statusForm
      });

      const data = await response.json();
      if (data.success) {
        setPrograms(prev => prev.map(program => 
          program.id === id ? { ...program, status } : program
        ));
      } else {
        console.error('Failed to update program status:', data.error);
        alert(data.error || 'Failed to update program status');
      }
    } catch (error) {
      console.error('Error updating program status:', error);
      alert('Error updating program status');
    }
  };

  return (
    <ProgramContext.Provider value={{
      programs,
      addProgram,
      updateProgram,
      deleteProgram,
      getProgram,
      updateProgramStatus,
      refreshPrograms: fetchPrograms
    }}>
      {children}
    </ProgramContext.Provider>
  );
};

export const usePrograms = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('usePrograms must be used within a ProgramProvider');
  }
  return context;
};