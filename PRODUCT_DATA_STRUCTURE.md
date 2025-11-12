# Product Data Structure for DynamoDB

## 📊 Overview

This document defines the **data structure** (tables and columns) for products in your warehouse management system.

---

## 🎯 Recommended Approach: Single Products Table

**For DynamoDB, I recommend using ONE table** for all products (both parent products and variants). This is simpler and more efficient for DynamoDB.

---

## 📋 Table 1: `products`

### Primary Key
- **Partition Key**: `id` (String)
  - Example: `"PRD-001"`, `"PRD-001-V1"`

### All Columns (Attributes)

| Column Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| **id** | String | ✅ Yes | Unique product ID (Primary Key) | `"PRD-001"` |
| **name** | String | ✅ Yes | Product name | `"Fresh Tomatoes"` |
| **category** | String | ✅ Yes | Main category | `"Root Vegetables"` |
| **subcategory** | String | ✅ Yes | Subcategory | `"Tomatoes"` |
| **description** | String | ✅ Yes | Product description | `"Fresh, locally sourced tomatoes"` |
| **supplier** | String | ✅ Yes | Supplier name | `"Green Farm Co."` |
| **price** | Number | ✅ Yes | Selling price | `45` |
| **unit** | String | ✅ Yes | Unit of measurement | `"kg"` |
| **stock** | Number | ✅ Yes | Current stock quantity | `450` |
| **minStock** | Number | ✅ Yes | Minimum stock level | `50` |
| **maxStock** | Number | ✅ Yes | Maximum stock level | `1000` |
| **status** | String | ✅ Yes | Stock status | `"active"` or `"low-stock"` or `"out-of-stock"` |
| **quality** | String | ✅ Yes | Quality rating | `"excellent"` or `"very-good"` or `"good"` or `"fair"` or `"poor"` |
| **image** | String | ✅ Yes | Main product image URL | `"/images/tomatoes.jpg"` |
| **images** | List<String> | ✅ Yes | Array of image URLs | `["url1", "url2", "url3"]` |
| **onB2C** | Boolean | ✅ Yes | Available on B2C platform | `true` or `false` |
| **lastUpdated** | String | ✅ Yes | Last update date (ISO format) | `"2024-01-15T10:30:00Z"` |
| **isVariant** | Boolean | ❌ No | Is this a variant? | `true` or `false` (default: `false`) |
| **parentProductId** | String | ❌ No | Parent product ID (if variant) | `"PRD-001"` |
| **purchasePrice** | Number | ❌ No | Purchase/cost price | `35` |
| **salePrice** | Number | ❌ No | Sale price (same as price) | `45` |
| **comparePrice** | Number | ❌ No | Original price for comparison | `50` |
| **b2cQty** | String | ❌ No | B2C quantity | `"1"` |
| **b2cUnit** | String | ❌ No | B2C unit | `"kg"` |
| **lowStockAlert** | Number | ❌ No | Low stock alert threshold | `50` |
| **expiryDate** | String | ❌ No | Expiry date | `"2024-02-15"` |
| **tags** | List<String> | ❌ No | Product tags | `["organic", "fresh", "local"]` |
| **createdAt** | String | ✅ Yes | Creation timestamp | `"2024-01-10T08:00:00Z"` |
| **updatedAt** | String | ✅ Yes | Last update timestamp | `"2024-01-15T10:30:00Z"` |

---

## 🔍 Global Secondary Indexes (GSIs)

**What are GSIs?** They let you query by different attributes, not just the primary key.

### GSI 1: `category-index`
**Purpose**: Query products by category

| Attribute | Type | Key Type |
|-----------|------|----------|
| **category** | String | Partition Key |

**Use Case**: Get all products in "Root Vegetables" category

### GSI 2: `parentProductId-index`
**Purpose**: Query all variants of a parent product

| Attribute | Type | Key Type |
|-----------|------|----------|
| **parentProductId** | String | Partition Key |

**Use Case**: Get all variants of product "PRD-001"

### GSI 3: `status-index`
**Purpose**: Query products by status (active, low-stock, out-of-stock)

| Attribute | Type | Key Type |
|-----------|------|----------|
| **status** | String | Partition Key |

**Use Case**: Get all "low-stock" products

### GSI 4: `supplier-index`
**Purpose**: Query products by supplier

| Attribute | Type | Key Type |
|-----------|------|----------|
| **supplier** | String | Partition Key |

**Use Case**: Get all products from "Green Farm Co."

---

## 📝 Example Data

### Example 1: Parent Product

