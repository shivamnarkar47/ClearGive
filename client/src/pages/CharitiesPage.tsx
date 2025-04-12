import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Plus, Heart, Wallet, Users, ChevronRight, Percent, BarChart, CloudCog } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api } from '@/lib/api'
import { toast } from "sonner"
import { User, UserRole } from '@/types/user'
import { StellarService } from '@/services/stellar'
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { FundManagementService, BudgetCategory as BudgetCategoryType, TransactionApproval, Cosigner } from '@/services/fund_management'
import CharityOwnershipTransfer from '@/components/CharityOwnershipTransfer'
import MilestoneManager from '@/components/MilestoneManager'

// Mock data - replace with real data later
const charities = [
  {
    id: 1,
    name: 'Red Cross',
    description: 'Providing emergency assistance, disaster relief, and disaster preparedness education.',
    category: 'Emergency Relief',
    impact: '10M+ people helped',
    rating: 4.8,
  },
  {
    id: 2,
    name: 'UNICEF',
    description: 'Working in 190 countries for the rights of every child.',
    category: 'Child Welfare',
    impact: '5M+ children supported',
    rating: 4.9,
  },
  {
    id: 3,
    name: 'WWF',
    description: 'Leading organization in wildlife conservation and endangered species.',
    category: 'Wildlife Conservation',
    impact: '1000+ species protected',
    rating: 4.7,
  },
  {
    id: 4,
    name: 'Doctors Without Borders',
    description: 'Medical care where its needed most.',
    category: 'Healthcare',
    impact: '70+ countries served',
    rating: 4.9,
  },
]

interface Charity {
  ID: string
  name: string
  description: string
  category: string
  website?: string
  imageUrl?: string
  walletAddress: string
  totalDonations: number
  owner_id: string
  createdAt: string
  updatedAt: string
  cosigners?: Array<{id: string, email: string, userId: string, isPrimary: boolean}>
}

interface CharityWithBalance extends Charity {
  balance: string
}

// Define budget category interface
interface BudgetCategory {
  id: string;
  name: string;
  allocation: number; // percentage of total budget
  spent: number; // amount spent in XLM
}

// Sample budget categories for demonstration
const sampleBudgetCategories: BudgetCategory[] = [
  { id: '1', name: 'Program Services', allocation: 70, spent: 1200 },
  { id: '2', name: 'Administrative', allocation: 15, spent: 350 },
  { id: '3', name: 'Fundraising', allocation: 10, spent: 200 },
  { id: '4', name: 'Reserve', allocation: 5, spent: 0 },
];

// Define interface for pending approval
interface PendingApproval {
  id: string;
  amount: string;
  description: string;
  category: string;
  requestedBy: string;
  requiredSignatures: number;
  currentSignatures: number;
}

// Sample pending approvals for demonstration
const samplePendingApprovals: TransactionApproval[] = [
  {
    ID: 1,
    charityId: 1,
    amount: '500',
    description: 'Emergency medical supplies',
    category: 'Program Services',
    requestedById: 'john@example.com',
    requiredSignatures: 3,
    currentSignatures: 1,
    status: 'pending',
    createdAt: '2023-07-15'
  },
  {
    ID: 2,
    charityId: 1,
    amount: '200',
    description: 'Office rent payment',
    category: 'Administrative',
    requestedById: 'sarah@example.com',
    requiredSignatures: 2,
    currentSignatures: 2,
    status: 'pending',
    createdAt: '2023-07-18'
  },
];

