# Query Management System

## Overview
The Query Management system has been added to allow EXCO users to handle queries from Finance and update program details. This system provides a comprehensive interface for managing program-related queries.

## Features

### 1. Summary Dashboard
- **Active Queries**: Shows the number of pending queries that need answers
- **Answered Queries**: Displays the count of queries that have been resolved
- **Total Programs with Queries**: Shows the overall count of programs that have queries

### 2. Active Queries Section
- Lists all pending queries from Finance
- Shows program name, budget, status, and query count
- Provides action buttons for:
  - **Answer Query** (HelpCircle icon): Open modal to answer the query
  - **Edit Program** (Edit3 icon): View and edit program details
  - **View Program** (Eye icon): View program information

### 3. Query History Section
- Displays all answered queries
- Shows program details and query status
- Provides view details button for historical reference

### 4. Answer Query Modal
- Displays the original query from Finance
- Shows who asked the question and when
- Provides a text area for entering your response
- Submit button to save the answer

### 5. Program View Modal
- Comprehensive program details display
- Basic information (title, description, department, budget, status)
- Timeline information (start date, end date, submission date)

## Navigation

### For EXCO Users
The Query Management system is accessible through the sidebar navigation:
- **Dashboard** → **Queries** (HelpCircle icon)
- This will be visible for users with the 'user' role (EXCO users)

### For Finance Users
Finance users can create queries through the existing program management interface, but they don't have access to the Query Management view.

## API Endpoints

The system uses the following API endpoints:

1. **Get User Queries**: `GET /api/programs?action=getUserQueries&userId={userId}`
2. **Answer Query**: `POST /api/programs?action=answerQuery`
3. **Get Program Details**: `GET /api/programs?action=getProgram&id={programId}`

## Translation Support

The system supports both English and Malay languages through the LanguageContext:
- All UI text is translatable
- Language switching affects the entire Query Management interface
- New translation keys have been added for all features

## Usage Instructions

### Answering a Query
1. Navigate to **Queries** in the sidebar
2. In the **Active Queries** section, click the **HelpCircle** icon next to the query
3. Review the query details in the modal
4. Enter your answer in the text area
5. Click **Submit Answer** to save

### Viewing Program Details
1. Click the **Eye** icon next to any program name
2. Review the comprehensive program information
3. Close the modal when finished

### Editing Programs
1. Click the **Edit3** icon to open program details
2. Make necessary changes
3. Save your modifications

## Technical Implementation

### Component Structure
- **QueryManagement.tsx**: Main component with all functionality
- **State Management**: Uses React hooks for local state
- **API Integration**: Fetches data from backend endpoints
- **Error Handling**: Graceful error handling with user feedback

### Key Features
- **Real-time Updates**: Queries refresh after answering
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Efficient rendering with proper React patterns

## Future Enhancements

Potential improvements for the Query Management system:
1. **Email Notifications**: Send alerts when new queries arrive
2. **Query Templates**: Pre-defined answer templates for common questions
3. **File Attachments**: Allow file uploads in query answers
4. **Query Categories**: Organize queries by type or priority
5. **Reporting**: Generate reports on query response times and patterns

## Troubleshooting

### Common Issues
1. **Queries not loading**: Check user authentication and API connectivity
2. **Answer not saving**: Verify the answer text is not empty
3. **Program details not showing**: Ensure the program ID is valid

### Debug Information
- Check browser console for any JavaScript errors
- Verify API responses in the Network tab
- Ensure user has proper permissions for the 'user' role

## Integration Notes

The Query Management system integrates seamlessly with:
- **Existing Program Management**: Uses the same data structures
- **User Authentication**: Respects user roles and permissions
- **Language System**: Supports the existing translation framework
- **Error Boundary**: Protected by the application's error handling

This system provides EXCO users with a comprehensive tool to manage and respond to Finance queries efficiently, improving communication and program management workflow.
