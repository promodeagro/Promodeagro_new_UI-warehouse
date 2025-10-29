import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Clock, CheckCircle2, Search, ArrowRight, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  riderApplications, 
  type ApplicationStatus 
} from "@/data/riderData";

const RiderOnboardingQueue = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");

  const filteredApplications = riderApplications.filter(app => {
    const matchesSearch = 
      app.rider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.contact_number.includes(searchTerm) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = riderApplications.filter(app => 
    ['pending_review', 'pending_docs', 'pending_bank', 'needs_reupload'].includes(app.status)
  ).length;
  
  const approvedTodayCount = riderApplications.filter(app => 
    app.status === 'approved' && 
    new Date(app.updated_at || app.created_at).toDateString() === new Date().toDateString()
  ).length;

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

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">Rider Onboarding Queue</h1>
              <p className="text-sm text-muted-foreground">Review and approve new rider applications</p>
            </div>
            <Button 
              onClick={() => navigate('/delivery/rider-onboarding')}
              className="hover:shadow-md"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Full Review
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved Today</p>
                  <p className="text-2xl font-bold text-success">{approvedTodayCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold text-foreground">{riderApplications.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or application ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
                  className="px-3 py-2 border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="pending_docs">Pending Docs</option>
                  <option value="pending_bank">Pending Bank</option>
                  <option value="needs_reupload">Needs Reupload</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-display">Applications ({filteredApplications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div 
                  key={application.id} 
                  className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-all hover:shadow-md cursor-pointer"
                  onClick={() => navigate(`/delivery/rider-onboarding-review?id=${application.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{application.rider_name}</h3>
                        <Badge className={getStatusColor(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Phone: </span>
                          <span className="text-foreground">{application.contact_number}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vehicle: </span>
                          <span className="text-foreground">{application.vehicle_type} - {application.vehicle_registration}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Applied: </span>
                          <span className="text-foreground">
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {application.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Notes: {application.admin_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/delivery/rider-onboarding-review?id=${application.id}`);
                        }}
                        className="hover:border-primary/50"
                      >
                        Review
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No applications found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search or filter" 
                      : "No applications in queue"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RiderOnboardingQueue;

