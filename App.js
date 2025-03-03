import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./HomeScreen";  // Tela de boas-vindas
import DataScreen from "./DataScreen";  // Tela da tabela

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Bem-vindo" }} />
        <Stack.Screen name="Dados" component={DataScreen} options={{ title: "Tabela de Dados" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
