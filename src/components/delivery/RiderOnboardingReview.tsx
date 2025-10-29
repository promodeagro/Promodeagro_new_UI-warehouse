import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, X, FileText, User, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  riderApplications, 
  riderDocuments, 
  riderBankDetails 
} from "@/data/riderData";

const RiderOnboardingReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get("id") || "APP-001";
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("details");
  const [rejectionReason, setRejectionReason] = useState("");

  const application = riderApplications.find(app => app.id === applicationId) || riderApplications[0];
  const documents = riderDocuments.filter(doc => doc.application_id === applicationId);
  const bankDetails = riderBankDetails.find(bank => bank.application_id === applicationId);

  const handleApproveDetails = () => {
    toast({
      title: "Details Approved",
      description: "Rider details have been approved",
    });
  };

  const handleRequestUpdate = () => {
    toast({
      title: "Update Requested",
      description: "Rider will be notified to update details",
    });
  };

  const handleApproveDocument = (docType: string) => {
    toast({
      title: "Document Approved",
      description: `${docType} has been approved`,
    });
  };

  const handleRequestReupload = (docType: string) => {
    toast({
      title: "Reupload Requested",
      description: `Reupload requested for ${docType}`,
      variant: "destructive",
    });
  };

  const handleApproveAllDocuments = () => {
    toast({
      title: "All Documents Approved",
      description: "All documents have been approved successfully",
    });
  };

  const handleApproveBankDetails = () => {
    toast({
      title: "Bank Details Approved",
      description: "Bank details have been verified and approved",
    });
  };

  const handleApproveAndOnboard = () => {
    toast({
      title: "Rider Onboarded",
      description: `${application.rider_name} has been successfully onboarded`,
    });
    setTimeout(() => {
      navigate("/delivery/rider-onboarding-queue");
    }, 1500);
  };

  const handleRejectApplication = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Application Rejected",
      description: `Application rejected: ${rejectionReason}`,
      variant: "destructive",
    });
    setTimeout(() => {
      navigate("/delivery/rider-onboarding-queue");
    }, 1500);
  };

  const getDocumentDisplayName = (docType: string) => {
    return docType.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/delivery/rider-onboarding-queue")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">
                  Review Application: {application.rider_name} ({applicationId})
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{application.status}</Badge>
                  <Badge variant="outline">Documents: {documents.length}</Badge>
                  <Badge variant="outline">
                    Bank: {bankDetails?.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="hover:bg-muted">
              <User className="h-4 w-4 mr-2" />
              Rider Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="hover:bg-muted">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="bank" className="hover:bg-muted">
              <CreditCard className="h-4 w-4 mr-2" />
              Bank Details
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Rider Details */}
          <TabsContent value="details" className="space-y-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{application.rider_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{application.contact_number}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date of Birth</Label>
                    <p className="text-lg font-medium text-foreground mt-1">
                      {new Date(application.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Alternate Contact</Label>
                    <p className="text-lg font-medium text-foreground mt-1">
                      {application.alternate_contact || 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Full Address</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{application.full_address}</p>
                    <p className="text-sm text-muted-foreground mt-1">Pincode: {application.pincode}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vehicle Type</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{application.vehicle_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Vehicle Registration</Label>
                    <p className="text-lg font-medium text-foreground mt-1">{application.vehicle_registration}</p>
                  </div>
                  {application.referral_name && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Referral Name</Label>
                        <p className="text-lg font-medium text-foreground mt-1">{application.referral_name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Referral Contact</Label>
                        <p className="text-lg font-medium text-foreground mt-1">{application.referral_contact}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleApproveDetails} className="hover:shadow-md">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Details
                  </Button>
                  <Button variant="outline" onClick={handleRequestUpdate} className="hover:border-primary/50">
                    Request Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Documents */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground">
                          {getDocumentDisplayName(doc.document_type)}
                        </h3>
                        <Badge variant={doc.status === "approved" ? "default" : "secondary"}>
                          {doc.status}
                        </Badge>
                      </div>
                      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center border overflow-hidden">
                        <img 
                          src={doc.file_url} 
                          alt={getDocumentDisplayName(doc.document_type)}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 hover:shadow-md"
                          onClick={() => handleApproveDocument(doc.document_type)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 hover:border-primary/50"
                          onClick={() => handleRequestReupload(doc.document_type)}
                        >
                          Request Reupload
                        </Button>
                      </div>
                      {doc.admin_notes && (
                        <p className="text-xs text-muted-foreground">
                          Notes: {doc.admin_notes}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {documents.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button onClick={handleApproveAllDocuments} className="hover:shadow-md">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All Documents
              </Button>
              <Button variant="outline" className="hover:border-primary/50">
                Bulk Request Reupload
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Bank Details */}
          <TabsContent value="bank" className="space-y-6">
            {bankDetails ? (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-muted-foreground">Bank Name</Label>
                      <p className="text-lg font-medium text-foreground mt-1">{bankDetails.bank_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Holder Name</Label>
                      <p className="text-lg font-medium text-foreground mt-1">{bankDetails.account_holder_name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Account Number</Label>
                      <p className="text-lg font-medium text-foreground mt-1 font-mono">{bankDetails.account_number}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">IFSC Code</Label>
                      <p className="text-lg font-medium text-foreground mt-1 font-mono">{bankDetails.ifsc_code}</p>
                    </div>
                  </div>

                  {bankDetails.bank_document_url && (
                    <div>
                      <Label className="text-muted-foreground">Canceled Cheque / Bank Passbook</Label>
                      <div className="mt-2 bg-muted rounded-lg aspect-video flex items-center justify-center border overflow-hidden">
                        <img 
                          src={bankDetails.bank_document_url} 
                          alt="Bank document"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                    {bankDetails.verified ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm font-medium text-foreground">Bank details verified</span>
                      </>
                    ) : (
                      <>
                        <X className="h-5 w-5 text-warning" />
                        <span className="text-sm font-medium text-foreground">Bank details pending verification</span>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={handleApproveBankDetails} className="hover:shadow-md">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Bank Details
                    </Button>
                    <Button variant="outline" className="hover:border-primary/50">
                      Request Bank Document
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No bank details provided yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Final Actions */}
        <Card className="mt-6 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/delivery/rider-onboarding-queue")}
                  className="hover:border-primary/50"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleRejectApplication}
                  className="hover:bg-destructive/90"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
                <Button onClick={handleApproveAndOnboard} className="hover:shadow-lg">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Onboard Rider
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RiderOnboardingReview;

