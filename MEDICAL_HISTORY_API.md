# Medical History API Documentation

## Overview
The Medical History API provides endpoints for users to view their medical history and for doctors/admins to view any user's medical history. This includes appointment history and prescription records.

## Endpoints

### 1. Get Current User's Medical History

**Endpoint**: `GET /api/medical-history/self`

**Authentication**: Required (User role)

**Headers**:
```
Authorization: Bearer <user_jwt_token>
```

**Response**:
```json
{
  "appointments": [
    {
      "appointment_id": 1,
      "appointment_date": "2024-01-15",
      "time_slot": "10:00 AM",
      "appointment_status": "Completed",
      "paid": true,
      "total_amount": "75.00",
      "doctor": {
        "doctor_id": 1,
        "first_name": "Dr. Smith",
        "last_name": "Johnson",
        "specialization": "General Medicine"
      }
    }
  ],
  "prescriptions": [
    {
      "prescription_id": 1,
      "appointment_id": 1,
      "medicines": [
        {
          "name": "Aspirin",
          "dosage": "100mg",
          "frequency": "Once daily"
        }
      ],
      "notes": "Take with food",
      "issued_at": "2024-01-15T14:30:00.000Z",
      "appointment": {
        "appointment_id": 1,
        "appointment_date": "2024-01-15",
        "time_slot": "10:00 AM"
      },
      "doctor": {
        "doctor_id": 1,
        "first_name": "Dr. Smith",
        "last_name": "Johnson"
      }
    }
  ]
}
```

### 2. Get Any User's Medical History (Admin/Doctor)

**Endpoint**: `GET /api/medical-history/:userId`

**Authentication**: Required (Doctor or Admin role)

**Headers**:
```
Authorization: Bearer <doctor_or_admin_jwt_token>
```

**Parameters**:
- `userId` (path parameter): The ID of the user whose medical history to retrieve

**Response**:
```json
{
  "user": {
    "user_id": 1,
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com"
  },
  "appointments": [...],
  "prescriptions": [...]
}
```

## Usage Examples

### User Viewing Their Own History

```bash
curl -X GET http://localhost:3000/api/medical-history/self \
  -H "Authorization: Bearer <user_jwt_token>"
```

### Doctor/Admin Viewing User's History

```bash
curl -X GET http://localhost:3000/api/medical-history/123 \
  -H "Authorization: Bearer <doctor_or_admin_jwt_token>"
```

## Error Responses

### Authentication Required
```json
{
  "message": "User authentication required"
}
```

### User Not Found
```json
{
  "message": "User not found"
}
```

### Insufficient Permissions
```json
{
  "message": "You do not have permission to perform this action"
}
```

### Server Error
```json
{
  "message": "Failed to retrieve medical history"
}
```

## Database Relations

The medical history functionality uses the following database relations:

### Appointments
- Links to users (patients)
- Links to doctors
- Includes appointment details, status, and payment information

### Prescriptions
- Links to appointments
- Links to patients (users)
- Links to doctors who issued the prescription
- Stores medicines as JSON array

## Security Features

1. **Role-Based Access Control**: 
   - Users can only view their own medical history
   - Doctors and admins can view any user's medical history

2. **JWT Authentication**: All endpoints require valid JWT tokens

3. **Data Validation**: User IDs are validated before querying

## Development Testing

### Test Endpoint (No Authentication Required)
```bash
GET /api/dev/test-medical-history/:userId
```

This endpoint allows testing the medical history functionality without authentication.

### Test Script
Run the PowerShell test script:
```powershell
.\test-medical-history.ps1
```

## Implementation Details

### Controller Functions

1. **getSelfMedicalHistory**: Retrieves current user's medical history
2. **getUserMedicalHistory**: Retrieves any user's medical history (admin/doctor only)

### Middleware Chain

```typescript
// User's own history
router.get("/self", verifyToken, allowRoles("user"), getSelfMedicalHistory);

// Admin/Doctor viewing any user's history
router.get("/:userId", verifyToken, allowRoles("doctor", "admin"), getUserMedicalHistory);
```

### Data Processing

- Medicines in prescriptions are stored as JSON strings and parsed for display
- Appointments include doctor information through database relations
- Prescriptions include both appointment and doctor information

This API provides comprehensive medical history access while maintaining proper security and data privacy controls.
