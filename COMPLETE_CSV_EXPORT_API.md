# Complete CSV Export API Documentation

## Overview
The CSV Export API provides comprehensive reporting functionality for administrators to export various data types as CSV files for analysis and record-keeping.

## Available Endpoints

### 1. Export Appointments as CSV
**Endpoint**: `GET /api/admin/reports/appointments.csv`

**CSV Columns**:
- `AppointmentID`, `Patient`, `Doctor`, `Date`, `Time`, `Status`, `Paid`, `Amount`, `CreatedAt`

### 2. Export Payments as CSV
**Endpoint**: `GET /api/admin/reports/payments.csv`

**CSV Columns**:
- `PaymentID`, `AppointmentID`, `Amount`, `Status`, `TransactionID`, `PaymentDate`, `Created`

### 3. Export Prescriptions as CSV
**Endpoint**: `GET /api/admin/reports/prescriptions.csv`

**CSV Columns**:
- `PrescriptionID`, `Patient`, `Doctor`, `IssuedAt`, `Medicines`, `Notes`, `AppointmentID`

### 4. Export Users as CSV
**Endpoint**: `GET /api/admin/reports/users.csv`

**CSV Columns**:
- `UserID`, `Name`, `Email`, `Role`, `Phone`, `Address`, `Created`

### 5. Export Complaints as CSV
**Endpoint**: `GET /api/admin/reports/complaints.csv`

**CSV Columns**:
- `TicketID`, `Subject`, `Description`, `Status`, `User`, `UserEmail`, `AppointmentID`, `Created`, `Updated`

## Authentication & Authorization

**Required**: Admin role with valid JWT token

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: text/csv
Content-Disposition: attachment; filename="<report_name>.csv"
```

## Usage Examples

### Download All Reports
```bash
# Appointments
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/appointments.csv -o appointments.csv

# Payments
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/payments.csv -o payments.csv

# Prescriptions
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/prescriptions.csv -o prescriptions.csv

# Users
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/users.csv -o users.csv

# Complaints
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/complaints.csv -o complaints.csv
```

### PowerShell Download
```powershell
$headers = @{ "Authorization" = "Bearer <admin_token>" }

# Download all reports
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/appointments.csv" -Headers $headers -OutFile "appointments.csv"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/payments.csv" -Headers $headers -OutFile "payments.csv"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/prescriptions.csv" -Headers $headers -OutFile "prescriptions.csv"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/users.csv" -Headers $headers -OutFile "users.csv"
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/complaints.csv" -Headers $headers -OutFile "complaints.csv"
```

### JavaScript/Frontend Integration
```javascript
const downloadCSV = async (reportType, token) => {
  const response = await fetch(`/api/admin/reports/${reportType}.csv`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};

// Usage
downloadCSV('appointments', adminToken);
downloadCSV('payments', adminToken);
downloadCSV('prescriptions', adminToken);
downloadCSV('users', adminToken);
downloadCSV('complaints', adminToken);
```

## Sample CSV Outputs

### Appointments CSV
```csv
AppointmentID,Patient,Doctor,Date,Time,Status,Paid,Amount,CreatedAt
1,"John Doe","Dr. Smith Johnson","2024-01-15","10:00 AM","Completed","Yes","75.00","2024-01-10T09:00:00.000Z"
2,"Jane Smith","Dr. Mary Wilson","2024-01-16","2:00 PM","Pending","No","50.00","2024-01-11T14:30:00.000Z"
```

### Payments CSV
```csv
PaymentID,AppointmentID,Amount,Status,TransactionID,PaymentDate,Created
1,1,"75.00","paid","stripe_12345","2024-01-15","2024-01-15T14:30:00.000Z"
2,2,"50.00","pending","stripe_67890","2024-01-16","2024-01-16T16:45:00.000Z"
```

### Prescriptions CSV
```csv
PrescriptionID,Patient,Doctor,IssuedAt,Medicines,Notes,AppointmentID
1,"John Doe","Dr. Smith Johnson","2024-01-15T15:00:00.000Z","Aspirin 100mg, Vitamin D 1000 IU","Take with food",1
2,"Jane Smith","Dr. Mary Wilson","2024-01-16T17:30:00.000Z","Ibuprofen 200mg","Take as needed for pain",2
```

## Development Testing

### Test Endpoints (No Authentication Required)
```bash
# Test data formatting for each report type
GET /api/dev/test-csv-export           # Appointments test
GET /api/dev/test-payments-csv         # Payments test  
GET /api/dev/test-prescriptions-csv    # Prescriptions test
GET /api/dev/test-users-csv            # Users test
GET /api/dev/test-complaints-csv       # Complaints test
```

### Automated Testing
```powershell
# Run comprehensive test script
.\test-all-csv-exports.ps1
```

## Implementation Details

### Route Structure
```typescript
// src/routes/admin/reports.ts
router.get("/appointments.csv", verifyToken, allowRoles("admin"), exportAppointments);
router.get("/payments.csv", verifyToken, allowRoles("admin"), exportPayments);
router.get("/prescriptions.csv", verifyToken, allowRoles("admin"), exportPrescriptions);
```

### Data Processing
- **Appointments**: Joins with users and doctors tables
- **Payments**: Includes transaction details and status
- **Prescriptions**: Parses JSON medicines data for readable format

### Error Handling
All endpoints include comprehensive error handling:
```json
{
  "message": "Failed to generate [report_type] CSV"
}
```

## Security Features

1. **Admin-Only Access**: `allowRoles("admin")` middleware
2. **JWT Authentication**: `verifyToken` middleware
3. **Data Sanitization**: Safe handling of user data in CSV format
4. **Audit Trail**: Server-side logging of export activities

## Performance Considerations

### For Large Datasets
- Consider implementing pagination for very large datasets
- Monitor memory usage during CSV generation
- Implement rate limiting for export endpoints

### Optimization Tips
```typescript
// For large datasets, consider streaming
const stream = new Transform({
  transform(chunk, encoding, callback) {
    // Process data in chunks
    callback(null, chunk);
  }
});
```

## Monitoring & Analytics

### Recommended Logging
```typescript
console.log(`CSV Export: ${reportType} by admin ${userId} at ${new Date()}`);
```

### Metrics to Track
- Export frequency by report type
- Average export time
- File sizes generated
- Error rates

## Future Enhancements

### Planned Features
1. **Date Range Filtering**: Query parameters for date ranges
2. **Custom Field Selection**: Choose which columns to export
3. **Scheduled Exports**: Automated daily/weekly reports via email
4. **Multiple Formats**: Excel (XLSX), PDF support

### Query Parameters (Future)
```bash
# Filter by date range
GET /api/admin/reports/appointments.csv?start_date=2024-01-01&end_date=2024-01-31

# Filter by status
GET /api/admin/reports/appointments.csv?status=Completed

# Combine filters
GET /api/admin/reports/payments.csv?status=paid&start_date=2024-01-01
```

## File Structure
```
src/
├── routes/
│   └── admin/
│       └── reports.ts              # All CSV export routes
├── routes/dev/
│   └── simple-tests.ts            # Development test endpoints
├── middleware/
│   └── authMiddleware.ts          # Authentication & authorization
└── index.ts                       # Route registration
```

This comprehensive CSV export system provides administrators with powerful reporting capabilities across all major data types while maintaining security, performance, and extensibility.
