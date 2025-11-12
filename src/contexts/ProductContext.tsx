import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, products as initialProducts } from '@/data/productData';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  searchProducts: (searchTerm: string, categoryFilter?: string, statusFilter?: string) => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Adapter types for single-row parent with embedded variants array (Dynamo-style)
  type RawVariant = Omit<Product,
    'isVariant' | 'parentProductId' | 'lastUpdated' | 'status' | 'quality' | 'supplier' | 'image'> & {
      id: string;
    };
  type RawParent = Omit<Product,
    'isVariant' | 'parentProductId'> & {
      variants?: RawVariant[];
    };

  const RAW_STORAGE_KEY = 'warehouse-products-raw';

  // Convert raw single-row parents -> flat UI items (parent + variants as separate items)
  const expandFromRaw = (rawParents: RawParent[]): Product[] => {
    const flat: Product[] = [];
    rawParents.forEach((parent) => {
      const { variants = [], ...parentData } = parent;
      flat.push({ ...parentData });
      variants.forEach((v) => {
        flat.push({
          ...v,
          isVariant: true,
          parentProductId: parent.id,
        } as Product);
      });
    });
    return flat;
  };

  // Convert flat UI items -> raw parents with variants array
  const collapseToRaw = (all: Product[]): RawParent[] => {
    const parents = all.filter((p) => !p.isVariant && !p.parentProductId);
    return parents.map((parent) => {
      const variants = all.filter((p) => p.isVariant && p.parentProductId === parent.id)
        .map((v) => {
          const { parentProductId, isVariant, lastUpdated, status, quality, supplier, image, ...rest } = v as any;
          return rest as RawVariant;
        });
      return { ...(parent as any), variants } as RawParent;
    });
  };

  // Load products from localStorage on mount
  useEffect(() => {
    try {
      // Prefer raw (single-row with variants) if available
      const savedRaw = localStorage.getItem(RAW_STORAGE_KEY);
      if (savedRaw) {
        const parsedRaw: RawParent[] = JSON.parse(savedRaw);
        const expanded = expandFromRaw(parsedRaw);
        setProducts(expanded);
        return;
      }
      // Fallback to legacy flat storage
      const savedProducts = localStorage.getItem('warehouse-products');
      if (savedProducts) {
        const parsedProducts: Product[] = JSON.parse(savedProducts);
        setProducts(parsedProducts);
        // Also persist a raw snapshot for forward compatibility
        const rawSnapshot = collapseToRaw(parsedProducts);
        localStorage.setItem(RAW_STORAGE_KEY, JSON.stringify(rawSnapshot));
      }
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('warehouse-products', JSON.stringify(products));
    // Persist raw (single-row with variants) alongside for Dynamo-style storage
    try {
      const raw = collapseToRaw(products);
      localStorage.setItem(RAW_STORAGE_KEY, JSON.stringify(raw));
    } catch (e) {
      console.error('Error saving raw products snapshot:', e);
    }
  }, [products]);

  const addProduct = (productData: Omit<Product, 'id' | 'lastUpdated'>) => {
    const newProduct: Product = {
      ...productData,
      id: `PRD-${String(products.length + 1).padStart(3, '0')}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === id 
          ? { 
              ...product, 
              ...updates, 
              lastUpdated: new Date().toISOString().split('T')[0],
              // Auto-update status based on stock
              status: updates.stock !== undefined ? 
                (updates.stock === 0 ? 'out-of-stock' : 
                 updates.stock <= (product.minStock || 0) ? 'low-stock' : 'active') :
                product.status
            }
          : product
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      // If deleting a parent, also remove its variants
      const toDelete = prev.find(p => p.id === id);
      if (toDelete && !toDelete.isVariant) {
        return prev.filter(p => p.id !== id && p.parentProductId !== id);
      }
      return prev.filter(product => product.id !== id);
    });
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(product => product.category === category);
  };

  const searchProducts = (searchTerm: string, categoryFilter: string = "all", statusFilter: string = "all") => {
    return products.filter(product => {
      const term = searchTerm.trim().toLowerCase();
      const tags = product.tags || [];
      
      const matchesSearch = term === "" ||
        product.name.toLowerCase().includes(term) ||
        product.id.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.subcategory.toLowerCase().includes(term) ||
        (Array.isArray(tags) && tags.some((t: string) => (t || "").toLowerCase().includes(term)));
      
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const value: ProductContextType = {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByCategory,
    searchProducts,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
