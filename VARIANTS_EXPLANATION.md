# Understanding Product Variants - Detailed Explanation

## 🎯 Key Point: Variants = Separate Rows

**Each variant is stored as a SEPARATE ROW in the same table.**

You don't store multiple variants in one row. Instead:
- **Parent product** = 1 row
- **Each variant** = 1 separate row

---

## 📊 Example: Product with 3 Variants

Let's say you create a product "Fresh Tomatoes" with 3 variants:
- Large (PRD-001-V1)
- Medium (PRD-001-V2)  
- Small (PRD-001-V3)

### How It's Stored in DynamoDB:

```
┌─────────────────────────────────────────────────────────────────┐
│ products table (4 rows total)                                   │
├─────────────────────────────────────────────────────────────────┤
│ Row 1: Parent Product                                           │
│ ├── id: "PRD-001"                                               │
│ ├── name: "Fresh Tomatoes"                                      │
│ ├── isVariant: false                                           │
│ ├── parentProductId: null                                       │
│ ├── price: 45                                                   │
│ └── stock: 450                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Row 2: Variant 1 (Large)                                       │
│ ├── id: "PRD-001-V1"                                            │
│ ├── name: "Fresh Tomatoes - Large"                              │
│ ├── isVariant: true ✅                                          │
│ ├── parentProductId: "PRD-001" ✅                               │
│ ├── price: 50                                                   │
│ └── stock: 200                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Row 3: Variant 2 (Medium)                                      │
│ ├── id: "PRD-001-V2"                                            │
│ ├── name: "Fresh Tomatoes - Medium"                             │
│ ├── isVariant: true ✅                                          │
│ ├── parentProductId: "PRD-001" ✅                               │
│ ├── price: 45                                                   │
│ └── stock: 150                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Row 4: Variant 3 (Small)                                        │
│ ├── id: "PRD-001-V3"                                            │
│ ├── name: "Fresh Tomatoes - Small"                              │
│ ├── isVariant: true ✅                                          │
│ ├── parentProductId: "PRD-001" ✅                               │
│ ├── price: 40                                                   │
│ └── stock: 100                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 How to Identify Parent vs Variant

### Parent Product Row:
```json
{
  "id": "PRD-001",
  "name": "Fresh Tomatoes",
  "isVariant": false,          // ✅ Not a variant
  "parentProductId": null,      // ✅ No parent (it IS the parent)
  "price": 45,
  "stock": 450
}
```

### Variant Product Row:
```json
{
  "id": "PRD-001-V1",
  "name": "Fresh Tomatoes - Large",
  "isVariant": true,           // ✅ This IS a variant
  "parentProductId": "PRD-001", // ✅ Points to parent
  "price": 50,
  "stock": 200
}
```

---

## 💡 How This Works in Practice

### When Creating a Product with Variants:

**Step 1: Create Parent Product**
```javascript
// Create parent product row
{
  id: "PRD-001",
  name: "Fresh Tomatoes",
  isVariant: false,
  parentProductId: null,
  // ... other fields
}
```

**Step 2: Create Each Variant as Separate Row**
```javascript
// Variant 1 - Large
{
  id: "PRD-001-V1",
  name: "Fresh Tomatoes - Large",
  isVariant: true,
  parentProductId: "PRD-001",  // ✅ Links to parent
  price: 50,
  stock: 200
}

// Variant 2 - Medium
{
  id: "PRD-001-V2",
  name: "Fresh Tomatoes - Medium",
  isVariant: true,
  parentProductId: "PRD-001",  // ✅ Same parent
  price: 45,
  stock: 150
}

// Variant 3 - Small
{
  id: "PRD-001-V3",
  name: "Fresh Tomatoes - Small",
  isVariant: true,
  parentProductId: "PRD-001",  // ✅ Same parent
  price: 40,
  stock: 100
}
```

---

## 🔎 How to Query Variants

### Get All Variants of a Parent Product:

Using the `parentProductId-index` GSI:

```typescript
// Query all variants of PRD-001
const variants = await dynamoDB.send(
  new QueryCommand({
    TableName: 'products',
    IndexName: 'parentProductId-index',
    KeyConditionExpression: 'parentProductId = :parentId',
    ExpressionAttributeValues: {
      ':parentId': 'PRD-001'
    }
  })
);

