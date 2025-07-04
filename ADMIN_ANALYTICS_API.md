# Admin Analytics API Documentation

## Overview
The Admin Analytics API provides comprehensive dashboard analytics and reporting capabilities for administrators to monitor system performance, user engagement, and business metrics.

## Available Endpoints

### 1. Admin Summary Analytics
**Endpoint**: `GET /api/admin/analytics/summary`

**Description**: Provides high-level overview statistics for the admin dashboard.

**Response**:
```json
{
  "totals": {
    "users": 150,
    "doctors": 25,
    "appointments": 1200,
    "payments": 800,
    "revenue": 45000.00
  },
  "recentAppointments": [
    {
      "appointment_id": 123,
      "appointment_date": "2024-01-15",
      "time_slot": "10:00 AM",
      "appointment_status": "Confirmed",
      "patient_full_name": "John Doe",
      "total_amount": "75.00",
      "paid": true
    }
  ]
}
```

### 2. Booking Trends
**Endpoint**: `GET /api/admin/analytics/bookings?range=7`

**Description**: Returns appointment booking trends over a specified time period.

**Query Parameters**:
- `range` (optional): Number of days to look back (default: 7)

**Response**:
```json
[
  {
    "date": "2024-01-15",
    "count": 12
  },
  {
    "date": "2024-01-16",
    "count": 8
  }
]
```

### 3. Top Performing Doctors
**Endpoint**: `GET /api/admin/analytics/top-doctors`

**Description**: Returns the top 5 doctors by number of appointments.

**Response**:
```json
[
  {
    "doctor_id": 1,
    "doctor_name": "Dr. Smith Johnson",
    "appointment_count": 45
  },
  {
    "doctor_id": 2,
    "doctor_name": "Dr. Mary Wilson",
    "appointment_count": 38
  }
]
```

### 4. Revenue Analytics
**Endpoint**: `GET /api/admin/analytics/revenue?range=30`

**Description**: Provides revenue analytics and payment status breakdown.

**Query Parameters**:
- `range` (optional): Number of days to look back (default: 30)

**Response**:
```json
{
  "dailyRevenue": [
    {
      "date": "2024-01-15",
      "revenue": 1250.00
    }
  ],
  "paymentStatus": [
    {
      "status": "paid",
      "count": 150,
      "total_amount": 11250.00
    },
    {
      "status": "pending",
      "count": 25,
      "total_amount": 1875.00
    }
  ]
}
```

### 5. Appointment Status Breakdown
**Endpoint**: `GET /api/admin/analytics/appointment-status`

**Description**: Provides breakdown of appointments by status and payment status.

**Response**:
```json
{
  "statusBreakdown": [
    {
      "status": "Completed",
      "count": 450
    },
    {
      "status": "Confirmed",
      "count": 120
    },
    {
      "status": "Pending",
      "count": 80
    },
    {
      "status": "Cancelled",
      "count": 30
    }
  ],
  "paidBreakdown": [
    {
      "paid_status": "Paid",
      "count": 500
    },
    {
      "paid_status": "Unpaid",
      "count": 180
    }
  ]
}
```

## Authentication & Authorization

**Required**: Admin role with valid JWT token

**Headers**:
```
Authorization: Bearer <admin_jwt_token>
```

## Usage Examples

### Fetch Dashboard Summary
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/admin/analytics/summary
```

### Get Last 14 Days Booking Trends
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:3000/api/admin/analytics/bookings?range=14"
```

### Get Revenue Analytics for Last Month
```bash
curl -H "Authorization: Bearer <admin_token>" \
  "http://localhost:3000/api/admin/analytics/revenue?range=30"
```

### JavaScript/Frontend Integration
```javascript
const fetchAnalytics = async (endpoint, token, params = '') => {
  const response = await fetch(`/api/admin/analytics/${endpoint}${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Usage examples
const summary = await fetchAnalytics('summary', adminToken);
const trends = await fetchAnalytics('bookings', adminToken, '?range=7');
const topDoctors = await fetchAnalytics('top-doctors', adminToken);
const revenue = await fetchAnalytics('revenue', adminToken, '?range=30');
const status = await fetchAnalytics('appointment-status', adminToken);
```

### React Dashboard Component Example
```jsx
const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await fetchAnalytics('summary', token);
      setAnalytics(data);
    };
    loadAnalytics();
  }, []);

  return (
    <div className="dashboard">
      <div className="summary-cards">
        <Card title="Total Users" value={analytics?.totals.users} />
        <Card title="Total Doctors" value={analytics?.totals.doctors} />
        <Card title="Total Appointments" value={analytics?.totals.appointments} />
        <Card title="Total Revenue" value={`$${analytics?.totals.revenue}`} />
      </div>
      
      <BookingTrendsChart endpoint="bookings" />
      <TopDoctorsChart endpoint="top-doctors" />
      <RevenueChart endpoint="revenue" />
    </div>
  );
};
```

## Development Testing

### Test Endpoints (No Authentication Required)
```bash
# Test analytics summary
GET /api/dev/test-analytics-summary

# Test booking trends
GET /api/dev/test-booking-trends
```

### Automated Testing
```powershell
# Run analytics test script
.\test-analytics.ps1
```

## Frontend Chart Recommendations

### 1. Summary Cards
- **Users**: Total registered users
- **Doctors**: Total active doctors
- **Appointments**: Total appointments booked
- **Revenue**: Total revenue generated

### 2. Line Charts
- **Booking Trends**: Daily appointments over time
- **Revenue Trends**: Daily revenue over time

### 3. Bar Charts
- **Top Doctors**: Horizontal bar chart of doctor performance
- **Appointment Status**: Pie or bar chart of status distribution

### 4. Donut/Pie Charts
- **Payment Status**: Paid vs Unpaid breakdown
- **Appointment Status**: Status distribution

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

### Server Errors
```json
{
  "message": "Failed to fetch analytics summary"
}
```

## Performance Considerations

### Query Optimization
- Indexes on `appointment_date`, `created_at` fields
- Efficient SQL aggregations with proper grouping
- Limit recent appointments to reasonable number (5-10)

### Caching Strategy
```javascript
// Consider caching analytics data for 5-15 minutes
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Example Redis caching
const getCachedAnalytics = async (key) => {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
};
```

### Rate Limiting
Consider implementing rate limiting for analytics endpoints to prevent abuse:
```javascript
// Example: 10 requests per minute per admin user
app.use('/api/admin/analytics', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many analytics requests'
}));
```

## Security Features

1. **Admin-Only Access**: `allowRoles("admin")` middleware
2. **JWT Authentication**: `verifyToken` middleware
3. **Data Sanitization**: Safe data handling and SQL injection prevention
4. **Audit Logging**: Log analytics access for security monitoring

## File Structure
```
src/
├── controllers/
│   └── analyticsController.ts      # Analytics business logic
├── routes/
│   └── admin/
│       └── analytics.ts           # Analytics routes
├── routes/dev/
│   └── simple-tests.ts            # Development test endpoints
└── middleware/
    └── authMiddleware.ts          # Authentication & authorization
```

This comprehensive analytics API provides administrators with powerful insights into system performance, user behavior, and business metrics through well-structured, secure endpoints.
