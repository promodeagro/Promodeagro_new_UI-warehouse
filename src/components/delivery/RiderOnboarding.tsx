import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, XCircle, AlertCircle, Clock, 
  Upload, Eye, ChevronLeft, User, FileText, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  riderApplications, 
  riderDocuments, 
  riderBankDetails,
  type RiderApplication,
  type RiderDocument,
  type BankDetails,
  type ApplicationStatus,
  type DocumentStatus
} from "@/data/riderData";

const RiderOnboarding = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<RiderApplication[]>(riderApplications);
  const [selectedApplication, setSelectedApplication] = useState<RiderApplication | null>(null);
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (selectedApplication) {
      const appDocuments = riderDocuments.filter(doc => doc.application_id === selectedApplication.id);
      setDocuments(appDocuments);
      const appBankDetails = riderBankDetails.find(bank => bank.application_id === selectedApplication.id);
      setBankDetails(appBankDetails || null);
      setAdminNotes(selectedApplication.admin_notes || "");
    }
  }, [selectedApplication]);

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'pending_review': return 'bg-warning text-warning-foreground';
      case 'pending_docs': return 'bg-primary/20 text-primary';
      case 'pending_bank': return 'bg-secondary/20 text-secondary';
      case 'needs_reupload': return 'bg-orange-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const updateApplicationStatus = (applicationId: string, status: ApplicationStatus, notes?: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        return { ...app, status, admin_notes: notes || adminNotes, updated_at: new Date().toISOString() };
      }
      return app;
    }));

    if (selectedApplication?.id === applicationId) {
      setSelectedApplication({ ...selectedApplication, status, admin_notes: notes || adminNotes });
    }

    toast({
      title: "Success",
      description: "Application status updated"
    });
  };

  const updateDocumentStatus = (documentId: string, status: DocumentStatus, notes: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id === documentId) {
        return { ...doc, status, admin_notes: notes, reviewed_at: new Date().toISOString() };
      }
      return doc;
    }));

    toast({
      title: "Success",
      description: "Document status updated"
    });
  };

  const verifyBankDetails = (applicationId: string, verified: boolean, notes: string) => {
    if (bankDetails) {
      setBankDetails({ 
        ...bankDetails, 
        verified, 
        admin_notes: notes,
        verified_at: verified ? new Date().toISOString() : undefined
      });
    }

    toast({
      title: "Success",
      description: verified ? "Bank details verified" : "Bank verification removed"
    });
  };

  const approveApplication = () => {
    if (!selectedApplication) return;

    const allDocsApproved = documents.every(doc => doc.status === 'approved');
    const bankVerified = bankDetails?.verified;

    if (!allDocsApproved || !bankVerified) {
      toast({
        title: "Cannot Approve",
        description: "All documents must be approved and bank details verified",
        variant: "destructive"
      });
      return;
    }

    updateApplicationStatus(selectedApplication.id, 'approved', 'Application approved and rider onboarded');
    
    toast({
      title: "Application Approved!",
      description: "Rider has been successfully onboarded"
    });
    
    setSelectedApplication(null);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/delivery/rider-management">
                <Button variant="ghost" size="sm" className="hover:bg-muted">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">Rider Onboarding</h1>
                <p className="text-sm text-muted-foreground">Review and verify new rider applications</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/delivery/rider-onboarding-queue')}
              className="hover:border-primary/50"
            >
              View Queue
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-display">Applications Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApplication(app)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedApplication?.id === app.id 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">{app.rider_name}</p>
                        <p className="text-xs text-muted-foreground">{app.contact_number}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(app.status).split(' ')[0]}`} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(app.status)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No applications pending</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Details */}
          <div className="lg:col-span-2">
            {selectedApplication ? (
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display">{selectedApplication.rider_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Application ID: {selectedApplication.id.substring(0, 8)}
                      </p>
                    </div>
                    <Badge className={getStatusColor(selectedApplication.status)}>
                      {getStatusLabel(selectedApplication.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details" className="hover:bg-muted">
                        <User className="h-4 w-4 mr-2" />
                        Details
                      </TabsTrigger>
                      <TabsTrigger value="documents" className="hover:bg-muted">
                        <FileText className="h-4 w-4 mr-2" />
                        Documents
                      </TabsTrigger>
                      <TabsTrigger value="bank" className="hover:bg-muted">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Bank
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">Full Name</Label>
                          <p className="font-medium text-foreground">{selectedApplication.rider_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Date of Birth</Label>
                          <p className="font-medium text-foreground">{new Date(selectedApplication.date_of_birth).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Contact Number</Label>
                          <p className="font-medium text-foreground">{selectedApplication.contact_number}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Alternate Contact</Label>
                          <p className="font-medium text-foreground">{selectedApplication.alternate_contact || 'N/A'}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-muted-foreground">Address</Label>
                          <p className="font-medium text-foreground">{selectedApplication.full_address}</p>
                          <p className="text-sm text-muted-foreground">Pincode: {selectedApplication.pincode}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Vehicle Type</Label>
                          <p className="font-medium text-foreground">{selectedApplication.vehicle_type}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Vehicle Registration</Label>
                          <p className="font-medium text-foreground">{selectedApplication.vehicle_registration}</p>
                        </div>
                        {selectedApplication.referral_name && (
                          <>
                            <div>
                              <Label className="text-muted-foreground">Referral Name</Label>
                              <p className="font-medium text-foreground">{selectedApplication.referral_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Referral Contact</Label>
                              <p className="font-medium text-foreground">{selectedApplication.referral_contact}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="pt-4 border-t">
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about this application..."
                          className="mt-2"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'pending_docs', adminNotes)}
                          className="hover:border-primary/50"
                        >
                          Request Documents
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected', adminNotes)}
                          className="hover:bg-destructive/90"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documents.map((doc) => (
                          <Card key={doc.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm text-foreground">
                                  {doc.document_type.split('_').map(w => 
                                    w.charAt(0).toUpperCase() + w.slice(1)
                                  ).join(' ')}
                                </p>
                                <Badge 
                                  variant={doc.status === 'approved' ? 'default' : 'outline'}
                                  className="text-xs"
                                >
                                  {doc.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div 
                                className="aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                                onClick={() => setImagePreview(doc.file_url)}
                              >
                                <img 
                                  src={doc.file_url} 
                                  alt={doc.document_type}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateDocumentStatus(doc.id, 'approved', 'Document approved')}
                                  disabled={doc.status === 'approved'}
                                  className="hover:border-primary/50"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateDocumentStatus(doc.id, 'reupload_requested', 'Please reupload clearer image')}
                                  className="hover:border-primary/50"
                                >
                                  <Upload className="h-3 w-3 mr-1" />
                                  Request Reupload
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {documents.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No documents uploaded yet</p>
                      )}
                    </TabsContent>

                    <TabsContent value="bank" className="space-y-4 mt-4">
                      {bankDetails ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-muted-foreground">Bank Name</Label>
                              <p className="font-medium text-foreground">{bankDetails.bank_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Account Holder</Label>
                              <p className="font-medium text-foreground">{bankDetails.account_holder_name}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Account Number</Label>
                              <p className="font-medium text-foreground font-mono">{bankDetails.account_number}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">IFSC Code</Label>
                              <p className="font-medium text-foreground font-mono">{bankDetails.ifsc_code}</p>
                            </div>
                            {bankDetails.bank_document_url && (
                              <div className="col-span-2">
                                <Label className="text-muted-foreground">Cancelled Cheque / Passbook</Label>
                                <div 
                                  className="mt-2 aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                                  onClick={() => setImagePreview(bankDetails.bank_document_url!)}
                                >
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
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                            {bankDetails.verified ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-success" />
                                <span className="text-sm font-medium text-foreground">Bank details verified</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-5 w-5 text-warning" />
                                <span className="text-sm font-medium text-foreground">Bank details pending verification</span>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!bankDetails.verified ? (
                              <Button 
                                onClick={() => verifyBankDetails(selectedApplication.id, true, 'Bank details verified')}
                                className="hover:shadow-md"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verify Bank Details
                              </Button>
                            ) : (
                              <Button 
                                variant="outline"
                                onClick={() => verifyBankDetails(selectedApplication.id, false, 'Verification removed')}
                                className="hover:border-primary/50"
                              >
                                Remove Verification
                              </Button>
                            )}
                            <Button variant="outline" className="hover:border-primary/50">
                              Request Bank Document
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No bank details provided yet</p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Final Approval Section */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground font-display">Final Approval</h3>
                        <p className="text-sm text-muted-foreground">
                          All documents and bank details must be verified
                        </p>
                      </div>
                      <Button 
                        size="lg"
                        onClick={approveApplication}
                        disabled={
                          !documents.every(doc => doc.status === 'approved') ||
                          !bankDetails?.verified ||
                          selectedApplication.status === 'approved'
                        }
                        className="hover:shadow-lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Onboard Rider
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Select an application to review</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-display">Document Preview</DialogTitle>
          </DialogHeader>
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Document preview"
              className="w-full h-auto rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderOnboarding;

