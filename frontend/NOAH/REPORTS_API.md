# Laporan API Documentation

## Overview
The reports API provides various types of attendance reports for the school management system. It supports different report types and export formats.

## API Endpoints

### GET /api/reports
Fetch attendance reports with different types and filters.

#### Query Parameters
- `type` (string, required): Type of report to generate
  - `summary`: Attendance summary statistics
  - `performance`: Student performance data
  - `detailed`: Detailed attendance report with historical data
  - `class`: Class-wise attendance report
- `period` (string, optional): Report period
  - `daily` (default)
  - `weekly`
  - `monthly`
- `class` (string, optional): Filter by class (e.g., "X-IPA-1")

#### Response Examples

##### Summary Report
```json
{
  "attendanceStats": {
    "present": 285,
    "late": 12,
    "absent": 15,
    "permission": 8,
    "attendanceRate": 89.1
  },
  "studentCategories": {
    "totalStudents": 320,
    "newStudents": 25,
    "transferStudents": 8,
    "existingStudents": 287
  },
  "topPerformers": [
    {
      "id": 7,
      "nis": "2024007",
      "name": "Galih Pratama",
      "class": "XII-IPA-1",
      "attendance": 99,
      "late": 0,
      "absent": 0,
      "permission": 1,
      "type": "existing"
    }
  ],
  "classDistribution": [
    {
      "class": "X-IPA-1",
      "present": 2,
      "late": 1,
      "absent": 0,
      "permission": 0
    }
  ]
}
```

##### Detailed Report
```json
{
  "reportTitle": "Laporan Kehadiran Siswa",
  "generatedAt": "2025-11-08T10:30:00.000Z",
  "period": "Mingguan",
  "totalStudents": 320,
  "attendanceRate": 89.1,
  "detailedStats": [
    {
      "id": 1,
      "nis": "2024001",
      "name": "Ahmad Fauzi",
      "class": "XII-IPA-1",
      "currentStatus": "hadir",
      "currentTime": "07:15",
      "attendancePercentage": 95,
      "weeklyHistory": [
        {
          "date": "2025-11-01",
          "status": "hadir",
          "time": "07:10"
        }
      ],
      "monthlySummary": {
        "present": 23,
        "late": 2,
        "absent": 1,
        "permission": 2
      }
    }
  ]
}
```

##### Class Report
```json
{
  "reportTitle": "Laporan Kehadiran per Kelas",
  "generatedAt": "2025-11-08T10:30:00.000Z",
  "classReport": [
    {
      "class": "X-IPA-1",
      "totalStudents": 30,
      "present": 28,
      "late": 1,
      "absent": 0,
      "permission": 1,
      "averageAttendance": 96.7
    }
  ]
}
```

### POST /api/reports/export
Export reports in various formats.

#### Request Body
```json
{
  "format": "excel", // or "pdf"
  "data": {
    "type": "attendance",
    "reportType": "summary" // or "detailed" or "class"
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "Laporan berhasil diekspor dalam format excel",
  "reportMetadata": {
    "title": "Laporan Ringkasan Kehadiran",
    "generatedAt": "2025-11-08T10:30:00.000Z",
    "period": "Mingguan",
    "totalStudents": 320,
    "fileType": "excel"
  },
  "downloadUrl": "/downloads/report-1234567890.xlsx"
}
```

## Usage in Frontend

### Fetching Reports
```typescript
import { getReports } from '@/utils/api';

// Get summary report
const summaryReport = await getReports('summary');

// Get detailed report for a specific class
const detailedReport = await getReports('detailed', { class: 'X-IPA-1' });

// Get class-wise report
const classReport = await getReports('class');
```

### Exporting Reports
```typescript
import { exportReport } from '@/utils/api';

// Export summary report to Excel
await exportReport('excel', { type: 'attendance', reportType: 'summary' });

// Export detailed report to PDF
await exportReport('pdf', { type: 'attendance', reportType: 'detailed' });
```