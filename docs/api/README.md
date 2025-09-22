# AI-BOS ERP API Documentation

## Overview

The AI-BOS ERP Backend for Frontend (BFF) provides a comprehensive REST API for enterprise resource planning operations. Built with NestJS and TypeScript, it offers type-safe endpoints with comprehensive authentication, authorization, and data management capabilities.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.aibos-erp.com`

## Authentication

All API endpoints (except health checks) require authentication using JWT tokens.

### Authentication Flow

1. **Register** or **Login** to receive a JWT token
2. **Include token** in the `Authorization` header: `Bearer <token>`
3. **Token expires** after 24 hours (configurable)

### Headers

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
Accept: application/json
```

---

## API Endpoints

### Health Check

#### GET /health

Check the health status of the API and its dependencies.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "kong": "healthy"
  }
}
```

**Status Codes:**

- `200 OK`: All services healthy
- `503 Service Unavailable`: One or more services unhealthy

---

### Authentication

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant-123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "tenant-123",
    "roles": ["user"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Status Codes:**

- `201 Created`: User registered successfully
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Email already exists
- `422 Unprocessable Entity`: Validation errors

#### POST /auth/login

Authenticate a user and receive a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "tenantId": "tenant-123",
    "roles": ["user"],
    "lastLoginAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Status Codes:**

- `200 OK`: Login successful
- `401 Unauthorized`: Invalid credentials
- `400 Bad Request`: Invalid input data

#### GET /auth/profile

Get the current user's profile information.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant-123",
  "roles": ["user"],
  "permissions": ["read:users", "write:users", "read:reports"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**

- `200 OK`: Profile retrieved successfully
- `401 Unauthorized`: Invalid or expired token

---

### User Management

#### GET /users

Get a list of users (admin only).

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search term for name or email
- `role` (optional): Filter by role
- `tenantId` (optional): Filter by tenant

**Response:**

```json
{
  "users": [
    {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "tenantId": "tenant-123",
      "roles": ["user"],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

**Status Codes:**

- `200 OK`: Users retrieved successfully
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions

#### POST /users

Create a new user (admin only).

**Headers:**

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "tenantId": "tenant-123",
  "roles": ["user"]
}
```

**Response:**

```json
{
  "id": "user-456",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "tenantId": "tenant-123",
  "roles": ["user"],
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**

- `201 Created`: User created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Email already exists

#### GET /users/:id

Get a specific user by ID.

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "tenantId": "tenant-123",
  "roles": ["user"],
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "lastLoginAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**

- `200 OK`: User retrieved successfully
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### PUT /users/:id

Update a user (admin or self).

**Headers:**

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "roles": ["user", "admin"]
}
```

**Response:**

```json
{
  "id": "user-123",
  "email": "user@example.com",
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "tenantId": "tenant-123",
  "roles": ["user", "admin"],
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Status Codes:**

- `200 OK`: User updated successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

#### DELETE /users/:id

Delete a user (admin only).

**Headers:**

```http
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "message": "User deleted successfully",
  "deletedAt": "2024-01-15T11:00:00Z"
}
```

**Status Codes:**

- `200 OK`: User deleted successfully
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ],
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req-123"
  }
}
```

### Common Error Codes

| Code               | HTTP Status | Description              |
| ------------------ | ----------- | ------------------------ |
| `VALIDATION_ERROR` | 400         | Input validation failed  |
| `UNAUTHORIZED`     | 401         | Authentication required  |
| `FORBIDDEN`        | 403         | Insufficient permissions |
| `NOT_FOUND`        | 404         | Resource not found       |
| `CONFLICT`         | 409         | Resource already exists  |
| `RATE_LIMITED`     | 429         | Too many requests        |
| `INTERNAL_ERROR`   | 500         | Internal server error    |

---

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **User management endpoints**: 100 requests per minute per user
- **Health check endpoints**: 1000 requests per minute per IP

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

---

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination metadata is included in responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Webhooks

The API supports webhooks for real-time notifications:

### Available Events

- `user.created`: User account created
- `user.updated`: User profile updated
- `user.deleted`: User account deleted
- `auth.login`: User logged in
- `auth.logout`: User logged out

### Webhook Payload

```json
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "tenantId": "tenant-123"
  }
}
```

---

## SDKs and Examples

### JavaScript/TypeScript

```typescript
import { AibosERPClient } from '@aibos/erp-sdk';

const client = new AibosERPClient({
  baseUrl: 'http://localhost:3001',
  apiKey: 'your-api-key',
});

// Login
const auth = await client.auth.login({
  email: 'user@example.com',
  password: 'password',
});

// Get users
const users = await client.users.list({
  page: 1,
  limit: 10,
});
```

### cURL Examples

```bash
# Health check
curl -X GET http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get profile
curl -X GET http://localhost:3001/auth/profile \
  -H "Authorization: Bearer <token>"
```

---

## Changelog

### Version 1.0.0 (2024-01-15)

- Initial API release
- Authentication and user management
- Health check endpoints
- Comprehensive error handling
- Rate limiting and pagination

---

## Support

For API support and questions:

- **Documentation**: This API documentation
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Team**: Contact the development team directly
