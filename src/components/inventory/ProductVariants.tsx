import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Search, Filter, Edit, Trash2, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories } from "@/contexts/CategoryContext";
import { useProducts } from "@/contexts/ProductContext";
import { useToast } from "@/hooks/use-toast";

export function ProductVariants() {
  const navigate = useNavigate();
  const { categories: contextCategories, getSubcategoriesByCategoryId } = useCategories();
  const { products, updateProduct } = useProducts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [b2cStatusFilter, setB2cStatusFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Helper function to get product status
  const getProductStatus = (stock: number, lowStockAlert: number): string => {
    if (stock === 0) return "out-of-stock";
    if (stock <= lowStockAlert) return "low-stock";
    return "in-stock";
  };

  // Helper function to get B2C status
  const getB2CStatus = (onB2C: boolean): string => {
    return onB2C ? "active" : "inactive";
  };

  // Helper function to get product status color
  const getProductStatusColor = (status: string): string => {
    switch (status) {
      case "in-stock":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "low-stock":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "out-of-stock":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  // Helper function to get B2C status color
  const getB2CStatusColor = (status: string): string => {
    return status === "active" 
      ? "bg-green-500/10 text-green-500 border-green-500/20" 
      : "bg-gray-500/10 text-gray-500 border-gray-500/20";
  };

  // Get all products and variants for the table
  const getAllProductsAndVariants = () => {
    const result: any[] = [];
    
    products.forEach(product => {
      // Add parent product
      const stockMode = (product as any).stockMode || "variant";
      if (!(product as any).isVariant && !(product as any).parentProductId) {
        result.push({
          ...product,
          isParent: true,
          stockMode,
        });
      }
      
      // Add variants
      if ((product as any).parentProductId || (product as any).isVariant) {
        const parentProduct = products.find(p => p.id === (product as any).parentProductId);
        result.push({
          ...product,
          isParent: false,
          parentProduct,
          stockMode: (parentProduct as any)?.stockMode || "variant",
        });
      }
    });
    
    return result;
  };

  // Filter products and variants
  const filteredItems = getAllProductsAndVariants().filter(item => {
    const term = searchTerm.trim().toLowerCase();
    const tags = (item as any).tags || [];
    const matchesSearch = term === "" ||
      item.name.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term) ||
      (Array.isArray(tags) && tags.some((t: string) => (t || "").toLowerCase().includes(term)));
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesSubCategory = subCategoryFilter === "all" || 
      item.subCategory === subCategoryFilter || 
      (item as any).subcategory === subCategoryFilter;
    const matchesB2CStatus = b2cStatusFilter === "all" || 
      (b2cStatusFilter === "active" && item.onB2C) ||
      (b2cStatusFilter === "inactive" && !item.onB2C);
    
    // Status filter
    const itemStock = item.stock || 0;
    const itemLowStockAlert = (item as any).lowStockAlert || item.minStock || 0;
    const itemStatus = getProductStatus(itemStock, itemLowStockAlert);
    
    // If item is a variant and stock mode is "parent", use parent's status
    let statusToCheck = itemStatus;
    if (!item.isParent && item.stockMode === "parent" && item.parentProduct) {
      const parentStock = item.parentProduct.stock || 0;
      const parentLowStockAlert = (item.parentProduct as any).lowStockAlert || item.parentProduct.minStock || 0;
      statusToCheck = getProductStatus(parentStock, parentLowStockAlert);
    }
    
    const matchesStatus = statusFilter === "all" || statusToCheck === statusFilter;
    
    return matchesSearch && matchesCategory && matchesSubCategory && matchesB2CStatus && matchesStatus;
  });

  // Calculate stats (using all items, not just filtered)
  const allItems = getAllProductsAndVariants();
  const totalVariants = products.filter(p => (p as any).isVariant || (p as any).parentProductId).length;
  const activeInB2C = allItems.filter(item => item.onB2C).length;
  const lowStockCount = allItems.filter(item => {
    const stock = item.stock || 0;
    const lowStockAlert = (item as any).lowStockAlert || item.minStock || 0;
    return stock > 0 && stock <= lowStockAlert;
  }).length;
  const outOfStockCount = allItems.filter(item => item.stock === 0).length;

  // Handle bulk actions
  const handleBulkAction = (action: "active" | "inactive") => {
    if (selectedVariants.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one variant to update.",
        variant: "destructive",
      });
      return;
    }

    selectedVariants.forEach(variantId => {
      const variant = products.find(p => p.id === variantId);
      if (variant) {
        updateProduct(variantId, {
          ...variant,
          onB2C: action === "active",
        });
      }
    });

    toast({
      title: "Status updated",
      description: `${selectedVariants.size} variant(s) have been ${action === "active" ? "activated" : "deactivated"}.`,
    });

    setSelectedVariants(new Set());
  };

  // Toggle variant B2C status
  const toggleVariantB2C = (variantId: string, currentStatus: boolean) => {
    const variant = products.find(p => p.id === variantId);
    if (variant) {
      // Only update the specific variant/product by its exact ID
      const updatedProduct = {
        ...variant,
        onB2C: !currentStatus,
      };
      updateProduct(variantId, updatedProduct);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Product Variants
              </CardTitle>
              <CardDescription>
                Manage all product variants and their details
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/inventory/products")}
            >
              View Products
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value);
              setSubCategoryFilter("all");
            }}>
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
            {categoryFilter !== "all" && (
              <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Sub Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub Categories</SelectItem>
                  {(() => {
                    const selectedCategory = contextCategories.find(c => c.name === categoryFilter);
                    const subCategories = selectedCategory ? getSubcategoriesByCategoryId(selectedCategory.id) : [];
                    return subCategories.map((subCat) => (
                      <SelectItem key={subCat.id} value={subCat.name}>{subCat.name}</SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            )}
            <Select value={b2cStatusFilter} onValueChange={setB2cStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="B2C Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All B2C Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Overview Cards */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-6">
            <Card className="bg-card border border-card-border hover-scale transition-smooth">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-card-foreground">{totalVariants}</div>
                    <p className="text-sm text-muted-foreground">Total Variants</p>
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
                    <div className="text-3xl md:text-4xl font-bold text-green-500">{activeInB2C}</div>
                    <p className="text-sm text-muted-foreground">Active in B2C</p>
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
                    <div className="text-3xl md:text-4xl font-bold text-yellow-500">{lowStockCount}</div>
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
                    <div className="text-3xl md:text-4xl font-bold text-red-500">{outOfStockCount}</div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center bg-red-500/10">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          {selectedVariants.size > 0 && (
            <div className="flex items-center justify-end gap-2 mb-4">
              <Button
                className="bg-gradient-primary hover:bg-gradient-primary/90"
                size="sm"
                onClick={() => handleBulkAction("active")}
              >
                Make Active ({selectedVariants.size})
              </Button>
              <Button
                className="bg-gradient-primary hover:bg-gradient-primary/90"
                size="sm"
                onClick={() => handleBulkAction("inactive")}
              >
                Make Inactive ({selectedVariants.size})
              </Button>
            </div>
          )}

          {/* Table */}
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 px-4">
                        <Checkbox
                          checked={filteredItems.length > 0 && selectedVariants.size === filteredItems.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVariants(new Set(filteredItems.map(item => item.id)));
                            } else {
                              // Deselect all filtered items
                              const filteredIds = new Set(filteredItems.map(item => item.id));
                              setSelectedVariants(prev => {
                                const newSet = new Set(prev);
                                filteredIds.forEach(id => newSet.delete(id));
                                return newSet;
                              });
                            }
                          }}
                          className="rounded-none"
                        />
                      </TableHead>
                      <TableHead className="min-w-[120px] px-4">Product ID</TableHead>
                      <TableHead className="min-w-[150px] px-4">Product Name</TableHead>
                      <TableHead className="min-w-[140px] px-4">Sell Unit in B2C</TableHead>
                      <TableHead className="min-w-[130px] px-4">Category</TableHead>
                      <TableHead className="min-w-[130px] px-4">Sub Category</TableHead>
                      <TableHead className="min-w-[120px] px-4">Status</TableHead>
                      <TableHead className="min-w-[140px] px-4">Purchasing Price</TableHead>
                      <TableHead className="min-w-[120px] px-4">Selling Price</TableHead>
                      <TableHead className="min-w-[130px] px-4">Compare Price</TableHead>
                      <TableHead className="min-w-[110px] px-4">Stock Mode</TableHead>
                      <TableHead className="min-w-[130px] px-4">Stock Quantity</TableHead>
                      <TableHead className="min-w-[120px] px-4">Low Stock Alert</TableHead>
                      <TableHead className="min-w-[130px] px-4">Expiry Date</TableHead>
                      <TableHead className="min-w-[150px] px-4">B2C Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                          No variants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => {
                        const isParent = item.isParent;
                        const stockMode = item.stockMode || "variant";
                        const isParentStockMode = stockMode === "parent";
                        
                        // Determine stock quantity, low stock alert, expiry date
                        let stockQuantity: string | number = "-";
                        let lowStockAlert: string | number = "-";
                        let expiryDate = "-";
                        
                        if (isParent || !isParentStockMode) {
                          // For parent products or variant mode, show actual values
                          stockQuantity = item.stock || 0;
                          lowStockAlert = (item as any).lowStockAlert || item.minStock || 0;
                          expiryDate = (item as any).expiryDate || "-";
                        } else {
                          // For variants in parent mode, show hyphen
                          stockQuantity = "-";
                          lowStockAlert = "-";
                          expiryDate = "-";
                        }
                        
                        // Determine status
                        let itemStatus: string;
                        if (isParent || !isParentStockMode) {
                          const itemStock = item.stock || 0;
                          const itemLowStockAlert = (item as any).lowStockAlert || item.minStock || 0;
                          itemStatus = getProductStatus(itemStock, itemLowStockAlert);
                        } else {
                          // Use parent's status for variants in parent mode
                          const parentStock = item.parentProduct?.stock || 0;
                          const parentLowStockAlert = (item.parentProduct as any)?.lowStockAlert || item.parentProduct?.minStock || 0;
                          itemStatus = getProductStatus(parentStock, parentLowStockAlert);
                        }
                        
                        const b2cStatus = getB2CStatus(item.onB2C || false);
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="px-4">
                              <Checkbox
                                checked={selectedVariants.has(item.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedVariants);
                                  if (checked) {
                                    newSelected.add(item.id);
                                  } else {
                                    newSelected.delete(item.id);
                                  }
                                  setSelectedVariants(newSelected);
                                }}
                                className="rounded-none"
                              />
                            </TableCell>
                            <TableCell className="px-4">{item.id}</TableCell>
                            <TableCell className="px-4 font-medium">{item.name}</TableCell>
                            <TableCell className="px-4">
                              {(item as any).b2cQty || 0} {(item as any).b2cUnit || item.unit || ""}
                            </TableCell>
                            <TableCell className="px-4">{item.category}</TableCell>
                            <TableCell className="px-4">{item.subCategory || (item as any).subcategory || "N/A"}</TableCell>
                            <TableCell className="px-4">
                              <Badge className={getProductStatusColor(itemStatus)}>
                                {itemStatus.replace('-', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4">₹{(item as any).purchasePrice || "0.00"}</TableCell>
                            <TableCell className="px-4">₹{item.price || (item as any).salePrice || "0.00"}</TableCell>
                            <TableCell className="px-4">₹{(item as any).comparePrice || "0.00"}</TableCell>
                            <TableCell className="px-4">{stockMode}</TableCell>
                            <TableCell className="px-4">
                              {typeof stockQuantity === "number" ? `${stockQuantity} ${item.unit || ""}` : stockQuantity}
                            </TableCell>
                            <TableCell className="px-4">{lowStockAlert}</TableCell>
                            <TableCell className="px-4">{expiryDate}</TableCell>
                            <TableCell className="px-4">
                              <div className="flex items-center gap-2">
                                <Badge className={getB2CStatusColor(b2cStatus)}>
                                  {b2cStatus}
                                </Badge>
                                <Switch
                                  checked={item.onB2C || false}
                                  onCheckedChange={(checked) => {
                                    // Stop event propagation to prevent affecting other toggles
                                    const variant = products.find(p => p.id === item.id);
                                    if (variant) {
                                      updateProduct(item.id, {
                                        ...variant,
                                        onB2C: checked,
                                      });
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onPointerDown={(e) => e.stopPropagation()}
                                  size="sm"
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

