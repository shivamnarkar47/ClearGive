import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Plus, 
  ExternalLink, 
  PieChart, 
  BarChart3, 
  Filter, 
  Medal, 
  Download,
  Eye
} from 'lucide-react'
import { useStellar } from '@/contexts/StellarContext'
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
import { toast } from "sonner"
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types/user'
import { StellarService } from '@/services/stellar'
import { CertificateService, Certificate } from '@/services/certificate'
import { useCertificates } from '@/hooks/useCertificates'

interface Transaction {
  ID: number;
  amount: string;
  charityId: number;
  donorId: number;
  message: string;
  txHash: string;
  status: string;
  CreatedAt: string;
  charity: Charity;
  category?: string;
}

interface Charity {
  ID: string;
  name: string;
  description: string;
  walletAddress: string;
  totalDonations: number;
  category: string;
  website?: string;
  imageUrl?: string;
}

const FundFlowVisualization = ({ transactions }: { transactions: Transaction[] }) => {
  const calculateTotalByCharity = () => {
    const totals = transactions.reduce((acc, tx) => {
      const charityName = tx.charity?.name || 'Unknown';
      acc[charityName] = (acc[charityName] || 0) + parseFloat(tx.amount);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(totals).map(([name, total]) => ({
      name,
      value: total
    }));
  };
  
  const data = calculateTotalByCharity();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <PieChart className="mr-2 h-5 w-5" />
        Fund Flow Visualization
      </h3>
      <div className="h-64 flex items-center justify-center">
        {data.length > 0 ? (
          <div className="w-full h-full relative">
            <div className="flex gap-2 h-full items-end">
              {data.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-blue-500 dark:bg-blue-600 rounded-t-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-all"
                  style={{ 
                    width: `${100 / data.length}%`, 
                    height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`,
                    minHeight: '20px'
                  }}
                >
                  <div className="p-2 text-white text-xs font-bold truncate">{item.name}</div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {data.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm mb-1">
                  <span>{item.name}</span>
                  <span className="font-semibold">{item.value.toFixed(2)} XLM</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            No donation data available to visualize
          </div>
        )}
      </div>
      <div className="mt-4">
        <Button variant="outline" size="sm">
          View Detailed Report
        </Button>
      </div>
    </div>
  );
};

const SpendingCategorization = ({ transactions }: { transactions: Transaction[] }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingTx, setEditingTx] = useState<number | null>(null);
  const [categoryInput, setCategoryInput] = useState('');
  
  const categories = [
    'all',
    'Healthcare',
    'Education',
    'Emergency Relief',
    'Infrastructure',
    'Food Security',
    'Administrative',
    'Other'
  ];
  
  const filteredTransactions = selectedCategory === 'all' 
    ? transactions 
    : transactions.filter(tx => tx.category === selectedCategory);
  
  const handleCategorySave = (txId: number) => {
    const updatedTransactions = transactions.map(tx => {
      if (tx.ID === txId) {
        return { ...tx, category: categoryInput };
      }
      return tx;
    });
    
    setEditingTx(null);
    setCategoryInput('');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart3 className="mr-2 h-5 w-5" />
        Spending Categorization
      </h3>
      
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map(category => (
          <Button 
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </Button>
        ))}
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Charity</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <TableRow key={tx.ID}>
                <TableCell>{tx.charity?.name || 'Unknown'}</TableCell>
                <TableCell>{tx.amount} XLM</TableCell>
                <TableCell>
                  {new Date(tx.CreatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {editingTx === tx.ID ? (
                    <select 
                      value={categoryInput} 
                      onChange={(e) => setCategoryInput(e.target.value)}
                      className="p-1 border rounded"
                    >
                      {categories.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    tx.category || 'Uncategorized'
                  )}
                </TableCell>
                <TableCell>
                  {editingTx === tx.ID ? (
                    <Button size="sm" onClick={() => handleCategorySave(tx.ID)}>Save</Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditingTx(tx.ID);
                        setCategoryInput(tx.category || categories[1]);
                      }}
                    >
                      Categorize
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const TransparencyDashboard = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Transparency Dashboard</h2>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FundFlowVisualization transactions={transactions} />
        <SpendingCategorization transactions={transactions} />
      </div>
    </div>
  );
};

// Add NFT Certificate Dialog Component
const NFTCertificateDialog = ({ 
  transaction, 
  isOpen, 
  onClose 
}: { 
  transaction: Transaction, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const { generateCertificate } = useCertificates();

  const handleGenerateCertificate = async () => {
    try {
      setIsGenerating(true);
      // Call the generateCertificate function from the hook
      const generatedCertificate = await generateCertificate(transaction.ID);
      if (generatedCertificate) {
        setCertificate(generatedCertificate);
        toast.success("NFT Certificate generated successfully");
      }
    } catch (error) {
      console.error('Error generating NFT certificate:', error);
      toast.error("Failed to generate NFT certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Medal className="w-5 h-5 mr-2" />
            NFT Donation Certificate
          </DialogTitle>
          <DialogDescription>
            Generate an NFT certificate for your donation to {transaction.charity?.name || 'Unknown Charity'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Amount:</div>
              <div className="font-medium">{transaction.amount} XLM</div>
              
              <div className="text-muted-foreground">Date:</div>
              <div className="font-medium">{new Date(transaction.CreatedAt).toLocaleDateString()}</div>
              
              <div className="text-muted-foreground">Charity:</div>
              <div className="font-medium">{transaction.charity?.name || 'Unknown'}</div>
              
              <div className="text-muted-foreground">Transaction:</div>
              <div className="font-medium truncate">{transaction.txHash}</div>
            </div>
          </div>
          
          {certificate ? (
            <div className="space-y-3">
              <div className="aspect-square rounded-lg border flex items-center justify-center bg-background">
                <div className="text-center p-6">
                  <Medal className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-lg">Thank You Certificate</h3>
                  <p className="text-sm text-muted-foreground mb-2">Your NFT Certificate is ready</p>
                  <p className="text-xs break-all">Token ID: {certificate.tokenId}</p>
                  <p className="text-xs text-muted-foreground mt-2">Issued: {new Date(certificate.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button className="w-full" onClick={() => window.open(certificate.tokenUri, '_blank')}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
                <Button className="w-full" onClick={() => window.open(`https://stellarscan.io/tx/${certificate.txHash}`, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Blockchain
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleGenerateCertificate} 
              disabled={isGenerating} 
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-background"></div>
                  Generating Certificate...
                </>
              ) : (
                <>
                  <Medal className="mr-2 h-4 w-4" />
                  Generate NFT Certificate
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function DonationsPage() {
  const { user } = useAuth() as { user: User | null }
  const { stellarAccount, balance, loading, createAccount, makeDonation } = useStellar();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedCharity, setSelectedCharity] = useState('');
  const [processingDonation, setProcessingDonation] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [message, setMessage] = useState('');
  const [showTransparencyDashboard, setShowTransparencyDashboard] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showNFTDialog, setShowNFTDialog] = useState(false);
  const stellarService = StellarService.getInstance();

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const response = await api.get('/charities');
        setCharities(response.data.data);
      } catch (error) {
        console.error('Failed to fetch charities:', error);
        toast.error("Error", {
          description: "Failed to load charities. Please try again later.",
        });
      }
    };

    fetchCharities();
  }, []);

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user) return;
      
      try {
        const response = await api.get(`/donations/`);
        setTransactions(response.data.data);
      } catch (error) {
        console.error('Failed to fetch donations:', error);
        toast.error("Error", {
          description: "Failed to load donation history. Please try again later.",
        });
      }
    };

    fetchDonations();
  }, [user]);

  const handleCreateAccount = async () => {
    try {
      await createAccount();
      toast.success("Account Created", {
        description: "Your Stellar account has been created successfully.",
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to create Stellar account. Please try again.",
      });
    }
  };

  const handleDonation = async () => {
    if (!selectedCharity || !donationAmount) return;

    setProcessingDonation(true);
    try {
      console.log(selectedCharity)
      console.log(charities)
      const charity = charities.find(c => c.ID == selectedCharity);
      console.log(charity)
      if (!charity) throw new Error('Charity not found');

      await makeDonation(
        charity.walletAddress,
        donationAmount,
        message || `Donation to ${charity.name}`
      ).then(async (response)=>{
        console.log(response)
        await api.post('/donations', {
          amount: donationAmount,
          charityId: parseInt(charity.ID),
          donorId: user?.id,
          message: message || `Donation to ${charity.name}`,
          txHash: response.toString(),
          status: 'completed'
        }).then((response) => {
          console.log(response)
          toast.success("Donation Successful", {
            description: `Your donation of ${donationAmount} XLM has been processed.`,
          });
        }).catch((error) => {
          toast.error("Error", {
            description: "Failed to process donation. Please try again.",
          });
          console.error('Donation error:', error);
        });
      });

      setIsDialogOpen(false);
      setDonationAmount('');
      setSelectedCharity('');
      setMessage('');
    } catch (error) {
      toast.error("Error", {
        description: "Failed to process donation. Please try again.",
      });
      console.log('Charity:', selectedCharity);
      console.error('Donation error:', error);
    } finally {
      setProcessingDonation(false);
    }
  };

  const handleViewInExplorer = (hash: string) => {
    stellarService.openTransactionInExplorer(hash);
  };

  // Function to handle NFT certificate generation
  const handleGenerateNFTCertificate = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowNFTDialog(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  console.log(transactions)

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b px-6 ">
          <h1 className="text-lg font-semibold">Donations</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTransparencyDashboard(!showTransparencyDashboard)}
            >
              {showTransparencyDashboard ? 'Hide' : 'Show'} Transparency Dashboard
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Donations</h2>
              <p className="text-muted-foreground">
                Manage and track your charitable contributions
              </p>
              {stellarAccount && (
                <p className="text-sm text-muted-foreground mt-1">
                  Balance: {balance} XLM
                </p>
              )}
            </div>
            {stellarAccount ? (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Donation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make a Donation</DialogTitle>
                    <DialogDescription>
                      Choose a charity and enter the details of your donation.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="charity">Charity</Label>
                      {charities ? (
                        <select
                          id="charity"
                          value={selectedCharity}
                          onChange={(e) => setSelectedCharity(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                          <option value="">Select a charity</option>
                          {charities.map((charity) => (
                            <option key={charity.ID} value={charity.ID}>
                              {charity.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Skeleton className="h-9 w-full" />
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (XLM)</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount in XLM"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Input
                        id="message"
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add a message to your donation"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleDonation}
                      disabled={processingDonation || !selectedCharity || !donationAmount}
                    >
                      {processingDonation ? 'Processing...' : 'Donate'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button onClick={handleCreateAccount}>
                Create Stellar Account
              </Button>
            )}
          </div>

          {showTransparencyDashboard && stellarAccount && (
            <TransparencyDashboard transactions={transactions} />
          )}

          {stellarAccount ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Charity</TableHead>
                    <TableHead>Amount (XLM)</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <TableRow key={tx.ID}>
                        <TableCell className="font-medium">
                          {tx.charity?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{tx.message}</TableCell>
                        <TableCell>
                          {new Date(tx.CreatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status == "completed" ? "success" : "secondary"}>
                            {tx.status == "completed" ? 'Completed' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleViewInExplorer(tx.txHash)}
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View in Explorer</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateNFTCertificate(tx)}
                            >
                              <Medal className="h-4 w-4" />
                              <span className="sr-only">Get NFT Certificate</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No donations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No Stellar Account Found</h3>
              <p className="text-muted-foreground mb-4">
                Create a Stellar account to start making donations
              </p>
              <Button onClick={handleCreateAccount}>
                Create Stellar Account
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* NFT Certificate Dialog */}
      {selectedTransaction && (
        <NFTCertificateDialog 
          transaction={selectedTransaction}
          isOpen={showNFTDialog}
          onClose={() => setShowNFTDialog(false)}
        />
      )}
    </DashboardLayout>
  );
} 