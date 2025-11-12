# Backend Quick Reference Guide

## 📋 Common Operations Cheat Sheet

### 1. DynamoDB Operations

#### Get All Items
```typescript
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const result = await dynamoDB.send(
  new ScanCommand({
    TableName: 'products',
  })
);
const items = result.Items || [];
```

#### Get Item by ID
```typescript
import { GetCommand } from '@aws-sdk/lib-dynamodb';

const result = await dynamoDB.send(
  new GetCommand({
    TableName: 'products',
    Key: { id: 'PRD-001' },
  })
);
const item = result.Item;
```

#### Create/Update Item (Put)
```typescript
import { PutCommand } from '@aws-sdk/lib-dynamodb';

await dynamoDB.send(
  new PutCommand({
    TableName: 'products',
    Item: {
      id: 'PRD-001',
      name: 'Tomatoes',
      price: 45,
      stock: 100,
    },
  })
);
```

#### Update Specific Fields
```typescript
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

await dynamoDB.send(
  new UpdateCommand({
    TableName: 'products',
    Key: { id: 'PRD-001' },
    UpdateExpression: 'SET stock = :stock, price = :price',
    ExpressionAttributeValues: {
      ':stock': 150,
      ':price': 50,
    },
    ReturnValues: 'ALL_NEW',
  })
);
```

#### Delete Item
```typescript
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

await dynamoDB.send(
  new DeleteCommand({
    TableName: 'products',
    Key: { id: 'PRD-001' },
  })
);
```

#### Query by Partition Key (Requires GSI or Sort Key)
```typescript
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

const result = await dynamoDB.send(
  new QueryCommand({
    TableName: 'products',
    IndexName: 'category-index', // Global Secondary Index
    KeyConditionExpression: 'category = :category',
    ExpressionAttributeValues: {
      ':category': 'Vegetables',
    },
  })
);
```

---

### 2. Express.js Routes

#### Basic Route Structure
```typescript
import express from 'express';
const router = express.Router();

// GET route
router.get('/', async (req, res) => {
  try {
    // Your logic here
    res.json({ data: 'result' });
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
});

// POST route
router.post('/', async (req, res) => {
  try {
    const data = req.body; // Get data from request body
    // Your logic here
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
});

// PUT route
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id; // Get ID from URL
    const updates = req.body; // Get updates from request body
    // Your logic here
    res.json({ data: 'updated' });
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
});

// DELETE route
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // Your logic here
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
});

export default router;
```

---

### 3. Common Patterns

#### Error Handling Pattern
```typescript
try {
  // Your operation
  const result = await someOperation();
  res.json(result);
} catch (error: any) {
  console.error('Error:', error);
  
  // Handle specific errors
  if (error.name === 'ResourceNotFoundException') {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  // Generic error
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
}
```

#### Request Validation Pattern
```typescript
router.post('/', async (req, res) => {
  // Validate required fields
  const { name, price, stock } = req.body;
  
  if (!name || !price || !stock) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, price, stock' 
    });
  }
  
  // Validate data types
  if (typeof price !== 'number' || price < 0) {
    return res.status(400).json({ 
      error: 'Price must be a positive number' 
    });
  }
  
  // Continue with operation
  // ...
});
```

#### Pagination Pattern
```typescript
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const lastKey = req.query.lastKey as string | undefined;
  
  const params: any = {
    TableName: 'products',
    Limit: limit,
  };
  
  if (lastKey) {
    params.ExclusiveStartKey = JSON.parse(lastKey);
  }
  
  const result = await dynamoDB.send(new ScanCommand(params));
  
  res.json({
    items: result.Items,
    lastKey: result.LastEvaluatedKey 
      ? JSON.stringify(result.LastEvaluatedKey) 
      : null,
  });
});
```

---

### 4. Frontend API Calls

#### Using Fetch
```typescript
// GET request
const products = await fetch('http://localhost:3001/api/products')
  .then(res => res.json());

// POST request
const newProduct = await fetch('http://localhost:3001/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'PRD-001',
    name: 'Tomatoes',
    price: 45,
  }),
}).then(res => res.json());

// PUT request
const updated = await fetch('http://localhost:3001/api/products/PRD-001', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stock: 150 }),
}).then(res => res.json());

// DELETE request
await fetch('http://localhost:3001/api/products/PRD-001', {
  method: 'DELETE',
});
```

#### Using React Query (Recommended)
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { productApi } from '@/services/api';

