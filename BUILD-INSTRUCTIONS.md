# 📦 Instrucciones para Crear el Ejecutable

El proyecto ya está configurado y listo para compilar. Solo necesitas ejecutar el comando con permisos de administrador.

## ⚠️ IMPORTANTE: Requiere permisos de administrador

Windows necesita permisos de administrador para crear enlaces simbólicos durante el proceso de compilación.

## 🚀 Pasos para compilar:

### Opción 1: PowerShell como Administrador (Recomendado)

1. **Abre PowerShell como Administrador**:
   - Presiona `Windows + X`
   - Selecciona "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

2. **Navega a la carpeta del proyecto**:
   ```powershell
   cd "C:\Users\Controlador\Desktop\prubasdeapi"
   ```

3. **Ejecuta el build**:
   ```powershell
   npm run build:win
   ```

### Opción 2: CMD como Administrador

1. **Abre CMD como Administrador**:
   - Presiona `Windows + R`
   - Escribe `cmd`
   - Presiona `Ctrl + Shift + Enter` (esto lo abre como admin)

2. **Navega a la carpeta del proyecto**:
   ```cmd
   cd /d "C:\Users\Controlador\Desktop\prubasdeapi"
   ```

3. **Ejecuta el build**:
   ```cmd
   npm run build:win
   ```

## ⏱️ Tiempo estimado

- Primera vez: **3-5 minutos** (descarga dependencias)
- Siguientes veces: **1-2 minutos**

## 📂 Archivos generados

Después de compilar, encontrarás los archivos en la carpeta `release/`:

- ✅ **API Monitor-Setup-1.0.0.exe** (~90 MB) - Instalador completo
- ✅ **API Monitor-Portable-1.0.0.exe** (~140 MB) - Versión portable

## 🎯 ¿Cuál usar?

### Instalador (Setup)
- Instala la aplicación en `C:\Program Files\API Monitor`
- Crea accesos directos en escritorio y menú inicio
- Incluye desinstalador
- Ideal para uso permanente

### Portable
- No requiere instalación
- Ejecutable único
- Ideal para llevar en USB
- Los datos se guardan en la misma carpeta

## 🔧 Scripts disponibles

```bash
npm run build:win       # Crea instalador + portable
npm run build:portable  # Solo portable
npm run build:electron  # Build completo
```

## ❌ Si tienes errores

### Error: "Cannot create symbolic link"
**Solución**: Debes ejecutar como administrador.

### Error: "EPERM: operation not permitted"
**Solución**: Cierra todas las instancias de la app y vuelve a intentar.

### Error: "Module not found"
**Solución**: Ejecuta primero `npm install`

## 📝 Personalizar antes de compilar

Si quieres cambiar la versión o nombre:

```json
// package.json
{
  "name": "api-monitor",
  "version": "1.0.0",  // ← Cambia aquí
  "productName": "API Monitor"  // ← Cambia aquí
}
```

## ✅ Verificar que el build funcionó

Después de compilar, verás:

```
✔ Building        target=nsis arch=x64
✔ Building        target=portable arch=x64
```

Y en la carpeta `release/` tendrás los archivos .exe

## 🎉 ¡Listo!

Ahora puedes distribuir el instalador o el portable a quien quieras.
El instalador incluye:
- ✅ Icono personalizado
- ✅ Accesos directos
- ✅ Desinstalador
- ✅ Detección automática de actualizaciones (si lo configuras)

---

**Creado por**: Claude Code
**Fecha**: 3 de noviembre de 2025
