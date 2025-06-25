import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { formatCurrency, calculateTotal } from './utils/helpers';
import { saveOrder } from './database/database'; 

export default function OrderSummary({ route, navigation }) {
  
  const { order, customerName, customerCpf } = route.params;
  const [includeService, setIncludeService] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); 

  const subtotal = calculateTotal(order);
  const serviceFee = includeService ? subtotal * 0.1 : 0;
  const finalTotal = subtotal + serviceFee;

 
  const confirmOrder = async () => {
    if (isProcessing) return; 
    
    setIsProcessing(true);
    
    try {
      const orderData = {
        customerName: customerName,
        customerCpf: customerCpf,
        items: order.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: subtotal,
        serviceFee: serviceFee,
        total: finalTotal,
        includeService: includeService
      };

      await saveOrder(orderData);

      Alert.alert(
        'Pedido Confirmado!',
        `Obrigado, ${customerName}!\n\nSeu pedido foi registrado com sucesso.\n\nTotal: ${formatCurrency(finalTotal)}\n\nNota fiscal será emitida no CPF: ${customerCpf}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Produtos', { resetOrder: true });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      
      Alert.alert(
        'Pedido Processado com Ressalvas',
        `Obrigado, ${customerName}!\n\nSeu pedido foi processado, mas houve um problema ao salvar no histórico.\n\nTotal: ${formatCurrency(finalTotal)}\n\nNota fiscal será emitida no CPF: ${customerCpf}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Produtos', { resetOrder: true });
            }
          }
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resumo da Comanda</Text>
        <View style={styles.customerInfo}>
          <Text style={styles.customerLabel}>Cliente:</Text>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.customerLabel}>CPF:</Text>
          <Text style={styles.customerCpf}>{customerCpf}</Text>
        </View>
      </View>

      <View style={styles.orderSection}>
        <Text style={styles.sectionTitle}>Itens do Pedido</Text>
        <FlatList
          data={order}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderItem}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {formatCurrency(item.price)} x {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>

        <View style={styles.serviceSection}>
          <Button
            title={includeService ? 'Remover 10% de serviço' : 'Adicionar 10% de serviço'}
            onPress={() => setIncludeService(!includeService)}
            color={includeService ? "#FF9800" : "#4CAF50"}
            disabled={isProcessing} 
          />
        </View>

        {includeService && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa de serviço (10%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(serviceFee)}</Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
        </View>
      </View>

      <View style={styles.buttonSection}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonContainer}>
            <Button 
              title="Voltar" 
              onPress={() => navigation.goBack()} 
              color="#666"
              disabled={isProcessing}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button 
              title={isProcessing ? "Processando..." : "Confirmar Pedido"}
              onPress={confirmOrder}
              color="#4CAF50"
              disabled={isProcessing}
            />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button 
            title="Novo Pedido" 
            onPress={() => navigation.navigate('Produtos', { resetOrder: true })} 
            color="#2196F3"
            disabled={isProcessing}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 15,
    textAlign: 'center',
    color: '#333'
  },
  customerInfo: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
  },
  customerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  customerCpf: {
    fontSize: 16,
    color: '#333',
  },
  orderSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summarySection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  serviceSection: {
    marginVertical: 15,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#2196F3',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  buttonSection: {
    padding: 15,
    paddingBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  buttonContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
});