```json
{
  "id": "PRD-001",
  "name": "Fresh Tomatoes",
  "category": "Root Vegetables",
  "subcategory": "Tomatoes",
  "description": "Fresh, locally sourced tomatoes",
  "supplier": "Green Farm Co.",
  "price": 45,
  "unit": "kg",
  "stock": 450,
  "minStock": 50,
  "maxStock": 1000,
  "status": "active",
  "quality": "excellent",
  "image": "/images/tomatoes.jpg",
  "images": [
    "https://images.unsplash.com/photo-1592924357228-91b4e2a8af0c",
    "https://images.unsplash.com/photo-1546470427-5a3b4b4b4b4b"
  ],
  "onB2C": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "isVariant": false,
  "purchasePrice": 35,
  "salePrice": 45,
  "comparePrice": 50,
  "b2cQty": "1",
  "b2cUnit": "kg",
  "lowStockAlert": 50,
  "expiryDate": "2024-02-15",
  "tags": ["organic", "fresh", "local"],
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Example 2: Variant Product

```json
{
  "id": "PRD-001-V1",
  "name": "Fresh Tomatoes - Large",
  "category": "Root Vegetables",
  "subcategory": "Tomatoes",
  "description": "Large size fresh tomatoes",
  "supplier": "Green Farm Co.",
  "price": 50,
  "unit": "kg",
  "stock": 200,
  "minStock": 25,
  "maxStock": 500,
  "status": "active",
  "quality": "excellent",
  "image": "/images/tomatoes-large.jpg",
  "images": [
    "https://images.unsplash.com/photo-1592924357228-91b4e2a8af0c"
  ],
  "onB2C": true,
  "lastUpdated": "2024-01-15T10:30:00Z",
  "isVariant": true,
  "parentProductId": "PRD-001",
  "purchasePrice": 40,
  "salePrice": 50,
  "comparePrice": 55,
  "b2cQty": "1",
  "b2cUnit": "kg",
  "lowStockAlert": 25,
  "expiryDate": "2024-02-15",
  "tags": ["organic", "fresh", "large"],
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## 🗄️ How to Create This Table in DynamoDB

### Option 1: Using AWS Console (Easiest)

1. Go to AWS Console → DynamoDB
2. Click "Create table"
3. Fill in:
   - **Table name**: `products`
   - **Partition key**: `id` (String)
   - Click "Create table"

4. After table is created, go to "Indexes" tab
5. Click "Create index" for each GSI:
   - **GSI 1**: Name: `category-index`, Partition key: `category` (String)
   - **GSI 2**: Name: `parentProductId-index`, Partition key: `parentProductId` (String)
   - **GSI 3**: Name: `status-index`, Partition key: `status` (String)
   - **GSI 4**: Name: `supplier-index`, Partition key: `supplier` (String)

### Option 2: Using AWS CLI

```bash
# Create main table
aws dynamodb create-table \
  --table-name products \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=category,AttributeType=S \
    AttributeName=parentProductId,AttributeType=S \
    AttributeName=status,AttributeType=S \
    AttributeName=supplier,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --global-secondary-indexes \
    'IndexName=category-index,KeySchema=[{AttributeName=category,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    'IndexName=parentProductId-index,KeySchema=[{AttributeName=parentProductId,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    'IndexName=status-index,KeySchema=[{AttributeName=status,KeyType=HASH}],Projection={ProjectionType=ALL}' \
    'IndexName=supplier-index,KeySchema=[{AttributeName=supplier,KeyType=HASH}],Projection={ProjectionType=ALL}' \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## 📊 Data Structure Summary

### Table Count: **1 Table**
- ✅ `products` (stores all products and variants)

### Total Columns: **27 Attributes**
- **Required**: 13 columns
- **Optional**: 14 columns

### Indexes: **4 Global Secondary Indexes**
- `category-index` - Query by category
- `parentProductId-index` - Query variants by parent
- `status-index` - Query by status
- `supplier-index` - Query by supplier

---

## 🔄 Alternative Structure (If Needed Later)

If you later need to separate categories or suppliers into their own tables (if they have detailed metadata), you can add:

### Table 2: `categories` (Optional - Only if categories have metadata)
- Partition Key: `id` (String)
- Columns: `id`, `name`, `description`, `image`, `createdAt`

### Table 3: `suppliers` (Optional - Only if suppliers have detailed info)
- Partition Key: `id` (String)
- Columns: `id`, `name`, `contact`, `address`, `createdAt`

**But for now, start with just the `products` table!** You can add these later if needed.

---

## ✅ Quick Reference

### Required Columns (Must Have)
1. `id` - Primary key
2. `name`
3. `category`
4. `subcategory`
5. `description`
6. `supplier`
7. `price`
8. `unit`
9. `stock`
10. `minStock`
11. `maxStock`
12. `status`
13. `quality`
14. `image`
15. `images`
16. `onB2C`
17. `lastUpdated`
18. `createdAt`
19. `updatedAt`

### Optional Columns (Can be empty/null)
1. `isVariant` - Default: `false`
2. `parentProductId` - Only if variant
3. `purchasePrice`
4. `salePrice`
5. `comparePrice`
6. `b2cQty`
7. `b2cUnit`
8. `lowStockAlert`
9. `expiryDate`
10. `tags`

---

## 🎯 Next Steps

1. ✅ Create the `products` table in DynamoDB
2. ✅ Create the 4 Global Secondary Indexes
3. ✅ Test inserting sample data
4. ✅ Query products by category
5. ✅ Query variants by parentProductId

This structure will handle all your product needs! 🚀

