/**
 * App Navigator
 * NataCarePM Mobile App
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import { 
  DashboardScreen, 
  ProjectsScreen, 
  LoginScreen,
  TasksScreen,
  ResourcesScreen,
  ReportsScreen
} from '../screens';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import RfiScreen from '../screens/RfiScreen';
import SubmittalsScreen from '../screens/SubmittalsScreen';
import DailyLogsScreen from '../screens/DailyLogsScreen';

// Types
type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ProjectDetail: { projectId: string };
};

type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  Tasks: undefined;
  Resources: undefined;
  Reports: undefined;
  RFIs: undefined;
  Submittals: undefined;
  DailyLogs: undefined;
};

// Navigators
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'folder-multiple' : 'folder-multiple-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'chart-bar' : 'chart-bar-stacked';
          } else if (route.name === 'RFIs') {
            iconName = focused ? 'file-question' : 'file-question-outline';
          } else if (route.name === 'Submittals') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'DailyLogs') {
            iconName = focused ? 'calendar-text' : 'calendar-text-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="RFIs" component={RfiScreen} />
      <Tab.Screen name="Submittals" component={SubmittalsScreen} />
      <Tab.Screen name="DailyLogs" component={DailyLogsScreen} />
    </Tab.Navigator>
  );
}

// Authentication stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Main app navigator
function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(true); // For demo purposes

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen 
              name="ProjectDetail" 
              component={ProjectDetailScreen}
              options={{ headerShown: true, title: 'Project Details' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;