// Result: Returns all 3 variant rows (V1, V2, V3)
```

### Get Only Parent Products (No Variants):

```typescript
// Scan all products, filter where isVariant = false
const parents = await dynamoDB.send(
  new ScanCommand({
    TableName: 'products',
    FilterExpression: 'isVariant = :false',
    ExpressionAttributeValues: {
      ':false': false
    }
  })
);
```

---

## 📝 Complete Example with Real Data

### Scenario: Creating "Tomatoes" with 3 Size Variants

**Input from Frontend:**
```javascript
{
  name: "Fresh Tomatoes",
  category: "Vegetables",
  variants: [
    { name: "Large", price: 50, stock: 200 },
    { name: "Medium", price: 45, stock: 150 },
    { name: "Small", price: 40, stock: 100 }
  ]
}
```

**What Gets Saved to DynamoDB (4 separate rows):**

**Row 1:**
```json
{
  "id": "PRD-001",
  "name": "Fresh Tomatoes",
  "category": "Vegetables",
  "isVariant": false,
  "parentProductId": null,
  "price": 45,
  "stock": 450
}
```

**Row 2:**
```json
{
  "id": "PRD-001-V1",
  "name": "Fresh Tomatoes - Large",
  "category": "Vegetables",
  "isVariant": true,
  "parentProductId": "PRD-001",
  "price": 50,
  "stock": 200
}
```

**Row 3:**
```json
{
  "id": "PRD-001-V2",
  "name": "Fresh Tomatoes - Medium",
  "category": "Vegetables",
  "isVariant": true,
  "parentProductId": "PRD-001",
  "price": 45,
  "stock": 150
}
```

**Row 4:**
```json
{
  "id": "PRD-001-V3",
  "name": "Fresh Tomatoes - Small",
  "category": "Vegetables",
  "isVariant": true,
  "parentProductId": "PRD-001",
  "price": 40,
  "stock": 100
}
```

---

## 🎯 Summary: Your Questions Answered

### Q1: Do variants have separate rows?
**Answer: YES ✅** - Each variant is a **separate row** in the table.

### Q2: How many rows for 1 product with 3 variants?
**Answer: 4 rows total**
- 1 row for parent product
- 3 rows for variants (one per variant)

### Q3: How are they linked?
**Answer:** Via `parentProductId` field
- Parent has `parentProductId: null`
- Each variant has `parentProductId: "PRD-001"` (parent's ID)

### Q4: How to get all variants?
**Answer:** Query using `parentProductId-index` GSI
- Filter by `parentProductId = "PRD-001"`
- Returns all variant rows

---

## 💻 Backend Code Example

### Creating Product with Variants:

```typescript
async function createProductWithVariants(productData: any) {
  const parentId = generateId(); // e.g., "PRD-001"
  
  // 1. Create parent product row
  await createProduct({
    id: parentId,
    name: productData.name,
    isVariant: false,
    parentProductId: null,
    // ... other fields
  });
  
  // 2. Create each variant as separate row
  for (let i = 0; i < productData.variants.length; i++) {
    const variant = productData.variants[i];
    await createProduct({
      id: `${parentId}-V${i + 1}`, // PRD-001-V1, PRD-001-V2, etc.
      name: `${productData.name} - ${variant.name}`,
      isVariant: true,                    // ✅ Mark as variant
      parentProductId: parentId,         // ✅ Link to parent
      price: variant.price,
      stock: variant.stock,
      // ... other fields
    });
  }
}
```

### Getting Variants:

```typescript
async function getProductVariants(parentId: string) {
  // Query all rows where parentProductId = parentId
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: 'products',
      IndexName: 'parentProductId-index',
      KeyConditionExpression: 'parentProductId = :parentId',
      ExpressionAttributeValues: {
        ':parentId': parentId
      }
    })
  );
  
  return result.Items; // Returns all variant rows
}
```

---

## ✅ Visual Summary

```
One Product "Tomatoes" with 3 Variants:

┌─────────────────────────────────────┐
│ 1 Parent Row                        │
│ id: PRD-001                         │
│ isVariant: false                    │
│ parentProductId: null              │
└─────────────────────────────────────┘
           │
           │ (parentProductId links here)
           │
    ┌──────┼──────┬────────┐
    │      │      │        │
┌───▼───┐ ┌▼────┐ ┌▼─────┐ ┌▼─────┐
│V1 Row │ │V2   │ │V3    │ │...   │
│Large  │ │Med  │ │Small │ │      │
│       │ │     │ │      │ │      │
│isV:✅ │ │isV:✅│ │isV:✅│ │isV:✅│
│pID:   │ │pID: │ │pID:  │ │pID:  │
│PRD-001│ │PRD- │ │PRD-  │ │PRD-  │
│       │ │001  │ │001   │ │001   │
└───────┘ └─────┘ └──────┘ └──────┘
```

---

## 🎯 Key Takeaways

1. ✅ **Each variant = Separate row**
2. ✅ **Parent product = Separate row**
3. ✅ **They're linked by `parentProductId`**
4. ✅ **Use GSI `parentProductId-index` to query variants**
5. ✅ **All in the same `products` table**

Hope this clears up the confusion! 🚀

