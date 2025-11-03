import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { storage } from '../utils/storage';
import './ApiMonitor.css';

const ApiMonitor = () => {
  const [apiConfigs, setApiConfigs] = useState([]);
  const [authConfigs, setAuthConfigs] = useState([]);
  const [collections, setCollections] = useState([]);
  const [newApi, setNewApi] = useState({
    name: '',
    url: '',
    method: 'GET',
    headers: '',
    body: '',
    interval: 5,
    intervalUnit: 'minutes',
    enabled: false,
    saveLogs: false,
    authId: '', // Referencia a una auth config
    collectionId: '' // Referencia a una colección
  });
  const [newAuth, setNewAuth] = useState({
    name: '',
    authType: 'normal', // 'normal' (obtiene token automático) o 'bearer' (token fijo)
    endpoint: '',
    body: '',
    tokenKey: 'token',
    headers: '' // Para auth bearer (token fijo manual)
  });
  const [selectedApi, setSelectedApi] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [editingApi, setEditingApi] = useState(null);
  const [editingAuth, setEditingAuth] = useState(null);
  const [apiStatus, setApiStatus] = useState({});
  const [apiTokens, setApiTokens] = useState({});
  const [showAuthSection, setShowAuthSection] = useState(false);
  const [envVars, setEnvVars] = useState([]);
  const [showEnvSection, setShowEnvSection] = useState(false);
  const [newEnvVar, setNewEnvVar] = useState({ key: '', value: '' });
  const [editingEnvVar, setEditingEnvVar] = useState(null);
  const [showCollectionSection, setShowCollectionSection] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: '' });
  const [editingCollection, setEditingCollection] = useState(null);
  const [expandedCollections, setExpandedCollections] = useState({});
  const [showCharts, setShowCharts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showToken, setShowToken] = useState({});
  const [showTokenEdit, setShowTokenEdit] = useState({});
  const intervalsRef = useRef({});

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedConfigs = storage.load('apiConfigs', []);
    const savedAuths = storage.load('authConfigs', []);
    const savedLogs = storage.load('apiLogs', []);
    const savedEnvVars = storage.load('envVars', []);
    const savedCollections = storage.load('collections', []);
    const savedHistory = storage.load('history', []);
    setApiConfigs(savedConfigs);
    setAuthConfigs(savedAuths);
    setLogs(savedLogs);
    setEnvVars(savedEnvVars);
    setCollections(savedCollections);
    setHistory(savedHistory);
    
    // Inicializar status para cada API
    const initialStatus = {};
    savedConfigs.forEach(api => {
      initialStatus[api.id] = { lastStatus: 'unknown' };
    });
    setApiStatus(initialStatus);
  }, []);

  // Guardar configs cuando cambien
  useEffect(() => {
    if (apiConfigs.length > 0) {
      storage.save('apiConfigs', apiConfigs);
    }
  }, [apiConfigs]);

  // Guardar auth configs cuando cambien
  useEffect(() => {
    storage.save('authConfigs', authConfigs);
  }, [authConfigs]);

  // Guardar env vars cuando cambien
  useEffect(() => {
    if (envVars.length > 0) {
      storage.save('envVars', envVars);
    }
  }, [envVars]);

  // Guardar colecciones cuando cambien
  useEffect(() => {
    if (collections.length > 0) {
      storage.save('collections', collections);
    }
  }, [collections]);

  // Guardar logs cuando cambien (limitados a 500)
  useEffect(() => {
    if (logs.length > 0) {
      storage.save('apiLogs', logs.slice(0, 500));
    }
  }, [logs]);

  // Guardar historial cuando cambie (limitado a 100)
  useEffect(() => {
    if (history.length > 0) {
      storage.save('history', history.slice(0, 100));
    }
  }, [history]);

  // Calcular estadísticas
  useEffect(() => {
    const stats = {};
    apiConfigs.forEach(api => {
      const apiLogs = logs.filter(log => log.apiName === api.name);
      const successCount = apiLogs.filter(log => log.status === 'success').length;
      const errorCount = apiLogs.filter(log => log.status === 'error').length;
      const totalCount = apiLogs.length;
      const avgDuration = apiLogs.length > 0 
        ? Math.round(apiLogs.reduce((sum, log) => sum + log.duration, 0) / apiLogs.length)
        : 0;
      
      stats[api.id] = {
        total: totalCount,
        success: successCount,
        errors: errorCount,
        successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : 0,
        avgDuration: avgDuration
      };
    });
    setStatistics(stats);
  }, [logs, apiConfigs]);

  // Función para obtener token de autenticación
  const getAuthToken = async (config) => {
    console.log(`🔍 getAuthToken llamado para ${config.name}`);

    if (!config.authId) {
      console.log(`⚠️ No hay authId configurado, retornando token guardado`);
      return apiTokens[config.id] || null;
    }

    // Buscar la configuración de autenticación
    console.log(`🔎 Buscando authConfig con id: ${config.authId} (tipo: ${typeof config.authId})`);
    console.log(`📚 authConfigs disponibles:`, authConfigs.map(a => ({ id: a.id, name: a.name, type: typeof a.id })));

    // Comparar IDs convirtiendo ambos a string para evitar problemas de tipo
    const authConfig = authConfigs.find(auth => String(auth.id) === String(config.authId));
    if (!authConfig) {
      console.error(`❌ No se encontró authConfig con id ${config.authId}`);
      console.error(`   Intenté buscar entre:`, authConfigs.map(a => a.id));
      return apiTokens[config.id] || null;
    }

    console.log(`✅ authConfig encontrado:`, authConfig.name, `tipo: ${authConfig.authType}`);

    // Si es Normal, obtener token del endpoint automáticamente (con credenciales)
    if (authConfig.authType === 'normal') {
      try {
        // Parsear body de autenticación (credenciales)
        let authBody = {};
        if (authConfig.body && authConfig.body.trim()) {
          try {
            authBody = JSON.parse(authConfig.body);
          } catch (e) {
            console.error('Error parsing auth body:', e);
          }
        }

        const response = await axios({
          method: 'POST',
          url: authConfig.endpoint,
          data: authBody,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        });

        // Extraer el token de la respuesta
        const tokenKey = authConfig.tokenKey || 'token';
        let token = response.data[tokenKey] || response.data.access_token || response.data.accessToken;

        if (token) {
          // Limpiar el token si ya viene con "bearer" o "Bearer" incluido
          if (typeof token === 'string') {
            token = token.replace(/^bearer\s+/i, '').trim();
          }
          setApiTokens(prev => ({ ...prev, [config.id]: token }));
          console.log(`🔑 Token obtenido automáticamente para ${config.name}`);
          return token;
        } else {
          console.error('Token no encontrado en la respuesta de autenticación');
          return null;
        }
      } catch (err) {
        console.error('Error obteniendo token:', err.message);
        return apiTokens[config.id] || null;
      }
    }

    // Si es Bearer, retornar el token fijo que el usuario ingresó
    if (authConfig.authType === 'bearer' && authConfig.headers && authConfig.headers.trim()) {
      let token = authConfig.headers.trim();
      // Limpiar el token si ya viene con "bearer" o "Bearer" incluido
      token = token.replace(/^bearer\s+/i, '').trim();
      setApiTokens(prev => ({ ...prev, [config.id]: token }));
      console.log(`🔑 Token Bearer configurado manualmente para ${config.name}`);
      return token;
    }

    return null;
  };

  // Función para hacer la petición y guardar el resultado
  const testApi = async (config) => {
    const startTime = Date.now();
    let status = 'success';
    let responseData = null;
    let error = null;
    let requestData = null;

    try {
      // Obtener token si está configurada la autenticación
      let token = null;
      if (config.authId) {
        console.log(`📋 Intentando obtener token para API: ${config.name}, authId: ${config.authId}`);
        token = await getAuthToken(config);
        if (token) {
          console.log(`✅ Token obtenido exitosamente para ${config.name}:`, token.substring(0, 20) + '...');
        } else {
          console.warn(`⚠️ No se pudo obtener token para ${config.name}`);
        }
      } else {
        console.log(`ℹ️ API ${config.name} no tiene authId configurado`);
      }

      // Parsear headers si existen
      let parsedHeaders = {};
      if (config.headers && config.headers.trim()) {
        try {
          parsedHeaders = JSON.parse(config.headers);
        } catch (e) {
          console.error('Error parsing headers:', e);
        }
      }

      // Agregar token a los headers si existe
      if (token) {
        // Agregar como Bearer token (tanto para auth token automática como manual)
        parsedHeaders['Authorization'] = `Bearer ${token}`;
        console.log(`🔑 Header Authorization agregado para ${config.name}`);
      } else {
        console.log(`⚠️ No se agregó Authorization header para ${config.name} (token es null)`);
      }

      // Parsear body si existe y es POST/PUT/PATCH
      let parsedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body && config.body.trim()) {
        try {
          const replacedBody = replaceEnvVars(config.body);
          parsedBody = JSON.parse(replacedBody);
        } catch (e) {
          console.error('Error parsing body:', e);
          parsedBody = config.body;
        }
      }

      // Reemplazar variables de entorno en URL y headers
      const replacedUrl = replaceEnvVars(config.url);
      const replacedHeaders = JSON.stringify(parsedHeaders);
      let finalHeaders = parsedHeaders;
      try {
        const headersWithVars = replaceEnvVars(replacedHeaders);
        finalHeaders = JSON.parse(headersWithVars);
      } catch (e) {
        console.error('Error replacing vars in headers:', e);
      }

      // Agregar Content-Type si no está definido y hay body
      if (parsedBody && !finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }

      // Guardar datos de la petición para logs
      requestData = {
        headers: finalHeaders,
        body: parsedBody,
        url: replacedUrl
      };

      const response = await axios({
        method: config.method,
        url: replacedUrl,
        headers: finalHeaders,
        data: parsedBody,
        timeout: 30000
      });
      
      status = 'success';
      responseData = {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (err) {
      status = 'error';
      error = {
        message: err.message,
        code: err.code,
        status: err.response?.status
      };
      responseData = err.response?.data || null;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      apiName: config.name,
      status: status,
      duration: duration,
      error: error,
      response: responseData,
      request: requestData,
      url: config.url,
      method: config.method
    };

    setLogs(prevLogs => [logEntry, ...prevLogs].slice(0, 1000));

    // Actualizar el estado de la API (usando estado separado para no triggerear efectos)
    setApiStatus(prev => ({
      ...prev,
      [config.id]: {
        lastCheck: logEntry.timestamp,
        lastStatus: status
      }
    }));

    // Mostrar notificación si hay error (si el navegador lo permite)
    if (status === 'error' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`❌ API ${config.name} caída`, {
        body: `Error: ${error.message}`,
        icon: '/favicon.ico'
      });
    }

    return logEntry;
  };

  const prevConfigRef = useRef([]);

  // Manejar intervalos de monitoreo
  useEffect(() => {
    const configKey = apiConfigs.map(api => `${api.id}:${api.enabled}:${api.interval}:${api.intervalUnit || 'minutes'}`).join(',');
    const prevKey = prevConfigRef.current.map(api => `${api.id}:${api.enabled}:${api.interval}:${api.intervalUnit || 'minutes'}`).join(',');
    
    // Solo recrear intervalos si la configuración realmente cambió
    if (configKey === prevKey) {
      return;
    }
    
    prevConfigRef.current = apiConfigs;
    
    // Limpiar intervalos anteriores
    Object.values(intervalsRef.current).forEach(interval => clearInterval(interval));
    intervalsRef.current = {};

    // Crear intervalos para APIs habilitadas
    apiConfigs.forEach(config => {
      if (config.enabled && config.id) {
        // Obtener el intervalo y la unidad
        const intervalValue = Math.max(1, parseInt(config.interval) || 5);
        const unit = config.intervalUnit || 'minutes';
        
        // Convertir a milisegundos según la unidad
        let intervalMs;
        if (unit === 'seconds') {
          intervalMs = intervalValue * 1000;
        } else if (unit === 'hours') {
          intervalMs = intervalValue * 60 * 60 * 1000;
        } else { // minutes (default)
          intervalMs = intervalValue * 60 * 1000;
        }
        
        console.log(`⏱️ Configurando intervalo para ${config.name}: ${intervalValue} ${unit} (${intervalMs}ms)`);
        
        // Ejecutar cada X tiempo según la unidad
        intervalsRef.current[config.id] = setInterval(() => {
          console.log(`🔔 Ejecutando intervalo para ${config.name}`);
          testApi(config);
        }, intervalMs);
      }
    });

    // Cleanup cuando cambie algo importante
    return () => {
      // No limpiar aquí, dejar que los intervalos corran
    };
  }, [apiConfigs]);

  // Solicitar permiso para notificaciones
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleAddApi = () => {
    if (!newApi.name || !newApi.url) {
      alert('⚠️ Por favor completa el nombre y la URL de la API');
      return;
    }

    // Asegurar que interval sea un número entero válido
    const intervalValue = Math.max(1, parseInt(newApi.interval) || 5);

    // Convertir authId a string si es necesario
    const authId = newApi.authId ? String(newApi.authId) : '';

    console.log(`➕ Agregando API ${newApi.name} con authId:`, authId);

    const apiConfig = {
      name: newApi.name,
      url: newApi.url,
      method: newApi.method,
      headers: newApi.headers || '',
      body: newApi.body || '',
      interval: intervalValue,
      intervalUnit: newApi.intervalUnit || 'minutes',
      enabled: newApi.enabled || false,
      saveLogs: newApi.saveLogs || false,
      authId: authId,
      collectionId: newApi.collectionId || '',
      id: Date.now(),
      lastCheck: null,
      lastStatus: 'unknown'
    };

    setApiConfigs([...apiConfigs, apiConfig]);
    addHistoryEntry('api_added', { name: apiConfig.name, method: apiConfig.method });
    setNewApi({
      name: '',
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      interval: 5,
      intervalUnit: 'minutes',
      enabled: false,
      saveLogs: false,
      authId: '',
      collectionId: ''
    });
    setShowAdvanced(false);
  };

  const handleEditApi = (api) => {
    setEditingApi(api);
    setNewApi({
      name: api.name,
      url: api.url,
      method: api.method,
      headers: api.headers || '',
      body: api.body || '',
      interval: api.interval,
      intervalUnit: api.intervalUnit || 'minutes',
      enabled: api.enabled,
      saveLogs: api.saveLogs || false,
      authId: api.authId || '',
      collectionId: api.collectionId || ''
    });
    setShowAdvanced(true);
    // Scroll al formulario con un pequeño delay para evitar problemas de foco
    setTimeout(() => {
      const form = document.querySelector('.add-api-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleUpdateApi = () => {
    if (!newApi.name || !newApi.url) {
      alert('⚠️ Por favor completa el nombre y la URL de la API');
      return;
    }

    // Asegurar que interval sea un número entero válido
    const intervalValue = Math.max(1, parseInt(newApi.interval) || 5);

    // Convertir authId a string si es necesario
    const authId = newApi.authId ? String(newApi.authId) : '';

    console.log(`💾 Actualizando API ${newApi.name} con authId:`, authId);

    setApiConfigs(prevConfigs =>
      prevConfigs.map(api =>
        api.id === editingApi.id
          ? {
              ...api,
              name: newApi.name,
              url: newApi.url,
              method: newApi.method,
              headers: newApi.headers || '',
              body: newApi.body || '',
              interval: intervalValue,
              intervalUnit: newApi.intervalUnit || 'minutes',
              enabled: newApi.enabled || false,
              saveLogs: newApi.saveLogs || false,
              authId: authId,
              collectionId: newApi.collectionId || ''
            }
          : api
      )
    );

    addHistoryEntry('api_updated', { name: newApi.name });
    setEditingApi(null);
    setNewApi({
      name: '',
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      interval: 5,
      intervalUnit: 'minutes',
      enabled: false,
      saveLogs: false,
      authId: '',
      collectionId: ''
    });
    setShowAdvanced(false);
  };

  const handleCancelEdit = () => {
    setEditingApi(null);
    setNewApi({
      name: '',
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      interval: 5,
      intervalUnit: 'minutes',
      enabled: false,
      saveLogs: false,
      authId: '',
      collectionId: ''
    });
    setShowAdvanced(false);
  };

  const handleToggleApi = (id) => {
    const toggledApi = apiConfigs.find(api => api.id === id);
    setApiConfigs(prevConfigs =>
      prevConfigs.map(api =>
        api.id === id ? { ...api, enabled: !api.enabled } : api
      )
    );
    if (toggledApi) {
      addHistoryEntry(toggledApi.enabled ? 'api_stopped' : 'api_started', { name: toggledApi.name });
    }
  };

  const handleDeleteApi = (id) => {
    if (confirm('¿Estás seguro de eliminar esta API?')) {
      const deletedApi = apiConfigs.find(api => api.id === id);
      setApiConfigs(prevConfigs => prevConfigs.filter(api => api.id !== id));
      clearInterval(intervalsRef.current[id]);
      delete intervalsRef.current[id];
      if (deletedApi) {
        addHistoryEntry('api_deleted', { name: deletedApi.name });
      }
    }
  };

  const handleTestApi = async (config) => {
    await testApi(config);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearStorage = () => {
    if (confirm('¿Estás seguro de limpiar todo el almacenamiento? Esto eliminará todas las APIs y logs guardados.')) {
      storage.clear();
      setApiConfigs([]);
      setAuthConfigs([]);
      setCollections([]);
      setEnvVars([]);
      setLogs([]);
      alert('✅ Almacenamiento limpiado correctamente');
    }
  };

  const handleExportConfig = () => {
    const config = {
      apis: apiConfigs,
      auths: authConfigs,
      collections: collections,
      envVars: envVars,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `api-monitor-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target.result);
          if (confirm(`¿Importar configuración? Esto reemplazará tus APIs y autenticaciones actuales.`)) {
            if (config.apis && Array.isArray(config.apis)) {
              setApiConfigs(config.apis);
            }
            if (config.auths && Array.isArray(config.auths)) {
              setAuthConfigs(config.auths);
            }
            if (config.collections && Array.isArray(config.collections)) {
              setCollections(config.collections);
            }
            if (config.envVars && Array.isArray(config.envVars)) {
              setEnvVars(config.envVars);
            }
            alert('✅ Configuración importada correctamente');
          }
        } catch (err) {
          alert('❌ Error al importar configuración: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Handlers de autenticación
  const handleAddAuth = () => {
    // Limpiar espacios en blanco
    const cleanName = newAuth.name.trim();
    const cleanEndpoint = newAuth.endpoint.trim();
    const cleanBody = newAuth.body.trim();
    const cleanHeaders = newAuth.headers.trim();
    const cleanTokenKey = newAuth.tokenKey.trim();

    if (!cleanName) {
      alert('⚠️ Por favor completa el nombre de autenticación');
      return;
    }

    if (newAuth.authType === 'normal' && !cleanEndpoint) {
      alert('⚠️ Por favor completa el endpoint de autenticación');
      return;
    }

    if (newAuth.authType === 'normal' && !cleanBody) {
      alert('⚠️ Por favor introduce las credenciales (username y password)');
      return;
    }

    if (newAuth.authType === 'bearer' && !cleanHeaders) {
      alert('⚠️ Por favor introduce el token Bearer');
      return;
    }

    const authConfig = {
      name: cleanName,
      authType: newAuth.authType,
      endpoint: cleanEndpoint,
      body: cleanBody,
      tokenKey: cleanTokenKey || 'token',
      headers: cleanHeaders,
      id: Date.now()
    };

    console.log('➕ Agregando auth:', authConfig);
    setAuthConfigs([...authConfigs, authConfig]);
    setNewAuth({
      name: '',
      authType: 'normal',
      endpoint: '',
      body: '',
      tokenKey: 'token',
      headers: ''
    });
  };

  const handleEditAuth = (auth) => {
    setEditingAuth(auth);
    setNewAuth({
      name: auth.name,
      authType: auth.authType || 'normal',
      endpoint: auth.endpoint || '',
      body: auth.body || '',
      tokenKey: auth.tokenKey || 'token',
      headers: auth.headers || ''
    });
    console.log('🔧 Editando auth:', auth);
  };

  const handleUpdateAuth = () => {
    // Limpiar espacios en blanco
    const cleanName = newAuth.name.trim();
    const cleanEndpoint = newAuth.endpoint.trim();
    const cleanBody = newAuth.body.trim();
    const cleanHeaders = newAuth.headers.trim();
    const cleanTokenKey = newAuth.tokenKey.trim();

    if (!cleanName) {
      alert('⚠️ Por favor completa el nombre de autenticación');
      return;
    }

    if (newAuth.authType === 'normal' && !cleanEndpoint) {
      alert('⚠️ Por favor completa el endpoint de autenticación');
      return;
    }

    if (newAuth.authType === 'normal' && !cleanBody) {
      alert('⚠️ Por favor introduce las credenciales (username y password)');
      return;
    }

    if (newAuth.authType === 'bearer' && !cleanHeaders) {
      alert('⚠️ Por favor introduce el token Bearer');
      return;
    }

    console.log('💾 Actualizando auth:', editingAuth.id);

    setAuthConfigs(prevConfigs =>
      prevConfigs.map(auth =>
        auth.id === editingAuth.id
          ? {
              ...auth,
              name: cleanName,
              authType: newAuth.authType,
              endpoint: cleanEndpoint,
              body: cleanBody,
              tokenKey: cleanTokenKey || 'token',
              headers: cleanHeaders
            }
          : auth
      )
    );

    setEditingAuth(null);
    setShowTokenEdit(false);
    setNewAuth({
      name: '',
      authType: 'normal',
      endpoint: '',
      body: '',
      tokenKey: 'token',
      headers: ''
    });
  };

  const handleDeleteAuth = (id) => {
    if (confirm('¿Estás seguro de eliminar esta configuración de autenticación?')) {
      // Eliminar la configuración de autenticación
      setAuthConfigs(prevConfigs => prevConfigs.filter(auth => auth.id !== id));

      // Limpiar la referencia de authId en todas las APIs que la usen
      setApiConfigs(prevConfigs =>
        prevConfigs.map(api =>
          api.authId === id ? { ...api, authId: '' } : api
        )
      );

      // Limpiar tokens guardados relacionados
      setApiTokens(prev => {
        const newTokens = { ...prev };
        // Limpiar tokens de todas las APIs que usaban esta auth
        apiConfigs.forEach(api => {
          if (api.authId === id) {
            delete newTokens[api.id];
          }
        });
        return newTokens;
      });

      console.log(`🗑️ Autenticación eliminada y cache limpiado`);
    }
  };

  // Handlers de variables de entorno
  const handleAddEnvVar = () => {
    if (!newEnvVar.key || !newEnvVar.value) {
      alert('⚠️ Por favor completa la clave y el valor');
      return;
    }
    const envVar = { ...newEnvVar, id: Date.now() };
    setEnvVars([...envVars, envVar]);
    setNewEnvVar({ key: '', value: '' });
  };

  const handleEditEnvVar = (envVar) => {
    setEditingEnvVar(envVar);
    setNewEnvVar({ key: envVar.key, value: envVar.value });
  };

  const handleUpdateEnvVar = () => {
    if (!newEnvVar.key || !newEnvVar.value) {
      alert('⚠️ Por favor completa la clave y el valor');
      return;
    }
    setEnvVars(prevVars =>
      prevVars.map(envVar =>
        envVar.id === editingEnvVar.id
          ? { ...envVar, key: newEnvVar.key, value: newEnvVar.value }
          : envVar
      )
    );
    setEditingEnvVar(null);
    setNewEnvVar({ key: '', value: '' });
  };

  const handleDeleteEnvVar = (id) => {
    if (confirm('¿Estás seguro de eliminar esta variable?')) {
      setEnvVars(prevVars => prevVars.filter(envVar => envVar.id !== id));
    }
  };

  // Función para reemplazar variables de entorno
  const replaceEnvVars = (text) => {
    if (!text) return text;
    let result = text;
    envVars.forEach(envVar => {
      const regex = new RegExp(`\\{\\{${envVar.key}\\}\\}`, 'g');
      result = result.replace(regex, envVar.value);
    });
    return result;
  };

  // Handlers de colecciones
  const handleAddCollection = () => {
    if (!newCollection.name) {
      alert('⚠️ Por favor completa el nombre de la colección');
      return;
    }
    const collection = { ...newCollection, id: Date.now() };
    setCollections([...collections, collection]);
    setNewCollection({ name: '' });
  };

  const handleEditCollection = (collection) => {
    setEditingCollection(collection);
    setNewCollection({ name: collection.name });
  };

  const handleUpdateCollection = () => {
    if (!newCollection.name) {
      alert('⚠️ Por favor completa el nombre de la colección');
      return;
    }
    setCollections(prevCols =>
      prevCols.map(col =>
        col.id === editingCollection.id
          ? { ...col, name: newCollection.name }
          : col
      )
    );
    setEditingCollection(null);
    setNewCollection({ name: '' });
  };

  const handleDeleteCollection = (id) => {
    if (confirm('¿Estás seguro de eliminar esta colección? Las APIs seguirán en la lista principal.')) {
      setCollections(prevCols => prevCols.filter(col => col.id !== id));
      // Quitar la referencia de la colección de todas las APIs
      setApiConfigs(prevConfigs =>
        prevConfigs.map(api =>
          api.collectionId === id ? { ...api, collectionId: '' } : api
        )
      );
    }
  };

  const toggleCollection = (collectionId) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId]
    }));
  };

  // Función para agregar entrada al historial
  const addHistoryEntry = (type, details) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: type,
      details: details
    };
    setHistory(prevHistory => [entry, ...prevHistory].slice(0, 100));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏸️';
    }
  };

  // Filtrar logs si hay un API seleccionada
  const filteredLogs = selectedApi
    ? logs.filter(log => log.apiName === selectedApi)
    : logs;

  const needsBody = ['POST', 'PUT', 'PATCH'].includes(newApi.method);

  // Agrupar APIs por colección
  const groupedApis = useMemo(() => {
    const grouped = {};
    collections.forEach(col => {
      grouped[col.id] = {
        collection: col,
        apis: apiConfigs.filter(api => api.collectionId === col.id)
      };
    });
    // APIs sin colección
    const apisWithoutCollection = apiConfigs.filter(api => !api.collectionId);
    if (apisWithoutCollection.length > 0) {
      grouped['none'] = {
        collection: null,
        apis: apisWithoutCollection
      };
    }
    return grouped;
  }, [apiConfigs, collections]);

  return (
    <div className="api-monitor">
      <div className="monitor-grid">
        {/* Panel izquierdo - Configuración */}
        <div className="config-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>🔧 Configuración de APIs</h2>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                onClick={() => setShowEnvSection(true)} 
                className="btn-env" 
                style={{ padding: '5px 10px', fontSize: '12px' }}
                title="Variables de Entorno"
              >
                🌍 Env
              </button>
              <button 
                onClick={() => setShowAuthSection(true)} 
                className="btn-auth" 
                style={{ padding: '5px 10px', fontSize: '12px' }}
                title="Configuración de Autenticaciones"
              >
                🔐 Auth
              </button>
              <button 
                onClick={() => setShowHistory(true)} 
                className="btn-history" 
                style={{ padding: '5px 10px', fontSize: '12px' }}
                title="Historial de Cambios"
              >
                📜 Historial
              </button>
            </div>
          </div>
          
          {/* Formulario para agregar API */}
          <div className="add-api-form">
            <input
              type="text"
              placeholder="Nombre de la API"
              value={newApi.name}
              onChange={(e) => setNewApi(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              autoComplete="off"
            />
            <input
              type="text"
              placeholder="https://api.ejemplo.com/endpoint"
              value={newApi.url}
              onChange={(e) => setNewApi(prev => ({ ...prev, url: e.target.value }))}
              className="form-input"
              autoComplete="off"
            />
            <div className="form-row">
              <select
                value={newApi.method}
                onChange={(e) => setNewApi({ ...newApi, method: e.target.value })}
                className="form-select"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div className="form-row">
              <input
                type="number"
                placeholder="Intervalo"
                value={newApi.interval}
                onChange={(e) => setNewApi({ ...newApi, interval: parseInt(e.target.value) || 5 })}
                className="form-input"
                min="1"
                style={{ flex: '2' }}
              />
              <select
                value={newApi.intervalUnit}
                onChange={(e) => setNewApi({ ...newApi, intervalUnit: e.target.value })}
                className="form-select"
                style={{ flex: '1' }}
              >
                <option value="seconds">Segundos</option>
                <option value="minutes">Minutos</option>
                <option value="hours">Horas</option>
              </select>
            </div>
            
            {/* Opciones avanzadas */}
            <div className="advanced-section">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-toggle-advanced"
              >
                {showAdvanced ? '⬆️ Ocultar' : '⬇️ Mostrar'} Opciones Avanzadas
              </button>
              
              {showAdvanced && (
                <div className="advanced-options">
                  <div className="form-group">
                    <label>Colección:</label>
                    <select
                      value={newApi.collectionId || ''}
                      onChange={(e) => setNewApi({ ...newApi, collectionId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Sin colección</option>
                      {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Autenticación:</label>
                    <select
                      value={newApi.authId || ''}
                      onChange={(e) => setNewApi({ ...newApi, authId: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Sin autenticación</option>
                      {authConfigs.map(auth => (
                        <option key={auth.id} value={auth.id}>{auth.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Headers (JSON):</label>
                    <textarea
                      placeholder='{"Content-Type": "application/json"}'
                      value={newApi.headers}
                      onChange={(e) => setNewApi({ ...newApi, headers: e.target.value })}
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                  {needsBody && (
                    <div className="form-group">
                      <label>Body (JSON):</label>
                      <textarea
                        placeholder='{"key": "value"}'
                        value={newApi.body}
                        onChange={(e) => setNewApi({ ...newApi, body: e.target.value })}
                        className="form-textarea"
                        rows="5"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newApi.enabled}
                  onChange={(e) => setNewApi({ ...newApi, enabled: e.target.checked })}
                />
                Auto-monitoreo
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newApi.saveLogs}
                  onChange={(e) => setNewApi({ ...newApi, saveLogs: e.target.checked })}
                />
                Guardar logs
              </label>
            </div>
            
            {editingApi ? (
              <div className="form-buttons">
                <button onClick={handleUpdateApi} className="btn-update">
                  ✅ Actualizar API
                </button>
                <button onClick={handleCancelEdit} className="btn-cancel">
                  ❌ Cancelar
                </button>
              </div>
            ) : (
              <button onClick={handleAddApi} className="btn-add">
                ➕ Agregar API
              </button>
            )}
          </div>

          {/* Lista de APIs */}
          <div className="api-list">
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>APIs Configuradas ({apiConfigs.length})</h3>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => setShowCollectionSection(true)}
                    className="btn-collection"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    title="Gestionar colecciones"
                  >
                    📁 Colecciones
                  </button>
                  <button
                    onClick={handleExportConfig}
                    className="btn-export"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    title="Exportar configuración"
                  >
                    📤 Exportar
                  </button>
                  <button
                    onClick={handleImportConfig}
                    className="btn-import"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    title="Importar configuración"
                  >
                    📥 Importar
                  </button>
                </div>
              </div>
            </div>
            {Object.keys(groupedApis).length === 0 ? (
              <p className="empty-state">No hay APIs configuradas</p>
            ) : (
              Object.entries(groupedApis).map(([groupId, group]) => (
                <div key={groupId}>
                  {group.collection && (
                    <div className="collection-header" onClick={() => toggleCollection(group.collection.id)}>
                      <span style={{ marginRight: '10px' }}>
                        {expandedCollections[group.collection.id] ? '📂' : '📁'}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{group.collection.name}</span>
                      <span style={{ marginLeft: '10px', fontSize: '0.9rem', opacity: 0.7 }}>
                        ({group.apis.length})
                      </span>
                    </div>
                  )}
                  {(!group.collection || expandedCollections[group.collection.id]) && group.apis.map(api => {
                    const stats = statistics[api.id] || { total: 0, success: 0, errors: 0, successRate: 0, avgDuration: 0 };
                    const status = apiStatus[api.id] || { lastStatus: 'unknown' };
                    return (
                      <div key={api.id} className="api-item" style={{ marginLeft: group.collection ? '20px' : '0' }}>
                        <div className="api-item-header">
                          <span className="api-item-name">{api.name}</span>
                          <div className="api-item-status">
                            {api.enabled && getStatusIcon(status.lastStatus)}
                            <span
                              className="status-indicator"
                              style={{ color: getStatusColor(status.lastStatus) }}
                            >
                              {status.lastStatus}
                            </span>
                          </div>
                        </div>
                        <div className="api-item-url">{api.method} - {api.url}</div>
                        {api.authId && (
                          <div style={{ fontSize: '12px', color: '#4a9eff', marginTop: '5px' }}>
                            🔐 Auth: {authConfigs.find(a => String(a.id) === String(api.authId))?.name || 'Desconocida'}
                          </div>
                        )}
                        {api.enabled && stats.total > 0 && (
                          <div className="api-item-stats">
                            <span>📊 {stats.total} requests</span>
                            <span style={{ color: '#4caf50' }}>✅ {stats.successRate}%</span>
                            <span style={{ color: '#f44336' }}>❌ {stats.errors}</span>
                            <span>⚡ {stats.avgDuration}ms</span>
                          </div>
                        )}
                        <div className="api-item-footer">
                          <button
                            onClick={() => handleToggleApi(api.id)}
                            className={`btn-toggle ${api.enabled ? 'enabled' : ''}`}
                          >
                            {api.enabled ? '⏸ Detener' : '▶ Iniciar'}
                          </button>
                          <button
                            onClick={() => handleTestApi(api)}
                            className="btn-test"
                          >
                            🧪 Probar
                          </button>
                          <button
                            onClick={() => handleEditApi(api)}
                            className="btn-edit"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteApi(api.id)}
                            className="btn-delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho - Logs */}
        <div className="logs-panel">
          <div className="logs-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2>{showCharts ? '📊 Gráficos de Rendimiento' : '📋 Logs de Respuestas'}</h2>
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="btn-toggle-charts"
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                {showCharts ? '📋 Ver Logs' : '📊 Ver Gráficos'}
              </button>
            </div>
            <div className="logs-controls">
              <select
                value={selectedApi || ''}
                onChange={(e) => setSelectedApi(e.target.value || null)}
                className="filter-select"
              >
                <option value="">Todas las APIs</option>
                {apiConfigs.map(api => (
                  <option key={api.id} value={api.name}>{api.name}</option>
                ))}
              </select>
              {!showCharts && (
                <>
                  <button
                    onClick={handleExportLogs}
                    className="btn-export"
                  >
                    📥 Exportar
                  </button>
                  <button
                    onClick={() => setLogs([])}
                    className="btn-clear"
                  >
                    🗑️ Limpiar
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="logs-container">
            {showCharts ? (
              // Mostrar gráficos
              <div className="charts-container">
                {selectedApi ? (
                  // Gráfico para una API específica
                  (() => {
                    const apiLogs = filteredLogs;
                    const apiStats = apiLogs.slice(-20).reverse(); // Últimas 20 respuestas
                    const maxDuration = Math.max(...apiStats.map(l => l.duration), 100);
                    
                    return (
                      <div className="chart-box">
                        <h3>Rendimiento de {selectedApi}</h3>
                        <div className="bar-chart">
                          {apiStats.map((log, idx) => (
                            <div key={idx} className="bar-container">
                              <div 
                                className="bar-fill" 
                                style={{ 
                                  height: `${(log.duration / maxDuration) * 100}%`,
                                  backgroundColor: log.status === 'success' ? '#4caf50' : '#f44336'
                                }}
                              >
                                <span className="bar-value">{log.duration}ms</span>
                              </div>
                              <span className="bar-label">{new Date(log.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Gráficos para todas las APIs
                  <div className="charts-grid">
                    {apiConfigs.filter(api => statistics[api.id] && statistics[api.id].total > 0).map(api => {
                      const apiLogs = logs.filter(l => l.apiName === api.name).slice(-20).reverse();
                      const maxDuration = Math.max(...apiLogs.map(l => l.duration), 100);
                      
                      return (
                        <div key={api.id} className="chart-box">
                          <h4>{api.name}</h4>
                          <div className="bar-chart" style={{ height: '150px' }}>
                            {apiLogs.map((log, idx) => (
                              <div key={idx} className="bar-container">
                                <div 
                                  className="bar-fill" 
                                  style={{ 
                                    height: `${(log.duration / maxDuration) * 100}%`,
                                    backgroundColor: log.status === 'success' ? '#4caf50' : '#f44336'
                                  }}
                                >
                                  <span className="bar-value">{log.duration}ms</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              filteredLogs.length === 0 ? (
                <p className="empty-state">No hay logs aún. Prueba una API primero.</p>
              ) : (
                filteredLogs.map(log => (
                  <div key={log.id} className={`log-entry log-${log.status}`}>
                    <div className="log-header">
                      <span className="log-status-icon">
                        {getStatusIcon(log.status)}
                      </span>
                      <span className="log-api-name">{log.apiName}</span>
                      <span className="log-timestamp">
                        {new Date(log.timestamp).toLocaleString('es-ES')}
                      </span>
                      <span className="log-duration">
                        {log.duration}ms
                      </span>
                    </div>
                    <div className="log-details">
                      <div className="log-method">
                        {log.method} {log.url}
                      </div>
                      
                      {/* Mostrar datos de la petición enviada */}
                      {log.request && (
                        <details className="log-request" style={{ marginTop: '8px' }}>
                          <summary style={{ color: '#4a9eff', cursor: 'pointer' }}>📤 Ver datos enviados</summary>
                          <pre style={{ background: 'rgba(74, 158, 255, 0.1)', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Headers enviados:</strong>
                              <pre style={{ marginTop: '5px' }}>{JSON.stringify(log.request.headers, null, 2)}</pre>
                            </div>
                            {log.request.body && (
                              <div>
                                <strong>Body enviado:</strong>
                                <pre style={{ marginTop: '5px' }}>{JSON.stringify(log.request.body, null, 2)}</pre>
                              </div>
                            )}
                          </pre>
                        </details>
                      )}
                      
                      {log.error && (
                        <>
                          <div className="log-error" style={{ marginTop: '8px' }}>
                            ❌ Error: {log.error.message}
                            {log.error.status && ` (${log.error.status})`}
                            {log.error.code && ` - ${log.error.code}`}
                          </div>
                          {log.response && (
                            <details className="log-response">
                              <summary>📥 Ver respuesta del error</summary>
                              <pre>{JSON.stringify(log.response, null, 2)}</pre>
                            </details>
                          )}
                        </>
                      )}
                      {!log.error && log.response && (
                        <details className="log-response">
                          <summary>📥 Ver respuesta completa</summary>
                          <pre>{JSON.stringify(log.response, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal de Configuración de Autenticaciones */}
      {showAuthSection && (
        <div className="modal-overlay" onClick={() => setShowAuthSection(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>🔐 Configuración de Autenticaciones</h3>
            
            {/* Formulario para agregar autenticación */}
            <div className="add-api-form">
              <input
                type="text"
                placeholder="Nombre de la autenticación"
                value={newAuth.name}
                onChange={(e) => setNewAuth({ ...newAuth, name: e.target.value })}
                className="form-input"
              />
              <div className="form-group">
                <label>Tipo de autenticación:</label>
                <select
                  value={newAuth.authType}
                  onChange={(e) => setNewAuth({ ...newAuth, authType: e.target.value })}
                  className="form-select"
                >
                  <option value="normal">Normal (Auto - con credenciales)</option>
                  <option value="bearer">Bearer (Manual - token fijo)</option>
                </select>
              </div>

              {/* Campos para Normal (Obtiene token automáticamente con credenciales) */}
              {newAuth.authType === 'normal' && (
                <>
                  <div className="form-group">
                    <label>Endpoint de autenticación:</label>
                    <input
                      type="text"
                      placeholder="http://localhost:5164/v1/api/User"
                      value={newAuth.endpoint}
                      onChange={(e) => setNewAuth({ ...newAuth, endpoint: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Credenciales (JSON):</label>
                    <textarea
                      placeholder='{"username": "next", "password": "123456"}'
                      value={newAuth.body}
                      onChange={(e) => setNewAuth({ ...newAuth, body: e.target.value })}
                      className="form-textarea"
                      rows="4"
                    />
                  </div>
                  <div className="form-group">
                    <label>Clave del token en respuesta:</label>
                    <input
                      type="text"
                      placeholder="token"
                      value={newAuth.tokenKey}
                      onChange={(e) => setNewAuth({ ...newAuth, tokenKey: e.target.value })}
                      className="form-input"
                    />
                    <small style={{ color: '#999', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                      Ejemplo: si la respuesta es {`{"token": "abc123"}`}, usa "token"
                    </small>
                  </div>
                </>
              )}

              {/* Campos para Bearer (Token fijo manual) */}
              {newAuth.authType === 'bearer' && (
                <div className="form-group">
                  <label>Token Bearer (sin "Bearer"):</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type={(editingAuth ? showTokenEdit : showToken['new']) ? 'text' : 'password'}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={newAuth.headers}
                      onChange={(e) => setNewAuth({ ...newAuth, headers: e.target.value })}
                      className="form-input"
                      style={{ flex: '1' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingAuth) {
                          setShowTokenEdit(!showTokenEdit);
                        } else {
                          setShowToken({ ...showToken, 'new': !showToken['new'] });
                        }
                      }}
                      className="btn-toggle-visibility"
                      style={{ padding: '8px', minWidth: '40px' }}
                      title={(editingAuth ? showTokenEdit : showToken['new']) ? 'Ocultar' : 'Mostrar'}
                    >
                      {(editingAuth ? showTokenEdit : showToken['new']) ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <small style={{ color: '#999', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    Solo pega el token, el sistema agregará automáticamente "Bearer"
                  </small>
                </div>
              )}
              
              {editingAuth ? (
                <div className="form-buttons">
                  <button onClick={handleUpdateAuth} className="btn-update">
                    ✅ Actualizar
                  </button>
                  <button onClick={() => {
                    setEditingAuth(null);
                    setShowTokenEdit(false);
                    setNewAuth({
                      name: '',
                      authType: 'normal',
                      endpoint: '',
                      body: '',
                      tokenKey: 'token',
                      headers: ''
                    });
                  }} className="btn-cancel">
                    ❌ Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={handleAddAuth} className="btn-add">
                  ➕ Agregar Autenticación
                </button>
              )}
            </div>

            {/* Lista de autenticaciones */}
            <div className="api-list">
              <h3>Autenticaciones Guardadas ({authConfigs.length})</h3>
              {authConfigs.length === 0 ? (
                <p className="empty-state">No hay autenticaciones configuradas</p>
              ) : (
                authConfigs.map(auth => (
                  <div key={auth.id} className="api-item">
                    <div className="api-item-header">
                      <span className="api-item-name">{auth.name}</span>
                      <span style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                        {auth.authType === 'normal' ? '🔄 Auto' : '🔑 Manual'}
                      </span>
                    </div>
                    <div className="api-item-url">
                      {auth.authType === 'normal' ? auth.endpoint : 'Token Bearer fijo'}
                    </div>
                    <div className="api-item-footer">
                      <button
                        onClick={() => handleEditAuth(auth)}
                        className="btn-edit"
                        style={{ flex: '1' }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteAuth(auth.id)}
                        className="btn-delete"
                        style={{ flex: '0 0 40px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAuthSection(false)}
                className="btn-cancel"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Colecciones */}
      {showCollectionSection && (
        <div className="modal-overlay" onClick={() => setShowCollectionSection(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>📁 Colecciones</h3>
            
            {/* Formulario para agregar colección */}
            <div className="add-api-form">
              <input
                type="text"
                placeholder="Nombre de la colección"
                value={newCollection.name}
                onChange={(e) => setNewCollection({ name: e.target.value })}
                className="form-input"
              />
              
              {editingCollection ? (
                <div className="form-buttons">
                  <button onClick={handleUpdateCollection} className="btn-update">
                    ✅ Actualizar
                  </button>
                  <button onClick={() => {
                    setEditingCollection(null);
                    setNewCollection({ name: '' });
                  }} className="btn-cancel">
                    ❌ Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={handleAddCollection} className="btn-add">
                  ➕ Agregar Colección
                </button>
              )}
            </div>

            {/* Lista de colecciones */}
            <div className="api-list">
              <h3>Colecciones Guardadas ({collections.length})</h3>
              {collections.length === 0 ? (
                <p className="empty-state">No hay colecciones configuradas</p>
              ) : (
                collections.map(collection => (
                  <div key={collection.id} className="api-item">
                    <div className="api-item-header">
                      <span className="api-item-name">{collection.name}</span>
                    </div>
                    <div className="api-item-url">{apiConfigs.filter(api => api.collectionId === collection.id).length} APIs</div>
                    <div className="api-item-footer">
                      <button
                        onClick={() => handleEditCollection(collection)}
                        className="btn-edit"
                        style={{ flex: '1' }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="btn-delete"
                        style={{ flex: '0 0 40px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCollectionSection(false)}
                className="btn-cancel"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Variables de Entorno */}
      {showEnvSection && (
        <div className="modal-overlay" onClick={() => setShowEnvSection(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>🌍 Variables de Entorno</h3>
            
            {/* Formulario para agregar variable */}
            <div className="add-api-form">
              <input
                type="text"
                placeholder="Clave (ej: API_URL)"
                value={newEnvVar.key}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Valor (ej: https://api.ejemplo.com)"
                value={newEnvVar.value}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                className="form-input"
              />
              
              {editingEnvVar ? (
                <div className="form-buttons">
                  <button onClick={handleUpdateEnvVar} className="btn-update">
                    ✅ Actualizar
                  </button>
                  <button onClick={() => {
                    setEditingEnvVar(null);
                    setNewEnvVar({ key: '', value: '' });
                  }} className="btn-cancel">
                    ❌ Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={handleAddEnvVar} className="btn-add">
                  ➕ Agregar Variable
                </button>
              )}
            </div>

            {/* Lista de variables */}
            <div className="api-list">
              <h3>Variables Guardadas ({envVars.length})</h3>
              {envVars.length === 0 ? (
                <p className="empty-state">No hay variables configuradas</p>
              ) : (
                envVars.map(envVar => (
                  <div key={envVar.id} className="api-item">
                    <div className="api-item-header">
                      <span className="api-item-name">{envVar.key}</span>
                    </div>
                    <div className="api-item-url" style={{ wordBreak: 'break-all' }}>{envVar.value}</div>
                    <div className="api-item-footer">
                      <button
                        onClick={() => handleEditEnvVar(envVar)}
                        className="btn-edit"
                        style={{ flex: '1' }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEnvVar(envVar.id)}
                        className="btn-delete"
                        style={{ flex: '0 0 40px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowEnvSection(false)}
                className="btn-cancel"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial de Cambios */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>📜 Historial de Cambios</h3>
            
            <div className="api-list">
              {history.length === 0 ? (
                <p className="empty-state">No hay historial aún</p>
              ) : (
                history.map(entry => (
                  <div key={entry.id} className="api-item">
                    <div className="api-item-header">
                      <span className="api-item-name">
                        {entry.type === 'api_added' && '➕ API Agregada'}
                        {entry.type === 'api_updated' && '✏️ API Actualizada'}
                        {entry.type === 'api_deleted' && '🗑️ API Eliminada'}
                        {entry.type === 'api_started' && '▶️ API Iniciada'}
                        {entry.type === 'api_stopped' && '⏸️ API Detenida'}
                      </span>
                    </div>
                    <div className="api-item-url">
                      {entry.details.name && `${entry.details.name}`}
                      {entry.details.method && ` (${entry.details.method})`}
                    </div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>
                      {new Date(entry.timestamp).toLocaleString('es-ES')}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowHistory(false)}
                className="btn-cancel"
              >
                ❌ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiMonitor;
