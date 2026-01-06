# Configuración de Supabase Keep-Alive

Este sistema mantiene activo tu proyecto de Supabase ejecutando una tarea automática cada 3 días.

## ✅ Qué hace

1. **Cada 3 días** se ejecuta automáticamente vía GitHub Actions
2. **Elimina** el archivo keepalive anterior (para no acumular datos)
3. **Crea** un nuevo archivo keepalive con timestamp
4. **Genera actividad** en Supabase para evitar que se pause por inactividad

## 🔧 Configuración (IMPORTANTE)

### Paso 1: Configurar GitHub Secrets

Para que funcione, necesitás agregar tus credenciales de Supabase como "secrets" en GitHub:

1. Andá a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, click en **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agregá estos dos secrets:

**Secret 1:**
- Name: `SUPABASE_URL`
- Value: `https://xuczvudiupfntxxmsbiu.supabase.co`

**Secret 2:**
- Name: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1Y3p2dWRpdXBmbnR4eG1zYml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzODgwNDksImV4cCI6MjA0OTk2NDA0OX0.sb_publishable_lA9GPzxFXn_1kbovhdFG6Q_NqtEJ9NE`

### Paso 2: Habilitar GitHub Actions

1. En tu repositorio, andá a la pestaña **Actions**
2. Si te pide permiso, click en **"I understand my workflows, go ahead and enable them"**

### Paso 3: Hacer push de los cambios

```bash
git add .github/
git commit -m "Agregar GitHub Action para Supabase Keep-Alive"
git push origin master
```

## 🧪 Probar manualmente

No necesitás esperar 3 días para probar. Podés ejecutarlo manualmente:

1. Andá a **Actions** en tu repositorio de GitHub
2. Click en **Supabase Keep-Alive** en el menú lateral
3. Click en **Run workflow** → **Run workflow**
4. Esperá 30-60 segundos
5. Deberías ver un ✅ verde indicando éxito

## 📅 Programación

- **Frecuencia:** Cada 3 días
- **Hora:** 2:00 AM UTC (11:00 PM hora Argentina)
- **Formato cron:** `0 2 */3 * *`

## 🔍 Verificar que funciona

### Opción 1: Ver logs en GitHub
1. Andá a **Actions**
2. Click en la ejecución más reciente
3. Deberías ver logs como:
   ```
   🚀 Iniciando Supabase Keep-Alive...
   ✅ Nuevo archivo keepalive creado exitosamente
   🎉 Keep-Alive completado con éxito!
   ```

### Opción 2: Ver archivo en Supabase
1. Andá a tu proyecto de Supabase
2. Storage → productos
3. Deberías ver un archivo llamado `keepalive_[timestamp].txt`

## ⚠️ Importante

- **No acumula datos:** El script elimina el archivo anterior antes de crear uno nuevo
- **Peso mínimo:** Cada archivo pesa menos de 1KB
- **No afecta tu app:** Los archivos keepalive no interfieren con las imágenes de productos
- **Gratis:** GitHub Actions es gratis para repositorios públicos (2000 minutos/mes en privados)

## 🛠️ Modificar la frecuencia

Si querés cambiar cada cuántos días se ejecuta, editá `.github/workflows/supabase-keepalive.yml`:

```yaml
schedule:
  - cron: '0 2 */3 * *'  # Cada 3 días
  # - cron: '0 2 */2 * *'  # Cada 2 días
  # - cron: '0 2 */5 * *'  # Cada 5 días
```

## ❓ Troubleshooting

### Error: "Bad credentials"
- Verificá que los secrets estén bien configurados en GitHub
- Asegurate de copiar las credenciales completas (sin espacios extras)

### Error: "Bucket not found"
- Verificá que el bucket "productos" exista en Supabase
- Verificá que sea público o que la key tenga permisos

### No se ejecuta automáticamente
- Verificá que GitHub Actions esté habilitado en tu repo
- Los cron jobs de GitHub Actions pueden tener hasta 15 minutos de delay

## 📞 Soporte

Si tenés problemas, revisá los logs en la pestaña Actions de GitHub.
