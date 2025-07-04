# Prescription PDF Download API

## Overview
This document describes the prescription PDF download functionality that allows users and doctors to download prescription documents as PDF files.

## Endpoints

### 1. Download Prescription PDF
**Endpoint:** `GET /api/prescriptions/:id/pdf`  
**Authentication:** Required (JWT Token)  
**Authorization:** Patient (own prescriptions), Doctor (issued prescriptions), Admin (all)

#### Description
Downloads a prescription as a formatted PDF document. The PDF includes patient information, doctor details, prescribed medicines, and doctor's notes.

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### URL Parameters
- `id` (number, required): The prescription ID

#### Response
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="prescription_{id}.pdf"`
- Returns the PDF file as binary data

#### Success Response (200)
- PDF file download with proper headers

#### Error Responses
```json
// 401 Unauthorized
{
  "message": "Authentication required"
}

// 403 Forbidden
{
  "message": "Unauthorized to download this prescription"
}

// 404 Not Found
{
  "message": "Prescription not found"
}

// 500 Internal Server Error
{
  "message": "Failed to generate prescription PDF"
}
```

### 2. Test PDF Generation (Development Only)
**Endpoint:** `GET /api/dev/test-prescription-pdf/:id`  
**Authentication:** Not required (development endpoint)

#### Description
Test endpoint for prescription PDF generation without authentication. Used for development and testing purposes.

#### URL Parameters
- `id` (number, required): The prescription ID

#### Response
Same as the main PDF download endpoint but without authentication checks.

## PDF Document Format

The generated PDF includes:

1. **Header**
   - Document title: "📋 Medical Prescription"
   - Horizontal separator line

2. **Patient Information**
   - Patient full name

3. **Doctor Information**
   - Doctor full name (prefixed with "Dr.")

4. **Prescription Details**
   - Appointment ID
   - Date issued (formatted)

5. **Prescribed Medicines**
   - Numbered list of medicines
   - Supports both string arrays and complex medicine objects
   - Handles JSON parsing of medicine data

6. **Doctor's Notes**
   - Additional notes from the doctor (if provided)

7. **Footer**
   - Validation text
   - Generation timestamp

## Access Control

### Patient Access
- Can download PDFs for their own prescriptions only
- Identified by matching `patient_id` with authenticated user ID

### Doctor Access
- Can download PDFs for prescriptions they have issued
- Identified by matching `doctor_id` with authenticated user ID

### Admin Access
- Can download PDFs for any prescription
- Full administrative access

## Medicine Data Handling

The system handles various medicine data formats:

1. **String Array**: Simple list of medicine names
2. **Object Array**: Complex objects with name, dosage, frequency
3. **Mixed Format**: Automatic conversion to readable strings
4. **Fallback**: Raw string if parsing fails

Example medicine formats supported:
```json
// Simple strings
["Aspirin", "Ibuprofen"]

// Complex objects
[
  {
    "name": "Aspirin",
    "dosage": "100mg",
    "frequency": "Once daily"
  }
]
```

## Testing

### Manual Testing Steps

1. **Create a test prescription:**
   ```bash
   POST /api/dev/test-prescription
   {
     "appointment_id": 1,
     "doctor_id": 1,
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

2. **Test PDF generation (no auth):**
   ```bash
   GET /api/dev/test-prescription-pdf/1
   ```

3. **Test authenticated PDF download:**
   ```bash
   GET /api/prescriptions/1/pdf
   Headers: Authorization: Bearer <jwt_token>
   ```

### PowerShell Test Script
Use the provided `test-prescription-pdf.ps1` script to test the functionality:

```powershell
.\test-prescription-pdf.ps1
```

## Dependencies

- **pdfkit**: For PDF generation
- **@types/pdfkit**: TypeScript definitions
- **drizzle-orm**: Database queries
- **express**: Web framework

## Error Handling

The system includes comprehensive error handling for:
- Missing or invalid prescription IDs
- Authorization failures
- Database connection issues
- PDF generation errors
- Medicine data parsing errors

## Security Considerations

1. **Authentication Required**: All production endpoints require valid JWT tokens
2. **Authorization Checks**: Users can only access their own prescriptions
3. **Data Validation**: Input validation and sanitization
4. **Error Messages**: No sensitive data exposure in error responses

## File Structure

```
src/
├── controllers/
│   └── prescriptionController.ts     # PDF download logic
├── routes/
│   ├── prescriptions/
│   │   └── index.ts                  # PDF route definition
│   └── dev/
│       └── simple-tests.ts           # Test endpoints
├── utils/
│   └── pdfGenerator.ts               # PDF generation utility
└── middleware/
    └── authMiddleware.ts             # Authentication checks
```

## Example Usage

### Frontend Integration
```javascript
// Download prescription PDF
const downloadPDF = async (prescriptionId, token) => {
  try {
    const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription_${prescriptionId}.pdf`;
      a.click();
    }
  } catch (error) {
    console.error('Failed to download PDF:', error);
  }
};
```

## Notes

- PDF files are generated on-demand and not stored on the server
- The system supports various medicine data formats for flexibility
- Development endpoints are available for testing without authentication
- All PDFs include proper metadata and formatting for professional appearance
