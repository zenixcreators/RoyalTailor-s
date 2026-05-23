import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Define schemas & fallback mock databases with exactly ONE clean example record as required
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  created_at?: string;
}

export interface Measurements {
  id?: string;
  customer_id: string;
  // Upper body
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  sleeve_length: number;
  arm_length: number;
  collar: number;
  neck: number;
  cuff: number;
  across_back: number;
  // Lower body
  inseam: number;
  outseam: number;
  thigh: number;
  knee: number;
  bottom_width: number;
  pant_length: number;
  // Additional
  height: number;
  weight: number;
  fitting_notes: string;
  style_notes: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  cloth_type: string;
  status: string;
  delivery_date: string;
  total_amount: number;
  advance_amount: number;
  remaining_amount: number;
  reference_images: string[];
  cloth_image?: string;
  quantity?: number;
  notes?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  notes: string;
  created_at?: string;
}

// Exactly ONE realistic tailoring example record per collection for production-ready minimal UI state
const EXAMPLE_CUST_ID = 'cust-example-uuid-1111';
const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: EXAMPLE_CUST_ID,
    name: 'Charles Sterling',
    phone: '+1 (555) 014-9988',
    address: '101 Luxury Way, Beverly Hills',
    notes: 'Bespoke tailoring customer. Favors light Italian fabrics.'
  }
];

const INITIAL_MEASUREMENTS: Measurements[] = [
  {
    customer_id: EXAMPLE_CUST_ID,
    shoulder: 18.5,
    chest: 40.0,
    waist: 34.0,
    hip: 41.0,
    sleeve_length: 25.0,
    arm_length: 31.0,
    collar: 15.5,
    neck: 15.5,
    cuff: 9.5,
    across_back: 17.5,
    inseam: 32.0,
    outseam: 42.0,
    thigh: 24.5,
    knee: 16.0,
    bottom_width: 8.5,
    pant_length: 41.0,
    height: 71.0,
    weight: 175.0,
    fitting_notes: 'Left shoulder sits 0.5 inches lower.',
    style_notes: 'Preferences: 2-button notch lapel blazer fit.'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-1001',
    customer_id: EXAMPLE_CUST_ID,
    cloth_type: 'Midnight Blue Navy Wool Blazer',
    status: 'Stitching',
    delivery_date: '2026-06-01',
    total_amount: 850,
    advance_amount: 300,
    remaining_amount: 550,
    reference_images: []
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-1001',
    title: 'Bespoke suit silk lining fabrics',
    amount: 120,
    notes: 'Premium silk fabric imported for orders.'
  }
];

// LocalStorage helpers to initialize Fallback Mode
function initializeLocalStorage() {
  if (!localStorage.getItem('rt_customers')) {
    localStorage.setItem('rt_customers', JSON.stringify(INITIAL_CUSTOMERS));
  }
  if (!localStorage.getItem('rt_measurements')) {
    localStorage.setItem('rt_measurements', JSON.stringify(INITIAL_MEASUREMENTS));
  }
  if (!localStorage.getItem('rt_orders')) {
    localStorage.setItem('rt_orders', JSON.stringify(INITIAL_ORDERS));
  }
  if (!localStorage.getItem('rt_expenses')) {
    localStorage.setItem('rt_expenses', JSON.stringify(INITIAL_EXPENSES));
  }
}

initializeLocalStorage();

