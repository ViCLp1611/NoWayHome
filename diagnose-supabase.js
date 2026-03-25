// Script para diagnosticar conexión a Supabase
// Ejecutar en la consola del navegador: http://localhost:5183/

import { supabase } from './src/lib/supabaseClient.js';

console.log('🔍 Diagnosticando conexión a Supabase...');

// 1. Verificar configuración
console.log('📋 Configuración:');
console.log('- URL configurada:', !!import.meta.env.VITE_SUPABASE_URL);
console.log('- Key configurada:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

// 2. Probar conexión básica
async function testConnection() {
  try {
    console.log('🔗 Probando conexión básica...');

    // Intentar consultar una tabla que debería existir por defecto
    const { data, error } = await supabase.from('administrador').select('count').limit(1);

    if (error) {
      console.error('❌ Error al consultar administrador:', error);

      // Si falla, intentar listar tablas disponibles
      console.log('📊 Intentando listar tablas disponibles...');
      try {
        const { data: tables, error: tableError } = await supabase.rpc('get_table_list');
        if (tableError) {
          console.log('⚠️ No se pudo listar tablas automáticamente');
          console.log('💡 Solución: Crear tabla administrador en Supabase SQL Editor');
        } else {
          console.log('📋 Tablas encontradas:', tables);
        }
      } catch (e) {
        console.log('⚠️ Función RPC no disponible');
      }

      return false;
    }

    console.log('✅ Conexión exitosa. Tabla administrador encontrada');
    console.log('📊 Respuesta:', data);
    return true;

  } catch (err) {
    console.error('❌ Error inesperado:', err);
    return false;
  }
}

// 3. Probar consulta específica
async function testAdminLogin() {
  try {
    console.log('🔐 Probando login de admin...');

    const { data, error } = await supabase
      .from('administrador')
      .select('*')
      .eq('correo', 'admin@nowayhome.com')
      .eq('contrasena', 'admin123')
      .single();

    if (error) {
      console.error('❌ Error en login:', error);
      return false;
    }

    console.log('✅ Login exitoso:', data);
    return true;

  } catch (err) {
    console.error('❌ Error en login:', err);
    return false;
  }
}

// Ejecutar pruebas
setTimeout(async () => {
  await testConnection();
  setTimeout(async () => {
    await testAdminLogin();
  }, 1000);
}, 1000);