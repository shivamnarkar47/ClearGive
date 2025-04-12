import { useState, useEffect } from 'react';
import { Certificate, CertificateService } from '@/services/certificate';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface UseCertificatesReturn {
  certificates: Certificate[];
  isLoading: boolean;
  error: Error | null;
  generateCertificate: (donationId: number) => Promise<Certificate | null>;
  verifyCertificate: (tokenId: string) => Promise<boolean>;
  refreshCertificates: () => Promise<void>;
}

export function useCertificates(): UseCertificatesReturn {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth() as { user: any | null };

  const fetchCertificates = async () => {
    if (!user?.ID) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userCertificates = await CertificateService.getUserCertificates(user.ID);
      setCertificates(userCertificates);
      setError(null);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch certificates'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user?.ID]);

  const generateCertificate = async (donationId: number): Promise<Certificate | null> => {
    try {
      const certificate = await CertificateService.generateCertificate(donationId);
      await fetchCertificates(); // Refresh the certificates list
      return certificate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate certificate';
      toast.error('Certificate Generation Failed', {
        description: errorMessage,
      });
      return null;
    }
  };

  const verifyCertificate = async (tokenId: string): Promise<boolean> => {
    try {
      const result = await CertificateService.verifyCertificate(tokenId);
      return result.valid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify certificate';
      toast.error('Certificate Verification Failed', {
        description: errorMessage,
      });
      return false;
    }
  };

  return {
    certificates,
    isLoading,
    error,
    generateCertificate,
    verifyCertificate,
    refreshCertificates: fetchCertificates,
  };
} 