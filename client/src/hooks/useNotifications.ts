import { useState, useEffect, useCallback } from 'react';
import { dbService, type Order, type Customer } from '../services/dbService';
import { notificationService, type AppNotification } from '../services/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tomorrowOrders, setTomorrowOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to format local tomorrow date YYYY-MM-DD
  const getTomorrowDateString = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getCustomerName = useCallback((customerId: string, clientList: Customer[]) => {
    return clientList.find(c => c.id === customerId)?.name || 'Guest Customer';
  }, []);

  const runSmartReminders = useCallback(async (
    activeOrders: Order[],
    clientList: Customer[],
    existingNotifs: AppNotification[]
  ) => {
    const tomorrow = getTomorrowDateString();
    
    // Find active orders due tomorrow (exclude 'Delivered')
    const dueTomorrow = activeOrders.filter(
      o => o.delivery_date === tomorrow && o.status !== 'Delivered'
    );

    setTomorrowOrders(dueTomorrow);

    if (dueTomorrow.length === 0) return existingNotifs;

    const notifTitle = `Delivery Reminder - ${tomorrow}`;
    const existingReminders = existingNotifs.filter(n => n.title === notifTitle);

    let expectedMessage = '';
    if (dueTomorrow.length === 1) {
      const order = dueTomorrow[0];
      const name = getCustomerName(order.customer_id, clientList);
      expectedMessage = `Tomorrow delivery: ${order.quantity || 1}x ${order.cloth_type} for ${name}`;
    } else {
      expectedMessage = `${dueTomorrow.length} pending deliveries due tomorrow`;
    }

    // Check if notification already exists
    if (existingReminders.length === 0) {
      // Create new grouped smart notification
      const newNotif = await notificationService.createNotification(notifTitle, expectedMessage);
      return [newNotif, ...existingNotifs];
    } else {
      const reminder = existingReminders[0];
      // If the number of tomorrow's active deliveries changed, update the message
      if (reminder.message !== expectedMessage) {
        await notificationService.deleteNotification(reminder.id);
        const updatedNotif = await notificationService.createNotification(notifTitle, expectedMessage);
        return [
          updatedNotif,
          ...existingNotifs.filter(n => n.id !== reminder.id)
        ];
      }
    }
    return existingNotifs;
  }, [getCustomerName]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [allNotifs, allOrders, allCusts] = await Promise.all([
        notificationService.getNotifications(),
        dbService.getOrders(),
        dbService.getCustomers()
      ]);

      setCustomers(allCusts);

      // Analyze and trigger automated smart grouped reminders
      const finalizedNotifs = await runSmartReminders(allOrders, allCusts, allNotifs);
      setNotifications(finalizedNotifs);
    } catch (err) {
      console.error('Error fetching notification state:', err);
    } finally {
      setLoading(false);
    }
  }, [runSmartReminders]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markAsRead = async (id: string) => {
    const success = await notificationService.markAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await notificationService.markAllAsRead();
    if (success) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const deleteNotification = async (id: string) => {
    const success = await notificationService.deleteNotification(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    tomorrowOrders,
    customers,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchAll
  };
};
