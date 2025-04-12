import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CharityService } from '@/services/charity';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';

interface CharityOwnershipTransferProps {
  charityId: string;
  onTransferComplete?: () => void;
}

export default function CharityOwnershipTransfer({ charityId, onTransferComplete }: CharityOwnershipTransferProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth() as { user: User | null };
  const charityService = CharityService.getInstance();

  const handleTransferOwnership = async () => {
    if (!newOwnerId || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await charityService.transferOwnership(
        charityId,
        parseInt(newOwnerId),
        email
      );

      toast.success('Charity ownership transferred successfully');
      setIsDialogOpen(false);
      
      // Reset form
      setNewOwnerId('');
      setEmail('');
      
      // Call callback if provided
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast.error('Failed to transfer ownership. Please check the user ID and email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Transfer Ownership</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Charity Ownership</DialogTitle>
          <DialogDescription>
            Transfer ownership of this charity to another user. The new owner will have full control over the charity.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newOwnerId" className="text-right">
              User ID
            </Label>
            <Input
              id="newOwnerId"
              className="col-span-3"
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              placeholder="Enter the new owner's user ID"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter the new owner's email"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransferOwnership} disabled={isLoading}>
            {isLoading ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 