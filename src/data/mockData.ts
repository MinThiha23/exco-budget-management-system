import { Program, DashboardStats } from '../types';

export const mockPrograms: Program[] = [
  {
    id: '1',
    title: 'Kedah Rural Education Support Program',
    description: 'Providing educational supplies and scholarships to underprivileged children in rural areas',
    department: 'Social Welfare',
    recipientName: 'Rural Education Foundation',
    budget: 2500000,
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    status: 'approved',
    userId: '1',
    submittedBy: 'YB Dato\' Ahmad Ibrahim',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25',
    documents: ['education_proposal.pdf', 'budget_breakdown.xlsx', 'beneficiary_list.pdf'],
    objectives: [
      'Distribute school supplies to 500 underprivileged children',
      'Provide scholarships to 100 deserving students',
      'Establish 10 community learning centers in rural areas'
    ],
    kpi: [
      { target: 500, current: 150, unit: 'children helped' },
      { target: 100, current: 25, unit: 'scholarships awarded' }
    ]
  },
  {
    id: '2',
    title: 'Kedah Senior Citizens Care Program',
    description: 'Providing healthcare support and daily necessities to elderly citizens in need',
    department: 'Health & Welfare',
    recipientName: 'Senior Citizens Welfare Association',
    budget: 1800000,
    startDate: '2024-02-15',
    endDate: '2024-11-30',
    status: 'pending',
    userId: '1',
    submittedBy: 'YB Dato\' Ahmad Ibrahim',
    createdAt: '2024-01-18',
    updatedAt: '2024-01-22',
    documents: ['healthcare_proposal.pdf', 'medical_requirements.docx'],
    objectives: [
      'Provide healthcare checkups to 300 senior citizens',
      'Distribute food packages to 200 elderly households',
      'Establish 5 senior citizen care centers'
    ],
    kpi: [
      { target: 300, current: 0, unit: 'seniors helped' },
      { target: 200, current: 0, unit: 'food packages' }
    ]
  },
  {
    id: '3',
    title: 'Kedah Orphan Support Initiative',
    description: 'Comprehensive support program for orphaned children including housing, education, and healthcare',
    department: 'Child Welfare',
    recipientName: 'Children\'s Home Foundation',
    budget: 3200000,
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'in-progress',
    userId: '1',
    submittedBy: 'YB Dato\' Ahmad Ibrahim',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-28',
    documents: ['orphan_care_proposal.pdf', 'facility_plans.pdf', 'staff_requirements.docx'],
    objectives: [
      'Provide housing support to 50 orphaned children',
      'Ensure education access for 100 orphans',
      'Establish 3 orphanage facilities with modern amenities'
    ],
    kpi: [
      { target: 50, current: 20, unit: 'children housed' },
      { target: 100, current: 35, unit: 'children in school' }
    ]
  },
  {
    id: '4',
    title: 'Kedah Community Food Bank Program',
    description: 'Establishing food banks to provide meals and groceries to families in need',
    department: 'Community Services',
    recipientName: 'Community Food Network',
    budget: 1500000,
    startDate: '2024-05-01',
    endDate: '2024-10-31',
    status: 'draft',
    userId: '1',
    submittedBy: 'YB Dato\' Ahmad Ibrahim',
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25',
    documents: ['food_bank_proposal.pdf'],
    objectives: [
      'Establish 15 community food banks across Kedah',
      'Serve 1000 meals daily to families in need',
      'Distribute grocery packages to 500 households monthly'
    ],
    kpi: [
      { target: 15, current: 0, unit: 'food banks' },
      { target: 1000, current: 0, unit: 'daily meals' }
    ]
  }
];

export const mockDashboardStats: DashboardStats = {
  totalPrograms: 4,
  approvedPrograms: 1,
  pendingPrograms: 1,
  totalBudget: 9000000,
  approvedBudget: 2500000,
  pendingBudget: 1800000
};