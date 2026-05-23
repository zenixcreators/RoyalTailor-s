const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Paths
const LOCAL_DB_PATH = path.join(__dirname, '..', 'database.json');

// Helper to get local data
function readLocalDB() {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      const initialData = { customers: [], measurements: [], orders: [], transactions: [] };
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading local DB:', err);
    return { customers: [], measurements: [], orders: [], transactions: [] };
  }
}

// Helper to write local data
function writeLocalDB(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error('Error writing local DB:', err);
    return false;
  }
}

// Google Sheets client initialization
let sheetsClient = null;
const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY;

const isSheetsEnabled = !!(spreadsheetId && serviceAccountEmail && privateKey);

if (isSheetsEnabled) {
  try {
    // Format private key correctly if it has escaped newlines
    const formattedKey = privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      serviceAccountEmail,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    sheetsClient = google.sheets({ version: 'v4', auth });
    console.log('Google Sheets Storage Service Initialized Successfully.');
  } catch (err) {
    console.error('Failed to initialize Google Sheets client. Falling back to Local Storage.', err.message);
  }
} else {
  console.log('Google Sheets credentials not fully configured. Using Local JSON Database.');
}

// Sheets operations helper
async function getSheetData(sheetName) {
  if (!sheetsClient) {
    const db = readLocalDB();
    return db[sheetName.toLowerCase()] || [];
  }

  try {
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let val = row[index] !== undefined ? row[index] : '';
        // Try parsing numeric values and arrays
        if (val === '[]') val = [];
        else if (val.startsWith('[') && val.endsWith(']')) {
          try { val = JSON.parse(val); } catch (e) {}
        } else if (!isNaN(val) && val.trim() !== '') {
          val = Number(val);
        }
        obj[header] = val;
      });
      return obj;
    });
  } catch (err) {
    console.error(`Error reading Sheet ${sheetName}, using local fallback:`, err.message);
    const db = readLocalDB();
    return db[sheetName.toLowerCase()] || [];
  }
}

