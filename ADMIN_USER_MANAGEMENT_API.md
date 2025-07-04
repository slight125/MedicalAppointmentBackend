# Admin User Management API Documentation

## Overview
Complete CRUD operations for user management in the admin panel.

## Base URL
```
/api/admin/users
```

## Authentication
All endpoints require:
- Valid JWT token in Authorization header
- Admin role permissions

## Endpoints

### 1. Get All Users
**GET** `/api/admin/users`

**Description:** Retrieve all users in the system

**Response:**
```json
{
  "success": true,
  "message": "Users displayed successfully",
  "data": [
    {
      "user_id": 1,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "role": "user",
      "contact_phone": "+1-555-0123",
      "address": "123 Main St",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z"
    }
  ],
  "count": 1
}
```

### 2. Search Users
**GET** `/api/admin/users/search?query=searchTerm`

**Description:** Search users by firstname, lastname, or email

**Query Parameters:**
- `query` (required): Search term to match against firstname, lastname, or email

**Response:**
```json
{
  "success": true,
  "message": "Found 2 users matching \"john\"",
  "data": [
    {
      "user_id": 1,
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "role": "user",
      "contact_phone": "+1-555-0123",
      "created_at": "2025-01-01T10:00:00Z"
    },
    {
      "user_id": 5,
      "firstname": "Johnny",
      "lastname": "Smith",
      "email": "johnny.smith@example.com",
      "role": "doctor",
      "contact_phone": "+1-555-0456",
      "created_at": "2025-01-02T10:00:00Z"
    }
  ],
  "count": 2
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Please provide a valid search query"
}
```

### 3. Get User by ID
**GET** `/api/admin/users/:id`

**Description:** Retrieve a specific user by their ID

**Parameters:**
- `id` (path parameter): User ID

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user_id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "role": "user",
    "contact_phone": "+1-555-0123",
    "address": "123 Main St",
    "created_at": "2025-01-01T10:00:00Z",
    "updated_at": "2025-01-01T10:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

### 4. Update User
**PATCH** `/api/admin/users/:id`

**Description:** Update user information (partial updates supported)

**Parameters:**
- `id` (path parameter): User ID

**Request Body:** (All fields optional)
```json
{
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "role": "doctor",
  "contact_phone": "+1-555-0123",
  "address": "123 Updated Street"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully"
}
```

### 5. Delete User
**DELETE** `/api/admin/users/:id`

**Description:** Permanently delete a user

**Parameters:**
- `id` (path parameter): User ID

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**⚠️ Warning:** This action is irreversible!

## 🎯 Complete Admin User Management System

### Available Endpoints:
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/search` - Search users by name or email ⭐ **NEW**  
- `GET /api/admin/users/:id` - Get user by ID
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Search Functionality:
The search endpoint supports:
- **Firstname matching**: Case-insensitive partial matching
- **Lastname matching**: Case-insensitive partial matching  
- **Email matching**: Case-insensitive partial matching
- **Combined results**: Returns users matching any of the above criteria
- **Ordered results**: Results are ordered by firstname, then lastname

### Example Search Queries:
- `/api/admin/users/search?query=john` - Finds "John", "Johnny", "johnson@email.com"
- `/api/admin/users/search?query=@gmail` - Finds all Gmail users
- `/api/admin/users/search?query=smith` - Finds "Smith", "Smithson", "john.smith@email.com"

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "message": "Access token missing or invalid"
}
```

**403 Forbidden:**
```json
{
  "message": "You do not have permission to perform this action"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error retrieving/updating/deleting user",
  "error": "Detailed error message"
}
```

## Usage Examples

### cURL Examples

**Get All Users:**
```bash
curl -X GET "http://localhost:3000/api/admin/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Search Users:**
```bash
curl -X GET "http://localhost:3000/api/admin/users/search?query=john" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get User by ID:**
```bash
curl -X GET "http://localhost:3000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update User:**
```bash
curl -X PATCH "http://localhost:3000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstname": "Jane", "contact_phone": "+1-555-9999"}'
```

**Delete User:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/users/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Notes

1. All endpoints require admin authentication
2. User passwords are not returned in any response
3. Email updates should trigger validation
4. Role changes require careful consideration
5. User deletion cascades may be needed for related data

## Database Schema Reference

The endpoints work with the following user fields:
- `user_id` (Primary Key)
- `firstname`
- `lastname`
- `email` (Unique)
- `role` (user/doctor/admin)
- `contact_phone`
- `address`
- `created_at`
- `updated_at`
