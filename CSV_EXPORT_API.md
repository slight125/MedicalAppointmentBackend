# CSV Export Functionality Documentation

## Overview
The CSV Export functionality allows administrators to export appointment data as CSV files for reporting and analysis purposes.

## Endpoint

### Export Appointments as CSV

**Endpoint**: `GET /api/admin/reports/appointments.csv`

**Authentication**: Required (Admin role only)

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
```

**Response Headers**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="appointments_report.csv"
```

**CSV Columns**:
- `AppointmentID`: Unique appointment identifier
- `Patient`: Patient's full name
- `Doctor`: Doctor's full name
- `Date`: Appointment date
- `Time`: Appointment time slot
- `Status`: Appointment status (Pending, Confirmed, Completed, Cancelled)
- `Paid`: Payment status (Yes/No)
- `Amount`: Appointment cost
- `CreatedAt`: When the appointment was created

## Usage Examples

### Using cURL
```bash
curl -X GET http://localhost:3000/api/admin/reports/appointments.csv \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -o appointments_report.csv
```

### Using PowerShell
```powershell
$headers = @{
    "Authorization" = "Bearer <admin_jwt_token>"
}
Invoke-WebRequest -Uri "http://localhost:3000/api/admin/reports/appointments.csv" -Headers $headers -OutFile "appointments_report.csv"
```

### Using JavaScript/Fetch
```javascript
fetch('/api/admin/reports/appointments.csv', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
})
.then(response => response.blob())
.then(blob => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'appointments_report.csv';
  a.click();
});
```

## Sample CSV Output
```csv
AppointmentID,Patient,Doctor,Date,Time,Status,Paid,Amount,CreatedAt
1,"John Doe","Dr. Smith Johnson","2024-01-15","10:00 AM","Completed","Yes","75.00","2024-01-10T09:00:00.000Z"
2,"Jane Smith","Dr. Mary Wilson","2024-01-16","2:00 PM","Pending","No","50.00","2024-01-11T14:30:00.000Z"
```

## Implementation Details

### Dependencies
- `json2csv`: For CSV generation
- `@types/json2csv`: TypeScript types

### Installation
```bash
pnpm add json2csv
pnpm add -D @types/json2csv
```

### Route Implementation
```typescript
import { Parser } from "json2csv";

router.get("/appointments.csv", verifyToken, allowRoles("admin"), async (req, res): Promise<void> => {
  try {
    // Fetch data with relations
    const data = await db.query.appointments.findMany({
      with: {
        user: true,
        doctor: true
      }
    });

    // Format data for CSV
    const formatted = data.map((appt) => ({
      AppointmentID: appt.appointment_id,
      Patient: appt.user ? `${appt.user.firstname} ${appt.user.lastname}` : "N/A",
      Doctor: appt.doctor ? `${appt.doctor.first_name} ${appt.doctor.last_name}` : "N/A",
      // ... other fields
    }));

    // Generate CSV
    const parser = new Parser();
    const csv = parser.parse(formatted);

    // Set response headers
    res.header("Content-Type", "text/csv");
    res.attachment("appointments_report.csv");
    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to generate appointments CSV" });
  }
});
```

## Security Features

1. **Admin Only Access**: Only users with admin role can access the endpoint
2. **JWT Authentication**: Valid JWT token required
3. **Data Sanitization**: User and doctor names are safely handled for CSV format

## Error Handling

### Authentication Required
```json
{
  "message": "Access token missing or invalid"
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
  "message": "Failed to generate appointments CSV"
}
```

## Development Testing

### Test Endpoint (No Authentication)
```bash
GET /api/dev/test-csv-export
```

This endpoint returns JSON data that would be converted to CSV, useful for testing data formatting.

### Test Script
```powershell
.\test-csv-export.ps1
```

## File Structure
```
src/
├── routes/
│   └── admin/
│       └── reports.ts          # CSV export routes
├── middleware/
│   └── authMiddleware.ts       # Authentication & authorization
└── index.ts                    # Route registration
```

## Future Enhancements

### Possible Extensions
1. **Date Range Filtering**: Add query parameters for date ranges
2. **Additional Formats**: Support for Excel, PDF exports
3. **Scheduled Reports**: Automated email reports
4. **Custom Fields**: Allow admins to select which fields to export

### Query Parameters (Future)
```bash
GET /api/admin/reports/appointments.csv?start_date=2024-01-01&end_date=2024-01-31&status=Completed
```

### Additional Endpoints (Future)
- `GET /api/admin/reports/prescriptions.csv` - Export prescriptions
- `GET /api/admin/reports/payments.csv` - Export payment records
- `GET /api/admin/reports/users.csv` - Export user data

## Production Considerations

1. **Performance**: For large datasets, consider pagination or streaming
2. **Memory Usage**: Large CSV files may consume significant memory
3. **Access Logs**: Log CSV export activities for audit purposes
4. **Rate Limiting**: Consider rate limiting for export endpoints

This CSV export functionality provides administrators with powerful reporting capabilities while maintaining security and data integrity.
