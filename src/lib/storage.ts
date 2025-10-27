// Simple localStorage wrapper for data persistence
export const storage = {
  async get(key: string) {
    try {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  },

  async delete(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }
};

// Make storage available globally for compatibility
if (typeof window !== 'undefined') {
  (window as any).storage = storage;
}
