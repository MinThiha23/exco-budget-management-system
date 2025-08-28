export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'Finance MMK' | 'finance_officer' | 'super_admin';
  displayRole?: string; // For UI display
  department: string;
  position: string;
  avatar?: string;
  createdAt: string;
  phone?: string;
  isActive?: boolean;
  location?: string;
  password?: string; // For creating new users
}

export interface Program {
  id: string;
  title: string;
  description: string;
  department: string;
  recipientName: string;
  budget: number;
  startDate: string;
  endDate: string;
  letterReferenceNumber?: string;
  status: 'draft' | 'submitted' | 'queried' | 'answered_query' | 'approved' | 'rejected' | 'budget_deducted' | 'in-progress' | 'completed';
  userId: string;
  submittedBy: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  documents: (string | { originalName: string; storedName: string; size: number; category?: string })[];
  objectives: string[];
  kpi: string[];
  voucherNumber?: string;
  eftNumber?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  budgetDeducted?: number;
  queries?: Query[];
  budgetDeductions?: BudgetDeduction[];
}

export interface Query {
  id: string;
  programId: string;
  queriedBy: string;
  queriedByName: string;
  queryText: string;
  queryDate: string;
  answeredBy?: string;
  answeredByName?: string;
  answerText?: string;
  answeredAt?: string;
  status: 'pending' | 'answered';
}



export interface BudgetDeduction {
  id: string;
  programId: string;
  deductedBy: string;
  deductedByName: string;
  deductionAmount: number;
  deductionReason: string;
  deductionDate: string;
}

export interface DashboardStats {
  totalPrograms: number;
  approvedPrograms: number;
  pendingPrograms: number;
  totalBudget: number;
  approvedBudget: number;
  pendingBudget: number;
}