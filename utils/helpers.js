
export const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
    }).format(value); 
  
  export const calculateTotal = (order) => 
    order.reduce((sum, item) => sum + item.price * item.quantity, 0);