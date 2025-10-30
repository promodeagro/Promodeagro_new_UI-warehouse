import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  unit: string;
  purchasingPrice: number;
  sellingPrice: number;
  imageUrl: string;
}

interface AddItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItems: (items: Item[]) => void;
  selectedItems?: Set<string>;
}

// Mock items data
const mockItems: Item[] = [
  { id: "1", name: "Tomato", category: "Vegetable", subCategory: "Fresh Vegetables", unit: "kg", purchasingPrice: 35, sellingPrice: 40, imageUrl: "🍅" },
  { id: "2", name: "Carrot", category: "Vegetable", subCategory: "Fresh Vegetables", unit: "kg", purchasingPrice: 42, sellingPrice: 50, imageUrl: "🥕" },
  { id: "3", name: "Ghee", category: "Dairy", subCategory: "Milk Products", unit: "box", purchasingPrice: 450, sellingPrice: 500, imageUrl: "🧈" },
  { id: "4", name: "Butter", category: "Dairy", subCategory: "Milk Products", unit: "box", purchasingPrice: 260, sellingPrice: 300, imageUrl: "🧈" },
  { id: "5", name: "Cucumber", category: "Vegetable", subCategory: "Fresh Vegetables", unit: "kg", purchasingPrice: 24, sellingPrice: 30, imageUrl: "🥒" },
  { id: "6", name: "Lemon", category: "Vegetable", subCategory: "Fresh Vegetables", unit: "kg", purchasingPrice: 70, sellingPrice: 80, imageUrl: "🍋" },
  { id: "7", name: "Green Chilli", category: "Vegetable", subCategory: "Fresh Vegetables", unit: "kg", purchasingPrice: 90, sellingPrice: 100, imageUrl: "🌶️" },
  { id: "8", name: "Watermelon", category: "Fruit", subCategory: "Fresh Fruits", unit: "kg", purchasingPrice: 32, sellingPrice: 40, imageUrl: "🍉" },
  { id: "9", name: "Apple", category: "Fruit", subCategory: "Fresh Fruits", unit: "pcs", purchasingPrice: 120, sellingPrice: 150, imageUrl: "🍎" },
];

const categories = ["All", "Vegetable", "Dairy", "Fruit"];
const subCategories: Record<string, string[]> = {
  Vegetable: ["All", "Fresh Vegetables"],
  Dairy: ["All", "Milk Products"],
  Fruit: ["All", "Fresh Fruits"],
};

export default function AddItemsDialog({ open, onOpenChange, onAddItems, selectedItems: initialSelectedItems }: AddItemsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(initialSelectedItems || new Set());

  // Update selectedItems when initialSelectedItems prop changes
  useEffect(() => {
    if (initialSelectedItems) {
      setSelectedItems(initialSelectedItems);
    }
  }, [initialSelectedItems]);

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSubCategory = selectedSubCategory === "All" || item.subCategory === selectedSubCategory;
    return matchesSearch && matchesCategory && matchesSubCategory;
  });

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDone = () => {
    const items = mockItems.filter((item) => selectedItems.has(item.id));
    onAddItems(items);
    setSelectedItems(new Set());
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden z-50">
        <DialogHeader>
          <DialogTitle>Add Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedSubCategory("All");
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSubCategory}
              onValueChange={setSelectedSubCategory}
              disabled={selectedCategory === "All"}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sub Category" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory !== "All" &&
                  subCategories[selectedCategory]?.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>
                      {subCat}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden bg-background">
            <div className="max-h-[350px] overflow-y-auto">
              <table className="w-full bg-background">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="w-12 p-3"></th>
                    <th className="text-left p-3 font-medium">Item Name</th>
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Sub Category</th>
                    <th className="text-left p-3 font-medium">Unit</th>
                    <th className="text-left p-3 font-medium">Purchasing Price</th>
                    <th className="text-left p-3 font-medium">Selling Price</th>
                  </tr>
                </thead>
                <tbody className="bg-background">
                  {filteredItems.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-t hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleItem(item.id)}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedItems.has(item.id)}
                          onCheckedChange={() => toggleItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.imageUrl}</span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3">{item.subCategory}</td>
                      <td className="p-3">{item.unit}</td>
                      <td className="p-3">₹{item.purchasingPrice}</td>
                      <td className="p-3">₹{item.sellingPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDone} disabled={selectedItems.size === 0}>
            Done ({selectedItems.size} items selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}