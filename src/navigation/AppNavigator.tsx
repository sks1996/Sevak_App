import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../constants/theme';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { AttendanceHistoryScreen } from '../screens/attendance/AttendanceHistoryScreen';
import { ReportsScreen } from '../screens/reports/ReportsScreen';
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';
import { AdvancedAnalyticsScreen } from '../screens/analytics/AdvancedAnalyticsScreen';
import { NotificationHistoryScreen } from '../screens/notifications/NotificationHistoryScreen';
import { TaskDashboardScreen } from '../screens/tasks/TaskDashboardScreen';
import { CreateTaskScreen } from '../screens/tasks/CreateTaskScreen';
import { MeetingDashboardScreen } from '../screens/meetings/MeetingDashboardScreen';
import { CreateMeetingScreen } from '../screens/meetings/CreateMeetingScreen';
import { CalendarViewScreen } from '../screens/meetings/CalendarViewScreen';
import { MeetingDetailsScreen } from '../screens/meetings/MeetingDetailsScreen';
import { NotificationPreferencesScreen } from '../screens/settings/NotificationPreferencesScreen';
import { NotificationStatusScreen } from '../screens/settings/NotificationStatusScreen';

// Placeholder screens
import { MessagesScreen } from '../screens/messages/MessagesScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileSettingsScreen } from '../screens/settings/ProfileSettingsScreen';
import { PreferencesScreen } from '../screens/settings/PreferencesScreen';
import { ChangePasswordScreen } from '../screens/settings/ChangePasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardMain" component={DashboardScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MessagesMain" component={MessagesScreen} />
  </Stack.Navigator>
);

const AttendanceStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AttendanceMain" component={AttendanceScreen} />
    <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportsMain" component={ReportsScreen} />
    <Stack.Screen name="AdvancedAnalytics" component={AdvancedAnalyticsScreen} />
  </Stack.Navigator>
);

const SettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
    <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
    <Stack.Screen name="Preferences" component={PreferencesScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="NotificationHistory" component={NotificationHistoryScreen} />
    <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
    <Stack.Screen name="NotificationStatus" component={NotificationStatusScreen} />
  </Stack.Navigator>
);

const MeetingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MeetingDashboard" component={MeetingDashboardScreen} />
    <Stack.Screen name="CreateMeeting" component={CreateMeetingScreen} />
    <Stack.Screen name="CalendarView" component={CalendarViewScreen} />
    <Stack.Screen name="MeetingDetails" component={MeetingDetailsScreen} />
  </Stack.Navigator>
);

const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Stack.Screen name="UserManagement" component={UserManagementScreen} />
  </Stack.Navigator>
);

const MainTabs = () => {
  const { authState } = useAuth();
  const { user } = authState;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            case 'Meetings':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Attendance':
              iconName = focused ? 'time' : 'time-outline';
              break;
            case 'Reports':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            case 'Admin':
              iconName = focused ? 'shield' : 'shield-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen 
        name="Tasks" 
        component={TaskDashboardScreen}
        options={{ tabBarLabel: 'Tasks' }}
      />
      <Tab.Screen 
        name="Meetings" 
        component={MeetingsStack}
        options={{ tabBarLabel: 'Meetings' }}
      />
      {user?.role !== 'admin' && (
        <Tab.Screen 
          name="Attendance" 
          component={AttendanceStack}
          options={{ tabBarLabel: 'Attendance' }}
        />
      )}
      <Tab.Screen 
        name="Reports" 
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStack}
        options={{ tabBarLabel: 'Settings' }}
      />
      {user?.role === 'admin' && (
        <Tab.Screen 
          name="Admin" 
          component={AdminStack}
          options={{ tabBarLabel: 'Admin' }}
        />
      )}
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { authState } = useAuth();
  const { isAuthenticated, isLoading } = authState;

  if (isLoading) {
    // You can add a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
