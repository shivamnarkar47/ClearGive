export type UserRole = 'USER' | 'CHARITY_OWNER';

export interface User {
  ID: string;
  email: string;
  role: UserRole;
  stellarAccount?: {
    publicKey: string;
    secretKey: string;
  };
}

export interface CharityOwner extends User {
  role: 'CHARITY_OWNER';
  charities: Charity[];
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  walletAddress: string; // Stellar public key
  ownerId: string;
  createdAt: Date;
  totalDonations: number;
  category: string;
  website?: string;
  imageUrl?: string;
} 