// @ts-nocheck
import { Charity } from '../types/user';
import { StellarService } from './stellar';
import { api } from '../lib/api';

export class CharityService {
  private static instance: CharityService;
  private stellarService: StellarService;

  private constructor() {
    this.stellarService = StellarService.getInstance();
  }

  static getInstance(): CharityService {
    if (!CharityService.instance) {
      CharityService.instance = new CharityService();
    }
    return CharityService.instance;
  }

  async createCharity(
    name: string,
    description: string,
    ownerId: string,
    category: string,
    website?: string,
    imageUrl?: string
  ): Promise<Charity> {
    try {
      // Create a Stellar account for the charity
      const stellarAccount = await this.stellarService.createAccount();

      const charity: Charity = {
        id: crypto.randomUUID(),
        name,
        description,
        walletAddress: stellarAccount.publicKey,
        ownerId,
        createdAt: new Date(),
        totalDonations: 0,
        category,
        website,
        imageUrl,
      };

      // TODO: Store charity in your backend database
      return charity;
    } catch (error) {
      console.error('Error creating charity:', error);
      throw new Error('Failed to create charity');
    }
  }

  async getCharitiesByOwner(ownerId: string): Promise<Charity[]> {
    // TODO: Implement fetching charities from your backend
    return [];
  }

  async getCharityById(id: string): Promise<Charity | null> {
    // TODO: Implement fetching charity from your backend
    return null;
  }

  async updateCharity(id: string, updates: Partial<Charity>): Promise<Charity> {
    // TODO: Implement updating charity in your backend
    throw new Error('Not implemented');
  }

  async getCharityBalance(charityId: string): Promise<string> {
    const charity = await this.getCharityById(charityId);
    if (!charity) {
      throw new Error('Charity not found');
    }
    return this.stellarService.getBalance(charity.walletAddress);
  }

  async getAllCharities(): Promise<Charity[]> {
    // TODO: Implement fetching all charities from your backend
    return [];
  }

  async transferOwnership(charityId: string, newOwnerId: number, email: string): Promise<Charity> {
    try {
      const response = await api.patch(`/charities/${charityId}/transfer-ownership`, {
        newOwnerId: newOwnerId,
        email: email
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error transferring charity ownership:', error);
      throw new Error('Failed to transfer charity ownership');
    }
  }
} 