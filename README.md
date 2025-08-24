# Tutor Homework Web App

A modern, secure web application for managing homework tasks and assignments with JWT authentication and Azure Functions backend. Features separate dashboards for tutors and students with role-based access control.

## Features

- **Secure Authentication**: JWT-based login/registration system
- **User Management**: Individual user accounts with secure password storage
- **Role-Based Access**: Separate dashboards for tutors and students
- **Homework Dashboard**: Add, view, and manage homework tasks
- **Student Task Management**: Students can view and mark tasks as complete
- **Tutor Task Creation**: Tutors can create and assign tasks to students
- **Azure Functions Backend**: Scalable serverless backend with Cosmos DB
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Tasks are stored in Azure Cosmos DB

## Architecture

### Backend (Azure Functions)
- **Auth Function**: `/api/auth/{action}` for login/register
- **Homework Function**: `/api/homework` for CRUD operations
- **JWT Authentication**: Secure token-based authentication
- **Cosmos DB**: Azure Cosmos DB for data storage

### Frontend
- **Modern UI**: Clean, responsive design with authentication flows
- **JWT Management**: Automatic token handling and validation
- **Protected Routes**: Authentication required for all operations
- **Role-Based Dashboards**: Separate interfaces for tutors and students

## Dashboard Structure

### Main Dashboard (`dashboard.html`)
- Role selection page allowing users to choose between tutor and student views
- Quick access to common functions

### Tutor Dashboard (`dashboard-tutor.html`)
- Quick task creation form
- Access to detailed task creation
- View all student tasks
- Progress tracking tools

### Student Dashboard (`dashboard-student.html`)
- Overview of assigned tasks with statistics
- Task filtering (All, Pending, Completed, Overdue)
- Mark tasks as complete
- Progress tracking

### Task Creation (`tutor.html`)
- Detailed homework task creation form
- Student assignment dropdown
- Comprehensive task management

## Quick Start

### 1. Backend Setup

```bash
cd hw_tracker_backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Update `local.settings.json` with your Azure settings:

```json
{
  "Values": {
    "COSMOS_CONN_STRING": "your-cosmos-connection-string",
    "COSMOS_DB": "your-database-name",
    "JWT_SECRET": "your-secure-jwt-secret"
  }
}
```

### 3. Start Backend

```bash
func start
```

### 4. Frontend

Open `hw_tracker_frontend/index.html` in your browser.

## Authentication Flow

1. **Register**: Create a new account at `/register.html`
2. **Login**: Sign in with your credentials at `/login.html`
3. **Dashboard**: Access your homework dashboard
4. **API Calls**: All requests automatically include JWT tokens

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Homework Management
- `GET /api/homework` - Fetch all homework tasks
- `POST /api/homework` - Create new homework task
- `PATCH /api/homework/{id}` - Mark task as complete

**Note**: All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

## File Structure

### Backend
```
hw_tracker_backend/
├── auth/                 # Authentication function
│   ├── function.json    # Function configuration
│   └── __init__.py      # Auth logic (login/register)
├── homework/            # Homework management function
│   ├── function.json    # Function configuration
│   └── __init__.py      # Homework CRUD operations
├── jwt_utils.py         # JWT validation utilities
├── requirements.txt     # Python dependencies
└── local.settings.json  # Environment configuration
```

### Frontend
```
hw_tracker_frontend/
├── index.html              # Landing page
├── login.html              # Login form
├── register.html           # Registration form
├── dashboard.html          # Main role selection dashboard
├── dashboard-tutor.html    # Tutor dashboard
├── dashboard-student.html  # Student dashboard
├── tutor.html              # Detailed task creation
├── auth.js                 # Authentication utilities
├── config.js               # Configuration settings
├── script.js               # Main application logic
└── styles.css              # Main stylesheet
```

## Security Features

- **Password Hashing**: SHA-256 hashing for secure storage
- **JWT Tokens**: 24-hour expiration with automatic validation
- **Protected Routes**: Authentication required for all operations
- **Secure Headers**: Automatic token inclusion in API calls

## Development

### Local Development
1. Install Azure Functions Core Tools
2. Set up Python virtual environment
3. Configure local.settings.json
4. Run `func start` for backend
5. Open frontend files in browser

### Production Deployment
1. Deploy to Azure Functions
2. Set environment variables in Azure App Settings
3. Update frontend config.js with production URLs
4. Deploy frontend to Azure Static Web Apps or similar

## Dependencies

### Backend
- `azure-functions`
- `azure-cosmos`
- `PyJWT`

### Frontend
- Vanilla JavaScript (no external dependencies)
- Modern CSS (Grid, Flexbox)
- HTML5

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Documentation

For detailed setup and usage instructions, see:
- [Authentication Setup Guide](AUTHENTICATION_SETUP.md)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.