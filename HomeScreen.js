import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bem-vindo ao App</Text>
      <Text style={styles.paragraph}>O projeto EMI, visa monitorar a temperatura e umidade do ambiente =)</Text>
      <Button title="Ver Dados" onPress={() => navigation.navigate("Dados")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    width:300,
}
});

export default HomeScreen;
