# Claude Code Infrastructure

Configuración de Claude Code para el proyecto API Monitor, con auto-activación de skills basada en el contexto del trabajo.

## Estructura

```
.claude/
├── hooks/                  # Hooks de auto-activación
│   ├── skill-activation-prompt.sh    # Analiza prompts y sugiere skills
│   ├── skill-activation-prompt.ts    # Lógica de activación
│   ├── post-tool-use-tracker.sh      # Rastrea archivos editados
│   └── package.json                  # Dependencias de los hooks
├── skills/                 # Skills del proyecto
│   ├── electron-react-app/ # Patrones de Electron + React
│   ├── api-monitoring/     # Patrones de monitoreo de APIs
│   └── skill-rules.json    # Configuración de triggers
├── settings.json           # Configuración principal
└── agents/                 # Agentes especializados (opcional)
```

## Skills Disponibles

### electron-react-app
**Triggers:** Electron, React, BrowserWindow, IPC, Vite
**Purpose:** Patrones de desarrollo para aplicaciones desktop con Electron + React

### api-monitoring
**Triggers:** API, endpoint, monitor, axios, Bearer token, authentication
**Purpose:** Patrones de monitoreo, autenticación y testing de APIs

## Configuración

El archivo `skill-rules.json` define cuándo cada skill debe activarse automáticamente basándose en:
- **Keywords**: Palabras clave en los prompts del usuario
- **Intent Patterns**: Expresiones regulares que detectan intención
- **File Triggers**: Patrones de rutas y contenido de archivos

## Uso

Los hooks se ejecutan automáticamente cuando:
1. El usuario envía un prompt (UserPromptSubmit)
2. Se usa una herramienta de edición (PostToolUse)

Los skills se sugieren basándose en el contexto y el contenido del trabajo.

## Personalización

Para agregar un nuevo skill:
1. Crear directorio en `.claude/skills/`
2. Agregar `SKILL.md` con la documentación
3. Actualizar `skill-rules.json` con triggers

## Referencias

- [Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase)
- [Claude Code Documentation](https://docs.claude.ai)

