import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Button, Text } from "react-native";
import axios from "axios";
import { Table, Row } from "react-native-table-component";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const DataScreen = () => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const tableHead = ["Hora", "Temperatura", "Umidade"];

  const fetchData = async () => {
    setLoading(true);
    const url = "https://yoeergerojrgfphyxavb.supabase.co/rest/v1/receive_dados";

    try {
      const response = await axios.get(url, {
        headers: {
          apikey:"<seu token>",
          Authorization:"< seu token > ",
        },
      });

      const sortedData = response.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6)
        .map((data) => {
          const temp = parseFloat(data.temperatura);
          return [
            new Date(data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            <View style={styles.iconContainer}>
              {temp > 30 ? (
                <Icon name="thermometer" size={20} color="red" />
              ) : (
                <Icon name="thermometer-low" size={20} color="blue" />
              )}
              <Text style={styles.tempText}>{temp}°</Text>
            </View>,
            `${data.umidade}%`,
          ];
        });

      setDados(sortedData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wednesday</Text>
      <Button title="Recarregar Dados" onPress={fetchData} disabled={loading} />

      <ScrollView>
        <Table borderStyle={{ borderWidth: 1, borderColor: "#ccc" }}>
          <Row data={tableHead} style={styles.header} textStyle={styles.headerText} />
          {dados.map((rowData, index) => (
            <Row key={index} data={rowData} style={styles.row} textStyle={styles.text} />
          ))}
        </Table>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    flex: 1,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  header: {
    height: 50,
    backgroundColor: "#e6e6e6",
    borderRadius: 8,
  },
  row: {
    height: 50,
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  text: {
    textAlign: "center",
    fontSize: 16,
  },
  headerText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tempText: {
    fontSize: 16,
  },
});

export default DataScreen;
