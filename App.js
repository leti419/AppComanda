import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Alert } from 'react-native';
import ProductList from './ProductList'; 
import OrderSummary from './OrderSummary'; 
import HistoryScreen from './HistoryScreen';
import { initDatabase } from './database/database'; 

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await initDatabase();
        console.log('Banco de dados inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        Alert.alert(
          'Erro no Banco de Dados',
          'Não foi possível inicializar o banco de dados. O histórico pode não funcionar corretamente.'
        );
      }
    };

    initializeDatabase();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Cafe Casa Calmo"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Produtos" 
          component={ProductList}
          options={{
            title: 'Cafe Casa Calmo',
          }}
        />
        
        <Stack.Screen 
          name="Comanda" 
          component={OrderSummary}
          options={{
            title: 'Resumo da Comanda',
          }}
        />
        
        <Stack.Screen 
          name="Historico" 
          component={HistoryScreen}
          options={{
            title: 'Histórico',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}