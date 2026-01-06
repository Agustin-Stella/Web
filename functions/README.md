# Firebase Cloud Functions - Supabase Keep-Alive

Esta función mantiene activo tu proyecto de Supabase ejecutándose automáticamente cada 3 días.

## 📋 Qué hace

1. **Cada 72 horas** (3 días) se ejecuta automáticamente
2. **Elimina** archivos keepalive anteriores (no acumula datos)
3. **Crea** un nuevo archivo keepalive con timestamp
4. **Genera actividad** en Supabase → evita pausa por inactividad

## 🚀 Instalación y Deploy

### Paso 1: Instalar dependencias

```bash
cd functions
npm install
```

### Paso 2: Verificar que estás logueado en Firebase

```bash
firebase login
```

### Paso 3: Verificar proyecto activo

```bash
firebase use
```

Debería mostrar: `nikiforrajeria` (activo)

### Paso 4: Deploy de la función

```bash
# Volver a la raíz del proyecto
cd ..

# Deployar solo las functions
firebase deploy --only functions
```

El deploy puede tardar 1-2 minutos.

### Paso 5: Verificar que se deployó correctamente

Después del deploy deberías ver:

```
✔  functions[supabaseKeepAlive(southamerica-east1)] Successful create operation.
Function URL: https://southamerica-east1-nikiforrajeria.cloudfunctions.net/supabaseKeepAlive
```

## ✅ Verificar que funciona

### Ver logs en tiempo real

```bash
firebase functions:log
```

### Ver logs en la consola de Firebase

1. Andá a https://console.firebase.google.com
2. Seleccioná tu proyecto "nikiforrajeria"
3. Functions → Logs
4. Buscá "supabaseKeepAlive"

### Probar manualmente (opcional)

No hay forma fácil de ejecutar manualmente una función programada. La función se ejecutará automáticamente según el schedule configurado (cada 72 horas).

Para probar inmediatamente, podés:
1. Modificar temporalmente el schedule a `every 5 minutes`
2. Hacer deploy
3. Esperar 5 minutos
4. Ver los logs
5. Volver a cambiar a `every 72 hours`
6. Re-deployar

## 📅 Configuración del Schedule

En `index.js` línea 23:
```javascript
schedule: 'every 72 hours', // Cada 3 días
```

Otras opciones:
- `every 24 hours` - Cada día
- `every 48 hours` - Cada 2 días
- `every 5 days` - Cada 5 días
- `0 2 * * *` - Todos los días a las 2 AM (formato cron)

## 💰 Costos

**Plan Spark (Gratuito):**
- 2,000,000 invocaciones/mes
- 400,000 GB-segundos/mes
- 200,000 CPU-segundos/mes

**Tu uso estimado:**
- Ejecuciones por mes: ~10 (cada 3 días)
- Muy por debajo del límite gratuito ✅

## 🔍 Troubleshooting

### Error: "Missing required billing account"

Firebase Functions v2 requiere tener billing habilitado (aunque sea plan gratuito).

**Solución:**
1. Andá a https://console.firebase.google.com
2. Seleccioná tu proyecto
3. Upgrade a "Blaze Plan" (pay as you go)
4. No te van a cobrar mientras estés bajo los límites gratuitos
5. Podés configurar alertas de facturación para estar seguro

### Error: "Permission denied"

```bash
firebase login --reauth
```

### Ver si la función está activa

```bash
firebase functions:list
```

Deberías ver: `supabaseKeepAlive`

### Cambiar región

Por defecto está en `southamerica-east1` (São Paulo). Si querés cambiarlo:

En `index.js`, cambiá:
```javascript
region: 'us-central1', // Más barato pero más lejos
```

## 📊 Monitoreo

### Ver cuándo fue la última ejecución

```bash
firebase functions:log --only supabaseKeepAlive
```

### Ver próxima ejecución programada

No hay forma de ver esto desde Firebase CLI. La función se ejecutará cada 72 horas desde la última ejecución.

## 🗑️ Eliminar la función

Si querés desactivarla:

```bash
firebase functions:delete supabaseKeepAlive
```

## 🔐 Seguridad

Las credenciales de Supabase están hardcodeadas en el código porque son claves **públicas** (ANON_KEY). No son secretas y ya están expuestas en tu frontend.

Si necesitás usar credenciales privadas, usá Firebase Config:
```bash
firebase functions:config:set supabase.url="..." supabase.key="..."
```

## 📞 Soporte

Si tenés problemas:
1. Verificá los logs: `firebase functions:log`
2. Verificá que billing esté habilitado
3. Verificá que el proyecto sea el correcto: `firebase use`
