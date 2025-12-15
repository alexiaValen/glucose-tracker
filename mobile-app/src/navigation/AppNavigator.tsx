// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { useAuthStore } from '../stores/authStore';
// import LoginScreen from '../screens/LoginScreen';
// import RegisterScreen from '../screens/RegisterScreen';
// import DashboardScreen from '../screens/DashboardScreen';
// import { View, ActivityIndicator, StyleSheet } from 'react-native';

// const Stack = createNativeStackNavigator();

// export default function AppNavigator() {
//   const { isAuthenticated, checkAuth } = useAuthStore();
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       await checkAuth();
//       setIsLoading(false);
//     };
//     initAuth();
//   }, []);

//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#6366F1" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         screenOptions={{
//           headerShown: false,
//         }}
//       >
//         {isAuthenticated ? (
//           <Stack.Screen name="Dashboard" component={DashboardScreen} />
//         ) : (
//           <>
//             <Stack.Screen name="Login" component={LoginScreen} />
//             <Stack.Screen name="Register" component={RegisterScreen} />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//   },
// });

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../stores/authStore';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddGlucoseScreen from '../screens/AddGlucoseScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native'; //newsest import
import AddSymptomScreen from '../screens/AddSymptomScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="AddGlucose" component={AddGlucoseScreen} />
            <Stack.Screen name="AddSymptom" component={AddSymptomScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});