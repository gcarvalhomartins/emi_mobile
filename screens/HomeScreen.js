import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Alert } from 'react-native'; // Import Alert for feedback
import { Text, Button, Card, Title, Paragraph, Surface } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HapticFeedback } from '../utils/haptics';
import { SUPABASE_API_KEY } from '@env';

const { width } = Dimensions.get('window');

// **IMPORTANT:** Replace with your actual Supabase API key

const HomeScreen = ({ navigation }) => {
  const [isActivatingIrrigation, setIsActivatingIrrigation] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);

  const navigateToData = () => {
    HapticFeedback.medium();
    navigation.navigate('Dados');
  };

  const handleActivateIrrigation = async () => {
    setIsActivatingIrrigation(true);
    setRemainingTime(60); // 3 minutos em segundos
    HapticFeedback.selection();

    try {
      const response = await fetch(
        'https://yoeergerojrgfphyxavb.supabase.co/rest/v1/comands?id=eq.1', // Filter for id=1
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_API_KEY,
            'Authorization': `Bearer ${SUPABASE_API_KEY}`, // Supabase requires Authorization header as well
            'Prefer': 'return=representation', // To get the updated data back
          },
          body: JSON.stringify({ status: 'pendente' }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update status:', errorData);
        Alert.alert('Erro', 'Falha ao atualizar o status da irrigação.');
        setIsActivatingIrrigation(false);
        setRemainingTime(null);
        return;
      }

      const updatedData = await response.json();
      console.log('Status updated successfully:', updatedData);
      // Alert.alert('Sucesso', 'Status da irrigação atualizado para pendente.');

      // Inicia a contagem regressiva (movemos this here after the API call)
      const intervalId = setInterval(() => {
        setRemainingTime((prevTime) => {
          if (prevTime > 0) {
            return prevTime - 1;
          } else {
            clearInterval(intervalId);
            setIsActivatingIrrigation(false);
            return null;
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao tentar atualizar o status.');
      setIsActivatingIrrigation(false);
      setRemainingTime(null);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) {
      return '';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Animatable.View animation="fadeIn" duration={1000}>
          <Card style={styles.heroCard}>
            <Card.Cover
              source={require('./banner.png')}
              style={styles.heroImage}
            />
            <Card.Content style={styles.heroContent}>
              <Title style={styles.heroTitle}>Monitoramento Inteligente</Title>
              <Paragraph style={styles.heroParagraph}>
                Acompanhe dados de temperatura e umidade com nosso sistema avançado
              </Paragraph>
              <Button
                mode="contained"
                onPress={navigateToData}
                style={styles.heroButton}
                labelStyle={styles.buttonLabel}
                icon={() => <Icon name="chart-line" size={18} color="white" />}
              >
                Ver Dados
              </Button>
            </Card.Content>
          </Card>
        </Animatable.View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Sistema Integrado</Text>

          <View style={styles.cardsRow}>
            <Animatable.View animation="fadeInLeft" duration={1000} delay={300} style={styles.featureCardContainer}>
              <Card style={styles.featureCard} onPress={() => HapticFeedback.selection()}>
                <Card.Content>
                  <View style={styles.iconContainer}>
                    <Icon name="thermometer" size={32} color="#4285F4" />
                  </View>
                  <Title style={styles.featureTitle}>Temperatura</Title>
                  <Paragraph>Monitoramento da temperatura ambiente</Paragraph>
                </Card.Content>
              </Card>
            </Animatable.View>

            <Animatable.View animation="fadeInRight" duration={1000} delay={400} style={styles.featureCardContainer}>
              <Card style={styles.featureCard} onPress={() => HapticFeedback.selection()}>
                <Card.Content>
                  <View style={styles.iconContainer}>
                    <Icon name="water-percent" size={32} color="#4285F4" />
                  </View>
                  <Title style={styles.featureTitle}>Umidade</Title>
                  <Paragraph>Controle preciso dos níveis de umidade do ambiente</Paragraph>
                </Card.Content>
              </Card>
            </Animatable.View>
          </View>

          <Animatable.View animation="fadeInUp" duration={1000} delay={500}>
            <Card
              style={[
                styles.fullCard,
                { backgroundColor: isActivatingIrrigation ? '#FFEB3B' : '#39D2C0' },
              ]}
              onPress={handleActivateIrrigation}
              disabled={isActivatingIrrigation}
            >
              <Card.Content style={styles.fullCardContent}>
                <View style={styles.iconContainer}>
                  <Icon
                    name={isActivatingIrrigation ? 'alert-circle' : 'water'}
                    size={32}
                    color={isActivatingIrrigation ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
                <View style={styles.fullCardTextContainer}>
                  <Title style={[styles.featureTitle, { color: isActivatingIrrigation ? '#FFFFFF' : '#FFFFFF' }]}>
                    {isActivatingIrrigation ? 'Ativando Irrigação...' : 'Ativar Irrigação Raspberry'}
                  </Title>
                  <Paragraph style={{ color: isActivatingIrrigation ? '#FFFFFF' : '#333' }}>
                    {isActivatingIrrigation
                      ? `Aguarde... ${formatTime(remainingTime)}`
                      : 'Pressione aqui para acionar a Irrigação manual do Raspberry '}
                  </Paragraph>
                </View>
              </Card.Content>
            </Card>
          </Animatable.View>
        </View>

        <Animatable.View
          animation="fadeIn"
          duration={800}
          delay={600}
          style={styles.callToActionContainer}
          useNativeDriver={true}
        >
          <Surface style={styles.callToAction}>
            <Text style={styles.callToActionTitle}>Pronto para começar?</Text>
            <Text style={styles.callToActionText}>
              Acesse agora os dados mais recentes do seu ambiente
            </Text>
            <Button
              mode="contained"
              onPress={navigateToData}
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
            >
              Acessar Painel
            </Button>
          </Surface>
        </Animatable.View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    borderWidth: 0, // Remover bordas
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  heroCard: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0, // Remover bordas
    elevation: 4, // Adicionar sombra no Android
    shadowColor: '#000', // Sombra no iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  heroImage: {
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heroContent: {
    padding: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroParagraph: {
    fontSize: 16,
    marginBottom: 16,
  },
  heroButton: {
    width: '50%',
    borderRadius: 8,
    marginTop: 8,
    elevation: 0, // Remove sombra do botão
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCardContainer: {
    width: (width - 40) / 2,
  },
  featureCard: {
    height: 160,
    borderRadius: 12,
    borderWidth: 0, // Remover bordas
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 8,
  },
  fullCard: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0, // Remover bordas
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fullCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullCardTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  callToActionContainer: {
    marginBottom: 24,
  },
  callToAction: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    elevation: 2,
    borderWidth: 0, // Remover bordas
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  callToActionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  callToActionText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 8,
    alignSelf: 'center',
    paddingHorizontal: 16,
    elevation: 0, // Remove sombra do botão
  },
});

export default HomeScreen;