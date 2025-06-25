import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('cafe_casa_calmo.db');

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_cpf TEXT NOT NULL,
            subtotal REAL NOT NULL,
            service_fee REAL DEFAULT 0,
            total REAL NOT NULL,
            include_service BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id)
          );`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id)
          );`
        );

        console.log('Tabelas criadas com sucesso');
      },
      (error) => {
        console.error('Erro ao criar tabelas:', error);
        reject(error);
      },
      () => {
        console.log('Banco de dados inicializado com sucesso');
        resolve();
      }
    );
  });
};

const saveCustomer = (customerData) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          'SELECT id FROM customers WHERE cpf = ?',
          [customerData.customerCpf],
          (_, result) => {
            if (result.rows.length > 0) {
              resolve(result.rows.item(0).id);
            } else {
              tx.executeSql(
                'INSERT INTO customers (name, cpf) VALUES (?, ?)',
                [customerData.customerName, customerData.customerCpf],
                (_, result) => {
                  resolve(result.insertId);
                },
                (_, error) => {
                  reject(error);
                }
              );
            }
          },
          (_, error) => {
            reject(error);
          }
        );
      }
    );
  });
};

export const saveOrder = async (orderData) => {
  try {
    const customerId = await saveCustomer(orderData);

    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT INTO orders (
              customer_id, customer_name, customer_cpf, 
              subtotal, service_fee, total, include_service
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              customerId,
              orderData.customerName,
              orderData.customerCpf,
              orderData.subtotal,
              orderData.serviceFee,
              orderData.total,
              orderData.includeService ? 1 : 0
            ],
            (_, result) => {
              const orderId = result.insertId;
              orderData.items.forEach((item) => {
                tx.executeSql(
                  `INSERT INTO order_items (
                    order_id, product_id, product_name, price, quantity
                  ) VALUES (?, ?, ?, ?, ?)`,
                  [orderId, item.id, item.name, item.price, item.quantity]
                );
              });

              console.log('Pedido salvo com sucesso, ID:', orderId);
              resolve(orderId);
            },
            (_, error) => {
              console.error('Erro ao salvar pedido:', error);
              reject(error);
            }
          );
        },
        (error) => {
          console.error('Erro na transação:', error);
          reject(error);
        },
        () => {
          console.log('Transação de salvamento concluída');
        }
      );
    });
  } catch (error) {
    console.error('Erro ao salvar pedido:', error);
    throw error;
  }
};

export const getAllOrders = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            o.id,
            o.customer_name,
            o.customer_cpf,
            o.subtotal,
            o.service_fee,
            o.total,
            o.include_service,
            o.created_at
          FROM orders o
          ORDER BY o.created_at DESC`,
          [],
          (_, result) => {
            const orders = [];
            const promises = [];

            for (let i = 0; i < result.rows.length; i++) {
              const order = result.rows.item(i);
              const promise = new Promise((resolveItems) => {
                tx.executeSql(
                  `SELECT product_id, product_name, price, quantity 
                   FROM order_items WHERE order_id = ?`,
                  [order.id],
                  (_, itemResult) => {
                    const items = [];
                    for (let j = 0; j < itemResult.rows.length; j++) {
                      const item = itemResult.rows.item(j);
                      items.push({
                        id: item.product_id,
                        name: item.product_name,
                        price: item.price,
                        quantity: item.quantity
                      });
                    }
                    
                    orders.push({
                      ...order,
                      created_at: new Date(order.created_at),
                      items: items
                    });
                    resolveItems();
                  }
                );
              });
              
              promises.push(promise);
            }

            Promise.all(promises).then(() => {
              orders.sort((a, b) => b.created_at - a.created_at);
              resolve(orders);
            });
          },
          (_, error) => {
            reject(error);
          }
        );
      }
    );
  });
};

export const getAllCustomers = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            c.id,
            c.name,
            c.cpf,
            c.created_at,
            COUNT(o.id) as total_orders,
            COALESCE(SUM(o.total), 0) as total_spent
          FROM customers c
          LEFT JOIN orders o ON c.id = o.customer_id
          GROUP BY c.id, c.name, c.cpf, c.created_at
          ORDER BY total_spent DESC`,
          [],
          (_, result) => {
            const customers = [];
            for (let i = 0; i < result.rows.length; i++) {
              const customer = result.rows.item(i);
              customers.push({
                ...customer,
                created_at: new Date(customer.created_at)
              });
            }
            resolve(customers);
          },
          (_, error) => {
            reject(error);
          }
        );
      }
    );
  });
};

export const getStatistics = () => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            COUNT(DISTINCT customer_id) as totalCustomers,
            COUNT(*) as totalOrders,
            COALESCE(SUM(total), 0) as totalRevenue,
            COALESCE(AVG(total), 0) as averageOrderValue
          FROM orders`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              const stats = result.rows.item(0);
              resolve({
                totalCustomers: stats.totalCustomers || 0,
                totalOrders: stats.totalOrders || 0,
                totalRevenue: stats.totalRevenue || 0,
                averageOrderValue: stats.averageOrderValue || 0
              });
            } else {
              resolve({
                totalCustomers: 0,
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0
              });
            }
          },
          (_, error) => {
            reject(error);
          }
        );
      }
    );
  });
};

export const getOrdersByCustomer = (cpf) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            o.id,
            o.customer_name,
            o.customer_cpf,
            o.subtotal,
            o.service_fee,
            o.total,
            o.include_service,
            o.created_at
          FROM orders o
          WHERE o.customer_cpf = ?
          ORDER BY o.created_at DESC`,
          [cpf],
          (_, result) => {
            const orders = [];
            for (let i = 0; i < result.rows.length; i++) {
              const order = result.rows.item(i);
              orders.push({
                ...order,
                created_at: new Date(order.created_at)
              });
            }
            resolve(orders);
          },
          (_, error) => {
            reject(error);
          }
        );
      }
    );
  });
};