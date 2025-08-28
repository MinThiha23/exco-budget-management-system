export type UserRole = 'user' | 'admin' | 'Finance MMK' | 'finance_officer' | 'super_admin';

export interface Permission {
  canCreateProgram: boolean;
  canEditProgram: boolean;
  canDeleteProgram: boolean;
  canSubmitProgram: boolean;
  canApproveProgram: boolean;
  canRejectProgram: boolean;
  canQueryProgram: boolean;
  canAnswerQuery: boolean;
  canDeductBudget: boolean;
  canViewAllPrograms: boolean;
  canViewFinancePrograms: boolean;
  canManageUsers: boolean;
  canGenerateReports: boolean;
  canViewReports: boolean;
}

export const getRolePermissions = (role: UserRole): Permission => {
  switch (role) {
    case 'user':
      return {
        canCreateProgram: true,
        canEditProgram: true,
        canDeleteProgram: true,
        canSubmitProgram: true,
        canApproveProgram: false,
        canRejectProgram: false,
        canQueryProgram: false,
        canAnswerQuery: false,
        canDeductBudget: false,
        canViewAllPrograms: false,
        canViewFinancePrograms: false,
        canManageUsers: false,
        canGenerateReports: false,
        canViewReports: false,
      };

    case 'admin':
      return {
        canCreateProgram: true,
        canEditProgram: true,
        canDeleteProgram: true,
        canSubmitProgram: true,
        canApproveProgram: true,
        canRejectProgram: true,
        canQueryProgram: true,
        canAnswerQuery: true,
        canDeductBudget: true,
        canViewAllPrograms: true,
        canViewFinancePrograms: true,
        canManageUsers: true,
        canGenerateReports: true,
        canViewReports: true,
      };

    case 'Finance MMK':
      return {
        canCreateProgram: false,
        canEditProgram: false,
        canDeleteProgram: false,
        canSubmitProgram: false,
        canApproveProgram: true,
        canRejectProgram: true,
        canQueryProgram: true,
        canAnswerQuery: true,
        canDeductBudget: true,
        canViewAllPrograms: false,
        canViewFinancePrograms: true,
        canManageUsers: false,
        canGenerateReports: true,
        canViewReports: true,
      };

    case 'finance_officer':
      return {
        canCreateProgram: false,
        canEditProgram: false,
        canDeleteProgram: false,
        canSubmitProgram: false,
        canApproveProgram: false,
        canRejectProgram: false,
        canQueryProgram: false,
        canAnswerQuery: false,
        canDeductBudget: false,
        canViewAllPrograms: false,
        canViewFinancePrograms: true,
        canManageUsers: false,
        canGenerateReports: false,
        canViewReports: true,
      };

    case 'super_admin':
      return {
        canCreateProgram: false,
        canEditProgram: false,
        canDeleteProgram: false,
        canSubmitProgram: false,
        canApproveProgram: false,
        canRejectProgram: false,
        canQueryProgram: false,
        canAnswerQuery: false,
        canDeductBudget: false,
        canViewAllPrograms: true,
        canViewFinancePrograms: true,
        canManageUsers: false,
        canGenerateReports: true,
        canViewReports: true,
      };

    default:
      return {
        canCreateProgram: false,
        canEditProgram: false,
        canDeleteProgram: false,
        canSubmitProgram: false,
        canApproveProgram: false,
        canRejectProgram: false,
        canQueryProgram: false,
        canAnswerQuery: false,
        canDeductBudget: false,
        canViewAllPrograms: true,
        canViewFinancePrograms: true,
        canManageUsers: false,
        canGenerateReports: true,
        canViewReports: true,
      };
  }
};

export const hasPermission = (role: UserRole, permission: keyof Permission): boolean => {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}; 