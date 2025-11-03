---
name: electron-react-app
description: Electron + React development patterns for desktop applications
---

# Electron React App Patterns

## Purpose

Guidelines for building desktop applications with Electron and React using Vite.

## When to Use This Skill

This skill activates when working with:
- Electron BrowserWindow configuration
- React component development in Electron
- IPC communication between main and renderer
- Vite build configuration
- Electron-store for data persistence
- contextIsolation setup

## Quick Reference

### BrowserWindow Configuration

```javascript
const mainWindow = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    nodeIntegration: false,
    contextIsolation: true
  },
  autoHideMenuBar: true,
  icon: path.join(__dirname, '../build/logo.ico'),
  title: 'API Monitor'
});
```

### DevTools in Development

```javascript
mainWindow.once('ready-to-show', () => {
  mainWindow.show();
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
});
```

### React Components

- Use functional components with hooks
- localStorage for client-side persistence
- useEffect for side effects
- useState for local state

### Vite Configuration

```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

## Best Practices

1. **Security**: Always use `contextIsolation: true` and `nodeIntegration: false`
2. **DevTools**: Only open in development mode
3. **Icons**: Use `.ico` for Windows, `.icns` for macOS
4. **Menu Bar**: Hide by default for cleaner UI
5. **Preload Scripts**: Use for secure IPC communication
6. **Data Persistence**: Use electron-store or localStorage
7. **State Management**: Keep it simple with useState/useEffect
8. **File Operations**: Perform in main process, not renderer

## Common Patterns

### State Persistence

```javascript
// Load on mount
useEffect(() => {
  const saved = localStorage.getItem('myData');
  if (saved) setData(JSON.parse(saved));
}, []);

// Save on change
useEffect(() => {
  localStorage.setItem('myData', JSON.stringify(data));
}, [data]);
```

### IPC Communication

```javascript
// preload.js
window.electronAPI = {
  sendMessage: (data) => ipcRenderer.send('message', data),
  onReply: (callback) => ipcRenderer.on('reply', callback)
};

// main.js
ipcMain.on('message', (event, data) => {
  // Handle message
  event.reply('reply', responseData);
});
```

## Troubleshooting

- **DevTools not opening**: Check `isDev` detection
- **Window not showing**: Verify `ready-to-show` event
- **Assets not loading**: Check public directory and paths
- **IPC not working**: Ensure preload script loaded correctly
- **White screen**: Check for console errors, verify React render

