# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a API Monitor! Este documento te guiará en el proceso.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Guía de Estilo](#guía-de-estilo)
- [Estructura de Commits](#estructura-de-commits)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Features](#sugerir-features)

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas un ambiente respetuoso y profesional.

## 🎯 ¿Cómo puedo contribuir?

### 🐛 Reportar Bugs

Si encuentras un bug:

1. **Verifica** que no exista un issue similar
2. **Abre un nuevo issue** con el template de bug
3. **Incluye**:
   - Descripción clara y concisa
   - Pasos para reproducir
   - Comportamiento esperado vs actual
   - Capturas de pantalla
   - Versión de Windows y de la app
   - Logs de consola (F12 en la app)

### 💡 Sugerir Features

Para sugerir nuevas características:

1. **Verifica** que no exista una sugerencia similar
2. **Abre un nuevo issue** con el label "enhancement"
3. **Describe**:
   - El problema que resuelve
   - La solución propuesta
   - Alternativas consideradas
   - Mockups o ejemplos (si aplica)

### 🔧 Pull Requests

¡Los PRs son bienvenidos! Sigue estos pasos:

1. Fork el repositorio
2. Crea tu rama desde `main`
3. Haz tus cambios
4. Asegúrate de que el código funcione
5. Commit con mensajes descriptivos
6. Push a tu fork
7. Abre un Pull Request

## 🛠️ Proceso de Desarrollo

### Setup Inicial

```bash
# Fork y clona el repo
git clone https://github.com/TU-USUARIO/api-monitor.git
cd api-monitor

# Instala dependencias
npm install

# Ejecuta en modo desarrollo
npm run dev
```

### Estructura de Ramas

- `main` - Código estable y listo para producción
- `develop` - Desarrollo activo
- `feature/nombre-feature` - Nuevas características
- `fix/nombre-bug` - Corrección de bugs
- `docs/descripcion` - Mejoras de documentación

### Flujo de Trabajo

```bash
# 1. Crea una nueva rama
git checkout -b feature/mi-nueva-feature

# 2. Haz tus cambios
# ... edita archivos ...

# 3. Commit
git add .
git commit -m "Add: descripción clara del cambio"

# 4. Push
git push origin feature/mi-nueva-feature

# 5. Abre un PR en GitHub
```

## 🎨 Guía de Estilo

### JavaScript/React

- **Usa funciones de flecha** para componentes
- **Hooks** sobre class components
- **Nombres descriptivos** para variables y funciones
- **Comentarios** para lógica compleja
- **ESLint**: El código debe pasar el linter

```javascript
// ✅ Bueno
const handleAddApi = () => {
  if (!newApi.name || !newApi.url) {
    alert('⚠️ Por favor completa los campos requeridos');
    return;
  }
  // ... lógica ...
};

// ❌ Malo
const h = () => {
  if (!n || !u) alert('Error');
  // ... lógica ...
};
```

### CSS

- **Nombres de clase** descriptivos y en kebab-case
- **Variables CSS** para colores y tamaños recurrentes
- **Mobile-first** cuando sea posible

```css
/* ✅ Bueno */
.api-item {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 8px;
}

/* ❌ Malo */
.ai {
  background: #1e1e1e;
  padding: 16px;
}
```

## 📝 Estructura de Commits

Usa el formato de [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos

- `Add:` - Nueva funcionalidad
- `Fix:` - Corrección de bug
- `Docs:` - Cambios en documentación
- `Style:` - Cambios de formato (no afectan código)
- `Refactor:` - Refactorización de código
- `Test:` - Agregar o modificar tests
- `Chore:` - Tareas de mantenimiento

### Ejemplos

```bash
# Nueva funcionalidad
git commit -m "Add: soporte para GraphQL queries"

# Bug fix
git commit -m "Fix: error al guardar autenticaciones con espacios"

# Documentación
git commit -m "Docs: actualizar README con ejemplos de uso"

# Refactor
git commit -m "Refactor: simplificar lógica de autenticación"
```

## 🧪 Testing

Antes de enviar tu PR:

1. **Prueba manualmente** todas las funciones afectadas
2. **Verifica** que no rompiste nada existente
3. **Ejecuta** la app en modo desarrollo y producción
4. **Revisa** que no haya errores en consola

```bash
# Modo desarrollo
npm run dev

# Build de producción
npm run build
npm run preview

# Build de ejecutable (como admin)
npm run build:win
```

## 📦 Agregar Dependencias

Si necesitas agregar una dependencia:

1. **Justifica** por qué es necesaria
2. **Verifica** que sea mantenida activamente
3. **Considera** el tamaño del bundle
4. **Documenta** su uso

```bash
# Dependencias de producción
npm install nombre-paquete

# Dependencias de desarrollo
npm install -D nombre-paquete
```

## ✅ Checklist antes del PR

- [ ] El código funciona correctamente
- [ ] No hay errores en consola
- [ ] Los commits siguen la convención
- [ ] La documentación está actualizada
- [ ] El código sigue la guía de estilo
- [ ] Se probó en Windows 10/11
- [ ] No se incluyeron archivos innecesarios

## 📞 Preguntas

¿Tienes dudas? Abre un issue con la etiqueta "question" o únete a [Discussions](https://github.com/TU-USUARIO/api-monitor/discussions).

## 🙏 Reconocimientos

Todos los contribuidores serán reconocidos en el README. ¡Gracias por tu aporte!

---

**¡Feliz coding! 🚀**
