import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useCertificates } from '@/hooks/useCertificates';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Medal, ExternalLink, Eye, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Certificate } from '@/services/certificate';
import { Skeleton } from '@/components/ui/skeleton';

const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyCertificate } = useCertificates();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const isValid = await verifyCertificate(certificate.tokenId);
      if (isValid) {
        toast.success('Certificate Verified', {
          description: 'This certificate is valid and authentic.'
        });
      } else {
        toast.error('Certificate Invalid', {
          description: 'This certificate could not be verified.'
        });
      }
    } catch (error) {
      toast.error('Verification Failed', {
        description: 'Unable to verify the certificate.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base flex items-center">
            <Medal className="h-4 w-4 mr-2 text-primary" />
            Donation Certificate #{certificate.id}
          </CardTitle>
          <Badge variant={
            certificate.status === 'minted' ? 'default' :
            certificate.status === 'pending' ? 'outline' : 'destructive'
          }>
            {certificate.status}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Issued on {new Date(certificate.issueDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {certificate.donation && (
          <div className="grid grid-cols-2 gap-1 text-sm mt-3">
            <div className="text-muted-foreground text-xs">Amount:</div>
            <div className="font-medium text-xs">{certificate.donation.amount} XLM</div>
            
            <div className="text-muted-foreground text-xs">Charity:</div>
            <div className="font-medium text-xs">{certificate.donation.charity?.name || 'Unknown'}</div>
            
            <div className="text-muted-foreground text-xs">Token ID:</div>
            <div className="font-medium text-xs truncate">{certificate.tokenId.substring(0, 8)}...</div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" onClick={() => window.open(certificate.tokenUri, '_blank')}>
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline" onClick={handleVerify} disabled={isVerifying}>
          {isVerifying ? (
            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-b-2 border-primary"></div>
          ) : (
            <CheckCircle2 className="h-3 w-3 mr-1" />
          )}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function CertificatesPage() {
  const { certificates, isLoading, error, refreshCertificates } = useCertificates();
  const [activeTab, setActiveTab] = useState('all');

  // Filter certificates based on active tab
  const filteredCertificates = certificates.filter(cert => {
    if (activeTab === 'all') return true;
    return cert.status === activeTab;
  });

  return (
    <DashboardLayout>
      <div className="container px-4 py-6">
        <h1 className="text-2xl font-bold mb-2">Your Donation Certificates</h1>
        <p className="text-muted-foreground mb-6">
          View and manage your donation certificates as NFTs on the blockchain
        </p>

        <Tabs defaultValue="all" className="mb-8" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="minted">Minted</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-1 text-sm mt-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="col-span-2 grid grid-cols-2 gap-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-lg text-red-600 mt-4">
                <p>Error loading certificates: {error.message}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshCertificates} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredCertificates.length === 0 ? (
              <div className="text-center py-12">
                <Medal className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-medium">No certificates found</h3>
                <p className="text-muted-foreground mt-1">
                  {activeTab === 'all' 
                    ? "You don't have any donation certificates yet." 
                    : `You don't have any ${activeTab} certificates.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredCertificates.map((certificate) => (
                  <CertificateCard key={certificate.id} certificate={certificate} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 