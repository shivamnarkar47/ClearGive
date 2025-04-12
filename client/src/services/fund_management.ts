import { api } from '@/lib/api';

export interface Cosigner {
  id: string;
  email: string;
  userId: string;
  isPrimary: boolean;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocation: number;
  spent: number;
}

export interface TransactionApproval {
  ID: number;
  charityId: number;
  amount: string;
  description: string;
  category: string;
  requestedById: string;
  requiredSignatures: number;
  currentSignatures: number;
  status: string;
  txHash?: string;
  createdAt: string;
}

export interface Milestone {
  id: number;
  name: string;
  description: string;
  approvalId: number;
  amount: string;
  dueDate: string;
  completionDate?: string;
  status: string;
  verificationProof?: string;
}

export interface MilestoneVerification {
  id: number;
  milestoneId: number;
  verifierId: string;
  comments: string;
  status: string;
}

export class FundManagementService {
  private static instance: FundManagementService;

  private constructor() {}

  static getInstance(): FundManagementService {
    if (!FundManagementService.instance) {
      FundManagementService.instance = new FundManagementService();
    }
    return FundManagementService.instance;
  }

  // Cosigner Management
  async addCosigner(charityId: string, email: string, userId?: string, isPrimary: boolean = false): Promise<Cosigner> {
    try {
      const response = await api.post(`/charities/${charityId}/cosigners`, {
        email,
        userId,
        isPrimary
      });
      return response.data.data;
    } catch (error) {
      console.error('Error adding cosigner:', error);
      throw new Error('Failed to add cosigner');
    }
  }

  async removeCosigner(charityId: string, cosignerId: string): Promise<void> {
    try {
      await api.delete(`/charities/${charityId}/cosigners/${cosignerId}`);
    } catch (error) {
      console.error('Error removing cosigner:', error);
      throw new Error('Failed to remove cosigner');
    }
  }

  // Multi-signature Settings
  async updateMultiSigSettings(charityId: string, isMultiSig: boolean, requiredSignatures: number): Promise<any> {
    try {
      const response = await api.patch(`/charities/${charityId}/multisig`, {
        isMultiSig,
        requiredSignatures
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating multi-signature settings:', error);
      throw new Error('Failed to update multi-signature settings');
    }
  }

  // Budget Management
  async addBudgetCategory(charityId: string, name: string, allocation: number): Promise<BudgetCategory> {
    try {
      const response = await api.post(`/charities/${charityId}/budget`, {
        name,
        allocation
      });
      return response.data.data;
    } catch (error) {
      console.error('Error adding budget category:', error);
      throw new Error('Failed to add budget category');
    }
  }

  async updateBudgetCategory(charityId: string, categoryId: string, name: string, allocation: number): Promise<BudgetCategory> {
    try {
      const response = await api.patch(`/charities/${charityId}/budget/${categoryId}`, {
        name,
        allocation
      });
      return response.data.data;
    } catch (error) {
      console.error('Error updating budget category:', error);
      throw new Error('Failed to update budget category');
    }
  }

  async deleteBudgetCategory(charityId: string, categoryId: string): Promise<void> {
    try {
      await api.delete(`/charities/${charityId}/budget/${categoryId}`);
    } catch (error) {
      console.error('Error deleting budget category:', error);
      throw new Error('Failed to delete budget category');
    }
  }

  // Transaction Approval Management
  async getPendingApprovals(charityId: string): Promise<TransactionApproval[]> {
    try {
      const response = await api.get(`/charities/${charityId}/approvals`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw new Error('Failed to fetch pending approvals');
    }
  }

  async createTransactionApproval(charityId: string, amount: string, description: string, category?: string): Promise<TransactionApproval> {
    try {
      const response = await api.post(`/charities/${charityId}/approvals`, {
        amount,
        description,
        category,
        charityId
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating transaction approval:', error);
      throw new Error('Failed to create transaction approval');
    }
  }

  async addApprovalSignature(approvalId: string, email: string): Promise<TransactionApproval> {
    try {
      const response = await api.post(`/charities/approvals/${approvalId}/sign`, {
        email: email
      });
      return response.data.data;
    } catch (error) {
      console.error('Error signing transaction approval:', error);
      throw new Error('Failed to sign transaction approval');
    }
  }

  async executeApproval(approvalId: string): Promise<TransactionApproval> {
    try {
      const response = await api.post(`/charities/approvals/${approvalId}/execute`, {});
      return response.data.data;
    } catch (error) {
      console.error('Error executing transaction approval:', error);
      throw new Error('Failed to execute transaction approval');
    }
  }

  // Milestone Management
  async getMilestones(approvalId: string): Promise<Milestone[]> {
    try {
      const response = await api.get(`/charities/approvals/${approvalId}/milestones`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      throw new Error('Failed to fetch milestones');
    }
  }

  async createMilestone(approvalId: string, name: string, description: string, amount: string, dueDate: Date): Promise<Milestone> {
    try {
      const response = await api.post(`/charities/approvals/${approvalId}/milestones`, {
        name,
        description,
        amount,
        dueDate
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw new Error('Failed to create milestone');
    }
  }

  async completeMilestone(milestoneId: string, proof: string): Promise<Milestone> {
    try {
      const response = await api.patch(`/charities/milestones/${milestoneId}/complete`, {
        proof
      });
      return response.data.data;
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw new Error('Failed to complete milestone');
    }
  }

  async verifyMilestone(milestoneId: string, comments: string, status: string): Promise<{milestone: Milestone, verification: MilestoneVerification}> {
    try {
      const response = await api.patch(`/charities/milestones/${milestoneId}/verify`, {
        comments,
        status
      });
      return response.data.data;
    } catch (error) {
      console.error('Error verifying milestone:', error);
      throw new Error('Failed to verify milestone');
    }
  }

  async releaseMilestoneFunds(milestoneId: string): Promise<{milestone: Milestone, txHash: string}> {
    try {
      const response = await api.post(`/charities/milestones/${milestoneId}/release`, {});
      return response.data.data;
    } catch (error) {
      console.error('Error releasing milestone funds:', error);
      throw new Error('Failed to release milestone funds');
    }
  }

  // Automatic Fund Returns
  async refundUnspentFunds(approvalId: string): Promise<{refundAmount: number, approval: TransactionApproval}> {
    try {
      const response = await api.post(`/charities/approvals/${approvalId}/refund`, {});
      return response.data;
    } catch (error) {
      console.error('Error refunding unspent funds:', error);
      throw new Error('Failed to refund unspent funds');
    }
  }
} 