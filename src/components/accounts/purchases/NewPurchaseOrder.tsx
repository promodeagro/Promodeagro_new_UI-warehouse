import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getPaymentMethodAccounts } from "@/lib/accounts";
import AddItemsDialog from "@/components/AddItemsDialog";

interface PurchaseItem {
  id: string;
  name: string;
  image?: string;
  imageUrl?: string;
  category: string;
  subCategory: string;
  unit: string;
  quantity: number;
  rate: number; // Purchasing price
  sellingPrice?: number;
  amount: number;
}

// Mock item data with images
const availableItems = [
  { id: 1, name: "Tomato", image: "🍅", category: "Vegetable", unit: "kg", rate: 40 },
  { id: 2, name: "Carrot", image: "🥕", category: "Vegetable", unit: "kg", rate: 50 },
  { id: 3, name: "Ghee", image: "🧈", category: "Dairy", unit: "box", rate: 500 },
  { id: 4, name: "Butter", image: "🧈", category: "Dairy", unit: "box", rate: 300 },
  { id: 5, name: "Cucumber", image: "🥒", category: "Vegetable", unit: "kg", rate: 30 },
];

// Mock purchase orders
const mockPurchaseOrders = [
  { 
    id: "PO-001", 
    vendor: "Green Farm Co.", 
    orderDate: "2025-10-05", 
    items: [
      { 
        id: 1, 
        name: "Organic Tomatoes", 
        image: "🍅", 
        category: "Vegetables", 
        subCategory: "Fresh", 
        unit: "kg", 
        rate: 40, 
        quantity: 10 
      },
      { 
        id: 2, 
        name: "Fresh Carrots", 
        image: "🥕", 
        category: "Vegetables", 
        subCategory: "Fresh", 
        unit: "kg", 
        rate: 50, 
        quantity: 5 
      },
    ]
  },
  { 
    id: "PO-002", 
    vendor: "Organic Valley Supplier", 
    orderDate: "2025-10-04", 
    items: [
      { 
        id: 3, 
        name: "Premium Ghee", 
        image: "🧈", 
        category: "Dairy", 
        subCategory: "Cooking", 
        unit: "box", 
        rate: 500, 
        quantity: 2 
      },
    ]
  },
  { 
    id: "PO-003", 
    vendor: "Local Co-op Market", 
    orderDate: "2025-10-03", 
    items: [
      { 
        id: 1, 
        name: "Organic Tomatoes", 
        image: "🍅", 
        category: "Vegetables", 
        subCategory: "Fresh", 
        unit: "kg", 
        rate: 40, 
        quantity: 15 
      },
      { 
        id: 5, 
        name: "Fresh Cucumbers", 
        image: "🥒", 
        category: "Vegetables", 
        subCategory: "Fresh", 
        unit: "kg", 
        rate: 30, 
        quantity: 8 
      },
    ]
  },
];

