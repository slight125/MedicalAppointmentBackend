# Prescription Creation Logic - Testing Guide

## Overview
This guide explains how to test the enhanced prescription creation logic that enforces:
1. **Doctor Only Access**: Only authenticated doctors can create prescriptions
2. **Completed Appointments Only**: Prescriptions can only be created for appointments with status "Completed"
3. **No Duplicates**: Prevents duplicate prescriptions for the same appointment
4. **Proper Data Handling**: Medicines stored as JSON, proper timestamps, and error handling

## Prerequisites
1. Backend server running on `http://localhost:3000`
2. Database with proper tables (appointments, prescriptions, users, doctors)
3. Test data (at least one appointment with status "Completed")

## Test Scenarios

### 1. Doctor Authentication Test

**Endpoint**: `POST /api/prescriptions`
**Headers**: 
```
Authorization: Bearer <doctor_jwt_token>
Content-Type: application/json
```

**Payload**:
```json
{
  "appointment_id": 1,
  "medicines": [
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "Once daily"
    }
  ],
  "notes": "Take with food"
}
```

**Expected Result**: 
- ✅ Success if valid doctor token
- ❌ 401/403 if no token or invalid token

### 2. Appointment Status Validation

**Prerequisites**: Appointment must have status "Completed"

**Test Cases**:
- **Valid**: Appointment with `appointment_status = "Completed"`
- **Invalid**: Appointment with `appointment_status = "Pending"` or `"Confirmed"`

**Expected Results**:
- ✅ Success for "Completed" appointments
- ❌ 400 error for non-completed appointments

### 3. Duplicate Prevention Test

**Steps**:
1. Create a prescription for appointment_id = 1 (should succeed)
2. Try to create another prescription for the same appointment_id = 1 (should fail)

**Expected Results**:
- First request: ✅ 201 Created
- Second request: ❌ 409 Conflict

### 4. Authorization Test

**Test Cases**:
- Doctor trying to create prescription for their own appointment
- Doctor trying to create prescription for another doctor's appointment

**Expected Results**:
- Own appointment: ✅ Success
- Other doctor's appointment: ❌ 403 Forbidden

## Automated Testing Scripts

### PowerShell Script
```powershell
# Run the PowerShell test script
.\test-prescriptions.ps1
```

### Node.js Script
```bash
# Run the Node.js test script
node test-prescriptions.mjs
```

### Development Endpoints (No Auth Required)

For quick testing without authentication:

#### Create Test Prescription
```bash
curl -X POST http://localhost:3000/api/dev/test-prescription \
  -H "Content-Type: application/json" \
  -d '{
    "appointment_id": 1,
    "doctor_id": 1,
    "medicines": [{"name": "Aspirin", "dosage": "100mg", "frequency": "Once daily"}],
    "notes": "Test prescription"
  }'
```

#### Test Appointment Update
```bash
curl -X POST http://localhost:3000/api/dev/test-appointment-update \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": 1}'
```

## Database Setup for Testing

### Required Test Data

1. **Users Table** (Patient):
```sql
INSERT INTO users (firstname, lastname, email, role) 
VALUES ('John', 'Doe', 'john@example.com', 'user');
```

2. **Doctors Table**:
```sql
INSERT INTO doctors (first_name, last_name, specialization) 
VALUES ('Dr. Smith', 'Johnson', 'General Medicine');
```

3. **Appointments Table** (with "Completed" status):
```sql
INSERT INTO appointments (user_id, doctor_id, appointment_date, time_slot, appointment_status, paid) 
VALUES (1, 1, '2024-01-15', '10:00 AM', 'Completed', true);
```

### Adding the `paid` Column

If the `paid` column doesn't exist, run:
```sql
ALTER TABLE appointments ADD COLUMN paid BOOLEAN DEFAULT FALSE;
UPDATE appointments SET paid = FALSE WHERE paid IS NULL;
CREATE INDEX idx_appointments_paid ON appointments(paid);
```

## Expected API Responses

### Successful Prescription Creation
```json
{
  "message": "Prescription issued successfully"
}
```

### Error Responses

**Unauthorized Access**:
```json
{
  "message": "Unauthorized or appointment not found"
}
```

**Invalid Appointment Status**:
```json
{
  "message": "Prescription can only be created for completed appointments"
}
```

**Duplicate Prescription**:
```json
{
  "message": "Prescription already exists for this appointment"
}
```

## Additional Endpoints for Testing

### View User Prescriptions
```bash
GET /api/prescriptions/user
Authorization: Bearer <user_jwt_token>
```

### View Doctor's Issued Prescriptions
```bash
GET /api/prescriptions/doctor
Authorization: Bearer <doctor_jwt_token>
```

### Get Specific Prescription
```bash
GET /api/prescriptions/:id
Authorization: Bearer <jwt_token>
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**: Ensure `.env` file has correct `DATABASE_URL`
2. **Missing `paid` Column**: Run the migration script
3. **JWT Token Issues**: Use valid tokens or test with dev endpoints
4. **Appointment Status**: Ensure test appointments have status "Completed"

### Debugging Steps

1. Check server logs for detailed error messages
2. Verify database schema matches expected structure
3. Test with development endpoints first (no auth required)
4. Use database queries to verify test data exists

## Schema Verification

Verify your database has the correct schema:

```sql
-- Check appointments table structure
\d appointments;

-- Check prescriptions table structure
\d prescriptions;

-- Verify test data
SELECT * FROM appointments WHERE appointment_status = 'Completed';
SELECT * FROM prescriptions;
```

This testing guide should help you verify that the prescription creation logic is working correctly with all the business rules enforced.
