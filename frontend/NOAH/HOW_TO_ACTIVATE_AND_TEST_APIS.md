# How to Activate and Test SIMAKA APIs

This guide explains how to activate all APIs for the SIMAKA system and test them to ensure they properly connect to the frontend with real-time updates.

## 1. Prerequisites

Before activating the APIs, ensure you have:
- Node.js installed (version 14 or higher)
- npm (Node Package Manager)
- Access to the project directory

## 2. Activating the APIs

### Step 1: Navigate to the Project Directory

Open your terminal or command prompt and navigate to the project directory:

```
cd "d:\Data C\Downloads\NOAH\noah"
```

### Step 2: Install Dependencies

If you haven't already installed the project dependencies, run:

```
npm install
```

This will install all required packages including Next.js, React, and other dependencies.

### Step 3: Start the Development Server

Run the development server with:

```
npm run dev
```

This will start the Next.js development server on `http://localhost:3000` and activate all API routes.

## 3. API Endpoints

Once the server is running, the following API endpoints will be available:

### 3.1. Students API
- **GET** `/api/students` - Retrieve all students
- **POST** `/api/students` - Add a new student

### 3.2. Attendance API
- **GET** `/api/attendance` - Get attendance records
- **PUT** `/api/attendance` - Update attendance status

### 3.3. Reports API
- **GET** `/api/reports` - Generate reports (summary, performance, detailed, class)
- **POST** `/api/reports/export` - Export reports

### 3.4. Settings API
- **GET** `/api/settings` - Get system settings
- **PUT** `/api/settings` - Update system settings

## 4. Testing the APIs

### 4.1. Using a Web Browser

You can test the APIs directly in your web browser by visiting:

- `http://localhost:3000/api/students`
- `http://localhost:3000/api/attendance`
- `http://localhost:3000/api/reports?type=summary`
- `http://localhost:3000/api/settings`

### 4.2. Using cURL

If you have cURL installed, you can test the APIs with these commands:

#### Get all students:
```bash
curl http://localhost:3000/api/students
```

#### Update student attendance:
```bash
curl -X PUT http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d "{\"studentId\": 1, \"newStatus\": \"hadir\"}"
```

#### Get summary report:
```bash
curl http://localhost:3000/api/reports?type=summary
```

#### Get class report:
```bash
curl http://localhost:3000/api/reports?type=class
```

### 4.3. Using Postman

1. Open Postman
2. Create a new request
3. Set the URL to `http://localhost:3000/api/students` (or any other endpoint)
4. Select the appropriate HTTP method (GET, POST, PUT)
5. For POST/PUT requests, set the Body to "raw" and choose "JSON" format
6. Add the required JSON data in the body
7. Click "Send" to test the API

## 5. Real-time Updates

The system is designed to provide real-time updates to the dashboard and reports when attendance changes:

1. When a user updates attendance status in the frontend, the system:
   - Calls the attendance API endpoint
   - Updates the student's status in the data manager
   - Recalculates statistics
   - Returns updated data to the frontend
   - Immediately updates the dashboard and reports

2. The frontend automatically refreshes with the latest data from the API responses.

## 6. Troubleshooting

### 6.1. APIs Not Responding

If the APIs are not responding:

1. Make sure the development server is running (`npm run dev`)
2. Check that the server started without errors
3. Verify you're accessing the correct URL (`http://localhost:3000`)
4. Check the terminal for any error messages

### 6.2. JSON Parsing Errors

If you're getting JSON parsing errors:

1. Ensure the development server is running
2. Check that you're accessing the correct API endpoints
3. Verify that the API routes are properly implemented

### 6.3. CORS Issues

If you encounter CORS issues:

1. The Next.js API routes should automatically handle CORS for local development
2. If issues persist, check the API route implementations

## 7. Key Features Implemented

1. **Real-time Dashboard Updates**: When attendance is updated, the dashboard statistics update immediately
2. **Automatic Report Refresh**: Reports automatically reflect the latest attendance data
3. **Consistent Data Management**: All APIs use the same data manager for consistency
4. **Proper Error Handling**: APIs return appropriate success/error responses
5. **TypeScript Support**: All APIs are properly typed for better reliability

## 8. Files That Were Modified

1. `src/utils/dataManager.ts` - Enhanced attendance update logic
2. `src/app/api/attendance/route.ts` - Improved response with updated stats
3. `src/app/api/reports/route.ts` - Fixed class report generation
4. `src/app/page.tsx` - Updated frontend to handle real-time updates

The system is now fully activated and provides real-time updates to both the dashboard and reports when attendance changes.