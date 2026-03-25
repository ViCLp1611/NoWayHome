// Script de prueba para verificar conexión a Supabase
// Ejecutar en la consola del navegador: http://localhost:5182/

import { supabase } from './src/lib/supabaseClient.js';

console.log('🔍 Probando conexión a Supabase...');

// Verificar configuración
const isConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('✅ Supabase configurado:', isConfigured);

// Probar conexión básica
async function testConnection() {
  try {
    const { data, error } = await supabase.from('administrador').select('count').limit(1);
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    console.log('✅ Conexión exitosa a Supabase');
    console.log('📊 Respuesta de prueba:', data);
    return true;
  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// Ejecutar prueba
testConnection();