// Fund Management Component
const FundManagement = ({ charity, charityCosigners }: { charity: CharityWithBalance, charityCosigners: Record<string, Array<{id: string, email: string, userId: string, isPrimary: boolean}>> }) => {
  
  const { user } = useAuth() as { user: User | null };
  const [activeTab, setActiveTab] = useState('budget');
  const [isMultiSigEnabled, setIsMultiSigEnabled] = useState(false);
  const [requiredSigners, setRequiredSigners] = useState(2);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryType[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<TransactionApproval[]>([]);
  const [cosigners, setCosigners] = useState<Cosigner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCosignerEmail, setNewCosignerEmail] = useState('');
  const [newBudgetCategory, setNewBudgetCategory] = useState({ name: '', allocation: 0 });
  const [newApproval, setNewApproval] = useState({ amount: '', description: '', category: '' });
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showCosignerDialog, setShowCosignerDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  
  const fundManagementService = FundManagementService.getInstance();
  
  useEffect(() => {
    loadCharityData();
  }, [charity.ID]);
  
  const loadCharityData = async () => {
    setIsLoading(true);
    try {
      // This would fetch real data in a production app
      const response = await api.get(`/charities/${charity.ID}`);
      const charityData = response.data.data;
      console.log(charityData);
      setIsMultiSigEnabled(charityData.isMultiSig || false);
      setRequiredSigners(charityData.requiredSignatures || 2);
      
      // Load budget categories
      if (charityData.budgetCategories && charityData.budgetCategories.length > 0) {
        setBudgetCategories(charityData.budgetCategories);
      } else {
        setBudgetCategories(sampleBudgetCategories);
      }
      
      // Load cosigners
      if (charityData.cosigners && charityData.cosigners.length > 0) {
        setCosigners(charityData.cosigners);
      }
      
      // Load pending approvals
      try {
        const approvalsResponse = await fundManagementService.getPendingApprovals(charity.ID);
        console.log(approvalsResponse);
        setPendingApprovals(approvalsResponse);
      } catch (error) {
        console.error('Error loading approvals:', error);
        setPendingApprovals(samplePendingApprovals);
      }
    } catch (error) {
      console.error('Error loading charity data:', error);
      toast.error('Failed to load charity data');
      
      // Fallback to sample data
      setBudgetCategories(sampleBudgetCategories);
      setPendingApprovals(samplePendingApprovals);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle multi-signature functionality
  const handleMultiSigToggle = async () => {
    try {
      // When enabling multi-sig, ensure at least 2 signatures are required
      const signaturesRequired = !isMultiSigEnabled ? Math.max(2, requiredSigners) : 1;
      
      await fundManagementService.updateMultiSigSettings(
        charity.ID, 
        !isMultiSigEnabled, 
        signaturesRequired
      );
      
      // Update local state to match what was sent to the server
      setIsMultiSigEnabled(!isMultiSigEnabled);
      if (!isMultiSigEnabled) {
        setRequiredSigners(Math.max(2, requiredSigners));
      }
      
      toast.success(`Multi-signature wallet ${!isMultiSigEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating multi-sig settings:', error);
      toast.error('Failed to update multi-signature settings');
    }
  };
  
  const handleSaveSettings = async () => {
    try {
      await fundManagementService.updateMultiSigSettings(
        charity.ID,
        isMultiSigEnabled,
        requiredSigners
      );
      
      toast.success('Wallet settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };
  
  // Handle approving a transaction
  const handleApprove = async (approvalId: string) => {
    try {
      console.log(approvalId);
      const updatedApproval = await fundManagementService.addApprovalSignature(approvalId, user?.email || '');
      
      // Update local state
      setPendingApprovals(prevApprovals => 
        prevApprovals.map(approval => 
          approval.ID.toString() === approvalId ? updatedApproval : approval
        )
      );
      
      toast.success("Transaction approved");
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast.error('Failed to approve transaction');
    }
  };
  
  // Execute a fully-approved transaction
  const handleExecute = async (approvalId: string) => {
    try {
      const executedApproval = await fundManagementService.executeApproval(approvalId);
      
      // Update local state
      setPendingApprovals(prevApprovals => 
        prevApprovals.filter(approval => approval.ID.toString() !== approvalId)
      );
      
      // If there's a category, update the budget
      if (executedApproval.category) {
        setBudgetCategories(prev => 
          prev.map(category => {
            if (category.name === executedApproval.category) {
              return {
                ...category,
                spent: category.spent + parseFloat(executedApproval.amount)
              };
            }
            return category;
          })
        );
      }
      
      // Reload charity data to get updated balance
      await loadCharityData();
      
      toast.success(`Transaction executed: ${executedApproval.amount} XLM for ${executedApproval.description}`);
    } catch (error) {
      console.error('Error executing transaction:', error);
      toast.error('Failed to execute transaction');
    }
  };
  
  const handleAddCosigner = async () => {
    if (!newCosignerEmail) {
      toast.error('Email is required');
      return;
    }
    
    try {
      const cosigner = await fundManagementService.addCosigner(
        charity.ID,
        newCosignerEmail
      );
      
      setCosigners(prev => [...prev, cosigner]);
      setNewCosignerEmail('');
      setShowCosignerDialog(false);
      toast.success('Cosigner added successfully');
    } catch (error) {
      console.error('Error adding cosigner:', error);
      toast.error('Failed to add cosigner');
    }
  };
  
  const handleRemoveCosigner = async (cosignerId: string) => {
    try {
      await fundManagementService.removeCosigner(charity.ID, cosignerId);
      setCosigners(prev => prev.filter(cosigner => cosigner.id !== cosignerId));
      toast.success('Cosigner removed successfully');
    } catch (error) {
      console.error('Error removing cosigner:', error);
      toast.error('Failed to remove cosigner');
    }
  };
  
  const handleAddBudgetCategory = async () => {
    if (!newBudgetCategory.name || newBudgetCategory.allocation <= 0) {
      toast.error('Name and allocation are required');
      return;
    }
    
    try {
      const category = await fundManagementService.addBudgetCategory(
        charity.ID,
        newBudgetCategory.name,
        newBudgetCategory.allocation
      );
      
      setBudgetCategories(prev => [...prev, {...category, spent: 0}]);
      setNewBudgetCategory({ name: '', allocation: 0 });
      setShowBudgetDialog(false);
      toast.success('Budget category added successfully');
    } catch (error) {
      console.error('Error adding budget category:', error);
      toast.error('Failed to add budget category');
    }
  };
  
  const handleCreateApproval = async () => {
    if (!newApproval.amount || !newApproval.description) {
      toast.error('Amount and description are required');
      return;
    }
    
    try {
      const approval = await fundManagementService.createTransactionApproval(
        charity.ID,
        newApproval.amount,
        newApproval.description,
        newApproval.category,
      );
      
      setPendingApprovals(prev => [...prev, approval]);
      setNewApproval({ amount: '', description: '', category: '' });
      setShowApprovalDialog(false);
      toast.success('Transaction approval created successfully');
    } catch (error) {
      console.error('Error creating transaction approval:', error);
      toast.error('Failed to create transaction approval');
    }
  };
  
  // Calculate total budget and spent amounts
  const totalBalance = parseFloat(charity.balance);
  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);
  
  // Sample cosigners to demonstrate UI
  const sampleCosigners = [
    { id: "1", email: "john@example.com", userId: "1", isPrimary: true },
    { id: "2", email: "sarah@example.com", userId: "2", isPrimary: false },
    { id: "3", email: "michael@example.com", userId: "3", isPrimary: false },
  ];
  
  const displayCosigners = cosigners.length > 0 ? cosigners : sampleCosigners;
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fund Management</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Fund Management
        </CardTitle>
        <CardDescription>
          Manage and track your charity's funds with transparency
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="budget" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="budget">Budget Allocation</TabsTrigger>
            <TabsTrigger value="approvals">Spending Approvals</TabsTrigger>
            <TabsTrigger value="settings">Wallet Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="budget">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center">
                  <BarChart className="mr-2 h-4 w-4" />
                  Budget Allocation
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowBudgetDialog(true)}>
                  Add Category
                </Button>
              </div>
              
              <div className="grid gap-3">
                {budgetCategories.map(category => (
                  <div key={category.id} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span>{category.name}</span>
                        <span className="ml-2 text-muted-foreground">({category.allocation}%)</span>
                      </div>
                      <div className="font-semibold">
                        {category.spent} / {(totalBalance * (category.allocation / 100)).toFixed(2)} XLM
                      </div>
                    </div>
                    <Progress 
                      value={(category.spent / (totalBalance * (category.allocation / 100))) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Total Balance:</span>
                  <span className="font-bold">{totalBalance.toFixed(2)} XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total Spent:</span>
                  <span className="font-medium">{totalSpent} XLM</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="approvals">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Transaction Approvals
                </h3>
                <Button size="sm" onClick={() => setShowApprovalDialog(true)}>
                  Request Spending
                </Button>
              </div>
              
              {pendingApprovals.length > 0 ? (
                <div className="space-y-3">
                  {pendingApprovals.map(approval => (
                    <div key={approval.ID} className="p-4 border rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{approval.description}</h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              approval.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : approval.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {approval.amount} XLM • {approval.category}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested by {approval.requestedById} on {new Date(approval.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium mb-2">
                            Signatures: {approval.currentSignatures}/{approval.requiredSignatures}
                          </div>
                          <div className="flex gap-2">
                            {approval.status === 'pending' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleApprove(approval.ID.toString())}
                                disabled={approval.currentSignatures >= approval.requiredSignatures}
                              >
                                Approve
                              </Button>
                            )}
                            {approval.status === 'approved' && user?.ID === charity.owner_id && (
                              <Button 
                                size="sm"
                                onClick={() => handleExecute(approval.ID.toString())}
                              >
                                Execute
                              </Button>
                            )}
                            {approval.status === 'pending' && approval.currentSignatures >= approval.requiredSignatures && user?.ID === charity.owner_id && (
                              <Button 
                                size="sm"
                                onClick={() => handleExecute(approval.ID.toString())}
                              >
                                Execute
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Add collapsible milestone section */}
                      {(approval.status === 'approved' || approval.status === 'pending') && (
                        <div className="mt-4 pt-4 border-t">
                          <MilestoneManager 
                            approval={approval}
                            isOwner={user?.ID === charity.owner_id}
                            onUpdate={loadCharityData}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No transaction approvals found
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Multi-Signature Wallet</h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.ID === charity.owner_id ? 
                      "Enable multi-signature authorization for better security and governance" :
                      "Multi-signature authorization provides better security and governance"
                    }
                  </p>
                </div>
                <Switch 
                  checked={isMultiSigEnabled}
                  onCheckedChange={handleMultiSigToggle}
                  disabled={user?.ID !== charity.owner_id && !charityCosigners[charity.ID]?.some((cosigner: {email: string}) => cosigner.email === user?.email)}
                />
              </div>
              
              {isMultiSigEnabled && (
                <div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="reqSigners">Required Signers</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="reqSigners"
                        type="number"
                        min="2"
                        max="5"
                        value={requiredSigners}
                        onChange={e => {
                          const value = parseInt(e.target.value);
                          // Ensure minimum of 2 signers when multi-sig is enabled
                          setRequiredSigners(Math.max(2, value));
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        out of {displayCosigners.length + 1} co-signers
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Signers</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowCosignerDialog(true)}
                        disabled={user?.ID !== charity.owner_id}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Signer
                      </Button>
                    </div>
                    <div className="space-y-2 mt-2">
                      {displayCosigners.map(cosigner => (
                        <div key={cosigner.id} className="p-2 border rounded flex justify-between items-center">
                          <div className="text-sm">{cosigner.email} {cosigner.isPrimary && '(Primary)'}</div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveCosigner(cosigner.id)}
                            disabled={user?.ID !== charity.owner_id}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {user && charity.owner_id === user.ID && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Charity Ownership</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Transfer ownership of this charity to another user. The new owner will have full control over the charity.
                    </p>
                    <CharityOwnershipTransfer 
                      charityId={charity.ID} 
                      onTransferComplete={loadCharityData}
                    />
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <Button variant="outline" onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Dialog for adding a cosigner */}
      <Dialog open={showCosignerDialog} onOpenChange={setShowCosignerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cosigner</DialogTitle>
            <DialogDescription>
              Add a person who can approve transactions for this charity.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="cosignerEmail">Email</Label>
              <Input
                id="cosignerEmail"
                value={newCosignerEmail}
                onChange={e => setNewCosignerEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCosignerDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCosigner}>Add Cosigner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for adding a budget category */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Category</DialogTitle>
            <DialogDescription>
              Create a new budget category to track spending.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newBudgetCategory.name}
                onChange={e => setNewBudgetCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="allocation">Allocation (%)</Label>
              <Input
                id="allocation"
                type="number"
                min="0"
                max="100"
                value={newBudgetCategory.allocation}
                onChange={e => setNewBudgetCategory(prev => ({ ...prev, allocation: parseFloat(e.target.value) }))}
                placeholder="Enter allocation percentage"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBudgetCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog for creating a transaction approval */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Spending Approval</DialogTitle>
            <DialogDescription>
              Create a new spending request that requires approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (XLM)</Label>
              <Input
                id="amount"
                type="number"
                step="0.0001"
                min="0"
                value={newApproval.amount}
                onChange={e => setNewApproval(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="Enter amount in XLM"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newApproval.description}
                onChange={e => setNewApproval(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={newApproval.category}
                onChange={e => setNewApproval(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select a category</option>
                {budgetCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateApproval}>Create Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default function CharitiesPage() {
  const { user } = useAuth() as { user: User | null }
  const [charities, setCharities] = useState<CharityWithBalance[]>([])
  const [charityCosigners, setCharityCosigners] = useState<Record<string, Array<{id: string, email: string, userId: string, isPrimary: boolean}>>>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    website: '',
    imageUrl: ''
  })
  const [selectedCharity, setSelectedCharity] = useState<CharityWithBalance | null>(null)
  const [showFundManagement, setShowFundManagement] = useState(false)
  const stellarService = StellarService.getInstance()

  useEffect(() => {
    fetchCharities()
  }, [])

  const fetchCharities = async () => {
    try {
      // Fetch basic charity data
      const response = await api.get('/charities')
      const charitiesData = response.data.data
      
      // Create an object to store cosigners by charity ID
      const cosignersMap: Record<string, Array<any>> = {}
      
      // Fetch detailed info including cosigners for each charity
      await Promise.all(charitiesData.map(async (charity: Charity) => {
        try {
          const detailResponse = await api.get(`/charities/${charity.ID}`)
          if (detailResponse.data.data.cosigners) {
            cosignersMap[charity.ID] = detailResponse.data.data.cosigners
          }
        } catch (error) {
          console.error(`Error fetching cosigners for charity ${charity.ID}:`, error)
        }
      }))
      
      // Store the cosigners map in state
      setCharityCosigners(cosignersMap)
      
      // Fetch balances for each charity
      const charitiesWithBalances = await Promise.all(
        charitiesData.map(async (charity: Charity) => {
          try {
            const balance = await stellarService.getBalance(charity.walletAddress)
            return { ...charity, balance }
          } catch (error) {
            console.error(`Error fetching balance for charity ${charity.ID}:`, error)
            return { ...charity, balance: '0' }
          }
        })
      )
      
      setCharities(charitiesWithBalances)
    } catch (error) {
      toast.error('Failed to fetch charities')
    }
  }

  const handleCreateCharity = async () => {
    try {
      setIsLoading(true)
      await api.post('/charities', formData)
      toast.success('Charity created successfully')
      setIsDialogOpen(false)
      fetchCharities()
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        website: '',
        imageUrl: ''
      })
    } catch (error) {
      toast.error('Failed to create charity')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  return (
    <DashboardLayout>
      <div className="container px-20 py-6">
        <div className="flex justify-between items-center mb-6 mx-auto">
          <h1 className="text-3xl font-bold">Charities</h1>
          {(user?.role === 'CHARITY_OWNER' || Object.values(charityCosigners).some(cosignerList => 
            cosignerList.some(cosigner => cosigner.email === user?.email)
          )) && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Charity
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Charity</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new charity. A Stellar wallet will be automatically created for your charity to receive donations.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website (optional)</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="imageUrl">Image URL (optional)</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateCharity} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Charity'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {charities.map((charity) => (
            <div key={charity.ID} className="border rounded-lg p-6">
              {/* Add Image if available */}
              {charity.imageUrl && (
                <img src={charity.imageUrl} alt={charity.name} className="w-full h-40 object-cover rounded-lg mb-4" />
              )}
              <h3 className="text-xl font-semibold mb-2">{charity.name}</h3>
              <p className="text-gray-600 mb-4">{charity.description}</p>
              <div className="flex flex-col gap-2">
                <div className="text-sm text-gray-500">
                  Total Balance: {charity.balance} XLM
                </div>
                <div className="text-sm text-gray-500 truncate">
                  Wallet: {charity.walletAddress}
                </div>
                <div className="flex justify-between">
                  {(user?.ID === charity.owner_id || charityCosigners[charity.ID]?.some((cosigner: {email: string}) => cosigner.email === user?.email)) && (
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedCharity(charity);
                      setShowFundManagement(true);
                    }}>
                      Manage Funds
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Display fund management if a charity is selected */}
        {selectedCharity && showFundManagement  && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedCharity.name} - Fund Management</h2>
              <Button variant="outline" size="sm" onClick={() => setShowFundManagement(false)}>
                Close
              </Button>
            </div>
            <FundManagement 
              charity={selectedCharity} 
              charityCosigners={charityCosigners}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
} 