// Fetch products
const { data: products, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: () => productApi.getAll(),
});

// Create product
const createMutation = useMutation({
  mutationFn: productApi.create,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});

// Update product
const updateMutation = useMutation({
  mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
    productApi.update(id, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  },
});
```

---

### 5. Common DynamoDB Patterns

#### Increment/Decrement Stock
```typescript
await dynamoDB.send(
  new UpdateCommand({
    TableName: 'products',
    Key: { id: productId },
    UpdateExpression: 'SET stock = stock + :change',
    ExpressionAttributeValues: {
      ':change': -quantity, // Negative to decrease
    },
  })
);
```

#### Check if Item Exists
```typescript
const result = await dynamoDB.send(
  new GetCommand({
    TableName: 'products',
    Key: { id: productId },
  })
);

if (!result.Item) {
  throw new Error('Product not found');
}
```

#### Conditional Update (Only update if exists)
```typescript
await dynamoDB.send(
  new UpdateCommand({
    TableName: 'products',
    Key: { id: productId },
    UpdateExpression: 'SET stock = :stock',
    ConditionExpression: 'attribute_exists(id)',
    ExpressionAttributeValues: {
      ':stock': 100,
    },
  })
);
```

#### Batch Operations
```typescript
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

await dynamoDB.send(
  new BatchWriteCommand({
    RequestItems: {
      products: [
        {
          PutRequest: {
            Item: { id: 'PRD-001', name: 'Tomatoes' },
          },
        },
        {
          PutRequest: {
            Item: { id: 'PRD-002', name: 'Spinach' },
          },
        },
      ],
    },
  })
);
```

---

### 6. Environment Variables

#### Backend (.env)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
PORT=3001
NODE_ENV=development
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

### 7. Common Commands

#### Start Development Server
```bash
npm run dev
```

#### Build for Production
```bash
npm run build
npm start
```

#### Check AWS Configuration
```bash
aws configure list
```

#### List DynamoDB Tables
```bash
aws dynamodb list-tables
```

#### Describe Table
```bash
aws dynamodb describe-table --table-name products
```

---

### 8. Testing with curl

```bash
# GET all products
curl http://localhost:3001/api/products

# GET product by ID
curl http://localhost:3001/api/products/PRD-001

# POST create product
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"id":"PRD-001","name":"Tomatoes","price":45}'

# PUT update product
curl -X PUT http://localhost:3001/api/products/PRD-001 \
  -H "Content-Type: application/json" \
  -d '{"stock":150}'

# DELETE product
curl -X DELETE http://localhost:3001/api/products/PRD-001
```

---

### 9. Common Error Codes

| HTTP Code | Meaning | When to Use |
|-----------|---------|-------------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST requests |
| 204 | No Content | Successful DELETE requests |
| 400 | Bad Request | Invalid input data |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server/database error |

---

### 10. Debugging Tips

#### Backend Logging
```typescript
console.log('Request received:', req.body);
console.log('Query params:', req.query);
console.log('Params:', req.params);
```

#### Check DynamoDB in AWS Console
1. Go to AWS Console → DynamoDB
2. Click on your table
3. Click "Explore table items"
4. View all items

#### Enable AWS SDK Logging
```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: 'us-east-1',
  logger: console, // Enable logging
});
```

---

### 11. Quick Checklist

Before deploying:
- [ ] `.env` file is in `.gitignore`
- [ ] Error handling is in place
- [ ] Input validation is done
- [ ] CORS is configured
- [ ] DynamoDB tables are created
- [ ] AWS credentials are set
- [ ] API endpoints are tested
- [ ] Frontend is connected

---

## 🚀 Quick Start Command Sequence

```bash
# 1. Create backend directory
mkdir backend && cd backend

# 2. Initialize project
npm init -y

# 3. Install dependencies
npm install express cors dotenv @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
npm install --save-dev nodemon typescript @types/node @types/express @types/cors ts-node

# 4. Create .env file with AWS credentials
echo "AWS_REGION=us-east-1" > .env
echo "AWS_ACCESS_KEY_ID=your_key" >> .env
echo "AWS_SECRET_ACCESS_KEY=your_secret" >> .env
echo "PORT=3001" >> .env

# 5. Create DynamoDB table
aws dynamodb create-table \
  --table-name products \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 6. Copy code files from BACKEND_STARTER_TEMPLATE.md

# 7. Start server
npm run dev
```

---

This quick reference should help you while building your backend! 📚

