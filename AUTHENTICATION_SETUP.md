# Authentication Setup Guide

## Overview
The ResumeOptimizer now includes a complete authentication system with user registration, login, and secure document access.

## Backend Setup

### 1. Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=resume_builder

# JWT Configuration (IMPORTANT: Change this in production!)
SECRET_KEY=your-super-secret-key-change-this-in-production

# Server Configuration
PORT=8001
```

### 2. Dependencies
All required packages are already included in `requirements.txt`:
- `bcrypt` - Password hashing
- `python-jose[cryptography]` - JWT token handling
- `passlib[bcrypt]` - Password validation

### 3. Database Collections
The system automatically creates these collections:
- `users` - User accounts and authentication data
- `documents` - User documents (now associated with user_id)
- `versions` - Document version history

## Frontend Setup

### 1. Authentication Components
The frontend includes:
- `AuthContext.js` - Authentication state management
- `Login.js` - Login form component
- `Register.js` - Registration form component

### 2. Environment Variables
Create a `.env` file in the `frontend/` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

## Features

### 🔐 Authentication Features
- **User Registration** - Create new accounts with username, email, password, and full name
- **User Login** - Secure authentication with JWT tokens
- **Password Security** - Bcrypt hashing for secure password storage
- **Token Management** - Automatic token refresh and storage
- **User Isolation** - Each user only sees their own documents

### 🛡️ Security Features
- **JWT Tokens** - Secure authentication tokens with expiration
- **Password Hashing** - Bcrypt encryption for password storage
- **Input Validation** - Server-side validation for all user inputs
- **CORS Protection** - Configured for secure cross-origin requests
- **User Authorization** - All document operations require authentication

### 📝 User Experience
- **Persistent Login** - Tokens stored in localStorage for session persistence
- **Loading States** - Smooth loading indicators during authentication
- **Error Handling** - Clear error messages for authentication failures
- **Form Validation** - Client-side validation for better UX
- **Responsive Design** - Mobile-friendly authentication forms

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user information

### Protected Document Endpoints
All document endpoints now require authentication:
- `POST /api/documents` - Create document (user-specific)
- `GET /api/documents` - List user's documents
- `GET /api/documents/{id}` - Get specific document
- `PUT /api/documents/{id}` - Update document
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/versions` - Get document versions
- `POST /api/documents/{id}/versions/{version}/restore` - Restore version

## Usage

### 1. Start the Backend
```bash
cd backend
python server.py
```

### 2. Start the Frontend
```bash
cd frontend
npm start
```

### 3. Create an Account
1. Navigate to the application
2. Click "create a new account"
3. Fill in your details and register

### 4. Login
1. Enter your username and password
2. You'll be automatically logged in and redirected to your documents

### 5. Use the Application
- All documents are now private to your account
- Your authentication token is automatically included in all requests
- Logout to clear your session

## Security Notes

### Production Deployment
1. **Change the SECRET_KEY** - Use a strong, random secret key
2. **Use HTTPS** - Always use HTTPS in production
3. **Database Security** - Secure your MongoDB instance
4. **Environment Variables** - Never commit secrets to version control
5. **Token Expiration** - Consider shorter token expiration times

### Password Requirements
- Minimum 6 characters
- Passwords are hashed with bcrypt
- No password complexity requirements (can be added if needed)

## Troubleshooting

### Common Issues
1. **CORS Errors** - Ensure backend CORS is configured correctly
2. **Token Expired** - User will be automatically logged out
3. **Database Connection** - Check MongoDB connection string
4. **Port Conflicts** - Ensure port 8001 is available

### Testing Authentication
You can test the authentication system using the provided test endpoints or by creating accounts through the frontend interface.

## Migration from Non-Authenticated Version

If you have existing documents without user association:
1. The system will work with new documents
2. Old documents without `user_id` will not be accessible
3. Consider adding a migration script if needed

---

The authentication system is now fully integrated and ready for use! 🎉 