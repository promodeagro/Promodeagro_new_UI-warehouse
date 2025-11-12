# Complete Backend Development Guide for Beginners

## 📚 Table of Contents
1. [What is a Backend?](#what-is-a-backend)
2. [Understanding AWS DynamoDB](#understanding-aws-dynamodb)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Backend Architecture](#backend-architecture)
5. [Building Your First API](#building-your-first-api)
6. [Connecting Frontend to Backend](#connecting-frontend-to-backend)
7. [Learning Resources](#learning-resources)

---

## What is a Backend?

### Frontend vs Backend

**Frontend (What you have now):**
- The React application users see in their browser
- Displays data, handles user interactions
- Currently uses static data (hardcoded in `productData.ts`, `orderData.ts`, etc.)

**Backend (What you need to build):**
- A server that stores and manages data
- Provides APIs (Application Programming Interfaces) for your frontend to communicate with
- Handles business logic (calculations, validations, etc.)
- Connects to databases (like DynamoDB) to store data permanently

### Simple Analogy
Think of it like a restaurant:
- **Frontend** = The menu customers see (what you have now)
- **Backend** = The kitchen that prepares food and manages inventory
- **Database** = The pantry that stores ingredients (DynamoDB)

---

## Understanding AWS DynamoDB

### What is DynamoDB?
DynamoDB is Amazon's **NoSQL database service**. Think of it as a smart filing cabinet in the cloud.

### Key Concepts:

#### 1. **Tables**
- Like Excel sheets or database tables
- Each table stores one type of data
- Example: `Products` table, `Orders` table, `Packers` table

#### 2. **Items**
- Like rows in Excel
- Each item is a record (one product, one order, etc.)

#### 3. **Attributes**
- Like columns in Excel
- Each attribute is a property (name, price, stock, etc.)

#### 4. **Primary Key**
- Unique identifier for each item
- Two types:
  - **Partition Key** (simple): Just one attribute (e.g., `product_id`)
  - **Composite Key**: Partition Key + Sort Key (e.g., `order_id` + `item_id`)

### Example Structure:

```
Products Table:
┌─────────────┬──────────────┬───────┬───────┐
│ product_id  │ name         │ price │ stock │
├─────────────┼──────────────┼───────┼───────┤
│ PRD-001     │ Tomatoes     │ 45    │ 450   │
│ PRD-002     │ Spinach      │ 35    │ 23    │
└─────────────┴──────────────┴───────┴───────┘
```

---

## Step-by-Step Setup

### Step 1: Create AWS Account

1. Go to [https://aws.amazon.com/](https://aws.amazon.com/)
2. Click "Create an AWS Account"
3. Provide email, password, and payment info (you get free tier for 12 months)
4. Verify your email and phone number

### Step 2: Install AWS CLI

AWS CLI (Command Line Interface) lets you interact with AWS from your terminal.

**For Linux:**
```bash
# Download AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

**Configure AWS CLI:**
```bash
aws configure
```
You'll need:
- **AWS Access Key ID**: Get from AWS Console → IAM → Users → Security Credentials
- **AWS Secret Access Key**: Get from same place
- **Default region**: e.g., `us-east-1` or `ap-south-1` (Mumbai)
- **Default output format**: `json`

### Step 3: Create IAM User with DynamoDB Permissions

1. Go to AWS Console → IAM (Identity and Access Management)
2. Click "Users" → "Add users"
3. Create user with programmatic access
4. Attach policy: `AmazonDynamoDBFullAccess` (for learning - restrict later)
5. Save Access Key ID and Secret Access Key

### Step 4: Install Backend Dependencies

You'll need Node.js and a backend framework. Let's use **Express.js** (most popular for beginners).

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install Express (web framework)
npm install express

# Install AWS SDK for DynamoDB
npm install aws-sdk @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# Install CORS (to allow frontend to call backend)
npm install cors

# Install dotenv (for environment variables)
npm install dotenv

# Install development dependencies
npm install --save-dev nodemon typescript @types/node @types/express @types/cors ts-node
```

---

## Backend Architecture

### Recommended Folder Structure:

```
backend/
├── src/
│   ├── config/
│   │   └── dynamodb.ts          # DynamoDB connection setup
│   ├── models/
│   │   ├── Product.ts           # Product data model
│   │   ├── Order.ts             # Order data model
│   │   └── Packer.ts            # Packer data model
│   ├── controllers/
│   │   ├── productController.ts # Product business logic
│   │   ├── orderController.ts   # Order business logic
│   │   └── packerController.ts  # Packer business logic
│   ├── routes/
│   │   ├── productRoutes.ts     # Product API endpoints
│   │   ├── orderRoutes.ts       # Order API endpoints
│   │   └── packerRoutes.ts      # Packer API endpoints
│   └── app.ts                   # Main Express app
├── .env                          # Environment variables (AWS credentials)
├── .gitignore                    # Git ignore file
├── package.json
└── tsconfig.json                 # TypeScript configuration
```

### How It Works:

```
Frontend Request → API Route → Controller → DynamoDB → Response → Frontend
```

**Example:**
1. Frontend: "Get all products" → `GET /api/products`
2. Route: Receives request → calls controller
3. Controller: Fetches from DynamoDB → returns data
4. DynamoDB: Returns products
5. Frontend: Receives products → displays them

---

## Building Your First API

### Step 1: Create DynamoDB Configuration

Create `src/config/dynamodb.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Create DynamoDB Document Client (easier to work with)
export const dynamoDB = DynamoDBDocumentClient.from(client);

// Table names
export const TABLES = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PACKERS: 'packers',
  CUSTOMERS: 'customers',
  INVOICES: 'invoices',
  PURCHASE_ORDERS: 'purchase_orders',
} as const;
```

### Step 2: Create Environment File

Create `.env` in backend root:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
PORT=3001
```

**⚠️ Important:** Add `.env` to `.gitignore` to never commit credentials!

### Step 3: Create Product Model

Create `src/models/Product.ts`:

```typescript
export interface Product {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  status: 'active' | 'low-stock' | 'out-of-stock';
  quality: 'excellent' | 'very-good' | 'good' | 'fair' | 'poor';
  supplier: string;
  description: string;
  image: string;
  lastUpdated: string;
  onB2C: boolean;
  images: string[];
  tags?: string[];
  isVariant?: boolean;
  parentProductId?: string;
  purchasePrice?: number;
  salePrice?: number;
  comparePrice?: number;
  b2cQty?: string;
  b2cUnit?: string;
  lowStockAlert?: number;
  expiryDate?: string;
}
```

### Step 4: Create Product Controller

Create `src/controllers/productController.ts`:

```typescript
import { dynamoDB, TABLES } from '../config/dynamodb';
import { Product } from '../models/Product';
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const result = await dynamoDB.send(
      new ScanCommand({
        TableName: TABLES.PRODUCTS,
      })
    );
    return (result.Items || []) as Product[];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const result = await dynamoDB.send(
      new GetCommand({
        TableName: TABLES.PRODUCTS,
        Key: { id },
      })
    );
    return (result.Item as Product) || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

// Create new product
export const createProduct = async (product: Product): Promise<Product> => {
  try {
    await dynamoDB.send(
      new PutCommand({
        TableName: TABLES.PRODUCTS,
        Item: product,
      })
    );
    return product;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  try {
    // Build update expression
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key as keyof Product];
    });

    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLES.PRODUCTS,
        Key: { id },
        UpdateExpression: `SET ${updateExpression.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );
    return result.Attributes as Product;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await dynamoDB.send(
      new DeleteCommand({
        TableName: TABLES.PRODUCTS,
        Key: { id },
      })
    );
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
```

### Step 5: Create Product Routes

Create `src/routes/productRoutes.ts`:

```typescript
import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';

const router = express.Router();

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
```

### Step 6: Create Main App

Create `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
// Import other routes as you create them
// import orderRoutes from './routes/orderRoutes';
// import packerRoutes from './routes/packerRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow frontend to call this API
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/products', productRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/packers', packerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
});
```

### Step 7: Create TypeScript Config

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Step 8: Update package.json

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  }
}
```

---

## Creating DynamoDB Tables

### Using AWS Console (Easiest for Beginners):

1. Go to AWS Console → DynamoDB
2. Click "Create table"
3. For Products table:
   - **Table name**: `products`
   - **Partition key**: `id` (String)
   - Click "Create table"

4. Repeat for other tables:
   - `orders` (Partition key: `id`)
   - `packers` (Partition key: `id`)
   - `customers` (Partition key: `id`)
   - `invoices` (Partition key: `id`)
   - `purchase_orders` (Partition key: `id`)

### Using AWS CLI (Advanced):

```bash
# Create Products table
aws dynamodb create-table \
  --table-name products \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Connecting Frontend to Backend

### Step 1: Create API Service

Create `src/services/api.ts` in your React app:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

// Product API functions
export const productApi = {
  getAll: () => apiRequest<Product[]>('/products'),
  getById: (id: string) => apiRequest<Product>(`/products/${id}`),
  create: (product: Product) =>
    apiRequest<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  update: (id: string, updates: Partial<Product>) =>
    apiRequest<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    apiRequest<void>(`/products/${id}`, {
      method: 'DELETE',
    }),
};
```

### Step 2: Update React Components

Replace static data with API calls:

```typescript
import { useEffect, useState } from 'react';
import { productApi } from '@/services/api';
import { Product } from '@/data/productData';

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Rest of your component...
}
```

### Step 3: Add Environment Variable

Create `.env` in your React app root:

```env
VITE_API_URL=http://localhost:3001/api
```

---

## Testing Your Backend

### Using curl (Command Line):

```bash
# Health check
curl http://localhost:3001/health

# Get all products
curl http://localhost:3001/api/products

# Create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PRD-001",
    "name": "Test Product",
    "price": 100,
    "stock": 50
  }'
```

### Using Postman (Visual Tool):

1. Download Postman: [https://www.postman.com/downloads/](https://www.postman.com/downloads/)
2. Create requests:
   - GET `http://localhost:3001/api/products`
   - POST `http://localhost:3001/api/products` (with JSON body)
   - etc.

---

## Common Tasks You'll Need

### 1. Query Products by Category

```typescript
// In DynamoDB, you need a Global Secondary Index (GSI) for this
// Create GSI: category-index (Partition key: category)

export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  const result = await dynamoDB.send(
    new QueryCommand({
      TableName: TABLES.PRODUCTS,
      IndexName: 'category-index',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeValues: {
        ':category': category,
      },
    })
  );
  return (result.Items || []) as Product[];
};
```

### 2. Update Stock When Order is Placed

```typescript
export const updateProductStock = async (
  productId: string,
  quantityChange: number
): Promise<void> => {
  await dynamoDB.send(
    new UpdateCommand({
      TableName: TABLES.PRODUCTS,
      Key: { id: productId },
      UpdateExpression: 'SET stock = stock + :change',
      ExpressionAttributeValues: {
        ':change': quantityChange,
      },
    })
  );
};
```

---

## Learning Resources

### YouTube Channels:
1. **Traversy Media** - Node.js & Express tutorials
2. **freeCodeCamp** - Full backend development course
3. **AWS YouTube** - DynamoDB tutorials

### Documentation:
1. **Express.js**: [https://expressjs.com/](https://expressjs.com/)
2. **AWS DynamoDB**: [https://docs.aws.amazon.com/dynamodb/](https://docs.aws.amazon.com/dynamodb/)
3. **AWS SDK v3**: [https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)

### Courses:
1. **Udemy**: "Node.js, Express, MongoDB & More: The Complete Bootcamp"
2. **freeCodeCamp**: "Back End Development and APIs" (free)

---

## Next Steps

1. ✅ Set up AWS account
2. ✅ Create DynamoDB tables
3. ✅ Build basic Products API
4. ⬜ Build Orders API
5. ⬜ Build Packers API
6. ⬜ Add authentication (JWT tokens)
7. ⬜ Add error handling and validation
8. ⬜ Deploy to AWS (EC2 or Lambda)

---

## Quick Start Checklist

- [ ] Create AWS account
- [ ] Install AWS CLI and configure
- [ ] Create IAM user with DynamoDB permissions
- [ ] Create backend folder structure
- [ ] Install Node.js dependencies
- [ ] Create DynamoDB tables
- [ ] Build Products API
- [ ] Test with Postman/curl
- [ ] Connect React frontend
- [ ] Test end-to-end flow

---

## Common Issues & Solutions

### Issue: "Access Denied" when accessing DynamoDB
**Solution**: Check IAM user permissions and AWS credentials

### Issue: "Table not found"
**Solution**: Make sure table name matches exactly (case-sensitive)

### Issue: CORS errors in browser
**Solution**: Make sure `cors()` middleware is added in Express app

### Issue: "Cannot read property of undefined"
**Solution**: Check that data exists in DynamoDB, handle null cases

---

## Need Help?

If you get stuck:
1. Check AWS CloudWatch logs
2. Check browser console for errors
3. Use `console.log()` to debug
4. Check DynamoDB table in AWS Console

Good luck! 🚀

