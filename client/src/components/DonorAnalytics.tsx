import { useState, useEffect, ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/user';
import { toast } from 'sonner';
import { BarChart, PieChart, DollarSign, Calendar, TrendingUp, Target } from 'lucide-react';

interface Donation {
  ID: number;
  amount: string;
  charityId: number;
  donorId: string;
  message: string;
  txHash: string;
  status: string;
  category: string;
  createdAt: string;
  charity: {
    name: string;
    category: string;
  };
}

interface DonorAnalyticsProps {
  userId: string;
}

export default function DonorAnalytics({ userId }: DonorAnalyticsProps) {
  const { user } = useAuth() as { user: User | null };
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  
  useEffect(() => {
    fetchDonations();
  }, [userId]);
  
  const fetchDonations = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/donations');
      // Filter client-side for the current user's donations
      const userDonations = response.data.data.filter(
        (donation: Donation) => donation.donorId === userId
      );
      setDonations(userDonations);
    } catch (error) {
      console.error('Failed to fetch donations:', error);
      toast.error('Failed to load donation history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate lifetime giving
  const lifetimeGiving = donations.reduce((total, donation) => {
    return total + parseFloat(donation.amount);
  }, 0);
  
  // Filter donations by year for tax purposes
  const donationsByYear = donations.filter(donation => {
    const donationYear = new Date(donation.createdAt).getFullYear();
    return donationYear === yearFilter;
  });
  
  // Calculate tax-deductible amount for the selected year
  const taxDeductibleAmount = donationsByYear.reduce((total, donation) => {
    return total + parseFloat(donation.amount);
  }, 0);
  
  // Group donations by charity category for impact report
  const donationsByCategory = donations.reduce((acc, donation) => {
    const category = donation.charity?.category || donation.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + parseFloat(donation.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Group donations by month for trend analysis
  const donationsByMonth = donations.reduce((acc, donation) => {
    const date = new Date(donation.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthYear] = (acc[monthYear] || 0) + parseFloat(donation.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Sort months chronologically
  const sortedMonths = Object.keys(donationsByMonth).sort();
  
  // Calculate donation frequency
  const donationFrequency = sortedMonths.length > 0
    ? (donations.length / sortedMonths.length).toFixed(1)
    : '0';
  
  // Format data for charts
  const categoryData = Object.entries(donationsByCategory).map(([category, amount]) => ({
    category,
    amount
  }));
  
  const trendData = sortedMonths.map(month => {
    const [year, monthNum] = month.split('-');
    return {
      month: `${monthNum}/${year.slice(2)}`,
      amount: donationsByMonth[month]
    };
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Donor Analytics</CardTitle>
          <CardDescription>Loading your donation data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="h-5 w-5 mr-2" />
          Donor Analytics
        </CardTitle>
        <CardDescription>
          Track your giving history and impact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 mb-6 grid-cols-1 md:grid-cols-4">
          <div className="p-4 bg-primary/10 rounded-lg flex items-center">
            <DollarSign className="h-8 w-8 mr-3 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Lifetime Giving</p>
              <h3 className="text-2xl font-bold">{lifetimeGiving.toFixed(2)} XLM</h3>
            </div>
          </div>
          
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Year</p>
              <h3 className="text-2xl font-bold">{taxDeductibleAmount.toFixed(2)} XLM</h3>
            </div>
          </div>
          
          <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center">
            <TrendingUp className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Donations/Month</p>
              <h3 className="text-2xl font-bold">{donationFrequency}</h3>
            </div>
          </div>
          
          <div className="p-4 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center">
            <Target className="h-8 w-8 mr-3 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Categories</p>
              <h3 className="text-2xl font-bold">{Object.keys(donationsByCategory).length}</h3>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="history" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="history">Giving History</TabsTrigger>
            <TabsTrigger value="impact">Impact Visualization</TabsTrigger>
            <TabsTrigger value="trends">Donation Trends</TabsTrigger>
          </TabsList>
          
          {/* Giving History Tab */}
          <TabsContent value="history">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Donation History</h3>
              {donations.length > 0 ? (
                <div className="grid gap-3">
                  {donations.map(donation => (
                    <div key={donation.ID} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{donation.charity?.name || 'Unknown Charity'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {donation.amount} XLM • {new Date(donation.createdAt).toLocaleDateString()}
                          </p>
                          {donation.message && (
                            <p className="text-sm mt-1 italic">"{donation.message}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 px-2 py-1 rounded-full">
                            {donation.charity?.category || donation.category || 'Uncategorized'}
                          </span>
                          {donation.txHash && (
                            <p className="text-xs mt-1 text-muted-foreground">
                              Tx: {donation.txHash.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No donations found. Make your first donation to see your history.
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Impact Visualization Tab */}
          <TabsContent value="impact">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Impact Visualization</h3>
              <p className="text-muted-foreground">
                See how your donations are making a difference across different categories.
              </p>
              
              {categoryData.length > 0 ? (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Category distribution chart */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Category Distribution</h4>
                    <div className="flex items-center justify-center h-64">
                      {/* Simple bar chart visualization */}
                      <div className="w-full">
                        <div className="flex gap-2 h-full items-end">
                          {categoryData.map((item, i) => (
                            <div 
                              key={i} 
                              className="bg-primary/70 hover:bg-primary rounded-t-md transition-all"
                              style={{ 
                                width: `${100 / categoryData.length}%`, 
                                height: `${(item.amount / Math.max(...categoryData.map(d => d.amount))) * 100}%`,
                                minHeight: '20px'
                              }}
                            >
                              <div className="p-2 text-white text-xs font-bold truncate">{item.category}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4">
                          {categoryData.map((item, i) => (
                            <div key={i} className="flex justify-between items-center text-sm mb-1">
                              <span>{item.category}</span>
                              <span className="font-semibold">{item.amount.toFixed(2)} XLM</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Impact metrics */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-4">Your Impact</h4>
                    <div className="space-y-4">
                      {categoryData.map((item, i) => {
                        // Generate impact metrics based on donation category
                        const impactMetric = getImpactMessage(item.category, item.amount);
                        return (
                          <div key={i} className="p-3 bg-muted/30 rounded-lg">
                            <div className="font-medium">{item.category}</div>
                            <div className="text-sm text-muted-foreground mt-1">{impactMetric}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No donation data available to visualize. Make your first donation to see your impact.
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Donation Trends Tab */}
          <TabsContent value="trends">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Donation Trends</h3>
              <p className="text-muted-foreground">
                Track how your giving has evolved over time.
              </p>
              
              {trendData.length > 0 ? (
                <div className="mt-6 border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Monthly Giving</h4>
                  
                  {/* Line chart visualization */}
                  <div className="h-64">
                    <div className="relative h-full">
                      {/* Y-axis */}
                      <div className="absolute left-0 h-full w-10 flex flex-col justify-between items-end pr-2">
                        {[0, 25, 50, 75, 100].map((tick, i) => (
                          <div key={i} className="text-xs text-muted-foreground">
                            {(tick / 100 * Math.max(...trendData.map(d => d.amount))).toFixed(0)}
                          </div>
                        ))}
                      </div>
                      
                      {/* Chart area */}
                      <div className="ml-10 h-full flex items-end">
                        <div className="w-full h-[calc(100%-20px)] flex items-end relative">
                          {/* Background grid lines */}
                          {[0, 25, 50, 75, 100].map((tick, i) => (
                            <div 
                              key={i} 
                              className="absolute w-full border-t border-muted/30" 
                              style={{ bottom: `${tick}%` }}
                            ></div>
                          ))}
                          
                          {/* Bars */}
                          <div className="flex gap-1 w-full h-full items-end">
                            {trendData.map((item, i) => (
                              <div 
                                key={i} 
                                className="flex-1 bg-primary/70 hover:bg-primary rounded-t transition-all relative group"
                                style={{ 
                                  height: `${(item.amount / Math.max(...trendData.map(d => d.amount))) * 100}%`,
                                  minHeight: '1px'
                                }}
                              >
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                  {item.amount.toFixed(2)} XLM
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* X-axis */}
                      <div className="absolute bottom-0 left-10 right-0">
                        <div className="flex justify-between">
                          {trendData.map((item, i) => (
                            <div key={i} className="text-xs text-muted-foreground transform -rotate-45 origin-top-left ml-2">
                              {item.month}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h4 className="font-medium mb-2">Insights</h4>
                    <div className="space-y-2">
                      {getTrendInsights(trendData)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-muted-foreground">
                  No trend data available yet. Make more donations to see your giving patterns.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchDonations}>
          Refresh Data
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper functions for impact metrics
const getImpactMessage = (category: string, amount: number) => {
  const randomIndex = Math.floor(Math.random() * 3);
  
  const impactMessages: Record<string, string[]> = {
    "Emergency Relief": [
      `Your donation helped provide emergency supplies for ${Math.floor(amount / 5)} people in need.`,
      `You've contributed to emergency housing for ${Math.floor(amount / 20)} displaced families.`,
      `Your generosity provided ${Math.floor(amount / 2)} meals for disaster victims.`
    ],
    "Education": [
      `You've helped provide educational materials for ${Math.floor(amount / 10)} students.`,
      `Your donation contributed to ${Math.floor(amount / 50)} hours of teaching in underserved areas.`,
      `You've helped fund ${Math.floor(amount / 100)} scholarships for deserving students.`
    ],
    "Healthcare": [
      `Your donation provided medical supplies for ${Math.floor(amount / 5)} patients.`,
      `You've helped fund ${Math.floor(amount / 25)} medical consultations in remote areas.`,
      `Your generosity supported ${Math.floor(amount / 100)} life-saving treatments.`
    ],
    "Environment": [
      `Your donation helped plant ${Math.floor(amount * 2)} trees to combat deforestation.`,
      `You've contributed to preserving ${Math.floor(amount / 10)} square meters of rainforest.`,
      `Your generosity helped protect ${Math.floor(amount / 50)} endangered species.`
    ],
    "Animal Welfare": [
      `Your donation provided food for ${Math.floor(amount / 2)} shelter animals.`,
      `You've helped fund ${Math.floor(amount / 30)} animal rescues.`,
      `Your generosity supported medical care for ${Math.floor(amount / 15)} injured animals.`
    ]
  };
  
  // Default impact message for categories not in the predefined list
  const defaultMessages = [
    `Your donation of ${amount.toFixed(2)} XLM has made a significant impact.`,
    `You've helped improve ${Math.floor(amount / 10)} lives with your generous contribution.`,
    `Your generosity has created meaningful change in communities.`
  ];
  
  const messages = impactMessages[category] || defaultMessages;
  return messages[randomIndex];
};

// Generate insights based on trend data
const getTrendInsights = (trendData: { month: string, amount: number }[]) => {
  if (trendData.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Make more donations to see insights about your giving patterns.
      </p>
    );
  }
  
  const insights: ReactNode[] = [];
  
  // Calculate average monthly donation
  const averageDonation = trendData.reduce((sum, item) => sum + item.amount, 0) / trendData.length;
  insights.push(
    <p key="average" className="text-sm">
      Your average monthly donation is <span className="font-semibold">{averageDonation.toFixed(2)} XLM</span>.
    </p>
  );
  
  // Identify peak months
  const maxAmount = Math.max(...trendData.map(d => d.amount));
  const peakMonths = trendData.filter(d => d.amount === maxAmount).map(d => d.month);
  insights.push(
    <p key="peak" className="text-sm">
      Your highest giving {peakMonths.length > 1 ? 'months were' : 'month was'} {peakMonths.join(', ')} 
      with <span className="font-semibold">{maxAmount.toFixed(2)} XLM</span>.
    </p>
  );
  
  // Calculate growth trend
  if (trendData.length >= 3) {
    const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
    const secondHalf = trendData.slice(Math.floor(trendData.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.amount, 0) / secondHalf.length;
    
    const percentChange = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
    
    if (!isNaN(percentChange) && isFinite(percentChange)) {
      insights.push(
        <p key="growth" className="text-sm">
          Your donations have {percentChange > 0 ? 'increased' : 'decreased'} by 
          <span className="font-semibold"> {Math.abs(percentChange).toFixed(1)}%</span> over time.
        </p>
      );
    }
  }
  
  return insights;
};