import { useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  FileText,
  Download,
  Calendar,
  FileSearch,
  ClipboardCheck,
  BarChart3,
  Clock,
  RefreshCw,
  Check,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/types/user'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TaxReport {
  id: string;
  year: number;
  totalDonations: number;
  status: 'ready' | 'processing' | 'error';
  createdAt: string;
}

interface ComplianceCheck {
  id: string;
  type: string;
  status: 'passed' | 'failed' | 'pending';
  date: string;
  details?: string;
}

interface AuditRecord {
  id: string;
  event: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function TaxReportingPage() {
  const { user } = useAuth() as { user: User | null };
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<string>('all');
  const [reports, setReports] = useState<TaxReport[]>([
    {
      id: '1',
      year: 2023,
      totalDonations: 1250.50,
      status: 'ready',
      createdAt: '2023-12-31T23:59:59Z'
    },
    {
      id: '2',
      year: 2024,
      totalDonations: 750.25,
      status: 'ready',
      createdAt: '2024-06-15T16:30:00Z'
    }
  ]);

  const complianceChecks: ComplianceCheck[] = [
    { id: '1', type: 'Donor Information Verification', status: 'passed', date: '2024-06-01T14:30:00Z' },
    { id: '2', type: 'Charity Eligibility Check', status: 'passed', date: '2024-06-01T14:32:00Z' },
    { id: '3', type: 'Transaction Limit Compliance', status: 'passed', date: '2024-06-01T14:35:00Z' },
    { id: '4', type: 'Anti-Money Laundering Check', status: 'pending', date: '2024-06-01T14:38:00Z' },
  ];

  const auditRecords: AuditRecord[] = [
    { 
      id: '1', 
      event: 'Tax Report Generated', 
      user: user?.email || 'Unknown', 
      timestamp: '2024-06-15T16:30:00Z',
      details: '2024 Tax Year Report' 
    },
    { 
      id: '2', 
      event: 'Donation Made', 
      user: user?.email || 'Unknown', 
      timestamp: '2024-05-20T13:45:00Z',
      details: 'Donation of 100 XLM to Red Cross' 
    },
    { 
      id: '3', 
      event: 'Compliance Check Completed', 
      user: 'System', 
      timestamp: '2024-06-01T14:35:00Z',
      details: 'All checks passed' 
    }
  ];

  const generateTaxReport = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate report
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: TaxReport = {
        id: Math.random().toString(36).substr(2, 9),
        year: parseInt(selectedYear),
        totalDonations: Math.round(Math.random() * 1000 * 100) / 100,
        status: 'ready',
        createdAt: new Date().toISOString()
      };
      
      setReports(prev => [newReport, ...prev]);
      toast.success('Tax report generated successfully');
    } catch (error) {
      console.error('Error generating tax report:', error);
      toast.error('Failed to generate tax report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: TaxReport) => {
    toast.success(`Downloading tax report for ${report.year}`);
    // In a real app, this would trigger a download of the actual report file
  };

  const runComplianceCheck = async () => {
    toast.success('Compliance check initiated');
    // In a real app, this would trigger a compliance check process
  };

  const exportAuditTrail = async () => {
    toast.success('Audit trail export prepared');
    // In a real app, this would generate and download an audit trail export
  };

  return (
    <DashboardLayout>
      <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b px-6">
        <h1 className="text-lg font-semibold">Tax Reporting & Compliance</h1>
      </header>
      
      <main className="flex-1 p-6 overflow-auto">
        <Tabs defaultValue="tax-forms">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="tax-forms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Tax Forms</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              <span>Audit Trail</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span>Compliance</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tax Forms Tab */}
          <TabsContent value="tax-forms">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate Tax Forms
                  </CardTitle>
                  <CardDescription>
                    Generate tax forms and receipts for your donations to use for tax deduction purposes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tax-year">Tax Year</Label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="tax-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2024, 2023, 2022].map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="charity-select">Charity Filter</Label>
                      <Select value={selectedCharity} onValueChange={setSelectedCharity}>
                        <SelectTrigger id="charity-select">
                          <SelectValue placeholder="Select charity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Charities</SelectItem>
                          <SelectItem value="1">Red Cross</SelectItem>
                          <SelectItem value="2">UNICEF</SelectItem>
                          <SelectItem value="3">World Wildlife Fund</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={generateTaxReport}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Tax Report
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Tax Documents
                  </CardTitle>
                  <CardDescription>
                    Access and download your previously generated tax documents.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Year</TableHead>
                              <TableHead>Total Donations</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reports.map(report => (
                              <TableRow key={report.id}>
                                <TableCell>{report.year}</TableCell>
                                <TableCell>{report.totalDonations.toFixed(2)} XLM</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      report.status === 'ready' 
                                        ? 'success' 
                                        : report.status === 'processing' 
                                          ? 'default' 
                                          : 'destructive'
                                    }
                                  >
                                    {report.status === 'ready' 
                                      ? 'Ready' 
                                      : report.status === 'processing' 
                                        ? 'Processing' 
                                        : 'Error'
                                    }
                                  </Badge>
                                </TableCell>
                                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadReport(report)}
                                    disabled={report.status !== 'ready'}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No tax documents found.</p>
                        <p className="mt-2">Generate a tax report to get started.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Automated Reporting
                </CardTitle>
                <CardDescription>
                  Configure and access automated donation reports for your records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-type">Report Type</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger id="report-type">
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly Summary</SelectItem>
                          <SelectItem value="quarterly">Quarterly Analysis</SelectItem>
                          <SelectItem value="annual">Annual Report</SelectItem>
                          <SelectItem value="custom">Custom Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="report-format">Format</Label>
                      <Select defaultValue="pdf">
                        <SelectTrigger id="report-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                          <SelectItem value="json">JSON Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border p-4 rounded-lg bg-muted/30">
                    <h3 className="font-medium mb-2">Scheduled Reports</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-background rounded">
                        <div>
                          <p className="font-medium">Monthly Donation Summary</p>
                          <p className="text-sm text-muted-foreground">Runs on the 1st of each month</p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-background rounded">
                        <div>
                          <p className="font-medium">Quarterly Impact Report</p>
                          <p className="text-sm text-muted-foreground">Runs every 3 months</p>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Schedule New Report</Button>
                <Button>Generate Custom Report</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Audit Trail
                </CardTitle>
                <CardDescription>
                  Review and export a complete audit trail of all donation activities and tax-related operations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Filter
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportAuditTrail}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Showing {auditRecords.length} records
                    </p>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditRecords.map(record => (
                          <TableRow key={record.id}>
                            <TableCell>{record.event}</TableCell>
                            <TableCell>{record.user}</TableCell>
                            <TableCell>{new Date(record.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{record.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Audit trail data is retained for 7 years in compliance with tax regulations.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Compliance Checks
                </CardTitle>
                <CardDescription>
                  Verify that your donation activities meet all regulatory requirements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4">Compliance Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Donor Verification</p>
                        <div className="mt-2 flex justify-center">
                          <Badge variant="success" className="flex items-center">
                            <Check className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Charity Eligibility</p>
                        <div className="mt-2 flex justify-center">
                          <Badge variant="success" className="flex items-center">
                            <Check className="mr-1 h-3 w-3" />
                            Compliant
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Transaction Limits</p>
                        <div className="mt-2 flex justify-center">
                          <Badge variant="success" className="flex items-center">
                            <Check className="mr-1 h-3 w-3" />
                            Within Limits
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">AML Checks</p>
                        <div className="mt-2 flex justify-center">
                          <Badge variant="default" className="flex items-center">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Check Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {complianceChecks.map(check => (
                          <TableRow key={check.id}>
                            <TableCell>{check.type}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  check.status === 'passed' 
                                    ? 'success' 
                                    : check.status === 'pending' 
                                      ? 'default' 
                                      : 'destructive'
                                }
                                className="flex items-center w-fit"
                              >
                                {check.status === 'passed' ? (
                                  <><Check className="mr-1 h-3 w-3" /> Passed</>
                                ) : check.status === 'pending' ? (
                                  <><Clock className="mr-1 h-3 w-3" /> Pending</>
                                ) : (
                                  <><X className="mr-1 h-3 w-3" /> Failed</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(check.date).toLocaleDateString()}</TableCell>
                            <TableCell>{check.details || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={runComplianceCheck}>
                  Run Compliance Check
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}