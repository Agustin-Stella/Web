/**
 * Script para mantener activo el proyecto de Supabase
 * Se ejecuta cada 3 días vía GitHub Actions
 *
 * Funcionamiento:
 * 1. Lista todos los archivos keepalive anteriores
 * 2. Los elimina para no acumular datos
 * 3. Sube un nuevo archivo keepalive con timestamp
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xuczvudiupfntxxmsbiu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3p2dWRpdXBmbnR4eG1zYml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzODgwNDksImV4cCI6MjA0OTk2NDA0OX0.sb_publishable_lA9GPzxFXn_1kbovhdFG6Q_NqtEJ9NE';
const BUCKET_NAME = 'productos';
const KEEPALIVE_PREFIX = 'keepalive_';

async function main() {
  console.log('🚀 Iniciando Supabase Keep-Alive...');
  console.log(`📅 Fecha: ${new Date().toISOString()}\n`);

  // Crear cliente de Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // 1. Listar archivos keepalive existentes
    console.log('🔍 Buscando archivos keepalive anteriores...');
    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: KEEPALIVE_PREFIX
      });

    if (listError) {
      console.error('❌ Error al listar archivos:', listError.message);
    } else if (files && files.length > 0) {
      console.log(`📋 Encontrados ${files.length} archivo(s) keepalive anterior(es)`);

      // 2. Eliminar archivos anteriores
      const filesToDelete = files.map(file => file.name);
      console.log('🗑️  Eliminando archivos anteriores:', filesToDelete);

      const { error: deleteError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        console.error('❌ Error al eliminar archivos:', deleteError.message);
      } else {
        console.log('✅ Archivos anteriores eliminados correctamente');
      }
    } else {
      console.log('ℹ️  No se encontraron archivos keepalive anteriores');
    }

    // 3. Subir nuevo archivo keepalive
    const timestamp = Date.now();
    const filename = `${KEEPALIVE_PREFIX}${timestamp}.txt`;
    const content = `Keep-Alive ejecutado: ${new Date().toISOString()}\n` +
                   `Este archivo mantiene activo el proyecto de Supabase.\n` +
                   `Se regenera automáticamente cada 3 días.`;

    console.log(`\n📤 Subiendo nuevo archivo: ${filename}`);

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filename, content, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error al subir archivo:', uploadError.message);
      process.exit(1);
    }

    console.log('✅ Nuevo archivo keepalive creado exitosamente');
    console.log('\n🎉 Keep-Alive completado con éxito!');
    console.log(`⏰ Próxima ejecución en 3 días (${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()})`);

  } catch (error) {
    console.error('💥 Error inesperado:', error);
    process.exit(1);
  }
}

main();
