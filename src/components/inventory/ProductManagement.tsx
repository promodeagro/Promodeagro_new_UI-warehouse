import React, { useState, useRef } from "react";
import { Package, Plus, Edit, Trash2, Search, Filter, Upload, Eye, AlertTriangle, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/contexts/CategoryContext";
import { useProducts } from "@/contexts/ProductContext";
import { useUnits } from "@/contexts/UnitsContext";

// Product Image Carousel Component
function ProductImageCarousel({ images, productId }: { images: string[], productId: string }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeImages, setActiveImages] = useState<string[]>([]);

  // Normalize incoming images whenever prop changes
  React.useEffect(() => {
    const normalized = (images || []).filter((img) => typeof img === 'string' && img.trim() !== '');
    setActiveImages(normalized);
    setCurrentImageIndex(0);
  }, [images]);

  // Auto-advance every 3 seconds
  React.useEffect(() => {
    if (activeImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % activeImages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeImages]);

  if (activeImages.length === 0) {
    return (
      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg flex items-center justify-center">
        <Package className="h-8 w-8 text-green-600" />
      </div>
    );
  }

  const onImgError = () => {
    // Remove the failed image from the carousel list
    setActiveImages((prev) => {
      const next = prev.filter((_, i) => i !== currentImageIndex);
      return next;
    });
    setCurrentImageIndex(0);
  };

  return (
    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30">
      <img
        src={activeImages[currentImageIndex]}
        alt={`Product ${productId}`}
        className="w-full h-full object-cover"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={onImgError}
      />
      {activeImages.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {activeImages.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-1 rounded-full ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductManagement() {
  const { categories: contextCategories, getSubcategoriesByCategoryId } = useCategories();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { units: managedUnits } = useUnits();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  // Formats product name into up to two segments: 30 characters first line, 20 characters second line
  const splitProductName = (name: string): { first: string; second: string; ellipsis: boolean } => {
    if (!name) return { first: "", second: "", ellipsis: false };
    const first = name.slice(0, 30);
    const remainder = name.slice(30);
    const second = remainder.slice(0, 20);
    return { first, second, ellipsis: remainder.length > 20 };
  };

  // Reset form function to clear all data when dialog closes
  const resetForm = () => {
    setNewProduct({
      name: "",
      category: "",
      price: "",
      unit: "",
      stock: "",
      minStock: "",
      maxStock: "",
      supplier: "",
      description: "",
      onB2C: true,
      subCategory: "",
      tags: [],
      b2cQty: "",
      b2cUnit: "",
      lowStockAlert: "",
      purchasePrice: "",
      salePrice: "",
      comparePrice: "",
      expiryDate: "",
    });
    setTagDraft("");
    setDescriptionWordCount(0);
    setImages([]);
    setVariants([]);
    setIsEditMode(false);
    setEditingProduct(null);
  };
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasParentVariants, setHasParentVariants] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const { toast } = useToast();


  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    unit: "",
    stock: "",
    minStock: "",
    maxStock: "",
    supplier: "",
    description: "",
    onB2C: true,
    subCategory: "",
    tags: [] as string[],
    b2cQty: "",
    b2cUnit: "",
    lowStockAlert: "",
    purchasePrice: "",
    salePrice: "",
    comparePrice: "",
    expiryDate: "",
  });

  const [tagDraft, setTagDraft] = useState("");
  const DESCRIPTION_WORD_LIMIT = 200;
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);
  type UploadedImage = { file: File, url: string };
  const [images, setImages] = useState<UploadedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type VariantImage = UploadedImage;
  type Variant = {
    name: string;
    qty: string;
    unit: string;
    purchasePrice: string;
    salePrice: string;
    comparePrice: string;
    b2cQty: string;
    b2cUnit: string;
    lowStockAlert: string;
    expiryDate: string;
    publishToB2C: boolean;
    images: VariantImage[];
  };
  const [variants, setVariants] = useState<Variant[]>([]);

  const handleImageFiles = (files: File[]) => {
    const allowed = files.filter(f => /image\/(jpeg|png|svg\+xml)/i.test(f.type));
    const mapped: UploadedImage[] = allowed.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    const combined = [...images, ...mapped].slice(0, 4);
    setImages(combined);
  };

  const removeImageAt = (index: number) => {
    const target = images[index];
    if (target) URL.revokeObjectURL(target.url);
    setImages(images.filter((_, i) => i !== index));
  };

  const addVariant = () => {
    // Snapshot current parent values as defaults for the new variant.
    setVariants([
      ...variants,
      {
        name: newProduct.name ? `${newProduct.name}` : "Product Variant",
        qty: "",
        unit: newProduct.b2cUnit || "",
        purchasePrice: "",
        salePrice: "",
        comparePrice: "",
        b2cQty: "",
        b2cUnit: newProduct.b2cUnit || "",
        lowStockAlert: "",
        expiryDate: newProduct.expiryDate || "",
        publishToB2C: newProduct.onB2C,
        images: [],
      },
    ]);
  };

  const removeVariant = (index: number) => {
    const v = variants[index];
    if (v) v.images.forEach(img => URL.revokeObjectURL(img.url));
    setVariants(variants.filter((_, i) => i !== index));
  };

  const editProduct = (product: any) => {
    setEditingProduct(product);
    setIsEditMode(true);
    setShowVariants(false);
    
    // Pre-fill the form with existing product data
    setNewProduct({
      name: product.name || "",
      category: product.category || "",
      price: product.price?.toString() || "",
      unit: product.unit || "",
      stock: product.stock?.toString() || "",
      minStock: product.minStock?.toString() || "",
      maxStock: product.maxStock?.toString() || "",
      supplier: product.supplier || "",
      description: product.description || "",
      onB2C: product.onB2C || false,
      subCategory: product.subCategory || (product as any).subcategory || "",
      tags: product.tags || [],
      b2cQty: (product as any).b2cQty?.toString() || "",
      b2cUnit: (product as any).b2cUnit || "",
      lowStockAlert: product.minStock?.toString() || "",
      purchasePrice: product.purchasePrice?.toString() || "",
      salePrice: product.price?.toString() || "",
      comparePrice: product.comparePrice?.toString() || "",
      expiryDate: product.expiryDate || "",
    });

    // Pre-fill images
    if (product.images && product.images.length > 0) {
      const imageObjects = product.images.map((url: string) => ({
        url: url,
        file: null as File | null
      }));
      setImages(imageObjects);
    } else {
      setImages([]);
    }

    // Pre-fill variants (if any)
    const productVariants = products.filter(p => (p as any).parentProductId === product.id);
    if (productVariants.length > 0) {
      setHasParentVariants(true);
      const variantData = productVariants.map(variant => ({
        name: variant.name || "",
        qty: variant.stock?.toString() || "",
        unit: variant.unit || "",
        purchasePrice: (variant as any).purchasePrice?.toString() || "",
        salePrice: variant.price?.toString() || "",
        comparePrice: (variant as any).comparePrice?.toString() || "",
        b2cQty: variant.stock?.toString() || "",
        b2cUnit: variant.unit || "",
        lowStockAlert: variant.minStock?.toString() || "",
        expiryDate: (variant as any).expiryDate || "",
        publishToB2C: variant.onB2C || false,
        images: variant.images ? variant.images.map((url: string) => ({
          url: url,
          file: null as File | null
        })) : []
      }));
      setVariants(variantData);
    } else {
      setHasParentVariants(false);
      setVariants([]);
    }

    setDescriptionWordCount(product.description ? product.description.trim().split(/\s+/).length : 0);
    setIsAddDialogOpen(true);
  };

  const viewProduct = (product: any) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setVariants(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVariantImages = (index: number, files: File[]) => {
    const allowed = files.filter(f => /image\/(jpeg|png|svg\+xml)/i.test(f.type));
    const mapped: VariantImage[] = allowed.map(f => ({ file: f, url: URL.createObjectURL(f) }));
    setVariants(variants.map((v, i) => (i === index ? { ...v, images: [...v.images, ...mapped].slice(0, 4) } : v)));
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    const img = variants[variantIndex]?.images[imageIndex];
    if (img) URL.revokeObjectURL(img.url);
    setVariants(
      variants.map((v, i) =>
        i === variantIndex ? { ...v, images: v.images.filter((_, j) => j !== imageIndex) } : v
      )
    );
  };

  const addTagFromDraft = () => {
    const value = tagDraft.trim();
    if (!value) return;
    if (!newProduct.tags.includes(value)) {
      setNewProduct({ ...newProduct, tags: [...newProduct.tags, value] });
    }
    setTagDraft("");
  };

  const removeTag = (value: string) => {
    setNewProduct({ ...newProduct, tags: newProduct.tags.filter(t => t !== value) });
  };

  // Get category names from context
  const categories = contextCategories.map(cat => cat.name);
  
  // Get subcategories dynamically from context
  const getSubcategoriesForCategory = (categoryName: string) => {
    const category = contextCategories.find(cat => cat.name === categoryName);
    return category ? category.subcategories : [];
  };
  // Units from Unit Management module (fallback to simple symbols if empty)
  const units = managedUnits.length > 0 ? managedUnits.map(u => u.symbol || u.name) : ["kg", "gram", "liter", "packet", "pcs", "box", "dz"];

  const getStatusColor = (status: string) => {
    const colors = {
      "active": "bg-green-500/10 text-green-500",
      "low-stock": "bg-yellow-500/10 text-yellow-500",
      "out-of-stock": "bg-red-500/10 text-red-500",
      "discontinued": "bg-gray-500/10 text-gray-500"
    };
    return colors[status as keyof typeof colors];
  };

  const getQualityColor = (quality: string) => {
    const colors = {
      "excellent": "bg-green-500/10 text-green-500",
      "very-good": "bg-green-400/10 text-green-400", 
      "good": "bg-yellow-500/10 text-yellow-500",
      "fair": "bg-orange-500/10 text-orange-500",
      "poor": "bg-red-500/10 text-red-500"
    };
    return colors[quality as keyof typeof colors];
  };

  const handleAddProduct = () => {
    if (isEditMode && editingProduct) {
      // Update existing product
      const updatedProduct = {
        ...editingProduct,
        name: newProduct.name,
        category: newProduct.category,
        subCategory: newProduct.subCategory,
        subcategory: newProduct.subCategory,
        description: newProduct.description,
        tags: newProduct.tags,
        price: parseFloat(newProduct.salePrice || "0"),
        stock: parseInt(newProduct.stock || "0"),
        minStock: parseInt(newProduct.lowStockAlert || "0"),
        maxStock: parseInt(newProduct.maxStock || "1000"),
        supplier: newProduct.supplier,
        unit: newProduct.unit || "kg",
        images: images.map(img => img.url),
        b2cQty: newProduct.b2cQty || "0",
        b2cUnit: newProduct.b2cUnit || "kg",
        purchasePrice: newProduct.purchasePrice || "0",
        salePrice: newProduct.salePrice || "0",
        comparePrice: newProduct.comparePrice || "0",
        expiryDate: newProduct.expiryDate || "",
        onB2C: newProduct.onB2C,
        status: parseInt(newProduct.stock || "0") === 0 ? "out-of-stock" :
                parseInt(newProduct.stock || "0") <= parseInt(newProduct.lowStockAlert || "0") ? "low-stock" : "active",
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      // Update variants: recreate children for this parent, ensuring they are marked as variants
      const updatedVariants = variants.map((variant, idx) => ({
        id: `PRD-${String(products.length + idx + 1).padStart(3, '0')}`,
        name: variant.name || `${newProduct.name} - Variant ${idx + 1}`,
        category: newProduct.category || "",
        subCategory: newProduct.subCategory || "",
        tags: newProduct.tags,
        price: parseFloat(variant.salePrice || "0"),
        stock: parseInt(variant.qty || "0"),
        b2cQty: variant.b2cQty || "0",
        b2cUnit: variant.b2cUnit || "kg",
        minStock: parseInt(variant.lowStockAlert || "0"),
        maxStock: 1000,
        status: (parseInt(variant.qty || "0") === 0 ? "out-of-stock" :
                parseInt(variant.qty || "0") <= parseInt(variant.lowStockAlert || "0") ? "low-stock" : "active") as "active" | "low-stock" | "out-of-stock",
        images: variant.images.map(img => img.url),
        unit: variant.unit || "kg",
        supplier: newProduct.supplier,
        description: newProduct.description || "",
        purchasePrice: parseFloat(variant.purchasePrice || "0"),
        salePrice: parseFloat(variant.salePrice || "0"),
        comparePrice: parseFloat(variant.comparePrice || "0"),
        expiryDate: variant.expiryDate || "",
        onB2C: variant.publishToB2C,
        isVariant: true,
        parentProductId: editingProduct.id,
        lastUpdated: new Date().toISOString().split('T')[0]
      }));

      // Update product using shared context
      updateProduct(editingProduct.id, updatedProduct);
      
      // Add/update variants using shared context
      updatedVariants.forEach(variant => {
        updateProduct(variant.id, variant);
      });

      toast({
        title: "Product Updated Successfully",
        description: `${updatedProduct.name} has been updated in inventory.`,
      });
    } else {
      // Add new product
      const newProducts = [];
      
      // Create main product
      const mainProduct = {
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      ...newProduct,
        subcategory: newProduct.subCategory, // Map subCategory to subcategory
        tags: newProduct.tags,
        price: parseFloat(newProduct.salePrice || "0"),
        stock: parseInt(newProduct.stock || "0"),
        minStock: parseInt(newProduct.lowStockAlert || "0"),
        maxStock: parseInt(newProduct.maxStock || "1000"),
        status: parseInt(newProduct.stock || "0") === 0 ? "out-of-stock" : 
                parseInt(newProduct.stock || "0") <= parseInt(newProduct.lowStockAlert || "0") ? "low-stock" : "active",
      quality: "good",
      image: "/api/placeholder/100/100",
        lastUpdated: new Date().toISOString().split('T')[0],
        images: images.map(img => img.url), // Include uploaded images
        unit: newProduct.unit || "kg",
        b2cQty: newProduct.b2cQty || "0",
        b2cUnit: newProduct.b2cUnit || "kg",
        supplier: newProduct.supplier || "Local Supplier",
        description: newProduct.description || "",
        category: newProduct.category || "",
        subCategory: newProduct.subCategory || "",
        purchasePrice: newProduct.purchasePrice || "0",
        salePrice: newProduct.salePrice || "0",
        comparePrice: newProduct.comparePrice || "0",
        expiryDate: newProduct.expiryDate || "",
        onB2C: newProduct.onB2C
      };
      
      newProducts.push(mainProduct);
      
      // Create variant products
      variants.forEach((variant, idx) => {
        const variantProduct = {
          id: `PRD-${String(products.length + newProducts.length + 1).padStart(3, '0')}`,
          name: variant.name || `${newProduct.name} - Variant ${idx + 1}`,
          category: newProduct.category || "",
          subCategory: newProduct.subCategory || "",
          tags: newProduct.tags,
          price: parseFloat(variant.salePrice || "0"),
          stock: parseInt(variant.qty || "0"),
          b2cQty: variant.b2cQty || "0",
          b2cUnit: variant.b2cUnit || "kg",
          minStock: parseInt(variant.lowStockAlert || "0"),
          maxStock: 1000,
          status: (parseInt(variant.qty || "0") === 0 ? "out-of-stock" : 
                  parseInt(variant.qty || "0") <= parseInt(variant.lowStockAlert || "0") ? "low-stock" : "active") as "active" | "low-stock" | "out-of-stock",
          quality: "good",
          image: "/api/placeholder/100/100",
          lastUpdated: new Date().toISOString().split('T')[0],
          images: variant.images.map(img => img.url), // Include variant images
          unit: variant.unit || "kg",
          supplier: newProduct.supplier || "Local Supplier",
          description: newProduct.description || "",
          purchasePrice: parseFloat(variant.purchasePrice || "0"),
          salePrice: parseFloat(variant.salePrice || "0"),
          comparePrice: parseFloat(variant.comparePrice || "0"),
          expiryDate: variant.expiryDate || "",
          onB2C: variant.publishToB2C,
          isVariant: true,
          parentProductId: mainProduct.id
        };
        
        newProducts.push(variantProduct);
      });

      // Add new products using shared context
      newProducts.forEach(product => {
        addProduct(product);
      });
    
    toast({
      title: "Product Added Successfully",
        description: `${mainProduct.name} and ${variants.length} variant(s) have been added to inventory.`,
      });
    }

    setIsAddDialogOpen(false);
    setIsEditMode(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleUpdateProduct = (productId: string, updates: any) => {
    updateProduct(productId, {
            ...updates, 
            lastUpdated: new Date().toISOString().split('T')[0],
            status: updates.stock === 0 ? "out-of-stock" : 
             updates.stock <= (updates.minStock || products.find(p => p.id === productId)?.minStock || 0) ? "low-stock" : "active"
    });
    
    toast({
      title: "Product Updated",
      description: "Changes have been synced to B2C portal.",
    });
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProduct(productId);
    toast({
      title: "Product Deleted",
      description: "Product has been removed from inventory and B2C portal.",
    });
  };

  const toggleB2CStatus = (productId: string, currentStatus: boolean) => {
    updateProduct(productId, { onB2C: !currentStatus });
    toast({
      title: currentStatus ? "Product Hidden from B2C" : "Product Published to B2C",
      description: currentStatus ? 
        "Product is no longer visible to customers." : 
        "Product is now live on customer portal.",
    });
  };

  // Show ONLY parent products in the grid (hide variant cards)
  const filteredProducts = products.filter(product => {
    // If this item is a variant, skip it from the main product grid
    if ((product as any).isVariant) return false;
    const term = searchTerm.trim().toLowerCase();
    const tags = (product as any).tags || [];
    const matchesSearch = term === "" ||
      product.name.toLowerCase().includes(term) ||
      product.id.toLowerCase().includes(term) ||
      (Array.isArray(tags) && tags.some((t: string) => (t || "").toLowerCase().includes(term)));
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Product Management Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Management
              </CardTitle>
              <CardDescription>
                Manage inventory products that sync live to B2C portal
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:bg-gradient-primary/90">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Product
                </Button>
              </DialogTrigger>
                <DialogContent className="w-[992px] max-w-[992px] h-[614px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    Add a new product to inventory. It will be synced to B2C portal if enabled.
                  </DialogDescription>
                </DialogHeader>
                  <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Enter product name"
                        className="w-full placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                          <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value, subCategory: ""})}>
                            <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sub Category + Overall Stock + Quantity In B2C (one row with three groups) */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Sub Category */}
                    <div className="space-y-2">
                      <Label htmlFor="subCategory">Sub Category *</Label>
                      <Select
                        value={newProduct.subCategory}
                        onValueChange={(value) => setNewProduct({ ...newProduct, subCategory: value })}
                        disabled={!newProduct.category}
                      >
                        <SelectTrigger id="subCategory" className="w-full">
                          <SelectValue placeholder="Select sub category" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubcategoriesForCategory(newProduct.category).map((sub) => (
                            <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Overall Stock with unit */}
                    <div className="space-y-2">
                      <Label htmlFor="stockQty">Overall Stock</Label>
                      <div className="grid grid-cols-3 gap-2">
                      <Input
                          id="stockQty"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                          placeholder="0"
                          className="col-span-2 w-full placeholder:text-muted-foreground"
                        />
                        <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}>
                          <SelectTrigger id="stockUnit" className="w-full">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                    </div>

                    {/* Quantity In B2C with unit */}
                    <div className="space-y-2">
                      <Label htmlFor="b2cQty">Quantity In B2C</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          id="b2cQty"
                          value={newProduct.b2cQty}
                          onChange={(e) => setNewProduct({ ...newProduct, b2cQty: e.target.value })}
                          placeholder="0"
                          className="col-span-2 w-full placeholder:text-muted-foreground"
                        />
                        <Select value={newProduct.b2cUnit} onValueChange={(value) => setNewProduct({ ...newProduct, b2cUnit: value })}>
                          <SelectTrigger id="b2cUnit" className="w-full">
                            <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map((u) => (
                              <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                  </div>
                  </div>

                  {/* price, unit, supplier removed as requested */}

                  {/* stock/min/max removed as requested */}

                    <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const words = raw.trim().length === 0 ? [] : raw.trim().split(/\s+/);
                          if (words.length > DESCRIPTION_WORD_LIMIT) {
                            const trimmed = words.slice(0, DESCRIPTION_WORD_LIMIT).join(" ");
                            setNewProduct({ ...newProduct, description: trimmed });
                            setDescriptionWordCount(DESCRIPTION_WORD_LIMIT);
                          } else {
                            setNewProduct({ ...newProduct, description: raw });
                            setDescriptionWordCount(words.length);
                          }
                        }}
                      placeholder="Product description for customers"
                      rows={3}
                        className="placeholder:text-muted-foreground"
                      />
                    <div className="text-xs text-muted-foreground">
                      {descriptionWordCount}/{DESCRIPTION_WORD_LIMIT} words
                    </div>
                  </div>

                  {/* moved subcategory + quantity above */}

                    <div className="space-y-2">
                    <Label htmlFor="tags">Tags (Multiple Names)</Label>
                    <div className="flex flex-wrap items-start gap-2 rounded-md border border-input bg-background px-3 py-3 h-20 resize-y overflow-auto">
                      {newProduct.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                        <input
                        id="tags"
                        className="flex-1 min-w-[240px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                        placeholder="Enter tag and press Enter"
                        value={tagDraft}
                        onChange={(e) => setTagDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addTagFromDraft();
                          } else if (e.key === 'Backspace' && tagDraft === '' && newProduct.tags.length > 0) {
                            removeTag(newProduct.tags[newProduct.tags.length - 1]);
                          }
                        }}
                        onBlur={() => addTagFromDraft()}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Product Images (Max 4)</Label>
                    <div
                      className="border-2 border-dashed border-card-border rounded-lg p-8 text-center text-muted-foreground cursor-pointer select-none"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const files = Array.from(e.dataTransfer.files || []);
                        handleImageFiles(files);
                      }}
                    >
                      <Upload className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <div className="text-sm text-primary">Upload Image</div>
                      <div className="mt-1 text-xs text-muted-foreground">Click or drag files here</div>
                      {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-3">
                          {images.map((img, idx) => (
                            <div key={idx} className="relative h-24 w-full rounded-md border border-card-border overflow-hidden bg-muted/20">
                              <img src={img.url} alt={`upload-${idx}`} className="h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeImageAt(idx); }}
                                className="absolute top-1 right-1 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md"
                                aria-label="Remove image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/svg+xml"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          handleImageFiles(files);
                          // reset input to allow re-uploading same file name
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Upload Upto 4 images for your item. File format: <span className="font-medium">jpeg, png, svg</span>. Recommended size: <span className="font-medium">300×200</span>. ({images.length}/4)
                    </div>
                  </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="purchasePrice">Purchasing Price (₹) *</Label>
                      <Input
                            id="purchasePrice"
                            value={newProduct.purchasePrice}
                            onChange={(e) => setNewProduct({...newProduct, purchasePrice: e.target.value})}
                            placeholder="0.00"
                            className="w-full placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="salePrice">Sale Price (₹) *</Label>
                      <Input
                            id="salePrice"
                            value={newProduct.salePrice}
                            onChange={(e) => setNewProduct({...newProduct, salePrice: e.target.value})}
                            placeholder="0.00"
                            className="w-full placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                          <Label htmlFor="comparePrice">Compare Price (₹)</Label>
                      <Input
                            id="comparePrice"
                            value={newProduct.comparePrice}
                            onChange={(e) => setNewProduct({...newProduct, comparePrice: e.target.value})}
                            placeholder="0.00"
                            className="w-full placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                      {/* Low Stock Alert + Expiry Date + Supplier before Variants */}
                      <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                          <Label htmlFor="lowStockAlertMain">Low Stock Alert</Label>
                          <Input id="lowStockAlertMain" value={newProduct.lowStockAlert} onChange={(e) => setNewProduct({ ...newProduct, lowStockAlert: e.target.value })} placeholder="Enter minimum threshold" className="w-full placeholder:text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryDateMain">Expiry Date</Label>
                          <Input id="expiryDateMain" type="date" value={newProduct.expiryDate} onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })} className="w-full" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplierMain">Supplier Name</Label>
                          <Input id="supplierMain" value={newProduct.supplier} onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })} placeholder="Enter supplier name" className="w-full placeholder:text-muted-foreground" />
                        </div>
                  </div>

                  {/* Publish to B2C toggle moved up */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="b2c"
                      checked={newProduct.onB2C}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, onB2C: checked })}
                    />
                    <Label htmlFor="b2c">Publish to B2C Portal</Label>
                  </div>

                  {/* Product Variants */}
                  <div className="space-y-3">
                    {isEditMode && hasParentVariants && !showVariants && (
                      <div>
                        <Button variant="outline" type="button" onClick={() => setShowVariants(true)}>View Variants</Button>
                      </div>
                    )}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Product Variants</Label>
                        {((isEditMode && hasParentVariants && showVariants) || variants.length > 0) && (
                          <Button variant="outline" size="sm" type="button" onClick={addVariant}>+ Add More Variant</Button>
                        )}
                      </div>
                    {(isEditMode && hasParentVariants ? showVariants : variants.length > 0) && (
                      <div className="w-full rounded-md border border-card-border py-4 px-[15px] my-4">
                        <div className={`flex gap-4 w-full ${variants.length > 2 ? 'overflow-x-auto' : 'overflow-x-hidden'}`}>
                          {variants.map((v, idx) => (
                            <div key={idx} className="w-[340px] flex-shrink-0 rounded-lg border border-card-border p-4 bg-card">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-sm font-medium">{`Product Variant ${String(idx + 1).padStart(2, '0')}`}</div>
                                <button type="button" onClick={() => removeVariant(idx)} className="text-muted-foreground hover:text-destructive" aria-label="Remove variant">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Variant Name</Label>
                                  <Input 
                                    value={v.name} 
                                    onChange={(e) => updateVariant(idx, 'name', e.target.value)} 
                                    placeholder="Product Variant"
                                    className="w-full placeholder:text-muted-foreground"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2 space-y-2">
                                    <Label>Overall Stock</Label>
                                    <Input 
                                      value={v.qty} 
                                      onChange={(e) => updateVariant(idx, 'qty', e.target.value)} 
                                      placeholder="Enter quantity" 
                                      className="placeholder:text-gray-400 placeholder:font-normal" 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Select value={v.unit} onValueChange={(val) => updateVariant(idx, 'unit', val)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-2">
                                    <Label>Purchasing Price (₹)</Label>
                                    <Input value={v.purchasePrice} onChange={(e) => updateVariant(idx, 'purchasePrice', e.target.value)} placeholder="0.00" className="placeholder:text-muted-foreground" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Sale Price (₹)</Label>
                                    <Input value={v.salePrice} onChange={(e) => updateVariant(idx, 'salePrice', e.target.value)} placeholder="0.00" className="placeholder:text-muted-foreground" />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Compare Price (₹)</Label>
                                  <Input value={v.comparePrice} onChange={(e) => updateVariant(idx, 'comparePrice', e.target.value)} placeholder="0.00" className="placeholder:text-muted-foreground" />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="col-span-2 space-y-2">
                                    <Label>Quantity In B2C</Label>
                                    <Input 
                                      value={v.b2cQty} 
                                      onChange={(e) => updateVariant(idx, 'b2cQty', e.target.value)} 
                                      placeholder="Enter B2C quantity" 
                                      className="placeholder:text-gray-400 placeholder:font-normal" 
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Select value={v.b2cUnit} onValueChange={(val) => updateVariant(idx, 'b2cUnit', val)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Unit" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Low Stock Alert</Label>
                                  <Input value={v.lowStockAlert} onChange={(e) => updateVariant(idx, 'lowStockAlert', e.target.value)} placeholder="Enter minimum threshold" className="placeholder:text-muted-foreground" />
                                </div>

                                <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input type="date" value={v.expiryDate} onChange={(e) => updateVariant(idx, 'expiryDate', e.target.value)} />
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label>Publish to B2C Portal</Label>
                                  <Switch checked={v.publishToB2C} onCheckedChange={(checked) => updateVariant(idx, 'publishToB2C', checked)} />
                                </div>

                                <div className="space-y-2">
                                  <Label>Product Images (Max 4)</Label>
                                  <div
                                    className="border-2 border-dashed border-card-border rounded-lg p-4 text-center text-muted-foreground cursor-pointer select-none"
                                    onClick={() => document.getElementById(`variant-file-${idx}`)?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    onDrop={(e) => { e.preventDefault(); addVariantImages(idx, Array.from(e.dataTransfer.files || [])); }}
                                  >
                                    <Upload className="h-5 w-5 mx-auto mb-2 text-primary" />
                                    <div className="text-xs">Upload images ({v.images.length}/4)</div>
                                    {v.images.length > 0 && (
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        {v.images.map((img, j) => (
                                          <div key={j} className="relative h-16 w-full rounded-md border border-card-border overflow-hidden bg-muted/20">
                                            <img src={img.url} className="h-full w-full object-cover" />
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeVariantImage(idx, j); }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md">
                                              <X className="h-3 w-3" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <input id={`variant-file-${idx}`} type="file" accept="image/jpeg,image/png,image/svg+xml" multiple className="hidden" onChange={(e) => addVariantImages(idx, Array.from(e.target.files || []))} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* duplicate low stock/expiry removed */}

                  {/* Publish to B2C toggle moved above */}

                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          // Footer Add Variant behavior
                          // 1) Always open the container
                          if (!showVariants) setShowVariants(true);
                          // 2) Append a new row
                          addVariant();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-0.5" />
                        {isEditMode ? "Add Variant" : "Add Variants"}
                    </Button>
                      <div className="flex items-center gap-3">
                    <Button onClick={handleAddProduct} className="bg-gradient-primary hover:bg-gradient-primary/90">
                      {isEditMode ? "Update Product" : "Add Product"}
                    </Button>
                        <Button variant="outline" onClick={() => {
                          setIsAddDialogOpen(false);
                          resetForm();
                        }}>
                          Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="w-[992px] max-w-[992px] h-[614px] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>View Product Details</DialogTitle>
                  <DialogDescription>
                    View product information and variants
                  </DialogDescription>
                </DialogHeader>
                
                {viewingProduct && (
                  <div className="space-y-6">
                    {/* Product Images */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Product Images</Label>
                      <div className="flex gap-2 overflow-x-auto">
                        {viewingProduct.images && viewingProduct.images.length > 0 ? (
                          viewingProduct.images.map((image: any, index: number) => (
                            <div key={index} className="flex-shrink-0">
                              <img
                                src={image.url || image}
                                alt={`Product ${index + 1}`}
                                className="w-20 h-20 object-cover rounded-lg border"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Product Name</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.name}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Product ID</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.id}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Category</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.category}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Sub Category</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.subCategory || (viewingProduct as any).subcategory || "N/A"}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Sale Price</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">₹{viewingProduct.price} / {viewingProduct.unit}</div>
                      </div>
                      {(viewingProduct as any).purchasePrice && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Purchase Price</Label>
                          <div className="p-3 bg-gray-50 rounded-md text-sm">₹{(viewingProduct as any).purchasePrice}</div>
                        </div>
                      )}
                      {(viewingProduct as any).comparePrice && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Compare Price</Label>
                          <div className="p-3 bg-gray-50 rounded-md text-sm">₹{(viewingProduct as any).comparePrice}</div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Stock</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.stock} {viewingProduct.unit}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Min Stock</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.minStock} {viewingProduct.unit}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Max Stock</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.maxStock} {viewingProduct.unit}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Supplier</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.supplier}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.status}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quality</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.quality}</div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">B2C Enabled</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">{viewingProduct.onB2C ? "Yes" : "No"}</div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <div className="p-3 bg-gray-50 rounded-md text-sm min-h-[80px]">{viewingProduct.description || "No description provided"}</div>
                      </div>

                      {/* View Variants Section - Positioned after Description */}
                      {(() => {
                        const productVariants = products.filter(p => (p as any).parentProductId === viewingProduct.id);
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">Product Variants ({productVariants.length})</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowVariants(!showVariants)}
                              >
                                {showVariants ? "Hide Variants" : "View Variants"}
                              </Button>
                            </div>
                            
                            {showVariants && (
                              <div className="bg-gray-50 rounded-lg p-4">
                                {productVariants.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-left p-2">Variant Name</th>
                                          <th className="text-left p-2">Stock</th>
                                          <th className="text-left p-2">Price</th>
                                          <th className="text-left p-2">B2C Qty</th>
                                          <th className="text-left p-2">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {productVariants.map((variant: any, index: number) => (
                                          <tr key={index} className="border-b">
                                            <td className="p-2">{variant.name}</td>
                                            <td className="p-2">{variant.stock} {variant.unit}</td>
                                            <td className="p-2">₹{variant.price}</td>
                                            <td className="p-2">{variant.stock} {variant.unit}</td>
                                            <td className="p-2">
                                              <Badge className={getStatusColor(variant.status)}>
                                                {variant.status.replace('-', ' ')}
                                              </Badge>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                                    <p>No variants found for this product</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Tags */}
                      {viewingProduct.tags && viewingProduct.tags.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Tags</Label>
                          <div className="flex flex-wrap gap-2">
                            {viewingProduct.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        {(viewingProduct as any).expiryDate && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Expiry Date</Label>
                            <div className="p-3 bg-gray-50 rounded-md text-sm">{(viewingProduct as any).expiryDate}</div>
                          </div>
                        )}
                        {(viewingProduct as any).lowStockAlert && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Low Stock Alert</Label>
                            <div className="p-3 bg-gray-50 rounded-md text-sm">{(viewingProduct as any).lowStockAlert}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats (reference-style cards, using existing design tokens) */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4 sm:mb-6">
            <Card className="bg-card border border-card-border hover-scale transition-smooth">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-card-foreground">{products.length}</div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-primary/10">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-card-border hover-scale transition-smooth">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-green-500">{products.filter(p => p.onB2C).length}</div>
                    <p className="text-sm text-muted-foreground">Live on B2C</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-green-500/10">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-card-border hover-scale transition-smooth">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-yellow-500">{products.filter(p => p.status === 'low-stock').length}</div>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-yellow-500/10">
                    <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-card-border hover-scale transition-smooth">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-red-500">{products.filter(p => p.status === 'out-of-stock').length}</div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-red-500/10">
                    <Trash2 className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ProductImageCarousel images={product.images || []} productId={product.id} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                          {product.id}
                        </Badge>
                      </div>
                        {(() => {
                          const { first, second, ellipsis } = splitProductName(product.name);
                          return (
                            <h4 className="font-semibold leading-tight">
                              <span className="block whitespace-nowrap">{first}</span>
                              {second && (
                                <span className="block">{ellipsis ? `${second}...` : second}</span>
                              )}
                            </h4>
                          );
                        })()}
                    </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <Switch
                        checked={product.onB2C}
                        onCheckedChange={() => toggleB2CStatus(product.id, product.onB2C)}
                      />
                      <span className="text-xs text-muted-foreground">B2C</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mb-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">₹{product.price}</span>
                        {(product as any).comparePrice && Number((product as any).comparePrice) > 0 && Number((product as any).comparePrice) > Number(product.price) && (
                          <span className="text-sm text-muted-foreground line-through">₹{(product as any).comparePrice}</span>
                        )}
                      <span className="text-sm text-muted-foreground">/{product.unit}</span>
                      </div>
                      <div className="flex flex-col items-end text-sm text-muted-foreground">
                        <div>{product.category}</div>
                        {(product as any).subcategory && (
                          <div>• {(product as any).subcategory}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(product.status)}>
                        {product.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getQualityColor(product.quality)}>
                        {product.quality}
                      </Badge>
                    </div>

                    <div className="flex text-sm pr-4.5
                    ">
                      <div className="flex-1 whitespace-nowrap">
                        <span className="text-muted-foreground">Stock:</span>
                        <span className={`font-bold ml-1 ${
                          product.stock === 0 ? 'text-red-500' :
                          product.stock <= product.minStock ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {product.stock} {product.unit}
                        </span>
                      </div>
                      <div className="flex-1 text-center whitespace-nowrap">
                        <span className="text-muted-foreground">Min:</span>
                        <span className="font-medium ml-1">{product.minStock}</span>
                      </div>
                      <div className="flex-1 text-right whitespace-nowrap">
                        {(() => {
                          const count = products.filter(p => (p as any).parentProductId === product.id).length;
                          return (
                            <>
                              <span className="text-muted-foreground">Vari:</span>
                              <span className="ml-1">{String(count).padStart(2, '0')}</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span>Supplier: {product.supplier}</span>
                      <br />
                      <span>Updated: {product.lastUpdated}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => viewProduct(product)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => editProduct(product)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats moved above to below search bar */}
      {/* [removed here] */}
    </div>
  );
}