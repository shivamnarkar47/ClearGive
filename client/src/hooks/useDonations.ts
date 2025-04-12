import { useState, useCallback } from 'react';
import { donationApi } from '../lib/api';

interface Donation {
  id: string;
  amount: number;
  currency: string;
  donorName: string;
  donorEmail: string;
  campaignId: number;
  status: string;
  donatedAt: string;
  description: string;
}

export function useDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await donationApi.getAllDonations();
      setDonations(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDonation = useCallback(async (donationData: Omit<Donation, 'id'>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await donationApi.createDonation(donationData);
      setDonations(prev => [...prev, result.data]);
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create donation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDonation = useCallback(async (id: string, donationData: Partial<Donation>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await donationApi.updateDonation(id, donationData);
      setDonations(prev => prev.map(d => d.id === id ? result.data : d));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update donation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDonation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await donationApi.deleteDonation(id);
      setDonations(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete donation');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    donations,
    loading,
    error,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  };
} 