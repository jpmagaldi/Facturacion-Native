//emulator -avd MiEmulador

//import React from 'react';
import { LogBox, StatusBar } from 'react-native';
import { PaperProvider, Appbar, Icon, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { es, registerTranslation } from 'react-native-paper-dates'

import BCliente from './src/Facturacion/BCliente';
import Facturacion from './src/Facturacion/Facturacion';
import BProducto from './src/Facturacion/BProducto';
import Config from './src/Configuracion';
import Ranking from './src/Ranking';
import Stock from './src/Stock';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

LogBox.ignoreLogs(['Warning: ...']);
registerTranslation('es', es)

const FacturacionTab = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen
      options={{
        headerBackButtonMenuEnabled: false
      }}
      name="StackFacturacion"
      component={Facturacion}
      initialParams={{ cliente: [], productos: [], cambios: [], tipo: '' }}
    />
    <Stack.Screen
      options={{
        headerBackButtonMenuEnabled: false
      }}
      name="StackCliente" component={BCliente} />
    <Stack.Screen
      options={{
        headerBackButtonMenuEnabled: false
      }}
      name="StackProducto" component={BProducto} />
    <Stack.Screen
      options={{
        headerBackButtonMenuEnabled: false
      }}
      name="StackRanking" component={Ranking} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = ''
        switch (route.name) {
          case 'Facturacion':
            iconName = focused ? 'home' : 'home-outline'
            break
          case 'Configuracion':
            iconName = focused ? 'toolbox' : 'toolbox-outline'
            break
          case 'Stock':
            iconName = focused ? 'package-variant' : 'package-variant-closed'
            break
          default:
            iconName = focused ? 'table-edit' : 'table'
        }      
        return <Icon source={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#663399',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
      unmountOnBlur: true,
    })}
  >
    <Tab.Screen name="Facturacion" component={FacturacionTab} />
    <Tab.Screen name="Ranking" component={Ranking} />
    <Tab.Screen name="Stock" component={Stock} />
    <Tab.Screen name="Configuracion" component={Config} />
  </Tab.Navigator>
);

export default function App() {
  return (
    <PaperProvider theme={MD3LightTheme}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="transparent" 
          translucent={true} 
        />
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
