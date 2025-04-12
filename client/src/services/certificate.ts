import { certificateApi } from '@/lib/api';

export interface Certificate {
  id: number;
  donationId: number;
  tokenId: string;
  tokenUri: string;
  issueDate: string;
  metadataHash: string;
  txHash: string;
  imageUrl: string;
  status: string;
  donation?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image: string;
  amount: string;
  currency: string;
  donatedTo: string;
  donatedBy: string;
  donationDate: string;
  issueDate: string;
  txHash: string;
  category?: string;
  impactArea?: string;
}

export class CertificateService {
  /**
   * Generate a certificate for a donation
   * @param donationId - The ID of the donation to generate a certificate for
   * @returns The generated certificate data
   */
  static async generateCertificate(donationId: number): Promise<Certificate> {
    try {
      const response = await certificateApi.generateCertificate(donationId);
      return response.data;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Get a certificate by ID
   * @param id - The certificate ID
   * @returns The certificate data
   */
  static async getCertificate(id: string): Promise<Certificate> {
    try {
      const response = await certificateApi.getCertificate(id);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate:', error);
      throw error;
    }
  }

  /**
   * Get a certificate by token ID
   * @param tokenId - The NFT token ID
   * @returns The certificate data
   */
  static async getCertificateByToken(tokenId: string): Promise<Certificate> {
    try {
      const response = await certificateApi.getCertificateByToken(tokenId);
      return response.data;
    } catch (error) {
      console.error('Error fetching certificate by token:', error);
      throw error;
    }
  }

  /**
   * Get certificate metadata
   * @param tokenId - The NFT token ID
   * @returns The certificate metadata
   */
  static async getCertificateMetadata(tokenId: string): Promise<CertificateMetadata> {
    try {
      const response = await certificateApi.getCertificateMetadata(tokenId);
      return response;
    } catch (error) {
      console.error('Error fetching certificate metadata:', error);
      throw error;
    }
  }

  /**
   * Get all certificates for a user
   * @param userId - The user ID
   * @returns Array of certificates
   */
  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    try {
      const response = await certificateApi.getUserCertificates(userId);
      return response.data;
    } catch (error) {
      console.error('Error fetching user certificates:', error);
      throw error;
    }
  }

  /**
   * Verify a certificate's authenticity
   * @param tokenId - The NFT token ID
   * @returns Verification result
   */
  static async verifyCertificate(tokenId: string): Promise<{ valid: boolean; tokenId: string; issueDate: string }> {
    try {
      const response = await certificateApi.verifyCertificate(tokenId);
      return response;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }
} 