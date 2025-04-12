import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { FundManagementService, Milestone, TransactionApproval } from '@/services/fund_management';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Clock, XCircle } from 'lucide-react';

interface MilestoneManagerProps {
  approval: TransactionApproval;
  isOwner: boolean;
  onUpdate?: () => void;
}

export default function MilestoneManager({ approval, isOwner, onUpdate }: MilestoneManagerProps) {
  const { user } = useAuth() as { user: User | null };
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMilestoneDialog, setShowNewMilestoneDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [verificationProof, setVerificationProof] = useState('');
  const [verificationComments, setVerificationComments] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('approved');
  
  // New milestone form state
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDescription, setMilestoneDescription] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const fundManagementService = FundManagementService.getInstance();
  
  useEffect(() => {
    loadMilestones();
  }, [approval.ID]);
  
  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const milestonesData = await fundManagementService.getMilestones(approval.ID.toString());
      setMilestones(milestonesData);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateMilestone = async () => {
    if (!milestoneName || !milestoneDescription || !milestoneAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await fundManagementService.createMilestone(
        approval.ID.toString(),
        milestoneName,
        milestoneDescription,
        milestoneAmount,
        milestoneDueDate
      );
      
      // Reset form and close dialog
      setMilestoneName('');
      setMilestoneDescription('');
      setMilestoneAmount('');
      setMilestoneDueDate(new Date());
      setShowNewMilestoneDialog(false);
      
      // Reload milestones
      loadMilestones();
      toast.success('Milestone created successfully');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    }
  };
  
  const handleCompleteMilestone = async () => {
    if (!selectedMilestone) return;
    
    try {
      await fundManagementService.completeMilestone(
        selectedMilestone.id.toString(),
        verificationProof
      );
      
      setVerificationProof('');
      setShowCompleteDialog(false);
      setSelectedMilestone(null);
      
      // Reload milestones
      loadMilestones();
      toast.success('Milestone marked as completed');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to mark milestone as completed');
    }
  };
  
  const handleVerifyMilestone = async () => {
    if (!selectedMilestone) return;
    
    try {
      await fundManagementService.verifyMilestone(
        selectedMilestone.id.toString(),
        verificationComments,
        verificationStatus
      );
      
      setVerificationComments('');
      setVerificationStatus('approved');
      setShowVerifyDialog(false);
      setSelectedMilestone(null);
      
      // Reload milestones
      loadMilestones();
      toast.success(`Milestone ${verificationStatus === 'approved' ? 'verified' : 'rejected'}`);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error verifying milestone:', error);
      toast.error('Failed to verify milestone');
    }
  };
  
  const handleReleaseFunds = async (milestone: Milestone) => {
    try {
      await fundManagementService.releaseMilestoneFunds(milestone.id.toString());
      
      // Reload milestones
      loadMilestones();
      toast.success('Funds released for milestone');
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error releasing funds:', error);
      toast.error('Failed to release funds');
    }
  };
  
  // Handle refunding unspent funds
  const handleRefundUnspent = async () => {
    try {
      const result = await fundManagementService.refundUnspentFunds(approval.ID.toString());
      
      toast.success(`Successfully refunded ${result.refundAmount.toFixed(2)} XLM of unspent funds`);
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error refunding unspent funds:', error);
      toast.error('Failed to refund unspent funds');
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'released':
        return 'bg-purple-100 text-purple-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (isLoading) {
    return <div className="py-4 text-center">Loading milestones...</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Milestones</h3>
        <div className="flex gap-2">
          {isOwner && (
            <Dialog open={showNewMilestoneDialog} onOpenChange={setShowNewMilestoneDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Add Milestone</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Milestone</DialogTitle>
                  <DialogDescription>
                    Create a milestone to track progress and release funds based on completion.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="milestoneName">Name</Label>
                    <Input
                      id="milestoneName"
                      value={milestoneName}
                      onChange={(e) => setMilestoneName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="milestoneDescription">Description</Label>
                    <Textarea
                      id="milestoneDescription"
                      value={milestoneDescription}
                      onChange={(e) => setMilestoneDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="milestoneAmount">Amount (XLM)</Label>
                    <Input
                      id="milestoneAmount"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={milestoneAmount}
                      onChange={(e) => setMilestoneAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {milestoneDueDate ? format(milestoneDueDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={milestoneDueDate}
                          onSelect={(date) => {
                            setMilestoneDueDate(date || new Date());
                            setDatePickerOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewMilestoneDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMilestone}>Create Milestone</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {/* Add refund button for executed approvals */}
          {isOwner && approval.status === 'executed' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefundUnspent}
            >
              Refund Unspent Funds
            </Button>
          )}
        </div>
      </div>
      
      {milestones.length > 0 ? (
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="border rounded-lg p-4">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{milestone.name}</h4>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(milestone.status)}`}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Due: {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                    <div>Amount: {milestone.amount} XLM</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Owner actions */}
                  {isOwner && milestone.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowCompleteDialog(true);
                      }}
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  {/* Cosigner actions */}
                  {milestone.status === 'completed' && (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedMilestone(milestone);
                        setShowVerifyDialog(true);
                      }}
                    >
                      Verify
                    </Button>
                  )}
                  
                  {/* Fund release */}
                  {isOwner && milestone.status === 'verified' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleReleaseFunds(milestone)}
                    >
                      Release Funds
                    </Button>
                  )}
                </div>
              </div>
              
              {milestone.verificationProof && (
                <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                  <p className="font-semibold text-xs">Verification Proof:</p>
                  <p className="text-xs mt-1">{milestone.verificationProof}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-muted-foreground">
          No milestones created for this approval.
        </div>
      )}
      
      {/* Complete milestone dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Milestone as Complete</DialogTitle>
            <DialogDescription>
              Provide verification proof that this milestone has been completed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="verificationProof">Verification Proof</Label>
              <Textarea
                id="verificationProof"
                value={verificationProof}
                onChange={(e) => setVerificationProof(e.target.value)}
                placeholder="Provide details or links to evidence that this milestone is complete"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteMilestone}>Mark as Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Verify milestone dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Milestone</DialogTitle>
            <DialogDescription>
              Review the milestone completion and approve or reject it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="verificationComments">Comments</Label>
              <Textarea
                id="verificationComments"
                value={verificationComments}
                onChange={(e) => setVerificationComments(e.target.value)}
                placeholder="Add any comments about the verification"
              />
            </div>
            <div className="grid gap-2">
              <Label>Verification Status</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={verificationStatus === 'approved' ? 'default' : 'outline'}
                  className="flex gap-2 items-center"
                  onClick={() => setVerificationStatus('approved')}
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant={verificationStatus === 'rejected' ? 'destructive' : 'outline'}
                  className="flex gap-2 items-center"
                  onClick={() => setVerificationStatus('rejected')}
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyMilestone}
              variant={verificationStatus === 'approved' ? 'default' : 'destructive'}
            >
              Submit Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 