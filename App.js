import React, { useEffect } from "react";
import { StatusBar, Platform, Animated } from "react-native";
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
// import HomeScreen from "./screens/HomeScreen.js";
import HomeScreen from "./screens/HomeScreen.js";
import DataScreen from "./screens/DataScreen.js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
// import { DynamicIslandManager } from './utils/dynamicIsland';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Criando o navegador de tabs
const Tab = createBottomTabNavigator();

// Definição do tema personalizado baseado no Material Design
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4285F4", // Azul Google
    accent: "#EA4335",  // Vermelho Google
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#202124",
    secondaryContainer: "#E8F0FE",
    // Removendo bordas definindo cores de borda como transparentes
    outline: "transparent",
    outlineVariant: "transparent",
  },
  // Adicionando configurações de estilo global para remover bordas
  roundness: 12,
};

const App = () => {
  // Initialize haptic feedback and test Dynamic Island when app loads
  useEffect(() => {
    const testHaptics = async () => {
      try {
        // Test if haptics work on this device
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          console.log('Haptic feedback initialized successfully');
        }
      } catch (error) {
        console.warn('Haptic feedback not available:', error);
      }
    };

    // Test Dynamic Island (iOS only)
    const testDynamicIsland = () => {
      if (Platform.OS === 'ios') {
        console.log('Dynamic Island test initiated');
        // Show a test message in the Dynamic Island
        DynamicIslandManager.showTemperatureUpdate(22.5, 65);
      }
    };

    testHaptics();
    testDynamicIsland();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        <NavigationContainer 
          theme={{
            ...NavigationDefaultTheme,
            colors: {
              ...NavigationDefaultTheme.colors,
              background: theme.colors.background,
              primary: theme.colors.primary,
              border: 'transparent', // Remove bordas da navegação
              card: theme.colors.background,
            }
          }}
        >
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                
                if (route.name === 'Home') {
                  iconName = focused ? 'home' : 'home-outline';
                } else if (route.name === 'Dados') {
                  iconName = focused ? 'chart-line' : 'chart-line';
                }
                
                // Feedback tátil quando um tab é pressionado
                if (focused) {
                  Haptics.selectionAsync();
                }
                
                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              tabBarStyle: {
                paddingBottom: Platform.OS === 'ios' ? 10 : 5,
                height: Platform.OS === 'ios' ? 80 : 60,
                paddingTop: 5,
                borderTopWidth: 0, // Remove a borda superior da tabbar
                elevation: 8, // Adiciona sombra em Android
                shadowOpacity: 0.1, // Adiciona sombra sutil em iOS
                shadowOffset: { width: 0, height: -3 },
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
              },
              // Configurações de transição simplificadas que funcionam com Tab Navigator
              unmountOnBlur: false,
            })}
            // Use a forma correta de configurar animações para Tab Navigator
            tabBarOptions={{
              lazy: false,
            }}
          >
            <Tab.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{
                tabBarLabel: 'Início',
              }}
            />
            <Tab.Screen 
              name="Dados" 
              component={DataScreen} 
              options={{
                tabBarLabel: 'Monitoramento',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;