export default function NewPurchaseOrder() {
  const navigate = useNavigate();
  // Invoice number (PUR-00001 style), read-only
  const nextInvoiceNumber = useMemo(() => {
    const key = "purchaseInvoiceCounter";
    const curr = Number(localStorage.getItem(key) || "0");
    // Note: we only preview here; actual increment occurs on submit
    const next = curr + 1;
    return `PUR-${String(next).padStart(5, "0")}`;
  }, []);

  const [vendorName, setVendorName] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [paymentAccount, setPaymentAccount] = useState("2010");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showAddItemsDialog, setShowAddItemsDialog] = useState(false);
  const [hambaliCharges, setHambaliCharges] = useState<number>(0);
  const handleAddItems = (selected: any[]) => {
    const newItems = selected.map((item: any) => ({
      id: item.id,
      name: item.name,
      image: item.imageUrl,
      imageUrl: item.imageUrl,
      category: item.category,
      subCategory: item.subCategory || "",
      unit: item.unit,
      quantity: 1,
      rate: item.purchasingPrice,
      sellingPrice: item.sellingPrice,
      amount: 1 * item.purchasingPrice,
    }));

    const existingIds = new Set(items.map(i => i.id));
    const uniqueToAdd = newItems.filter(i => !existingIds.has(i.id));
    const updated = [...items, ...uniqueToAdd];
    setItems(updated);
    setSelectedItemIds(new Set(updated.map(i => i.id)));
  };

  const handlePaymentStatusChange = (status: string) => {
    setPaymentStatus(status);
    // Auto-select payment account based on status
    if (status === "pending") {
      setPaymentAccount("2010"); // Accounts Payable
    } else if (status === "paid") {
      setPaymentAccount("1010"); // Cash in Hand
    }
  };


  const removeItem = (index: number) => {
    const itemToRemove = items[index];
    setItems(items.filter((_, i) => i !== index));
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemToRemove.id);
      return newSet;
    });
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    setItems(newItems);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setUploadedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalAmount = subTotal + (hambaliCharges || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!vendorName || !orderDate || !paymentStatus) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate unique IDs and persist invoice counter
      const id = `PO-${Date.now()}`;
      const key = "purchaseInvoiceCounter";
      const curr = Number(localStorage.getItem(key) || "0");
      localStorage.setItem(key, String(curr + 1));
      
      // Create purchase order
      const newPurchase = {
        id,
        poId: nextInvoiceNumber,
        vendor: vendorName,
        date: orderDate,
        dueDate,
        status: paymentStatus,
        paymentMode: getPaymentMethodAccounts().find(acc => acc.code === paymentAccount)?.name || "",
        paymentAccount,
        itemsCount: items.length,
        subtotal: subTotal,
        discountPercentage: 0,
        discountAmount: 0,
        totalAmount,
        hambaliCharges,
        items,
        notes,
        uploadedImages: uploadedImages.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          // Convert to base64 for storage
          data: URL.createObjectURL(file)
        })),
      };
      
      
      // Save to localStorage
      const stored = localStorage.getItem("purchases");
      const list = stored ? JSON.parse(stored) : [];
      localStorage.setItem("purchases", JSON.stringify([newPurchase, ...list]));
      
      
      // Create journal entries
      const jeStored = localStorage.getItem("journalEntries");
      const jeList = jeStored ? JSON.parse(jeStored) : [];
      
      // Journal Entry: Record Inventory Purchase
      const je1 = {
        id: `JE-${Date.now()}-1`,
        date: orderDate,
        description: "Record inventory purchase",
        reference: id,
        status: "posted",
        lines: [
          { account: "Inventory", debit: totalAmount, credit: 0 },
          { account: paymentStatus === "paid" 
            ? getPaymentMethodAccounts().find(acc => acc.code === paymentAccount)?.name || "Cash in Hand"
            : "Accounts Payable", 
            debit: 0, 
            credit: totalAmount 
          },
        ]
      };
      
      localStorage.setItem("journalEntries", JSON.stringify([je1, ...jeList]));
      
      toast({
        title: "Success!",
        description: "Purchase invoice created successfully with accounting entries.",
      });
      navigate("/accounts/purchases");
    } catch (error) {
      console.error("Error saving purchase:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase invoice.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/accounts/purchases")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Purchase Invoice</h1>
          <p className="text-muted-foreground">Create a new purchase invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Purchase Invoice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Purchase Invoice No</Label>
                <Input id="invoiceNo" value={nextInvoiceNumber} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor Name</Label>
                <Input 
                  id="vendor" 
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Vendor name" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date</Label>
                <Input 
                  id="orderDate" 
                  type="date" 
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input 
                  id="dueDate" 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAccount">Payment Account</Label>
                <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getPaymentMethodAccounts().map((account) => (
                      <SelectItem key={account.code} value={account.code}>
                        {account.name} (₹{account.balance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Purchase Items</Label>
                <Button type="button" className="gap-2" onClick={() => setShowAddItemsDialog(true)}>
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>

              {items.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Item Name</th>
                        <th className="text-left p-3 font-medium w-24">Unit</th>
                        <th className="text-left p-3 font-medium w-32">Purchase Qty</th>
                        <th className="text-left p-3 font-medium w-32">Purchasing Price</th>
                        <th className="text-left p-3 font-medium w-32">Selling Price</th>
                        <th className="text-left p-3 font-medium w-32">Amount</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {(item.image || item.imageUrl) && <span className="text-2xl">{item.image || item.imageUrl}</span>}
                              <span className="font-medium">{item.name}</span>
                            </div>
                          </td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                              min="1"
                              className="w-24"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-24"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={item.sellingPrice ?? 0}
                              onChange={(e) => updateItem(index, "sellingPrice", parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-24"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-semibold">₹{item.amount.toFixed(2)}</span>
                          </td>
                          <td className="p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-semibold">
                      <tr className="border-t">
                        <td colSpan={5} className="p-3 text-right font-bold">Subtotal:</td>
                        <td className="p-3 font-bold">₹{subTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="p-3 text-right font-bold">Hambali charges:</td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={hambaliCharges}
                            onChange={(e) => setHambaliCharges(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-32"
                          />
                        </td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="p-3 text-right font-bold">Total:</td>
                        <td className="p-3 font-bold">₹{totalAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">
                  No items added. Click "Add Item" to add items to the invoice.
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
              <Label>Attach Images (Optional)</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="imageUpload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Images
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Upload receipts, invoices, or product images
                  </span>
                </div>
                
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={4} 
                placeholder="Add any notes for this purchase..." 
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate("/accounts/purchases")}>
                Cancel
              </Button>
              <Button type="submit">Create Purchase Invoice</Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <AddItemsDialog
        open={showAddItemsDialog}
        onOpenChange={setShowAddItemsDialog}
        onAddItems={handleAddItems}
        selectedItems={selectedItemIds}
      />

    </div>
  );
}