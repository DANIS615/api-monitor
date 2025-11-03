# 🔍 API Monitor - Monitor de APIs en Tiempo Real

<div align="center">

**Una aplicación de escritorio moderna para monitorear, probar y analizar APIs en tiempo real**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-28.3.3-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)](https://reactjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Descargar](#-descargar) • [Características](#-características) • [Instalación](#-instalación) • [Contribuir](#-contribuir)

</div>

---

## ✨ Características

### 🎯 Monitoreo de APIs
- ✅ **Monitoreo en tiempo real** - Ejecuta peticiones HTTP automáticamente en intervalos configurables
- ✅ **Múltiples métodos HTTP** - Soporte para GET, POST, PUT, DELETE, PATCH
- ✅ **Historial completo** - Registro detallado de todas las peticiones y respuestas
- ✅ **Estadísticas en vivo** - Success rate, tiempos de respuesta, y más
- ✅ **Notificaciones** - Alertas cuando una API falla

### 🔐 Autenticación Inteligente
- ✅ **Auth Normal** - Autenticación automática con credenciales (username/password)
- ✅ **Bearer Token** - Soporte para tokens JWT y Bearer tokens
- ✅ **Auto-renovación** - Renueva tokens automáticamente cuando expiran
- ✅ **Multi-API** - Configura diferentes autenticaciones para cada API
- ✅ **Limpieza automática** - Extrae tokens incluso si vienen con prefijo "bearer"

### 📊 Visualización y Análisis
- ✅ **Dashboard en tiempo real** - Visualiza el estado de todas tus APIs
- ✅ **Logs detallados** - Inspecciona headers, body, y respuestas completas
- ✅ **Exportar datos** - Guarda logs y configuraciones en JSON
- ✅ **Colecciones** - Organiza tus APIs en colecciones
- ✅ **Variables de entorno** - Define variables reutilizables

### 🛠️ Herramientas Avanzadas
- ✅ **Importar/Exportar** - Comparte configuraciones con tu equipo
- ✅ **Modo portable** - No requiere instalación
- ✅ **Persistencia local** - Todos tus datos se guardan localmente
- ✅ **Headers personalizados** - Configura headers en formato JSON
- ✅ **Body editor** - Editor JSON para POST/PUT/PATCH

## 🚀 Descargar

### Windows (10/11)

Descarga la última versión desde [Releases](../../releases/latest):

| Versión | Tamaño | Descripción |
|---------|--------|-------------|
| **Instalador** | ~76 MB | Instalación completa con accesos directos y desinstalador |
| **Portable** | ~76 MB | Ejecutable sin instalación, ideal para USB |

### Requisitos del Sistema

```
Mínimos:
✅ Windows 10 (build 17763+) / Windows 11
✅ 4 GB RAM
✅ 200 MB espacio en disco
✅ Conexión a internet

Recomendados:
⭐ Windows 10/11 (64-bit)
⭐ 8 GB RAM
⭐ Procesador dual-core 2.0 GHz+
```

## 💻 Instalación para Desarrollo

### Prerrequisitos

- [Node.js](https://nodejs.org/) v16 o superior
- [npm](https://www.npmjs.com/) v8 o superior
- [Git](https://git-scm.com/)

### Clonar y Configurar

```bash
# Clonar el repositorio
git clone https://github.com/TU-USUARIO/api-monitor.git
cd api-monitor

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Esto iniciará:
- ✅ Vite dev server en http://localhost:5173
- ✅ Servidor Express (opcional) en http://localhost:3000
- ✅ Aplicación Electron con hot-reload

### Compilar para Producción

```bash
# Build de Vite
npm run build

# Crear ejecutables Windows (requiere PowerShell como Administrador)
npm run build:win       # Crea instalador + portable
npm run build:portable  # Solo portable
```

Los archivos se generarán en `release/`

## 🏗️ Estructura del Proyecto

```
api-monitor/
├── build/                  # Recursos (iconos)
├── electron/               # Proceso principal Electron
│   ├── main.js            # Punto de entrada
│   └── preload.js         # Script de preload
├── src/                   # Código fuente React
│   ├── components/
│   │   └── ApiMonitor.jsx # Componente principal
│   ├── utils/
│   │   └── storage.js     # LocalStorage manager
│   ├── App.jsx
│   └── main.jsx
├── release/               # Ejecutables (generado)
├── dist/                  # Build Vite (generado)
└── package.json
```

## 📚 Guía de Uso

### 1. Configurar una API Básica

```javascript
Nombre: Mi API de Ventas
URL: http://localhost:5164/v1/api/Sales
Método: GET
Intervalo: 5 minutos
```

### 2. Configurar Autenticación

**Autenticación Normal (con credenciales):**

```json
Nombre: Smart Ventas Auth
Tipo: Normal (Auto - con credenciales)
Endpoint: http://localhost:5164/v1/api/User
Credenciales:
{
  "username": "next",
  "password": "123456"
}
Clave del token: token
```

**Autenticación Bearer (token fijo):**

```json
Nombre: Mi Token Fijo
Tipo: Bearer (Manual - token fijo)
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Asignar Auth a tu API

1. Edita tu API
2. Expande "Opciones Avanzadas"
3. Selecciona la autenticación configurada
4. Guarda

El monitor automáticamente:
- 🔐 Obtiene el token del endpoint de auth
- 🧹 Limpia el prefijo "bearer" si viene incluido
- ✅ Agrega `Authorization: Bearer <token>` a tus peticiones
- 🔄 Renueva el token cuando expira

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para más detalles.

### Formas de Contribuir

- 🐛 **Reportar bugs** - [Crear issue](../../issues/new)
- 💡 **Sugerir features** - [Discussions](../../discussions)
- 📝 **Mejorar docs** - PRs bienvenidos
- 🔧 **Código** - Fork → Feature branch → PR
- ⭐ **Dar estrella** - ¡Ayuda a que más gente descubra el proyecto!

### Proceso de Desarrollo

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: amazing feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🐛 Reportar Issues

[Crea un issue](../../issues/new) incluyendo:

- ✅ Descripción clara del problema
- ✅ Pasos para reproducir
- ✅ Comportamiento esperado vs actual
- ✅ Capturas de pantalla (si aplica)
- ✅ Versión de Windows y de la app

## 📋 Roadmap

- [ ] Soporte para macOS y Linux
- [ ] Gráficas de tiempo de respuesta en tiempo real
- [ ] Exportar reportes PDF/Excel
- [ ] Sincronización en la nube (opcional)
- [ ] Temas personalizables (dark/light)
- [ ] Plugin system
- [ ] Tests con certificados SSL personalizados
- [ ] Integración con CI/CD
- [ ] Webhooks para alertas
- [ ] GraphQL support

## 🛡️ Seguridad

- 🔒 **Datos locales**: Todo se almacena en tu computadora usando localStorage
- 🚫 **Sin servidores externos**: Nunca enviamos tus datos a ningún servidor
- 🔐 **Tokens seguros**: Los tokens solo se guardan localmente y se limpian al cerrar la app

Si encuentras una vulnerabilidad, repórtala de forma responsable creando un issue privado.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

```
MIT License - Puedes usar, modificar y distribuir libremente
```

## 👏 Agradecimientos

Construido con tecnologías increíbles:

- [Electron](https://www.electronjs.org/) - Framework para apps de escritorio
- [React](https://reactjs.org/) - Biblioteca UI
- [Vite](https://vitejs.dev/) - Build tool ultra-rápida
- [Axios](https://axios-http.com/) - Cliente HTTP
- [Chart.js](https://www.chartjs.org/) - Visualización de datos

## 💬 Comunidad y Soporte

- 📖 [Wiki](../../wiki) - Documentación completa
- 💬 [Discussions](../../discussions) - Preguntas y respuestas
- 🐛 [Issues](../../issues) - Reportar bugs
- ⭐ [Releases](../../releases) - Descargas

## 📊 Estadísticas del Proyecto

![GitHub stars](https://img.shields.io/github/stars/TU-USUARIO/api-monitor?style=social)
![GitHub forks](https://img.shields.io/github/forks/TU-USUARIO/api-monitor?style=social)
![GitHub issues](https://img.shields.io/github/issues/TU-USUARIO/api-monitor)
![GitHub pull requests](https://img.shields.io/github/issues-pr/TU-USUARIO/api-monitor)

---

<div align="center">

**Hecho con ❤️ por la comunidad open source**

Si este proyecto te ayudó, considera darle una ⭐

[⬆ Volver arriba](#-api-monitor---monitor-de-apis-en-tiempo-real)

</div>