const getLocal = <T>(key: string): T[] => {
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const setLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Database API CRUD Operations
export const dbService = {
  isConfigured() {
    return isSupabaseConfigured;
  },

  // --- CUSTOMERS ---
  async getCustomers(): Promise<Customer[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    return getLocal<Customer>('rt_customers').sort((a, b) => a.name.localeCompare(b.name));
  },

  async addCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customer.name,
          phone: customer.phone || '',
          address: customer.address || '',
          notes: customer.notes || '',
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocal<Customer>('rt_customers');
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
      created_at: new Date().toISOString()
    };
    local.push(newCust);
    setLocal('rt_customers', local);
    return newCust;
  },

  async updateCustomer(id: string, updatedFields: Partial<Customer>): Promise<Customer> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('customers')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocal<Customer>('rt_customers');
    const idx = local.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    local[idx] = { ...local[idx], ...updatedFields };
    setLocal('rt_customers', local);
    return local[idx];
  },

  async deleteCustomer(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
    let localCusts = getLocal<Customer>('rt_customers');
    localCusts = localCusts.filter(c => c.id !== id);
    setLocal('rt_customers', localCusts);

    let localMeas = getLocal<Measurements>('rt_measurements');
    localMeas = localMeas.filter(m => m.customer_id !== id);
    setLocal('rt_measurements', localMeas);

    let localOrders = getLocal<Order>('rt_orders');
    localOrders = localOrders.filter(o => o.customer_id !== id);
    setLocal('rt_orders', localOrders);
    return true;
  },

  // --- MEASUREMENTS ---
  async getMeasurements(customerId: string): Promise<Measurements> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('customer_id', customerId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
    } else {
      const local = getLocal<Measurements>('rt_measurements');
      const found = local.find(m => m.customer_id === customerId);
      if (found) return found;
    }

    // Return realistic empty tailoring measurement template values
    return {
      customer_id: customerId,
      shoulder: 0, chest: 0, waist: 0, hip: 0, sleeve_length: 0, arm_length: 0, collar: 0, neck: 0, cuff: 0, across_back: 0,
      inseam: 0, outseam: 0, thigh: 0, knee: 0, bottom_width: 0, pant_length: 0,
      height: 0, weight: 0, fitting_notes: '', style_notes: ''
    };
  },

  async saveMeasurements(customerId: string, measData: Omit<Measurements, 'customer_id'>): Promise<Measurements> {
    if (isSupabaseConfigured) {
      // Check if record exists
      const { data: existing } = await supabase
        .from('measurements')
        .select('id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('measurements')
          .update(measData)
          .eq('customer_id', customerId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('measurements')
          .insert([{ customer_id: customerId, ...measData }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }

    const local = getLocal<Measurements>('rt_measurements');
    const idx = local.findIndex(m => m.customer_id === customerId);
    const savedRecord = { customer_id: customerId, ...measData, created_at: new Date().toISOString() };
    if (idx !== -1) {
      local[idx] = savedRecord;
    } else {
      local.push(savedRecord);
    }
    setLocal('rt_measurements', local);
    return savedRecord;
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(o => ({
        ...o,
        reference_images: o.cloth_image ? [o.cloth_image] : []
      }));
    }
    return getLocal<Order>('rt_orders').sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  async addOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const totalAmount = Number(order.total_amount) || 0;
    const advanceAmount = Number(order.advance_amount) || 0;
    const remainingAmount = totalAmount - advanceAmount;
    const primaryImg = Array.isArray(order.reference_images) && order.reference_images.length > 0
      ? order.reference_images[0]
      : (order.cloth_image || '');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          customer_id: order.customer_id,
          cloth_type: order.cloth_type,
          quantity: order.quantity || 1,
          status: order.status || 'Received',
          delivery_date: order.delivery_date,
          total_amount: totalAmount,
          advance_amount: advanceAmount,
          remaining_amount: remainingAmount,
          cloth_image: primaryImg
        }])
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        reference_images: data.cloth_image ? [data.cloth_image] : []
      };
    }

    const local = getLocal<Order>('rt_orders');
    const newOrder: Order = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_id: order.customer_id,
      cloth_type: order.cloth_type,
      quantity: order.quantity || 1,
      status: order.status || 'Received',
      delivery_date: order.delivery_date,
      total_amount: totalAmount,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      cloth_image: primaryImg,
      reference_images: order.reference_images || [],
      created_at: new Date().toISOString()
    };
    local.push(newOrder);
    setLocal('rt_orders', local);
    return newOrder;
  },

  async updateOrder(id: string, updatedFields: Partial<Order>): Promise<Order> {
    if (isSupabaseConfigured) {
      const { data: old } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      const total = updatedFields.total_amount !== undefined ? Number(updatedFields.total_amount) : Number(old.total_amount);
      const advance = updatedFields.advance_amount !== undefined ? Number(updatedFields.advance_amount) : Number(old.advance_amount);
      const isDelivered = updatedFields.status === 'Delivered';

      const finalAdvance = isDelivered ? total : advance;
      const finalRemaining = isDelivered ? 0 : (total - finalAdvance);

      const fieldsToSave: any = {
        ...updatedFields,
        advance_amount: finalAdvance,
        remaining_amount: finalRemaining
      };

      if ('reference_images' in fieldsToSave) {
        fieldsToSave.cloth_image = Array.isArray(fieldsToSave.reference_images) && fieldsToSave.reference_images.length > 0
          ? fieldsToSave.reference_images[0]
          : '';
        delete fieldsToSave.reference_images;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(fieldsToSave)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return {
        ...data,
        reference_images: data.cloth_image ? [data.cloth_image] : []
      };
    }

    const local = getLocal<Order>('rt_orders');
    const idx = local.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Order not found');
    const oldOrder = local[idx];

    const total = updatedFields.total_amount !== undefined ? Number(updatedFields.total_amount) : oldOrder.total_amount;
    const advance = updatedFields.advance_amount !== undefined ? Number(updatedFields.advance_amount) : oldOrder.advance_amount;
    const isDelivered = updatedFields.status === 'Delivered';

    const finalAdvance = isDelivered ? total : advance;
    const finalRemaining = isDelivered ? 0 : (total - finalAdvance);

    local[idx] = {
      ...oldOrder,
      ...updatedFields,
      advance_amount: finalAdvance,
      remaining_amount: finalRemaining
    };
    setLocal('rt_orders', local);
    return local[idx];
  },

  async deleteOrder(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
    let local = getLocal<Order>('rt_orders');
    local = local.filter(o => o.id !== id);
    setLocal('rt_orders', local);
    return true;
  },

  // --- EXPENSES ---
  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    return getLocal<Expense>('rt_expenses').sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  async addExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          title: expense.title,
          amount: Number(expense.amount) || 0,
          notes: expense.notes || ''
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const local = getLocal<Expense>('rt_expenses');
    const newExp: Expense = {
      id: `EXP-${Date.now()}`,
      title: expense.title,
      amount: Number(expense.amount) || 0,
      notes: expense.notes || '',
      created_at: new Date().toISOString()
    };
    local.push(newExp);
    setLocal('rt_expenses', local);
    return newExp;
  },

  async deleteExpense(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    }
    let local = getLocal<Expense>('rt_expenses');
    local = local.filter(e => e.id !== id);
    setLocal('rt_expenses', local);
    return true;
  },

  // --- CONSOLIDATED FINANCES ---
  async getFinances() {
    const [orders, expenses] = await Promise.all([
      this.getOrders(),
      this.getExpenses()
    ]);

    let totalRevenue = 0;
    let pendingPayments = 0;

    orders.forEach(o => {
      // Paid revenues are advances + full payments (advance is updated to total upon delivery)
      totalRevenue += Number(o.advance_amount) || 0;
      // Pending receivables on current orders
      pendingPayments += Number(o.remaining_amount) || 0;
    });

    let totalExpenses = 0;
    expenses.forEach(e => {
      totalExpenses += Number(e.amount) || 0;
    });

    return {
      summary: {
        totalRevenue,
        pendingPayments,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses
      },
      expenses,
      orders
    };
  }
};