async function writeSheetData(sheetName, dataList) {
  if (!sheetsClient) {
    const db = readLocalDB();
    db[sheetName.toLowerCase()] = dataList;
    return writeLocalDB(db);
  }

  try {
    if (dataList.length === 0) {
      // Clear sheet except headers if data is empty
      const headerRes = await sheetsClient.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A1:Z1`,
      });
      const headers = headerRes.data.values || [[]];
      await sheetsClient.spreadsheets.values.clear({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
      });
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'RAW',
        resource: { values: headers },
      });
      return true;
    }

    // Prepare headers
    const headers = Object.keys(dataList[0]);
    const values = [headers];

    dataList.forEach(item => {
      const row = headers.map(header => {
        const val = item[header];
        if (Array.isArray(val) || typeof val === 'object') {
          return JSON.stringify(val);
        }
        return val !== undefined ? String(val) : '';
      });
      values.push(row);
    });

    // Clear and update the sheet to maintain atomic consistency
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    });
    return true;
  } catch (err) {
    console.error(`Error writing to Sheet ${sheetName}:`, err.message);
    // Write locally as temporary backup
    const db = readLocalDB();
    db[sheetName.toLowerCase()] = dataList;
    writeLocalDB(db);
    return false;
  }
}

// Storage API Actions
module.exports = {
  isSheetsActive() {
    return !!sheetsClient;
  },

  // Customers
  async getCustomers() {
    return await getSheetData('Customers');
  },

  async addCustomer(customer) {
    const customers = await this.getCustomers();
    const newCustomer = {
      id: `CUST-${Date.now()}`,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
    await writeSheetData('Customers', customers);
    return newCustomer;
  },

  async updateCustomer(id, updatedFields) {
    const customers = await this.getCustomers();
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    
    customers[idx] = {
      ...customers[idx],
      name: updatedFields.name !== undefined ? updatedFields.name : customers[idx].name,
      phone: updatedFields.phone !== undefined ? updatedFields.phone : customers[idx].phone,
      address: updatedFields.address !== undefined ? updatedFields.address : customers[idx].address,
      notes: updatedFields.notes !== undefined ? updatedFields.notes : customers[idx].notes
    };
    await writeSheetData('Customers', customers);
    return customers[idx];
  },

  async deleteCustomer(id) {
    // Delete customer
    let customers = await this.getCustomers();
    customers = customers.filter(c => c.id !== id);
    await writeSheetData('Customers', customers);

    // Delete customer's measurements
    let measurements = await this.getMeasurementsAll();
    measurements = measurements.filter(m => m.customerId !== id);
    await writeSheetData('Measurements', measurements);

    // Update customer's orders to clear customer link or let them be
    return true;
  },

  // Measurements
  async getMeasurementsAll() {
    return await getSheetData('Measurements');
  },

  async getMeasurements(customerId) {
    const measurements = await this.getMeasurementsAll();
    const customerMeas = measurements.find(m => m.customerId === customerId);
    if (!customerMeas) {
      // Return empty default measurements if none exist yet
      return {
        customerId,
        chest: '',
        waist: '',
        shoulder: '',
        sleeve: '',
        neck: '',
        hip: '',
        inseam: '',
        notes: '',
        updatedAt: ''
      };
    }
    return customerMeas;
  },

  async saveMeasurements(customerId, measData) {
    const measurements = await this.getMeasurementsAll();
    const idx = measurements.findIndex(m => m.customerId === customerId);
    
    const newMeas = {
      customerId,
      chest: measData.chest || '',
      waist: measData.waist || '',
      shoulder: measData.shoulder || '',
      sleeve: measData.sleeve || '',
      neck: measData.neck || '',
      hip: measData.hip || '',
      inseam: measData.inseam || '',
      notes: measData.notes || '',
      updatedAt: new Date().toISOString()
    };

    if (idx !== -1) {
      measurements[idx] = newMeas;
    } else {
      measurements.push(newMeas);
    }

    await writeSheetData('Measurements', measurements);
    return newMeas;
  },

  // Orders
  async getOrders() {
    return await getSheetData('Orders');
  },

  async addOrder(order) {
    const orders = await this.getOrders();
    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`, // Numeric order reference
      customerId: order.customerId,
      clothType: order.clothType,
      deliveryDate: order.deliveryDate,
      status: order.status || 'Received',
      totalAmount: Number(order.totalAmount) || 0,
      advancePayment: Number(order.advancePayment) || 0,
      remainingBalance: (Number(order.totalAmount) || 0) - (Number(order.advancePayment) || 0),
      notes: order.notes || '',
      referenceImages: order.referenceImages || [],
      createdAt: new Date().toISOString()
    };
    orders.push(newOrder);
    await writeSheetData('Orders', orders);

    // Log the advance payment as an income transaction if greater than 0
    if (newOrder.advancePayment > 0) {
      await this.addTransaction({
        orderId: newOrder.id,
        amount: newOrder.advancePayment,
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        description: `Advance for ${newOrder.clothType} (${newOrder.id})`
      });
    }

    return newOrder;
  },

  async updateOrder(id, updatedFields) {
    const orders = await this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');

    const oldOrder = orders[idx];

    // Compute finances
    const totalAmount = updatedFields.totalAmount !== undefined ? Number(updatedFields.totalAmount) : oldOrder.totalAmount;
    const advancePayment = updatedFields.advancePayment !== undefined ? Number(updatedFields.advancePayment) : oldOrder.advancePayment;
    const remainingBalance = totalAmount - advancePayment;

    // Handle completed payment transaction on status update to 'Delivered'
    if (updatedFields.status === 'Delivered' && oldOrder.status !== 'Delivered' && remainingBalance > 0) {
      // If the remaining balance gets cleared automatically upon delivery, pay it out
      await this.addTransaction({
        orderId: id,
        amount: remainingBalance,
        type: 'income',
        date: new Date().toISOString().split('T')[0],
        description: `Final balance payment for ${oldOrder.clothType} (${id})`
      });
    }

    orders[idx] = {
      ...oldOrder,
      clothType: updatedFields.clothType !== undefined ? updatedFields.clothType : oldOrder.clothType,
      deliveryDate: updatedFields.deliveryDate !== undefined ? updatedFields.deliveryDate : oldOrder.deliveryDate,
      status: updatedFields.status !== undefined ? updatedFields.status : oldOrder.status,
      totalAmount,
      advancePayment: updatedFields.status === 'Delivered' && remainingBalance > 0 ? totalAmount : advancePayment, // Autofill advance if delivered
      remainingBalance: updatedFields.status === 'Delivered' ? 0 : remainingBalance,
      notes: updatedFields.notes !== undefined ? updatedFields.notes : oldOrder.notes,
      referenceImages: updatedFields.referenceImages !== undefined ? updatedFields.referenceImages : oldOrder.referenceImages
    };

    await writeSheetData('Orders', orders);
    return orders[idx];
  },

  async deleteOrder(id) {
    let orders = await this.getOrders();
    orders = orders.filter(o => o.id !== id);
    await writeSheetData('Orders', orders);

    // Keep transactions for ledger but detach from order
    let transactions = await this.getTransactions();
    transactions = transactions.map(t => {
      if (t.orderId === id) {
        return { ...t, orderId: '' };
      }
      return t;
    });
    await writeSheetData('Transactions', transactions);
    return true;
  },

  // Finances
  async getTransactions() {
    return await getSheetData('Transactions');
  },

  async addTransaction(tx) {
    const transactions = await this.getTransactions();
    const newTx = {
      id: `TX-${Date.now()}`,
      orderId: tx.orderId || '',
      amount: Number(tx.amount) || 0,
      type: tx.type || 'income', // income or expense
      date: tx.date || new Date().toISOString().split('T')[0],
      description: tx.description || ''
    };
    transactions.push(newTx);
    await writeSheetData('Transactions', transactions);
    return newTx;
  }
};
