import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Upload,
  Plus,
  X
} from "lucide-react";
import { packers } from "@/data/packerData";

export default function CreatePacker() {
  const navigate = useNavigate();
  const [newPacker, setNewPacker] = useState<any>({
    name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    date_of_birth: '',
    blood_group: '',
    joining_date: new Date().toISOString().split('T')[0],
    address: '',
    pincode: '',
    zone: 'Promode Agro',
    aadhar_number: '',
    pan_number: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    qualification: '',
    role: '',
    active: true,
    sync_status: 'synced' as const,
    assigned_orders: 0,
    packed_orders: 0,
    pending_orders: 0,
    completion_percentage: 0,
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, string>>({});
  
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

  // Generate unique packer ID
  const generatePackerId = () => {
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      const allIds = [...packers.map(p => p.id), ...savedPackers.map((p: any) => p.id)];
      let newId = '';
      let counter = 1;
      do {
        newId = `PKR-${String(counter).padStart(3, '0')}`;
        counter++;
      } while (allIds.includes(newId));
      return newId;
    } catch (error) {
      console.error('Error generating packer ID:', error);
      // Fallback: use timestamp-based ID
      return `PKR-${Date.now().toString().slice(-6)}`;
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
    setNewPacker({ ...newPacker, aadhar_number: formatted });
  };

  // Add new role to the list
  const handleAddNewRole = () => {
    const trimmedRole = newRoleInput.trim();
    if (trimmedRole && !availableRoles.includes(trimmedRole)) {
      const updatedRoles = [...availableRoles, trimmedRole];
      setAvailableRoles(updatedRoles);
      localStorage.setItem('packer-roles', JSON.stringify(updatedRoles));
      setNewPacker({ ...newPacker, role: trimmedRole });
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

  const handleSave = () => {
    // Validate required fields
    if (!newPacker.name || !newPacker.phone || !newPacker.address || !newPacker.pincode || !newPacker.role) {
      toast.error('Please fill in all required fields: Name, Phone, Address, Pincode, and Role');
      return;
    }

    // Generate packer ID
    const packerId = generatePackerId();
    
    // Create packer object
    const createdPacker = {
      ...newPacker,
      id: packerId,
      profile_image: profileImage,
      documents: uploadedDocuments,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to localStorage
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      savedPackers.push(createdPacker);
      localStorage.setItem('warehouse-packers', JSON.stringify(savedPackers));
      
      toast.success(`Packer ${createdPacker.name} created successfully!`);
      
      // Navigate to packer details
      navigate(`/order-management/packer-details/${packerId}`);
    } catch (error) {
      console.error('Error creating packer:', error);
      toast.error('Failed to create packer. Please try again.');
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
            <h1 className="text-2xl font-bold">Create New Packer</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the packer details below. Fields marked with * are required.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-success hover:bg-success/90">
          <Save className="h-4 w-4 mr-2" />
          Create Packer
        </Button>
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="active-toggle" className="text-sm font-medium">
                    Active
                  </Label>
                  <Switch
                    id="active-toggle"
                    checked={newPacker.active}
                    onCheckedChange={(checked) => setNewPacker({ ...newPacker, active: checked })}
                  />
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
                  />
                  <Button
                    size="icon"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-50"
                    onClick={() => document.getElementById('profile-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={newPacker.name}
                    onChange={(e) => setNewPacker({ ...newPacker, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={newPacker.phone}
                      onChange={(e) => setNewPacker({ ...newPacker, phone: e.target.value })}
                      className="pl-10"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alt-phone">Alternate Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="alt-phone"
                      value={newPacker.alternate_phone}
                      onChange={(e) => setNewPacker({ ...newPacker, alternate_phone: e.target.value })}
                      className="pl-10"
                      placeholder="Enter alternate number"
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
                      value={newPacker.email}
                      onChange={(e) => setNewPacker({ ...newPacker, email: e.target.value })}
                      className="pl-10"
                      placeholder="Enter email address"
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
                      value={newPacker.date_of_birth}
                      onChange={(e) => setNewPacker({ ...newPacker, date_of_birth: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="blood-group">Blood Group</Label>
                  <Input
                    id="blood-group"
                    value={newPacker.blood_group}
                    onChange={(e) => setNewPacker({ ...newPacker, blood_group: e.target.value })}
                    placeholder="e.g., O+, A-, B+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="joining-date">Joining Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="joining-date"
                      type="date"
                      value={newPacker.joining_date}
                      onChange={(e) => setNewPacker({ ...newPacker, joining_date: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      id="address"
                      value={newPacker.address}
                      onChange={(e) => setNewPacker({ ...newPacker, address: e.target.value })}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                      placeholder="Enter your full address"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={newPacker.pincode}
                    onChange={(e) => setNewPacker({ ...newPacker, pincode: e.target.value })}
                    placeholder="Enter pincode"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    value={newPacker.zone}
                    onChange={(e) => setNewPacker({ ...newPacker, zone: e.target.value })}
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
                    value={newPacker.aadhar_number}
                    onChange={handleAadharChange}
                    placeholder="1234-5678-9011"
                    maxLength={14}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={newPacker.qualification}
                    onChange={(e) => setNewPacker({ ...newPacker, qualification: e.target.value })}
                    placeholder="Enter qualification"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role of Person <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Select 
                      value={newPacker.role} 
                      onValueChange={(value) => {
                        if (value === 'add-new') {
                          setShowAddRole(true);
                        } else {
                          setNewPacker({ ...newPacker, role: value });
                        }
                      }}
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
                    {showAddRole && (
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
                    value={newPacker.pan_number}
                    onChange={(e) => setNewPacker({ ...newPacker, pan_number: e.target.value })}
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bank-name"
                      value={newPacker.bank_name}
                      onChange={(e) => setNewPacker({ ...newPacker, bank_name: e.target.value })}
                      className="pl-10"
                      placeholder="Enter bank name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="account-number"
                      value={newPacker.account_number}
                      onChange={(e) => setNewPacker({ ...newPacker, account_number: e.target.value })}
                      className="pl-10"
                      placeholder="Enter account number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={newPacker.ifsc_code}
                    onChange={(e) => setNewPacker({ ...newPacker, ifsc_code: e.target.value })}
                    placeholder="ABCD0123456"
                  />
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h4 className="font-semibold mb-4">Upload Documents</h4>
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
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentUpload(doc.key, e)}
                        className="hidden"
                        id={`upload-${doc.key}`}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {uploadedDocuments[doc.key] ? "Reupload" : "Upload"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

