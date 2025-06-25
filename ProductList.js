import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import products from './data/products';
import { formatCurrency, calculateTotal } from './utils/helpers';

export default function ProductList({ navigation, route }) {

  const [order, setOrder] = useState([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.resetOrder) {
        setOrder([]);
        navigation.setParams({ resetOrder: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.resetOrder]);

  const addToOrder = (product) => {
    const existingItem = order.find(item => item.id === product.id);
    if (existingItem) {
      setOrder(order.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrder([...order, { ...product, quantity: 1 }]);
    }
  };

  const removeFromOrder = (productId) => {
    const existingItem = order.find(item => item.id === productId);
    if (existingItem && existingItem.quantity > 1) {
      setOrder(order.map(item =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setOrder(order.filter(item => item.id !== productId));
    }
  };

  const removeItemCompletely = (productId) => {
    setOrder(order.filter(item => item.id !== productId));
  };

  const getProductQuantity = (productId) => {
    const item = order.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const validateCpf = (cpf) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.length === 11;
  };

  const formatCpf = (cpf) => {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleNameSubmit = () => {
    if (customerName.trim() === '') {
      Alert.alert('Erro', 'Por favor, informe o nome do cliente.');
      return;
    }
    setShowNameModal(false);
    setShowCpfModal(true);
  };

  const handleCpfSubmit = () => {
    if (customerCpf.trim() === '') {
      Alert.alert('Erro', 'Por favor, informe o CPF para emissão da nota fiscal.');
      return;
    }
    
    if (!validateCpf(customerCpf)) {
      Alert.alert('Erro', 'CPF deve conter 11 dígitos.');
      return;
    }

    setShowCpfModal(false);
    navigation.navigate('Comanda', { 
      order, 
      customerName: customerName.trim(),
      customerCpf: customerCpf.trim()
    });
    
    setCustomerName('');
    setCustomerCpf('');
  };

  const startFinalizationProcess = () => {
    if (order.length === 0) {
      Alert.alert('Comanda Vazia', 'Adicione pelo menos um produto antes de finalizar a comanda.');
      return;
    }
    setShowNameModal(true);
  };

  const currentSubtotal = calculateTotal(order);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selecione os produtos</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => navigation.navigate('Historico')}
        >
          <Text style={styles.historyButtonText}>📋 Histórico</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const quantity = getProductQuantity(item.id);
          return (
            <View style={styles.item}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                {quantity > 0 && (
                  <Text style={styles.quantityText}>Qtd: {quantity}</Text>
                )}
              </View>
              <View style={styles.buttonContainer}>
                <Button 
                  title="+" 
                  onPress={() => addToOrder(item)}
                  color="#4CAF50"
                />
                {quantity > 0 && (
                  <>
                    <Button 
                      title="-" 
                      onPress={() => removeFromOrder(item.id)}
                      color="#FF9800"
                    />
                    <Button 
                      title="Remover" 
                      onPress={() => removeItemCompletely(item.id)}
                      color="#F44336"
                    />
                  </>
                )}
              </View>
            </View>
          );
        }}
      />

      {order.length > 0 && (
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Itens Selecionados:</Text>
          {order.map(item => (
            <Text key={item.id} style={styles.summaryItem}>
              {item.name} x{item.quantity} = {formatCurrency(item.price * item.quantity)}
            </Text>
          ))}
          <Text style={styles.subtotal}>
            Subtotal: {formatCurrency(currentSubtotal)}
          </Text>
        </View>
      )}

      <Button
        title="Finalizar Comanda"
        onPress={startFinalizationProcess}
        disabled={order.length === 0}
        color={order.length === 0 ? "#CCCCCC" : "#2196F3"}
      />

      <Modal
        visible={showNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dados do Cliente</Text>
            <Text style={styles.modalLabel}>Nome do Cliente:</Text>
            <TextInput
              style={styles.textInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Digite o nome completo"
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowNameModal(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleNameSubmit}
              >
                <Text style={styles.buttonText}>Próximo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCpfModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCpfModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>CPF para Nota Fiscal</Text>
            <Text style={styles.modalLabel}>CPF do Cliente:</Text>
            <TextInput
              style={styles.textInput}
              value={customerCpf}
              onChangeText={(text) => setCustomerCpf(formatCpf(text))}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              maxLength={14}
            />
            <Text style={styles.helpText}>
              * Obrigatório para emissão da nota fiscal
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowCpfModal(false)}
              >
                <Text style={styles.buttonText}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleCpfSubmit}
              >
                <Text style={styles.buttonText}>Finalizar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#333',
    flex: 1,
  },
  historyButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  historyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  item: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productInfo: {
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quantityText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  orderSummary: {
    backgroundColor: 'white',
    padding: 15,
    marginVertical: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 10,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});