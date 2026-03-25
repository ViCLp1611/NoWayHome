const ADMIN_ACTIVITY_STORAGE_KEY = 'nowayhome_admin_activity_v1';
const MAX_ACTIVITY_ITEMS = 50;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
};

const safeParse = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getAdminActivityLog = (limit = 20) => {
  const storage = getStorage();
  if (!storage) return [];

  const rows = safeParse(storage.getItem(ADMIN_ACTIVITY_STORAGE_KEY) || '[]');
  return rows.slice(0, limit);
};

export const recordAdminActivity = ({ type, user, status = 'success', source = 'admin' }) => {
  const storage = getStorage();
  if (!storage) return;

  const nextItem = {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: String(type || 'Movimiento').trim(),
    user: String(user || 'Sin detalle').trim(),
    status: status === 'warning' ? 'warning' : 'success',
    source: String(source || 'admin').trim(),
    timeISO: new Date().toISOString(),
  };

  const currentRows = safeParse(storage.getItem(ADMIN_ACTIVITY_STORAGE_KEY) || '[]');
  const nextRows = [nextItem, ...currentRows].slice(0, MAX_ACTIVITY_ITEMS);

  storage.setItem(ADMIN_ACTIVITY_STORAGE_KEY, JSON.stringify(nextRows));

  window.dispatchEvent(new CustomEvent('admin-activity-updated', { detail: nextItem }));
};
