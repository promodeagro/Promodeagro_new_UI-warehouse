# Backend Starter Template - Quick Setup

This document provides ready-to-use code templates to get your backend running quickly.

## Step 1: Create Backend Directory Structure

Run these commands in your terminal:

```bash
cd /opt/mycode/shiv/1.0/Promodeagro_new_UI-warehouse
mkdir backend
cd backend
mkdir -p src/{config,models,controllers,routes}
```

## Step 2: Initialize Project

```bash
npm init -y
npm install express cors dotenv
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install --save-dev nodemon typescript @types/node @types/express @types/cors ts-node
```

## Step 3: Copy These Files

### File 1: `package.json`

```json
{
  "name": "promodeagro-backend",
  "version": "1.0.0",
  "description": "Backend API for Promodeagro Warehouse Management",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "keywords": ["warehouse", "api", "dynamodb"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.0.0",
    "@aws-sdk/lib-dynamodb": "^3.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.0",
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "nodemon": "^3.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

### File 2: `tsconfig.json`

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
  "exclude": ["node_modules", "dist"]
}
```

### File 3: `.env` (Create this file and add your AWS credentials)

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
PORT=3001
```

### File 4: `.gitignore`

```
node_modules/
dist/
.env
*.log
.DS_Store
```

### File 5: `src/config/dynamodb.ts`

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

// Create DynamoDB Document Client
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

### File 6: `src/models/Product.ts`

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

### File 7: `src/controllers/productController.ts`

```typescript
import { dynamoDB, TABLES } from '../config/dynamodb';
import { Product } from '../models/Product';
import {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

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
export const updateProduct = async (
  id: string,
  updates: Partial<Product>
): Promise<Product> => {
  try {
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

### File 8: `src/routes/productRoutes.ts`

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
    console.error('Error in GET /api/products:', error);
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
    console.error('Error in GET /api/products/:id:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const product = await updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    console.error('Error in PUT /api/products/:id:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    await deleteProduct(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /api/products/:id:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
```

### File 9: `src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow frontend to call this API
app.use(express.json()); // Parse JSON request bodies

// Routes
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
});
```

## Step 4: Create DynamoDB Table

### Using AWS Console (Recommended for beginners):

1. Go to [AWS Console](https://console.aws.amazon.com/dynamodb/)
2. Click "Create table"
3. Fill in:
   - **Table name**: `products`
   - **Partition key**: `id` (String)
   - **Settings**: Use default settings
4. Click "Create table"

### Using AWS CLI:

```bash
aws dynamodb create-table \
  --table-name products \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

## Step 5: Run Your Backend

```bash
# Development mode (auto-restarts on changes)
npm run dev

# Production mode
npm run build
npm start
```

## Step 6: Test Your API

### Using curl:

```bash
# Health check
curl http://localhost:3001/health

# Get all products
curl http://localhost:3001/api/products

# Create a product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "id": "PRD-001",
    "name": "Fresh Tomatoes",
    "category": "Vegetables",
    "subcategory": "Tomatoes",
    "price": 45,
    "unit": "kg",
    "stock": 450,
    "minStock": 50,
    "maxStock": 1000,
    "status": "active",
    "quality": "excellent",
    "supplier": "Green Farm Co.",
    "description": "Fresh tomatoes",
    "image": "/images/tomatoes.jpg",
    "lastUpdated": "2024-01-15",
    "onB2C": true,
    "images": []
  }'
```

### Using Postman:

1. Download [Postman](https://www.postman.com/downloads/)
2. Create a new request
3. Set method to `GET`
4. Enter URL: `http://localhost:3001/api/products`
5. Click "Send"

## Step 7: Connect Frontend

### Create `src/services/api.ts` in your React app:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
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

### Add to `.env` in React app:

```env
VITE_API_URL=http://localhost:3001/api
```

## Troubleshooting

### Error: "Cannot find module"
**Solution**: Run `npm install` in the backend directory

### Error: "Access Denied" to DynamoDB
**Solution**: 
1. Check `.env` file has correct AWS credentials
2. Verify IAM user has DynamoDB permissions
3. Check AWS region matches

### Error: "Table not found"
**Solution**: Make sure you created the `products` table in DynamoDB

### CORS Error in Browser
**Solution**: Make sure `cors()` middleware is in `src/app.ts`

## Next Steps

1. ✅ Set up backend structure
2. ✅ Create Products API
3. ⬜ Create Orders API
4. ⬜ Create Packers API
5. ⬜ Add authentication
6. ⬜ Add validation

Good luck! 🚀

