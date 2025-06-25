import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { getAllOrders, getAllCustomers, getStatistics, getOrdersByCustomer } from './database/database';
import { formatCurrency } from './utils/helpers';

export default function HistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

 
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, statsData] = await Promise.all([
        getAllOrders(),
        getAllCustomers(),
        getStatistics()
      ]);
      
      setOrders(ordersData);
      setCustomers(customersData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do histórico.');
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);


  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };


  const showOrderDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };


  const showCustomerOrders = async (customer) => {
    try {
      const customerOrders = await getOrdersByCustomer(customer.cpf);
      Alert.alert(
        `Pedidos de ${customer.name}`,
        `Total de pedidos: ${customerOrders.length}\nValor total gasto: ${formatCurrency(customer.total_spent)}`,
        [
          { text: 'OK' },
          { 
            text: 'Ver Detalhes', 
            onPress: () => {
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os pedidos do cliente.');
    }
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => showOrderDetails(item)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
      </View>
      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.orderCpf}>CPF: {item.customer_cpf}</Text>
      </View>
      <Text style={styles.itemCount}>
        {item.items.length} item(s) • {item.service_fee > 0 ? 'Com taxa de serviço' : 'Sem taxa de serviço'}
      </Text>
    </TouchableOpacity>
  );


  const renderCustomer = ({ item }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => showCustomerOrders(item)}
    >
      <View style={styles.customerHeader}>
        <Text style={styles.customerName}>{item.name}</Text>
        <Text style={styles.customerSpent}>{formatCurrency(item.total_spent)}</Text>
      </View>
      <View style={styles.customerInfo}>
        <Text style={styles.customerCpf}>CPF: {item.cpf}</Text>
        <Text style={styles.customerOrders}>{item.total_orders} pedido(s)</Text>
      </View>
    </TouchableOpacity>
  );


  const renderStatistics = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{statistics.totalCustomers}</Text>
        <Text style={styles.statLabel}>Clientes Únicos</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{statistics.totalOrders}</Text>
        <Text style={styles.statLabel}>Total de Pedidos</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCurrency(statistics.totalRevenue)}</Text>
        <Text style={styles.statLabel}>Receita Total</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCurrency(statistics.averageOrderValue)}</Text>
        <Text style={styles.statLabel}>Ticket Médio</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Pedidos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => setActiveTab('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>
            Clientes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Estatísticas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
            </View>
          }
        />
      )}

      {activeTab === 'customers' && (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCustomer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={loadData} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
            </View>
          }
        />
      )}

      {activeTab === 'stats' && renderStatistics()}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <ScrollView>
                <Text style={styles.modalTitle}>Detalhes do Pedido</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customer_name}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>CPF:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customer_cpf}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Data:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedOrder.created_at)}</Text>
                </View>

                <Text style={styles.itemsTitle}>Itens do Pedido:</Text>
                {selectedOrder.items.map((item, index) => (
                  <View key={index} style={styles.itemDetail}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemInfo}>
                      {formatCurrency(item.price)} x {item.quantity} = {formatCurrency(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.totalSection}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(selectedOrder.subtotal)}</Text>
                  </View>
                  {selectedOrder.service_fee > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Taxa de serviço:</Text>
                      <Text style={styles.totalValue}>{formatCurrency(selectedOrder.service_fee)}</Text>
                    </View>
                  )}
                  <View style={[styles.totalRow, styles.finalTotalRow]}>
                    <Text style={styles.finalTotalLabel}>Total:</Text>
                    <Text style={styles.finalTotalValue}>{formatCurrency(selectedOrder.total)}</Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderCpf: {
    fontSize: 14,
    color: '#666',
  },
  itemCount: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  customerCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerSpent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerCpf: {
    fontSize: 14,
    color: '#666',
  },
  customerOrders: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flex: 1,
    padding: 15,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  detailSection: {
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  itemDetail: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  itemInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  totalSection: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
  },
  finalTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#2196F3',
    paddingTop: 10,
    marginTop: 10,
  },
  finalTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finalTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});