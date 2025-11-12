/**
 * Product Data Model for DynamoDB
 * 
 * This file defines the complete data structure for products
 * Used in both backend and frontend
 */

export interface Product {
  // Primary Key (Required)
  id: string; // Primary Key: "PRD-001", "PRD-001-V1"

  // Basic Information (Required)
  name: string;
  category: string;
  subcategory: string;
  description: string;
  supplier: string;

  // Pricing (Required)
  price: number; // Selling price
  unit: string; // "kg", "bunch", "dozen", etc.

  // Stock Management (Required)
  stock: number; // Current stock quantity
  minStock: number; // Minimum stock level
  maxStock: number; // Maximum stock level
  status: 'active' | 'low-stock' | 'out-of-stock'; // Calculated from stock

  // Quality & Status (Required)
  quality: 'excellent' | 'very-good' | 'good' | 'fair' | 'poor';

  // Images (Required)
  image: string; // Main product image URL
  images: string[]; // Array of image URLs

  // B2C Status (Required)
  onB2C: boolean; // Available on B2C platform

  // Timestamps (Required)
  lastUpdated: string; // ISO format: "2024-01-15T10:30:00Z"
  createdAt: string; // ISO format: "2024-01-10T08:00:00Z"
  updatedAt: string; // ISO format: "2024-01-15T10:30:00Z"

  // Variant Information (Optional)
  isVariant?: boolean; // Default: false - Is this a variant product?
  parentProductId?: string; // Parent product ID if this is a variant

  // Additional Pricing (Optional)
  purchasePrice?: number; // Cost/purchase price
  salePrice?: number; // Sale price (same as price usually)
  comparePrice?: number; // Original price for comparison

  // B2C Specific (Optional)
  b2cQty?: string; // B2C quantity
  b2cUnit?: string; // B2C unit

  // Stock Alerts (Optional)
  lowStockAlert?: number; // Low stock alert threshold

  // Additional Info (Optional)
  expiryDate?: string; // Expiry date: "2024-02-15"
  tags?: string[]; // Product tags: ["organic", "fresh", "local"]
}

/**
 * Example: Parent Product
 */
export const exampleParentProduct: Product = {
  id: "PRD-001",
  name: "Fresh Tomatoes",
  category: "Root Vegetables",
  subcategory: "Tomatoes",
  description: "Fresh, locally sourced tomatoes",
  supplier: "Green Farm Co.",
  price: 45,
  unit: "kg",
  stock: 450,
  minStock: 50,
  maxStock: 1000,
  status: "active",
  quality: "excellent",
  image: "/images/tomatoes.jpg",
  images: [
    "https://images.unsplash.com/photo-1592924357228-91b4e2a8af0c",
    "https://images.unsplash.com/photo-1546470427-5a3b4b4b4b4b"
  ],
  onB2C: true,
  lastUpdated: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-10T08:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  isVariant: false,
  purchasePrice: 35,
  salePrice: 45,
  comparePrice: 50,
  b2cQty: "1",
  b2cUnit: "kg",
  lowStockAlert: 50,
  expiryDate: "2024-02-15",
  tags: ["organic", "fresh", "local"]
};

/**
 * Example: Variant Product
 */
export const exampleVariantProduct: Product = {
  id: "PRD-001-V1",
  name: "Fresh Tomatoes - Large",
  category: "Root Vegetables",
  subcategory: "Tomatoes",
  description: "Large size fresh tomatoes",
  supplier: "Green Farm Co.",
  price: 50,
  unit: "kg",
  stock: 200,
  minStock: 25,
  maxStock: 500,
  status: "active",
  quality: "excellent",
  image: "/images/tomatoes-large.jpg",
  images: [
    "https://images.unsplash.com/photo-1592924357228-91b4e2a8af0c"
  ],
  onB2C: true,
  lastUpdated: "2024-01-15T10:30:00Z",
  createdAt: "2024-01-10T08:00:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  isVariant: true, // ✅ This is a variant
  parentProductId: "PRD-001", // ✅ Points to parent
  purchasePrice: 40,
  salePrice: 50,
  comparePrice: 55,
  b2cQty: "1",
  b2cUnit: "kg",
  lowStockAlert: 25,
  expiryDate: "2024-02-15",
  tags: ["organic", "fresh", "large"]
};

/**
 * Helper function to check if product is a variant
 */
export function isVariant(product: Product): boolean {
  return product.isVariant === true;
}

/**
 * Helper function to check if product is a parent
 */
export function isParent(product: Product): boolean {
  return !product.isVariant || product.isVariant === false;
}

/**
 * Helper function to calculate status from stock
 */
export function calculateStatus(
  stock: number,
  minStock: number,
  lowStockAlert?: number
): 'active' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) {
    return 'out-of-stock';
  }
  const threshold = lowStockAlert || minStock;
  if (stock <= threshold) {
    return 'low-stock';
  }
  return 'active';
}

