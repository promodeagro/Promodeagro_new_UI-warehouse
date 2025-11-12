# Product Table Structure - Quick Summary

## 📊 Table Overview

**Table Name**: `products`  
**Primary Key**: `id` (String)  
**Total Columns**: 27 attributes

---

## 🗂️ All Columns in One Table

```
┌─────────────────────┬──────────┬──────────┬─────────────────────────────┐
│ Column Name         │ Type     │ Required │ Description                 │
├─────────────────────┼──────────┼──────────┼─────────────────────────────┤
│ id                  │ String   │ ✅ Yes   │ Primary Key                 │
│ name                │ String   │ ✅ Yes   │ Product name                 │
│ category            │ String   │ ✅ Yes   │ Main category                │
│ subcategory         │ String   │ ✅ Yes   │ Subcategory                 │
│ description         │ String   │ ✅ Yes   │ Product description          │
│ supplier            │ String   │ ✅ Yes   │ Supplier name                │
│ price               │ Number   │ ✅ Yes   │ Selling price               │
│ unit                │ String   │ ✅ Yes   │ Unit (kg, bunch, etc.)      │
│ stock               │ Number   │ ✅ Yes   │ Current stock                │
│ minStock            │ Number   │ ✅ Yes   │ Minimum stock level         │
│ maxStock            │ Number   │ ✅ Yes   │ Maximum stock level          │
│ status              │ String   │ ✅ Yes   │ active/low-stock/out-of-stock│
│ quality             │ String   │ ✅ Yes   │ excellent/very-good/good/etc │
│ image               │ String   │ ✅ Yes   │ Main image URL              │
│ images              │ List     │ ✅ Yes   │ Array of image URLs          │
│ onB2C               │ Boolean  │ ✅ Yes   │ Available on B2C             │
│ lastUpdated         │ String   │ ✅ Yes   │ Last update date             │
│ createdAt           │ String   │ ✅ Yes   │ Creation timestamp           │
│ updatedAt           │ String   │ ✅ Yes   │ Update timestamp             │
├─────────────────────┼──────────┼──────────┼─────────────────────────────┤
│ isVariant           │ Boolean  │ ❌ No    │ Is variant? (default: false) │
│ parentProductId     │ String   │ ❌ No    │ Parent ID (if variant)       │
│ purchasePrice       │ Number   │ ❌ No    │ Cost price                  │
│ salePrice           │ Number   │ ❌ No    │ Sale price                   │
│ comparePrice        │ Number   │ ❌ No    │ Original price               │
│ b2cQty              │ String   │ ❌ No    │ B2C quantity                │
│ b2cUnit             │ String   │ ❌ No    │ B2C unit                     │
│ lowStockAlert       │ Number   │ ❌ No    │ Low stock threshold          │
│ expiryDate          │ String   │ ❌ No    │ Expiry date                  │
│ tags                │ List     │ ❌ No    │ Product tags array           │
└─────────────────────┴──────────┴──────────┴─────────────────────────────┘
```

---

## 🔍 Indexes for Faster Queries

| Index Name           | Partition Key | Use Case                              |
|----------------------|---------------|---------------------------------------|
| `category-index`     | category      | Get all products in a category        |
| `parentProductId-index` | parentProductId | Get all variants of a product      |
| `status-index`       | status        | Get all low-stock products            |
| `supplier-index`     | supplier      | Get all products from a supplier      |

---

## 📝 Example: Parent Product Row

| Column | Value |
|--------|-------|
| id | `PRD-001` |
| name | `Fresh Tomatoes` |
| category | `Root Vegetables` |
| subcategory | `Tomatoes` |
| price | `45` |
| stock | `450` |
| status | `active` |
| isVariant | `false` |
| parentProductId | `null` |

---

## 📝 Example: Variant Product Row

| Column | Value |
|--------|-------|
| id | `PRD-001-V1` |
| name | `Fresh Tomatoes - Large` |
| category | `Root Vegetables` |
| subcategory | `Tomatoes` |
| price | `50` |
| stock | `200` |
| status | `active` |
| **isVariant** | **`true`** |
| **parentProductId** | **`PRD-001`** |

---

## ✅ Summary

- **Number of Tables**: 1 (`products`)
- **Total Columns**: 27
- **Required Columns**: 19
- **Optional Columns**: 8
- **Indexes**: 4 (for faster queries)

---

## 🎯 That's It!

This single table structure handles:
- ✅ Parent products
- ✅ Variant products
- ✅ Querying by category
- ✅ Querying by status
- ✅ Querying by supplier
- ✅ Getting all variants of a product

Simple and efficient! 🚀

