import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  User, 
  FileText, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Building,
  ArrowLeft,
  Save,
  Edit,
  Upload,
  Eye,
  Download,
  Ban,
  X,
  CreditCard as IdCard,
  Plus,
  Trash2
} from "lucide-react";
import { packers } from "@/data/packerData";
import PackerIdCard from "./PackerIdCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function PackerDetails() {
  const { packerId } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPacker, setEditedPacker] = useState<any>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  const [showIdCard, setShowIdCard] = useState(false);
  
  // Load roles from localStorage or use defaults
  const [availableRoles, setAvailableRoles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('packer-roles');
      if (saved) {
        return JSON.parse(saved);
      }
      return ['Manager', 'Packer Boy', 'Farm Boy'];
    } catch (error) {
      return ['Manager', 'Packer Boy', 'Farm Boy'];
    }
  });
  const [newRoleInput, setNewRoleInput] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // Find the packer - check both static packers and saved packers
  const packer = useMemo(() => {
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      return packers.find(p => p.id === packerId) || savedPackers.find((p: any) => p.id === packerId);
    } catch (error) {
      console.error('Error loading packers:', error);
      return packers.find(p => p.id === packerId);
    }
  }, [packerId]);

  // Initialize edited packer
  useEffect(() => {
    if (packer) {
      setEditedPacker({ ...packer });
    }
  }, [packer]);

  // Load profile image and documents from packer
  useEffect(() => {
    if (packer) {
      // Load profile image if available
      if ((packer as any).profile_image) {
        setProfileImage((packer as any).profile_image);
      }
      
      // Load documents if available
      if ((packer as any).documents) {
        setUploadedDocuments((packer as any).documents);
      } else {
        // Load sample documents for testing (remove this in production)
        const sampleDocuments = {
          'aadhar_front': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPkFhZGhhciBGcm9udDwvdGV4dD48L3N2Zz4=',
          'pan': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiMzMzMiPlBBTiBDYXJkPC90ZXh0Pjwvc3ZnPg=='
        };
        setUploadedDocuments(sampleDocuments);
      }
    }
  }, [packer]);

  const handleSave = () => {
    // Save logic here - would sync with backend
    console.log("Saving packer data:", editedPacker);
    
    // Save to localStorage (ready for database integration)
    const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
    const updatedPackers = savedPackers.map((p: any) => 
      p.id === packerId ? { 
        ...p, 
        ...editedPacker,
        profile_image: profileImage,
        documents: uploadedDocuments
      } : p
    );
    localStorage.setItem('warehouse-packers', JSON.stringify(updatedPackers));
    
    toast.success("Packer details saved successfully!");
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (packer) {
      setEditedPacker({ ...packer });
    }
    setIsEditing(false);
  };

  const handleSuspendAccount = () => {
    if (packer) {
      setIsSuspended(true);
      toast.warning(`${packer.name} account suspended. No new orders will be assigned.`);
    }
  };

  const handleUnsuspendAccount = () => {
    if (packer) {
      setIsSuspended(false);
      toast.success(`${packer.name} account unsuspended. Normal functionality restored.`);
    }
  };

  const handleDeletePacker = () => {
    if (!packer || !packerId) return;
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete ${packer.name}? This action cannot be undone.`)) {
      try {
        // Check if packer is from static data or localStorage
        const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
        const isStaticPacker = packers.find(p => p.id === packerId);
        const isSavedPacker = savedPackers.find((p: any) => p.id === packerId);
        
        if (isSavedPacker) {
          // Remove from saved packers in localStorage
          const updatedPackers = savedPackers.filter((p: any) => p.id !== packerId);
          localStorage.setItem('warehouse-packers', JSON.stringify(updatedPackers));
        }
        
        // For both static and saved packers, add to deleted packers list
        // This ensures they won't show up in the packer overview
        const deletedPackers = JSON.parse(localStorage.getItem('deleted-packers') || '[]');
        if (!deletedPackers.includes(packerId)) {
          deletedPackers.push(packerId);
          localStorage.setItem('deleted-packers', JSON.stringify(deletedPackers));
        }
        
        // Also remove from selected packers for auto-assign if present
        const selectedPackers = JSON.parse(localStorage.getItem('selectedPackersForAutoAssign') || '[]');
        const updatedSelectedPackers = selectedPackers.filter((id: string) => id !== packerId);
        localStorage.setItem('selectedPackersForAutoAssign', JSON.stringify(updatedSelectedPackers));
        
        // Dispatch event to refresh packer list in PackerOverview
        window.dispatchEvent(new CustomEvent('forcePackerRefresh'));
        
        toast.success(`${packer.name} has been deleted successfully.`);
        
        // Navigate back to packer overview
        navigate('/order-management/packer-overview');
      } catch (error) {
        console.error('Error deleting packer:', error);
        toast.error('Failed to delete packer. Please try again.');
      }
    }
  };

  const handleProfileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImage(result);
        toast.success("Profile picture uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Format Aadhar number (12 digits only, format as 1234-5678-9011)
  const formatAadharNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 12 digits
    const limited = digits.slice(0, 12);
    // Format as 1234-5678-9011
    if (limited.length <= 4) {
      return limited;
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    } else {
      return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8)}`;
    }
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadharNumber(e.target.value);
    setEditedPacker({ ...editedPacker, aadhar_number: formatted });
  };

  // Add new role to the list
  const handleAddNewRole = () => {
    const trimmedRole = newRoleInput.trim();
    if (trimmedRole && !availableRoles.includes(trimmedRole)) {
      const updatedRoles = [...availableRoles, trimmedRole];
      setAvailableRoles(updatedRoles);
      localStorage.setItem('packer-roles', JSON.stringify(updatedRoles));
      if (editedPacker) {
        setEditedPacker({ ...editedPacker, role: trimmedRole });
      }
      setNewRoleInput('');
      setShowAddRole(false);
      toast.success(`Role "${trimmedRole}" added successfully!`);
    } else if (trimmedRole && availableRoles.includes(trimmedRole)) {
      toast.error('This role already exists');
    } else {
      toast.error('Please enter a role name');
    }
  };

  const handleDocumentUpload = (documentType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only images (JPG, PNG, GIF) or PDF files");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedDocuments(prev => ({
          ...prev,
          [documentType]: result
        }));
        toast.success(`${documentType.replace('_', ' ')} uploaded successfully!`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Early return if packer not found
  if (!packer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Packer not found</h2>
          <Button onClick={() => navigate('/order-management/packer-overview')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packer Overview
          </Button>
        </div>
      </div>
    );
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-success/10 text-success border-success/20';
      case 'active': return 'bg-warning/10 text-warning border-warning/20';
      case 'offline': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return '🟢';
      case 'active': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/order-management/packer-overview')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Packer Details</h1>
            <p className="text-sm text-muted-foreground">
              Manage personal info, documents, and performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getSyncStatusColor(packer.sync_status || 'synced')}>
            {getSyncStatusIcon(packer.sync_status || 'synced')} {(packer.sync_status || 'synced').toUpperCase()}
          </Badge>
          {isSuspended && (
            <Badge variant="destructive" className="bg-red-500 text-white">
              <Ban className="h-3 w-3 mr-1" />
              SUSPENDED
            </Badge>
          )}
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-success hover:bg-success/90">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowIdCard(true)}>
                <IdCard className="h-4 w-4 mr-2" />
                View ID Card
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal" className="gap-2">
            <User className="h-4 w-4" />
            Personal Info
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Verification & Documents
          </TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Personal Information</CardTitle>
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="active-toggle" className="text-sm font-medium">
                      Active/Inactive
                    </Label>
                    <Switch
                      id="active-toggle"
                      checked={editedPacker?.is_active ?? true}
                      onCheckedChange={(checked) => setEditedPacker({ ...editedPacker, is_active: checked })}
                      disabled={!isEditing}
                    />
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    disabled={!isEditing || isSuspended}
                    onClick={handleSuspendAccount}
                  >
                    {isSuspended ? "Suspended" : "Suspend Account"}
                  </Button>
                  {isSuspended && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUnsuspendAccount}
                      className="ml-2"
                    >
                      Unsuspend Account
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Profile Picture Upload Section */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileUpload}
                    className="hidden"
                    id="profile-upload"
                    disabled={!isEditing}
                  />
                  <Button
                    size="icon"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50"
                    onClick={() => document.getElementById('profile-upload')?.click()}
                    disabled={!isEditing}
                  >
                    <Upload className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="packer-id">Packer ID</Label>
                  <Input id="packer-id" value={packer.id} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={editedPacker?.name || ''}
                    onChange={(e) => setEditedPacker({ ...editedPacker, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={editedPacker?.phone || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, phone: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt-phone">Alternate Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="alt-phone"
                      value={editedPacker?.alternate_phone || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, alternate_phone: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={editedPacker?.email || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, email: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={editedPacker?.date_of_birth || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, date_of_birth: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood-group">Blood Group</Label>
                  <Input
                    id="blood-group"
                    value={editedPacker?.blood_group || ''}
                    onChange={(e) => setEditedPacker({ ...editedPacker, blood_group: e.target.value })}
                    placeholder="e.g., O+, A-, B+"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joining-date">Joining Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="joining-date"
                      type="date"
                      value={editedPacker?.joining_date || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, joining_date: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="address"
                      value={editedPacker?.address || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, address: e.target.value })}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                      placeholder="Enter your full address"
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={editedPacker?.pincode || ''}
                    onChange={(e) => setEditedPacker({ ...editedPacker, pincode: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    value={editedPacker?.zone || 'Promode Agro'}
                    onChange={(e) => setEditedPacker({ ...editedPacker, zone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Enter zone"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="aadhar">Aadhar Number</Label>
                  <Input
                    id="aadhar"
                    type="text"
                    value={editedPacker?.aadhar_number || ''}
                    onChange={handleAadharChange}
                    placeholder="1234-5678-9011"
                    maxLength={14}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={editedPacker?.qualification || 'Bachelor of Commerce'}
                    onChange={(e) => setEditedPacker({ ...editedPacker, qualification: e.target.value })}
                    placeholder="Enter qualification"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role of Person <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Select 
                      value={editedPacker?.role || ''} 
                      onValueChange={(value) => {
                        if (value === 'add-new') {
                          setShowAddRole(true);
                        } else {
                          setEditedPacker({ ...editedPacker, role: value });
                        }
                      }}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="role" className="flex-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                        <SelectItem value="add-new" className="text-primary">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Role
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {showAddRole && isEditing && (
                      <div className="flex gap-2 flex-1">
                        <Input
                          placeholder="Enter new role"
                          value={newRoleInput}
                          onChange={(e) => setNewRoleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNewRole();
                            } else if (e.key === 'Escape') {
                              setShowAddRole(false);
                              setNewRoleInput('');
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="icon"
                          onClick={handleAddNewRole}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => {
                            setShowAddRole(false);
                            setNewRoleInput('');
                          }}
                          variant="outline"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pan">PAN Number</Label>
                  <Input
                    id="pan"
                    value={editedPacker?.pan_number || ''}
                    onChange={(e) => setEditedPacker({ ...editedPacker, pan_number: e.target.value })}
                    placeholder="ABCDE1234F"
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bank-name"
                      value={editedPacker?.bank_name || ''}
                      onChange={(e) => setEditedPacker({ ...editedPacker, bank_name: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="account-number"
                      value={editedPacker?.account_number || '78901234567890'}
                      onChange={(e) => setEditedPacker({ ...editedPacker, account_number: e.target.value })}
                      className="pl-10"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reconfirm-account">Re-Confirm Account Name</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reconfirm-account"
                      value={editedPacker?.reconfirm_account_name || '78901234567890'}
                      onChange={(e) => setEditedPacker({ ...editedPacker, reconfirm_account_name: e.target.value })}
                      className="pl-10"
                      placeholder="Re-enter account holder name"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={editedPacker?.ifsc_code || ''}
                    onChange={(e) => setEditedPacker({ ...editedPacker, ifsc_code: e.target.value })}
                    placeholder="ABCD0123456"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold mb-4">Uploaded Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Aadhar Front', key: 'aadhar_front' },
                    { name: 'Aadhar Back', key: 'aadhar_back' },
                    { name: 'PAN Card', key: 'pan' },
                    { name: 'Bank Passbook', key: 'bank_passbook' },
                    { name: 'Qualification Certificate', key: 'qualification_upload' },
                    { name: 'Address Proof', key: 'address_proof' },
                  ].map((doc) => (
                    <div key={doc.key} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{doc.name}</span>
                        <span className="text-green-500">
                          {uploadedDocuments[doc.key] ? "✓" : "✗"}
                        </span>
                      </div>
                      {uploadedDocuments[doc.key] && (
                        <div className="text-xs text-gray-500 mb-2">
                          Uploaded: {new Date().toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {uploadedDocuments[doc.key] && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              const documentData = uploadedDocuments[doc.key];
                              const isPDF = documentData.startsWith('data:application/pdf');
                              
                              // Create a new window with proper content
                              const newWindow = window.open('', '_blank');
                              if (newWindow) {
                                if (isPDF) {
                                  // For PDF files, embed the PDF viewer
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${doc.name}</title>
                                        <style>
                                          body { margin: 0; padding: 0; background: #f5f5f5; }
                                          .container { max-width: 100%; margin: 0 auto; background: white; }
                                          h1 { color: #333; margin: 20px; text-align: center; }
                                          .pdf-viewer { width: 100%; height: calc(100vh - 80px); }
                                          .download-btn { 
                                            position: fixed; top: 20px; right: 20px;
                                            background: #007bff; color: white; padding: 10px 20px; 
                                            border: none; border-radius: 4px; cursor: pointer; 
                                            text-decoration: none; display: inline-block; z-index: 1000;
                                          }
                                          .download-btn:hover { background: #0056b3; }
                                        </style>
                                      </head>
                                      <body>
                                        <h1>${doc.name}</h1>
                                        <a href="${documentData}" download="${doc.name}.pdf" class="download-btn">
                                          Download PDF
                                        </a>
                                        <iframe src="${documentData}" class="pdf-viewer" frameborder="0"></iframe>
                                      </body>
                                    </html>
                                  `);
                                } else {
                                  // For image files, show the image
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${doc.name}</title>
                                        <style>
                                          body { margin: 0; padding: 20px; background: #f5f5f5; }
                                          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                          h1 { color: #333; margin-bottom: 20px; text-align: center; }
                                          .document-viewer { text-align: center; }
                                          img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
                                          .download-btn { 
                                            background: #007bff; color: white; padding: 10px 20px; 
                                            border: none; border-radius: 4px; cursor: pointer; 
                                            margin-top: 10px; text-decoration: none; display: inline-block;
                                          }
                                          .download-btn:hover { background: #0056b3; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="container">
                                          <h1>${doc.name}</h1>
                                          <div class="document-viewer">
                                            <img src="${documentData}" alt="${doc.name}" />
                                            <br>
                                            <a href="${documentData}" download="${doc.name}.jpg" class="download-btn">
                                              Download Document
                                            </a>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                                newWindow.document.close();
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentUpload(doc.key, e)}
                          className="hidden"
                          id={`upload-${doc.key}`}
                          disabled={!isEditing}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                          disabled={!isEditing}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploadedDocuments[doc.key] ? "Reupload" : "Upload"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Delete Packer Button */}
      <div className="flex justify-end mt-6 p-6 bg-gray-50 rounded-lg">
        <Button 
          variant="outline" 
          onClick={handleDeletePacker}
          className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete Packer
        </Button>
      </div>

      {/* ID Card Dialog */}
      <Dialog open={showIdCard} onOpenChange={setShowIdCard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <PackerIdCard 
            packer={{
              id: packer.id,
              name: editedPacker?.name || packer.name,
              date_of_birth: editedPacker?.date_of_birth || packer.date_of_birth,
              role: editedPacker?.role || (packer as any).role || 'Warehouse Packer',
              phone: editedPacker?.phone || packer.phone,
              profile_image: profileImage || (packer as any).profile_image || null
            }}
            onClose={() => setShowIdCard(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
