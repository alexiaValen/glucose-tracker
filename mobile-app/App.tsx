// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.tsx to start working on your app!</Text>
//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });


import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
// import { LogBox } from 'react-native';

// // Ignore specific log notifications
// LogBox.ignoreLogs([
//   'Setting a timer for a long period of time',
//   'VirtualizedLists should never be nested',
// ]);

export default function App() {
  return <AppNavigator />;
}