import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, Platform } from "react-native";
import { 
  Appbar, Card, Text, useTheme, Button, 
  ActivityIndicator, FAB, Divider, Chip, ProgressBar,
  Portal, Modal, IconButton, Menu, Badge
} from "react-native-paper";
import axios from "axios";
import * as Animatable from "react-native-animatable";
// import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "@react-navigation/native";
import { HapticFeedback } from '../utils/haptics';
import {SUPABASE_URL, SUPABASE_API_KEY, SUPABASE_AUTH} from '@env';
// Constantes para autenticação do Supabase

const TelaMonitoramento = ({ navigation }) => {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [erroDados, setErroDados] = useState(false);
  const [dataFiltro, setDataFiltro] = useState(null);
  const [mostrarModalFiltro, setMostrarModalFiltro] = useState(false);
  const [menuVisivel, setMenuVisivel] = useState(false);
  const [todasDatas, setTodasDatas] = useState([]);
  // Adiciona estado para rastrear se o erro é por filtro vazio
  const [erroFiltroVazio, setErroFiltroVazio] = useState(false);
  const tema = useTheme();
  const larguraTela = Dimensions.get("window").width;

  // Adicionar estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [dadosCompletos, setDadosCompletos] = useState([]);

  // Adicionar novo estado para armazenar dados por data (cache explícito)
  const [cacheDadosPorData, setCacheDadosPorData] = useState({});
  
  // Modificar o obterDataString para ser mais robusto com timezones
  const obterDataString = (data) => {
    if (!data) return null;
    
    // Se já for uma string no formato AAAA-MM-DD, retorna ela mesma
    if (typeof data === 'string' && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return data;
    }
    
    // Se for uma data, converte para string no formato AAAA-MM-DD
    const dataObj = new Date(data);
    
    // Usar o UTC para evitar problemas de timezone
    const ano = dataObj.getUTCFullYear();
    const mes = String(dataObj.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getUTCDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}`;
  };
  
  // Nova função para verificar e limpar o cache de dados
  const limparCache = () => {
    console.log("Limpando cache de dados...");
    setCacheDadosPorData({});
  };

  // Função para atualizar ao puxar para baixo
  const aoAtualizar = () => {
    setAtualizando(true);
    HapticFeedback.medium(); // Feedback ao atualizar
    buscarDados();
  };

  // Função para extrair apenas a data (YYYY-MM-DD) de um timestamp completo
  const extrairDataString = (timestamp) => {
    if (!timestamp) return null;
    return obterDataString(new Date(timestamp));
  };
  
  // Reformular buscarDados para usar cache e ser mais confiável
  const buscarDados = async () => {
    console.log("Iniciando busca de dados...");
    setCarregando(true);
    setErroDados(false);
    setErroFiltroVazio(false);
    const url = `${SUPABASE_URL}/rest/v1/receive_dados`;

    try {
      console.log("Fazendo requisição à API...");
      const resposta = await axios.get(url, {
        headers: {
          apikey: SUPABASE_API_KEY,
          Authorization: `Bearer ${SUPABASE_AUTH}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`Processando ${resposta.data.length} registros recebidos da API...`);
      
      // IMPORTANTE: Trabalhar com uma cópia dos dados
      const dadosRecebidos = [...resposta.data];
      
      // Ordenar dados (mais recentes primeiro)
      const dadosOrdenados = dadosRecebidos.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      // Novo sistema de cache: agrupar dados por data (YYYY-MM-DD)
      const novoCache = {};
      
      dadosOrdenados.forEach(item => {
        if (!item.created_at) return; // Ignorar itens sem data
        
        try {
          const dataObj = new Date(item.created_at);
          if (isNaN(dataObj.getTime())) return; // Ignorar datas inválidas
          
          const dataStr = obterDataString(dataObj);
          
          // Se esta data ainda não tem uma lista no cache, criar uma
          if (!novoCache[dataStr]) {
            novoCache[dataStr] = [];
          }
          
          // Adicionar este item à lista da sua data no cache
          novoCache[dataStr].push({...item}); // Importante: criar uma cópia do item
        } catch (err) {
          console.error("Erro ao processar data:", err);
        }
      });
      
      // Para cada chave no cache, ordenar os dados (mais recentes primeiro)
      Object.keys(novoCache).forEach(dataStr => {
        novoCache[dataStr].sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      });
      
      console.log(`Cache construído com ${Object.keys(novoCache).length} datas distintas`);
      
      // Atualizar o cache global
      setCacheDadosPorData(novoCache);
      
      // Obter todas as datas únicas e convertê-las em objetos Date
      const datasUnicas = Object.keys(novoCache)
        .sort((a, b) => b.localeCompare(a)) // Mais recente primeiro
        .map(dataStr => {
          const [ano, mes, dia] = dataStr.split('-').map(Number);
          const dataObj = new Date(Date.UTC(ano, mes - 1, dia));
          return dataObj;
        });
      
      console.log(`Identificadas ${datasUnicas.length} datas únicas`);
      setTodasDatas(datasUnicas);
      
      // Variável para armazenar dados que serão exibidos (com ou sem filtro)
      let dadosParaExibir = [];
      
      // Aplicar filtro por data se necessário
      if (dataFiltro) {
        const dataFiltroString = obterDataString(dataFiltro);
        console.log(`Aplicando filtro para data: ${dataFiltroString}`);
        
        // Buscar dados desta data específica no cache
        dadosParaExibir = novoCache[dataFiltroString] || [];
        
        console.log(`Encontrados ${dadosParaExibir.length} registros para a data ${dataFiltroString}`);
        
        // Verificar se a data existe mas não tem dados
        if (dadosParaExibir.length === 0) {
          console.log("ERRO: Nenhum dado disponível para esta data");
          setErroFiltroVazio(true);
          setDados([]);
          setDadosCompletos([]);
          setCarregando(false);
          setAtualizando(false);
          return;
        }
      } else {
        // Sem filtro: usar todos os dados
        dadosParaExibir = dadosOrdenados;
        console.log(`Modo sem filtro: usando todos os ${dadosParaExibir.length} registros`);
      }
      
      // Atualizar dados completos para paginação
      setDadosCompletos(dadosParaExibir);
      
      // Calcular total de páginas
      const totalPgs = Math.ceil(dadosParaExibir.length / itensPorPagina);
      setTotalPaginas(totalPgs);
      
      // Ajustar página atual se necessário
      if (paginaAtual > totalPgs && totalPgs > 0) {
        setPaginaAtual(1);
      }
      
      if (dadosParaExibir.length === 0) {
        console.log("AVISO: Nenhum dado disponível para exibição");
        setDados([]);
        setErroDados(!erroFiltroVazio);
      } else {
        // Aplicar paginação aos dados
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const dadosPaginados = dadosParaExibir.slice(inicio, inicio + itensPorPagina);
        
        console.log(`Exibindo página ${paginaAtual} com ${dadosPaginados.length} registros`);
        setDados(dadosPaginados);
        
        // Feedback tátil ao carregar dados com sucesso
        HapticFeedback.success();
      }
    } catch (erro) {
      console.error("Erro crítico ao buscar dados:", erro);
      setErroDados(true);
      setDados([]);
      setDadosCompletos([]);
      HapticFeedback.error();
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };
  
  // Função para carregar uma página específica
  const carregarPagina = (numeroPagina) => {
    if (numeroPagina < 1 || numeroPagina > totalPaginas) return;
    
    setPaginaAtual(numeroPagina);
    
    // Aplicar paginação aos dados armazenados
    const inicio = (numeroPagina - 1) * itensPorPagina;
    const dadosPaginados = dadosCompletos.slice(inicio, inicio + itensPorPagina);
    
    setDados(dadosPaginados);
    
    // Fornecer feedback tátil ao mudar de página
    HapticFeedback.selection();
  };
  
  // Atualizar selecionarDataFiltro para ser mais robusto e usar o cache
  const selecionarDataFiltro = (data) => {
    if (!data) {
      console.log("ERRO: Tentativa de selecionar data nula");
      return;
    }
    
    console.log(`Iniciando seleção de data: ${data.toISOString()}`);
    
    // Converter para string para comparação
    const novaDataString = obterDataString(data);
    const dataFiltroAtualString = dataFiltro ? obterDataString(dataFiltro) : null;
    
    console.log(`Comparando: nova="${novaDataString}", atual="${dataFiltroAtualString}"`);
    
    // Verificar se é a mesma data
    if (dataFiltroAtualString === novaDataString) {
      console.log("Mesma data já selecionada, apenas fechando menu");
      setMenuVisivel(false);
      return;
    }
    
    // IMPORTANTE: Limpar completamente os estados antes de aplicar novo filtro
    setDados([]);
    setDadosCompletos([]);
    setPaginaAtual(1);
    
    // Definir o novo filtro de data
    console.log(`Definindo novo filtro para: ${novaDataString}`);
    setDataFiltro(data);
    setMenuVisivel(false);
    
    // Verificar se a data existe no cache
    if (cacheDadosPorData[novaDataString]) {
      console.log(`Usando dados do cache para ${novaDataString}`);
      const dadosDaData = cacheDadosPorData[novaDataString];
      
      setDadosCompletos(dadosDaData);
      
      const totalPgs = Math.ceil(dadosDaData.length / itensPorPagina);
      setTotalPaginas(totalPgs);
      
      const dadosPaginados = dadosDaData.slice(0, itensPorPagina);
      setDados(dadosPaginados);
      
      HapticFeedback.success();
    } else {
      // Não existe no cache, buscar novos dados
      console.log(`Data ${novaDataString} não encontrada no cache, buscando dados...`);
      setTimeout(() => {
        buscarDados();
      }, 300); // Aumento o delay para garantir que os estados foram limpos
    }
  };
  
  // Atualizar limparFiltro para limpar completamente o estado e usar o cache
  const limparFiltro = () => {
    if (!dataFiltro) {
      console.log("Nenhum filtro aplicado, não há o que limpar");
      return;
    }
    
    console.log("Removendo filtro de data");
    
    // Limpar estados
    setDados([]);
    setDadosCompletos([]);
    setPaginaAtual(1);
    
    // Remover filtro
    setDataFiltro(null);
    
    // Verificar se existem dados no cache completo
    if (cacheDadosPorData && Object.keys(cacheDadosPorData).length > 0) {
      console.log("Usando dados combinados do cache");
      
      // Combinar todos os dados de todas as datas
      const todosDados = [];
      Object.values(cacheDadosPorData).forEach(dadosDaData => {
        todosDados.push(...dadosDaData);
      });
      
      // Ordenar por data (mais recentes primeiro)
      todosDados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setDadosCompletos(todosDados);
      
      const totalPgs = Math.ceil(todosDados.length / itensPorPagina);
      setTotalPaginas(totalPgs);
      
      const dadosPaginados = todosDados.slice(0, itensPorPagina);
      setDados(dadosPaginados);
      
      HapticFeedback.success();
    } else {
      // Não há dados no cache, buscar novos
      console.log("Cache vazio, buscando dados...");
      setTimeout(() => {
        buscarDados();
      }, 300);
    }
  };

  // Atualizar selecionarHoje para usar a nova abordagem
  const selecionarHoje = () => {
    const hoje = new Date();
    console.log(`Selecionando hoje: ${hoje.toISOString().split('T')[0]}`);
    
    const hojeString = obterDataString(hoje);
    const dataFiltroAtualString = dataFiltro ? obterDataString(dataFiltro) : null;
    
    // Verificar se já está selecionado hoje
    if (dataFiltroAtualString === hojeString) {
      console.log("Hoje já está selecionado, apenas fechando menu");
      setMenuVisivel(false);
      return;
    }
    
    // Limpar todos os estados de dados e definir novo filtro
    setDados([]);
    setDadosCompletos([]);
    setDataFiltro(hoje);
    setMenuVisivel(false);
    setPaginaAtual(1);
    
    // Buscar dados com o novo filtro
    setTimeout(() => {
      buscarDados();
    }, 100);
  };
  
  // Atualizar isDataHoje para usar strings
  const isDataHoje = (data) => {
    if (!data) return false;
    
    const hoje = new Date();
    return obterDataString(data) === obterDataString(hoje);
  };

  // Função para formatar a data para exibição
  const formatarData = (data) => {
    if (!data) return '';
    const opcoes = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return data.toLocaleDateString('pt-BR', opcoes);
  };

  // Modificar a função obterDadosGrafico para verificação adicional
  const obterDadosGrafico = () => {
    // Verificação mais rigorosa para garantir que dados válidos existam
    if (!dados || dados.length === 0 || erroDados || erroFiltroVazio) {
      return null;
    }

    const dadosInvertidos = [...dados].reverse().slice(0, 6);
    const rotulos = dadosInvertidos.map(d => 
      new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const dadosTemperatura = dadosInvertidos.map(d => parseFloat(d.temperatura));
    const dadosUmidade = dadosInvertidos.map(d => parseFloat(d.umidade));

    return {
      labels: rotulos,
      datasets: [
        {
          data: dadosTemperatura,
          color: () => tema.colors.primary,
          strokeWidth: 2
        },
        {
          data: dadosUmidade,
          color: () => tema.colors.accent,
          strokeWidth: 2
        }
      ],
      legend: ["Temperatura (°C)", "Umidade (%)"]
    };
  };

  // ===== Configurações do Gráfico =====
  // Define a aparência visual do gráfico de linha
  const configGrafico = {
    backgroundGradientFrom: tema.colors.surface,
    backgroundGradientTo: tema.colors.surface,
    decimalPlaces: 1, // Número de casas decimais
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(32, 33, 36, ${opacity})`,
    propsForDots: {
      r: "5", // Raio dos pontos
      strokeWidth: "2", // Espessura da borda
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Linhas contínuas (sem tracejado)
    },
  };

  // ===== Funções Auxiliares =====
  
  /**
   * Retorna o nome do dia da semana atual em português
   */
  const obterDiaSemana = () => {
    const diasSemana = [
      'Domingo', 'Segunda-feira', 'Terça-feira', 
      'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return diasSemana[new Date().getDay()];
  };

  /**
   * Calcula as médias de temperatura e umidade dos dados disponíveis
   */
  const obterEstatisticas = () => {
    // Verificação mais rigorosa para garantir que dados válidos existam
    if (!dados || dados.length === 0 || erroDados || erroFiltroVazio) {
      return { tempMedia: 0, umidadeMedia: 0 };
    }
    
    // Converte strings para números
    const temperaturas = dados.map(d => parseFloat(d.temperatura));
    const umidades = dados.map(d => parseFloat(d.umidade));
    
    // Calcula as médias aritméticas
    const tempMedia = temperaturas.reduce((total, temp) => total + temp, 0) / temperaturas.length;
    const umidadeMedia = umidades.reduce((total, umid) => total + umid, 0) / umidades.length;
    
    return { tempMedia, umidadeMedia };
  };

  // Obtém as estatísticas atuais
  const { tempMedia, umidadeMedia } = obterEstatisticas();
  
  useEffect(() => {
    // Buscar dados ao carregar a tela
    buscarDados();
  }, []);

  // Função que atualiza os dados - simplificada para apenas buscar do banco
  const atualizarDados = () => {
    // Fornecer feedback quando o usuário atualiza manualmente
    HapticFeedback.medium();
    
    // Mostrar indicador de carregamento para feedback visual imediato
    setCarregando(true);
    
    // Pequeno atraso para garantir que o usuário veja o indicador de carregamento
    setTimeout(() => {
      buscarDados();
    }, 300);
  };

  // Componente para estado vazio (sem dados)
  const renderizarEstadoVazio = () => (
    <Animatable.View animation="fadeIn" duration={500} style={estilos.containerEstadoVazio}>
      <Icon 
        name={erroFiltroVazio ? "calendar-remove" : "cloud-off-outline"} 
        size={60} 
        color={tema.colors.primary} 
      />
      <Text style={estilos.tituloEstadoVazio}>
        {erroFiltroVazio 
          ? "Sem dados para esta data" 
          : "Sem dados disponíveis"}
      </Text>
      <Text style={estilos.mensagemEstadoVazio}>
        {erroFiltroVazio 
          ? `Não encontramos registros para ${formatarData(dataFiltro)}. Tente outra data ou remova o filtro.` 
          : "Não foi possível carregar os dados do sensor neste momento."}
      </Text>
      <View style={estilos.botoesEstadoVazio}>
        {dataFiltro && (
          <Button 
            mode="outlined" 
            onPress={limparFiltro} 
            style={[estilos.botaoEstadoVazio, {marginRight: 8}]}
            icon="filter-remove"
          >
            Remover Filtro
          </Button>
        )}
        <Button 
          mode="contained" 
          onPress={atualizarDados} 
          style={estilos.botaoEstadoVazio}
          icon="refresh"
        >
          {erroFiltroVazio ? "Tentar Outra Data" : "Tentar Novamente"}
        </Button>
      </View>
    </Animatable.View>
  );

  // Alterando para função de toggle em vez de apenas definir como true
  const alternarMenuFiltro = () => {
    setMenuVisivel(atual => !atual);
    if (!menuVisivel) {
      HapticFeedback.selection(); // Feedback ao abrir o menu
    }
  };

  return (
    <SafeAreaView style={estilos.areaSegura}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => {
          HapticFeedback.light();
          navigation.goBack();
        }} />
        <Appbar.Content title="Monitoramento em Tempo Real" />
        <Appbar.Action 
          icon={dataFiltro ? "filter-check" : "filter"} 
          onPress={alternarMenuFiltro}
          color={dataFiltro ? tema.colors.primary : undefined}
        />
        <Appbar.Action 
          icon="refresh" 
          onPress={atualizarDados} 
          disabled={carregando} 
          /* Adicionando um tooltip explicativo */
          accessibilityLabel="Atualizar dados"
        />
      </Appbar.Header>
      
      <ScrollView 
        style={estilos.container}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} />
        }
      >
        <Animatable.View animation="fadeIn" duration={500}>
          <Card style={estilos.cartaoHeader}>
            <Card.Content>
              <Text variant="titleLarge" style={estilos.textoDiaSemana}>{obterDiaSemana()}</Text>
              <View style={estilos.containerChip}>
                {dataFiltro ? (
                  <Chip 
                    icon="calendar"
                    style={[
                      estilos.chip, 
                      {backgroundColor: tema.colors.primaryContainer}
                    ]}
                    onClose={limparFiltro}
                    mode="outlined"
                    elevated
                  >
                    Filtrando: {formatarData(dataFiltro)}
                    {/* Indicador de quantos registros existem para esta data */}
                    {cacheDadosPorData[obterDataString(dataFiltro)] && 
                      ` (${cacheDadosPorData[obterDataString(dataFiltro)].length})`}
                  </Chip>
                ) : (
                  <Chip 
                    icon="clock-outline" 
                    style={estilos.chip}
                  >
                    {dados.length > 0 
                      ? `Última atualização: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
                      : 'Sem dados para exibir'}
                  </Chip>
                )}
              </View>
            </Card.Content>
          </Card>
        </Animatable.View>
        
        {carregando && dados.length === 0 ? (
          <View style={estilos.containerCarregando}>
            <ActivityIndicator size="large" color={tema.colors.primary} />
            <Text style={estilos.textoCarregando}>
              {dataFiltro ? 
                `Carregando dados para ${formatarData(dataFiltro)}...` : 
                'Carregando dados...'}
            </Text>
          </View>
        ) : erroDados || erroFiltroVazio || dados.length === 0 ? (
          // Melhoria na condição para mostrar estado vazio
          renderizarEstadoVazio()
        ) : (
          <>
            {/* Mostrar informação de paginação se houver múltiplas páginas */}
            {totalPaginas > 1 && (
              <View style={estilos.containerPaginacao}>
                <Text style={estilos.infoPaginacao}>
                  Mostrando {(paginaAtual - 1) * itensPorPagina + 1}-
                  {Math.min(paginaAtual * itensPorPagina, dadosCompletos.length)} de {dadosCompletos.length} registros
                </Text>
                <View style={estilos.controlePaginacao}>
                  <IconButton 
                    icon="chevron-left" 
                    size={24}
                    mode="contained-tonal"
                    disabled={paginaAtual <= 1}
                    onPress={() => carregarPagina(paginaAtual - 1)}
                    style={estilos.botaoPaginacao}
                  />
                  <Text style={estilos.numeroPagina}>
                    {paginaAtual} / {totalPaginas}
                  </Text>
                  <IconButton 
                    icon="chevron-right" 
                    size={24}
                    mode="contained-tonal"
                    disabled={paginaAtual >= totalPaginas}
                    onPress={() => carregarPagina(paginaAtual + 1)}
                    style={estilos.botaoPaginacao}
                  />
                </View>
              </View>
            )}
            
            {/* Verificação adicional antes de renderizar o gráfico */}
            {obterDadosGrafico() && dados.length > 0 && !erroDados && !erroFiltroVazio && (
              <Animatable.View animation="fadeInUp" duration={800}>
                <Card style={estilos.cartao}>
                  <Card.Title title="Tendência de Medições" subtitle="Últimas 6 leituras" />
                  <Card.Content>
                    <LineChart
                      data={obterDadosGrafico()}
                      width={larguraTela - 40}
                      height={220}
                      chartConfig={configGrafico}
                      bezier
                      style={estilos.grafico}
                    />
                  </Card.Content>
                </Card>
              </Animatable.View>
            )}

            {/* Verificação adicional antes de renderizar as estatísticas */}
            {dados.length > 0 && !erroDados && !erroFiltroVazio && (
              <View style={estilos.containerEstatisticas}>
                <Animatable.View animation="fadeInLeft" duration={800} delay={300} style={estilos.containerCartaoEstatistica}>
                  <Card 
                    style={[estilos.cartaoEstatistica, { backgroundColor: '#E3F2FD' }]} 
                    onPress={() => {
                      HapticFeedback.selection(); // Feedback de seleção
                    }}
                  >
                    <Card.Content style={estilos.conteudoEstatistica}>
                      <Icon name="thermometer" size={30} color={tempMedia > 30 ? tema.colors.accent : tema.colors.primary} />
                      <Text variant="headlineMedium" style={estilos.valorEstatistica}>
                        {tempMedia.toFixed(1)}°C
                      </Text>
                      <Text variant="bodyMedium">Temperatura Média</Text>
                    </Card.Content>
                  </Card>
                </Animatable.View>
                
                <Animatable.View animation="fadeInRight" duration={800} delay={400} style={estilos.containerCartaoEstatistica}>
                  <Card 
                    style={[estilos.cartaoEstatistica, { backgroundColor: '#E8F5E9' }]} 
                    onPress={() => {
                      HapticFeedback.selection(); // Feedback de seleção
                    }}
                  >
                    <Card.Content style={estilos.conteudoEstatistica}>
                      <Icon name="water-percent" size={30} color={tema.colors.primary} />
                      <Text variant="headlineMedium" style={estilos.valorEstatistica}>
                        {umidadeMedia.toFixed(1)}%
                      </Text>
                      <Text variant="bodyMedium">Umidade Média</Text>
                    </Card.Content>
                  </Card>
                </Animatable.View>
              </View>
            )}

            {/* Verificação adicional antes de renderizar a tabela de leituras */}
            {dados.length > 0 && !erroDados && !erroFiltroVazio && (
              <Animatable.View animation="fadeInUp" duration={800} delay={500}>
                <Card style={estilos.cartao}>
                  <Card.Title 
                    title="Últimas Leituras" 
                    subtitle="Dados mais recentes do sensor"
                  />
                  <Card.Content>
                    <Divider style={estilos.divisor} />
                    {dados.slice(0, 6).map((item, index) => (
                      <Animatable.View 
                        key={index} 
                        animation="fadeIn" 
                        delay={100 * index}
                      >
                        <View style={estilos.linhaTabela}>
                          <View style={estilos.colunaHora}>
                            <Text variant="titleMedium">
                              {new Date(item.created_at).toLocaleTimeString([], { 
                                hour: "2-digit", 
                                minute: "2-digit" 
                              })}
                            </Text>
                          </View>
                          
                          <View style={estilos.colunaValor}>
                            <View style={estilos.itemValor}>
                              <Icon 
                                name={parseFloat(item.temperatura) > 30 ? "thermometer" : "thermometer-low"}
                                size={20} 
                                color={parseFloat(item.temperatura) > 30 ? tema.colors.accent : tema.colors.primary} 
                              />
                              <Text>{parseFloat(item.temperatura).toFixed(1)}°C</Text>
                            </View>
                          </View>
                          
                          <View style={estilos.colunaValor}>
                            <View style={estilos.itemValor}>
                              <Icon name="water-percent" size={20} color={tema.colors.primary} />
                              <Text>{item.umidade}%</Text>
                            </View>
                          </View>
                        </View>
                        {index < dados.length - 1 && <Divider style={estilos.divisorLinha} />}
                      </Animatable.View>
                    ))}
                  </Card.Content>
                </Card>
              </Animatable.View>
            )}
          </>
        )}
        
        <View style={estilos.rodape} />
      </ScrollView>
      
      {/* Menu para seleção de data - Melhoria no gerenciamento do dismiss */}
      <Menu
        visible={menuVisivel}
        onDismiss={() => {
          setMenuVisivel(false);
        }}
        anchor={{ x: larguraTela - 40, y: 60 }}
        style={estilos.menu}
        contentStyle={estilos.menuContent}
      >
        <View style={estilos.menuHeader}>
          <Text style={estilos.menuTitle}>Filtrar por Data</Text>
          <IconButton 
            icon="close" 
            size={20} 
            onPress={() => setMenuVisivel(false)} 
          />
        </View>
        <Divider style={estilos.menuDivider} />
        <ScrollView style={estilos.menuScrollView}>
          {/* Opção para selecionar o dia atual */}
          <Menu.Item 
            title="Hoje" 
            leadingIcon="calendar-today"
            onPress={selecionarHoje} 
            titleStyle={dataFiltro && isDataHoje(dataFiltro) ? estilos.menuItemSelected : null}
            style={estilos.menuItem}
            trailingIcon={dataFiltro && isDataHoje(dataFiltro) ? "check" : null}
          />
          <Divider />
          
          <Menu.Item 
            title="Todas as datas" 
            leadingIcon="calendar-blank-outline"
            onPress={limparFiltro} 
            titleStyle={dataFiltro === null ? estilos.menuItemSelected : null}
            style={estilos.menuItem}
            trailingIcon={dataFiltro === null ? "check" : null}
          />
          <Divider />
          
          {todasDatas.length > 0 ? (
            todasDatas.map((data, index) => {
              const dataString = obterDataString(data);
              const filtroString = dataFiltro ? obterDataString(dataFiltro) : null;
              const selecionada = dataString === filtroString;
              
              // Verificação mais rigorosa para datas inválidas
              if (isNaN(data.getTime())) {
                console.log(`Ignorando data inválida no índice ${index}`);
                return null;
              }
              
              // Formatar data para exibição
              const dataFormatada = formatarData(data);
              
              // Adicionar dia da semana
              const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
              const diaSemana = diasSemana[data.getDay()];
              
              // Exibir quantidade de registros para cada data
              const qtdRegistros = cacheDadosPorData[dataString]?.length || 0;
              
              return (
                <Menu.Item
                  key={`data-${index}-${dataString}`} // Chave mais específica
                  title={`${dataFormatada} (${diaSemana}) - ${qtdRegistros} reg.`}
                  leadingIcon="calendar"
                  onPress={() => selecionarDataFiltro(data)}
                  titleStyle={selecionada ? estilos.menuItemSelected : null}
                  style={estilos.menuItem}
                  trailingIcon={selecionada ? "check" : null}
                />
              );
            })
          ) : (
            <Menu.Item title="Nenhuma data disponível" disabled />
          )}
        </ScrollView>
      </Menu>
      
      {/* Adicionando indicador de carregamento sobreposto quando está atualizando com dados existentes */}
      {carregando && dados.length > 0 && (
        <View style={estilos.carregandoSobreposto}>
          <View style={estilos.containerIndicadorCarregando}>
            <ActivityIndicator color={tema.colors.primary} />
            <Text style={estilos.textoIndicadorCarregando}>
              {dataFiltro ? 'Atualizando filtro...' : 'Atualizando...'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const estilos = StyleSheet.create({
  areaSegura: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  cartaoHeader: {
    marginBottom: 16,
    elevation: 1,
  },
  textoDiaSemana: {
    fontWeight: "bold",
    textAlign: "center",
  },
  containerChip: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  // Estilos para o estado vazio
  containerEstadoVazio: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
  },
  tituloEstadoVazio: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  mensagemEstadoVazio: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  botoesEstadoVazio: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  botaoEstadoVazio: {
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  
  // Melhorias do menu de filtro
  menu: {
    maxHeight: 400,
    width: 300,
    marginRight: 10,
  },
  menuContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  menuScrollView: {
    maxHeight: 300,
  },
  menuItem: {
    height: 50,
  },
  menuItemSelected: {
    fontWeight: 'bold',
    color: '#4285F4',
  },
  chip: {
    marginTop: 8,
    height: 40,
    paddingHorizontal: 8,
  },
  containerCarregando: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  cartao: {
    marginBottom: 16,
    elevation: 2,
  },
  grafico: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 16,
  },
  containerEstatisticas: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  containerCartaoEstatistica: {
    width: "48%",
  },
  cartaoEstatistica: {
    elevation: 2,
  },
  conteudoEstatistica: {
    alignItems: "center",
    paddingVertical: 16,
  },
  valorEstatistica: {
    fontWeight: "bold",
    marginVertical: 8,
  },
  divisor: {
    marginBottom: 12,
  },
  linhaTabela: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  colunaHora: {
    flex: 1,
  },
  colunaValor: {
    flex: 1,
    alignItems: "center",
  },
  itemValor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  divisorLinha: {
    height: 0.5,
  },
  rodape: {
    height: 70,
  },
  textoCarregando: {
    marginTop: 8,
    textAlign: 'center',
  },
  carregandoSobreposto: {
    position: 'absolute',
    top: 70, // Posicionado abaixo da AppBar
    alignSelf: 'center',
    zIndex: 999,
  },
  containerIndicadorCarregando: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  textoIndicadorCarregando: {
    marginLeft: 8,
    fontWeight: '500',
  },
  
  // Estilos para paginação
  containerPaginacao: {
    marginBottom: 16,
    alignItems: 'center',
  },
  infoPaginacao: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  controlePaginacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPaginacao: {
    margin: 0,
  },
  numeroPagina: {
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
});

export default TelaMonitoramento;