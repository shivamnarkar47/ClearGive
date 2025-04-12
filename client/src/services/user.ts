import { User } from '@/types/user';
import { api } from '@/lib/api';

export class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async updateUserWallet(userId: string, stellarWallet: { publicKey: string; secretKey: string }): Promise<User> {
    try {
      const response = await api.put(`/users/${userId}`, {
        stellar_account: {
          public_key: stellarWallet.publicKey,
          secret_key: stellarWallet.secretKey
        }
      });

      if (response.data.status !== 'success') {
        throw new Error('Failed to update user wallet');
      }

      return response.data.data;
    } catch (error) {
      console.error('Error updating user wallet:', error);
      throw new Error('Failed to update user wallet');
    }
  }
} 