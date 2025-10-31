import { useState } from "react";
import { Plus, Edit, Trash2, Tag, Package, X as CloseIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCategories, Category } from "@/contexts/CategoryContext";

export const ProductCategoryManagement = () => {
  const { toast } = useToast();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", subcategories: [""], color: "green" });

  // Reset form to clean state
  const resetForm = () => {
    setFormData({ name: "", description: "", subcategories: [""], color: "green" });
  };

  const colorOptions = [
    { value: "green", label: "Green", class: "bg-green-500" },
    { value: "orange", label: "Orange", class: "bg-orange-500" },
    { value: "red", label: "Red", class: "bg-red-500" },
    { value: "purple", label: "Purple", class: "bg-purple-500" },
    { value: "blue", label: "Blue", class: "bg-blue-500" },
    { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  ];

  const handleCreateCategory = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    addCategory({
      name: formData.name,
      description: formData.description,
      subcategories: formData.subcategories.filter(sub => sub.trim() !== ""),
      color: formData.color,
    });

    resetForm();
    setIsCreateOpen(false);
    
    toast({
      title: "Success",
      description: "Product category created successfully",
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({ 
      name: category.name, 
      description: category.description || "",
      subcategories: category.subcategories.length > 0 ? category.subcategories : [""],
      color: category.color 
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !formData.name.trim()) return;

    updateCategory(editingCategory.id, {
      name: formData.name,
      description: formData.description,
      subcategories: formData.subcategories.filter(sub => sub.trim() !== ""),
      color: formData.color,
    });

    setEditingCategory(null);
    setFormData({ name: "", description: "", subcategories: [""], color: "green" });
    
    toast({
      title: "Success", 
      description: "Category updated successfully",
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId);
    toast({
      title: "Success",
      description: "Category deleted successfully",
    });
  };

  const toggleCategoryStatus = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      updateCategory(categoryId, { isActive: !category.isActive });
    }
  };

  const getCategoryColorClass = (color: string) => {
    const colorMap = {
      green: "bg-green-500/10 text-green-500 border-green-200",
      orange: "bg-orange-500/10 text-orange-500 border-orange-200", 
      red: "bg-red-500/10 text-red-500 border-red-200",
      purple: "bg-purple-500/10 text-purple-500 border-purple-200",
      blue: "bg-blue-500/10 text-blue-500 border-blue-200",
      yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-200",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-primary" />
                Category Management
              </CardTitle>
              <CardDescription>
                Manage categories and organize your inventory
              </CardDescription>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                  onClick={resetForm}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[540px]">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Add a new product category to organize your inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category Name</label>
                    <Input
                      placeholder="Enter Category Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Input
                      placeholder="Enter category description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  {/* Subcategories */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Sub Category</label>
                      <button
                        className="text-sm text-primary flex items-center gap-1"
                        type="button"
                        onClick={() => setFormData({ ...formData, subcategories: [...formData.subcategories, ""] })}
                      >
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {formData.subcategories.map((sub, i) => (
                      <div key={i} className="mb-2 flex items-center gap-[15px]">
                        <Input
                          placeholder={`Sub Category Name ${i + 1}`}
                          value={sub}
                          className={formData.subcategories.length === 1 ? "w-[450px]" : "flex-1 max-w-[420px]"}
                          onChange={(e) => {
                            const next = [...formData.subcategories];
                            next[i] = e.target.value;
                            setFormData({ ...formData, subcategories: next });
                          }}
                        />
                        {formData.subcategories.length > 1 && (
                          <button
                            type="button"
                            className="h-8 w-8 rounded-md border flex items-center justify-center text-foreground hover:text-destructive"
                            onClick={() => {
                              const next = formData.subcategories.filter((_, idx) => idx !== i);
                              setFormData({ ...formData, subcategories: next });
                            }}
                            aria-label="Remove subcategory"
                          >
                            <CloseIcon className="h-4 w-4 text-foreground" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Removed duplicate Sub Category single input */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Color</label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`w-8 h-8 rounded-full ${color.class} ${
                            formData.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateCategory} className="flex-1">
                      Create Category
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingCategory(category)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${category.color}-500`} />
                      <h3 className="font-semibold">{category.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={category.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <Switch checked={category.isActive} onCheckedChange={() => toggleCategoryStatus(category.id)} />
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getCategoryColorClass(category.color)}>
                      <Package className="h-3 w-3 mr-1" />
                      {String(category.subcategories.length).padStart(2, '0')} Sub Category
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category Name</label>
              <Input
                placeholder="Enter category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                placeholder="Enter category description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            {/* Subcategories */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Sub Category</label>
                <button
                  className="text-sm text-primary flex items-center gap-1"
                  type="button"
                  onClick={() => setFormData({ ...formData, subcategories: [...formData.subcategories, ""] })}
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
              {formData.subcategories.map((sub, i) => (
                <div key={i} className="mb-2 flex items-center gap-[15px]">
                  <Input
                    placeholder={`Sub Category Name ${i + 1}`}
                    value={sub}
                    className={formData.subcategories.length === 1 ? "w-[450px]" : "flex-1 max-w-[420px]"}
                    onChange={(e) => {
                      const next = [...formData.subcategories];
                      next[i] = e.target.value;
                      setFormData({ ...formData, subcategories: next });
                    }}
                  />
                  {formData.subcategories.length > 1 && (
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border flex items-center justify-center text-foreground hover:text-destructive"
                      onClick={() => {
                        const next = formData.subcategories.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, subcategories: next });
                      }}
                      aria-label="Remove subcategory"
                    >
                      <CloseIcon className="h-4 w-4 text-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full ${color.class} ${
                      formData.color === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdateCategory} className="flex-1">
                Update Category
              </Button>
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Category Dialog */}
      <Dialog open={!!viewingCategory} onOpenChange={(open) => !open && setViewingCategory(null)}>
        <DialogContent className="max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
            <DialogDescription>Overview of this category</DialogDescription>
          </DialogHeader>
          {viewingCategory && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category Name</label>
                <div className="p-3 rounded-md border bg-muted/30 text-sm">{viewingCategory.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <div className="p-3 rounded-md border bg-muted/30 text-sm">{viewingCategory.description || "—"}</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Sub Category</label>
                {viewingCategory.subcategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {viewingCategory.subcategories.map((sub, i) => (
                      <Badge key={i} variant="secondary">{sub}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-md border bg-muted/30 text-sm">No sub categories</div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full bg-${viewingCategory.color}-500`} />
                  <span className="text-sm">{viewingCategory.color}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Badge variant={viewingCategory.isActive ? "default" : "secondary"}>{viewingCategory.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};