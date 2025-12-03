# Sevak App - Frontend

A React Native application for managing Sevaks (volunteers) with secure messaging and attendance tracking features.

## Features

### ✅ Completed (Week 1-2)
- **Authentication System**: Complete login/logout functionality with role-based access
- **User Management**: Profile management and user information display
- **Role-Based Access**: Different permissions for Sevak, HOD, and Admin roles
- **Theme System**: Saffron & White spiritual theme with consistent styling
- **Navigation**: Tab-based navigation with role-specific screens
- **UI Components**: Reusable components (Button, Input, Card, Header, etc.)

### 🚧 In Progress
- **Messaging Module**: Group-based messaging system
- **Attendance Module**: Reports and analytics
- **Admin Management**: User and permission management

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Sevak | john@example.com | password123 |
| HOD | jane@example.com | password123 |
| Admin | admin@example.com | password123 |

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── auth/            # Authentication components
│   └── forms/            # Form components
├── screens/
│   ├── auth/            # Login screen
│   ├── dashboard/       # Main dashboard
│   ├── profile/         # User profile
│   ├── messages/        # Messaging interface
│   ├── reports/         # Attendance reports
│   └── settings/        # App settings
├── navigation/          # Navigation configuration
├── contexts/           # React contexts (Auth)
├── constants/          # Theme, colors, constants
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/simulator:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Icons**: Expo Vector Icons
- **Styling**: StyleSheet with custom theme

## Theme Colors

- **Primary**: Saffron Orange (#FF6B35)
- **Secondary**: Navy Blue (#1A365D)
- **Background**: White (#FFFFFF)
- **Surface**: Light Gray (#F7FAFC)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)

## User Roles & Permissions

### Sevak (Volunteer)
- View personal attendance records
- Read messages and announcements
- View own profile information

### HOD (Head of Department)
- Send messages to department groups
- View department-wide attendance
- Manage department groups

### Admin (Administrator)
- Full system access
- Manage all users and permissions
- View system-wide reports
- Manage groups and announcements

## Development Status

### Phase 1: Authentication Foundation ✅
- [x] Project setup and configuration
- [x] Authentication module
- [x] Basic navigation structure
- [x] Shared UI components
- [x] Theme implementation
- [x] User profile management

### Phase 2: Core Features (Next)
- [ ] Messaging module
- [ ] Basic attendance module
- [ ] Role-based access implementation

### Phase 3: Advanced Features
- [ ] Admin management module
- [ ] Advanced attendance reports
- [ ] Offline support

## Testing

The app includes mock authentication with predefined users for testing different roles and permissions.

## Contributing

1. Follow the established code structure
2. Use TypeScript for type safety
3. Follow the theme system for consistent styling
4. Test with different user roles
5. Update documentation for new features

## License

This project is for internal use by the Sevak organization.
