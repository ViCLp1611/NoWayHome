import { supabase } from '../lib/supabaseClient.js';

// Servicio de Usuario - Maneja la lógica de negocio para usuarios
class UserService {
  constructor() {
    this.userFallback = [
      {
        id: '1',
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '+34 645 678 901',
        role: 'host',
        status: 'active',
        registeredDate: '2024-01-15',
        properties: 3,
      },
      {
        id: '2',
        name: 'Carlos Ruiz',
        email: 'carlos.ruiz@email.com',
        phone: '+34 612 345 678',
        role: 'guest',
        status: 'active',
        registeredDate: '2024-02-20',
        properties: 0,
      },
      {
        id: '3',
        name: 'Ana Martínez',
        email: 'ana.martinez@email.com',
        phone: '+34 634 567 890',
        role: 'host',
        status: 'active',
        registeredDate: '2023-11-10',
        properties: 5,
      },
    ];
  }

  isSupabaseConfigured() {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }

  normalizeUserRow(user) {
    if (!user) return null;
    return {
      id: String(user.id),
      name: user.name || user.nombre || '',
      email: user.email || user.correo || '',
      phone: user.phone || user.telefono || '',
      role: user.role || user.tipo || 'guest',
      status: user.status || user.estado || 'active',
      registeredDate: user.registered_date || user.registeredDate || user.created_at || new Date().toISOString(),
      properties: Number.isFinite(user.properties) ? user.properties : 0,
    };
  }

  async getAllUsersService() {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Supabase getAllUsersService error:', error);
      } else if (data) {
        return data.map((user) => this.normalizeUserRow(user));
      }
    }
    return this.userFallback;
  }

  async deleteUserService(id) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteUserService error:', error);
        throw error;
      }
      return data;
    }
    this.userFallback = this.userFallback.filter((u) => u.id !== id);
    return { id };
  }

  async updateUserService(id, payload) {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single();
      if (error) {
        console.error('Supabase updateUserService error:', error);
        throw error;
      }
      return this.normalizeUserRow(data);
    }
    this.userFallback = this.userFallback.map((u) => (u.id === id ? { ...u, ...payload } : u));
    return this.userFallback.find((u) => u.id === id);
  }

  async toggleUserStatusService(id) {
    if (this.isSupabaseConfigured()) {
      const { data: existing, error: selectError } = await supabase.from('users').select('status').eq('id', id).single();
      if (selectError) {
        throw selectError;
      }
      const nextStatus = existing.status === 'active' ? 'suspended' : 'active';
      const { data, error } = await supabase.from('users').update({ status: nextStatus }).eq('id', id).select().single();
      if (error) {
        throw error;
      }
      return this.normalizeUserRow(data);
    }
    const userIndex = this.userFallback.findIndex((u) => u.id === id);
    if (userIndex === -1) throw new Error('Usuario no encontrado');
    this.userFallback[userIndex].status = this.userFallback[userIndex].status === 'active' ? 'suspended' : 'active';
    return this.userFallback[userIndex];
  }
}

export const userService = new UserService();
