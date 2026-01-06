/**
 * Firebase Cloud Functions para Forrajeria Niki
 *
 * Función: supabaseKeepAlive
 * Mantiene activo el proyecto de Supabase ejecutándose cada 3 días
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://xuczvudiupfntxxmsbiu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3p2dWRpdXBmbnR4eG1zYml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzODgwNDksImV4cCI6MjA0OTk2NDA0OX0.sb_publishable_lA9GPzxFXn_1kbovhdFG6Q_NqtEJ9NE';
const BUCKET_NAME = 'productos';
const KEEPALIVE_PREFIX = 'keepalive_';

/**
 * Función programada que se ejecuta cada 3 días (cada 72 horas)
 * Mantiene activo el proyecto de Supabase para evitar que se pause por inactividad
 */
exports.supabaseKeepAlive = onSchedule({
  schedule: 'every 72 hours', // Cada 3 días
  timeZone: 'America/Argentina/Cordoba',
  memory: '256MiB',
  timeoutSeconds: 60,
  region: 'southamerica-east1', // São Paulo (más cercano a Argentina)
}, async (event) => {
  logger.info('🚀 Iniciando Supabase Keep-Alive...', {
    timestamp: new Date().toISOString(),
    scheduledTime: event.scheduleTime,
  });

  // Crear cliente de Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // 1. Listar archivos keepalive existentes
    logger.info('🔍 Buscando archivos keepalive anteriores...');

    const { data: files, error: listError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list('', {
        search: KEEPALIVE_PREFIX
      });

    if (listError) {
      logger.error('❌ Error al listar archivos:', listError);
      throw listError;
    }

    // 2. Eliminar archivos keepalive anteriores
    if (files && files.length > 0) {
      logger.info(`📋 Encontrados ${files.length} archivo(s) keepalive anterior(es)`);

      const filesToDelete = files.map(file => file.name);
      logger.info('🗑️  Eliminando archivos anteriores:', filesToDelete);

      const { error: deleteError } = await supabase
        .storage
        .from(BUCKET_NAME)
        .remove(filesToDelete);

      if (deleteError) {
        logger.error('❌ Error al eliminar archivos:', deleteError);
        // No lanzamos error aquí, continuamos con la creación del nuevo archivo
      } else {
        logger.info('✅ Archivos anteriores eliminados correctamente');
      }
    } else {
      logger.info('ℹ️  No se encontraron archivos keepalive anteriores');
    }

    // 3. Crear nuevo archivo keepalive
    const timestamp = Date.now();
    const filename = `${KEEPALIVE_PREFIX}${timestamp}.txt`;
    const content = `Keep-Alive ejecutado: ${new Date().toISOString()}\n` +
                   `Función: Firebase Cloud Functions\n` +
                   `Este archivo mantiene activo el proyecto de Supabase.\n` +
                   `Se regenera automáticamente cada 3 días (72 horas).\n` +
                   `Próxima ejecución aproximada: ${new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleString('es-AR')}`;

    logger.info(`📤 Subiendo nuevo archivo: ${filename}`);

    const { error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filename, content, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      logger.error('❌ Error al subir archivo:', uploadError);
      throw uploadError;
    }

    logger.info('✅ Nuevo archivo keepalive creado exitosamente');
    logger.info('🎉 Keep-Alive completado con éxito!');

    return {
      success: true,
      message: 'Keep-Alive ejecutado correctamente',
      file: filename,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('💥 Error inesperado en Keep-Alive:', error);
    throw error;
  }
});
