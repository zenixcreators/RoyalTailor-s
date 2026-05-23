import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at?: string;
}

// Exactly one initial notification for first load matching our luxury minimal presentation
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-welcome-101',
    title: 'Assistant Configured',
    message: 'Welcome to Royal Tailor Assistant. Active stitching deliveries will remind you here.',
    is_read: false,
    created_at: new Date().toISOString()
  }
];

function initializeLocalStorage() {
  if (!localStorage.getItem('rt_notifications')) {
    localStorage.setItem('rt_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
  }
}

initializeLocalStorage();

const getLocal = (): AppNotification[] => {
  return JSON.parse(localStorage.getItem('rt_notifications') || '[]');
};

const setLocal = (data: AppNotification[]) => {
  localStorage.setItem('rt_notifications', JSON.stringify(data));
};

export const notificationService = {
  async getNotifications(): Promise<AppNotification[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase notifications fetch failed, using local storage fallback:', err);
      }
    }
    return getLocal().sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  },

  async createNotification(title: string, message: string): Promise<AppNotification> {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert([{
            title,
            message,
            is_read: false
          }])
          .select()
          .single();
        if (error) throw error;
        if (data) return data;
      } catch (err) {
        console.warn('Supabase notification insertion failed (likely RLS policy), falling back to local database:', err);
      }
    }

    const local = getLocal();
    local.push(newNotif);
    setLocal(local);
    return newNotif;
  },

  async markAsRead(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase notifications update failed, updating local storage:', err);
      }
    }

    const local = getLocal();
    const idx = local.findIndex(n => n.id === id);
    if (idx !== -1) {
      local[idx].is_read = true;
      setLocal(local);
      return true;
    }
    return false;
  },

  async markAllAsRead(): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase notifications bulk update failed, updating local storage:', err);
      }
    }

    const local = getLocal();
    const updated = local.map(n => ({ ...n, is_read: true }));
    setLocal(updated);
    return true;
  },

  async deleteNotification(id: string): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      } catch (err) {
        console.warn('Supabase notification deletion failed, removing from local storage:', err);
      }
    }

    let local = getLocal();
    local = local.filter(n => n.id !== id);
    setLocal(local);
    return true;
  }
};
