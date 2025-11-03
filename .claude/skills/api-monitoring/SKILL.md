---
name: api-monitoring
description: API monitoring, testing, and authentication patterns
---

# API Monitoring Patterns

## Purpose

Guidelines for building API monitoring tools with authentication, logging, charts, and collections.

## When to Use This Skill

This skill activates when working with:
- Axios HTTP requests
- Bearer token authentication
- API endpoint testing
- Request/response logging
- Performance charts
- Collections and environment variables
- Error handling (401, 403, etc.)

## Quick Reference

### Axios Request with Auth

```javascript
// Get auth token first
const token = await getAuthToken(config);

// Parse headers
let parsedHeaders = {};
if (config.headers && config.headers.trim()) {
  parsedHeaders = JSON.parse(config.headers);
}

// Add Bearer token
if (token) {
  parsedHeaders['Authorization'] = `Bearer ${token}`;
}

// Make request
const response = await axios({
  method: config.method,
  url: replacedUrl,
  headers: parsedHeaders,
  data: parsedBody,
  timeout: 30000
});
```

### Authentication Token Retrieval

```javascript
// For 'token' type auth
if (authConfig.authType === 'token') {
  const response = await axios({
    method: 'POST',
    url: authConfig.endpoint,
    data: JSON.parse(authConfig.body),
    headers: { 'Content-Type': 'application/json' }
  });
  const tokenKey = authConfig.tokenKey || 'token';
  return response.data[tokenKey];
}

// For 'normal' type auth (manual headers)
if (authConfig.authType === 'normal') {
  return authConfig.headers; // Already configured token
}
```

### Environment Variables

```javascript
const replaceEnvVars = (str) => {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const envVar = envVars.find(e => e.key === key);
    return envVar ? envVar.value : match;
  });
};
```

## Best Practices

1. **Authentication**:
   - Support multiple auth types: 'token' (auto) and 'normal' (manual)
   - Store tokens in state, not localStorage for sensitive data
   - Auto-retrieve tokens before requests expire

2. **Error Handling**:
   - Capture status codes (401, 403, 500)
   - Log full error details including message and code
   - Store request data (headers, body, URL)

3. **Logging**:
   - Store timestamps for all requests
   - Include duration for performance tracking
   - Log both request and response data

4. **UI/UX**:
   - Show/hide sensitive tokens
   - Group APIs in collections
   - Visual status indicators (success/error)
   - Performance charts for trends

5. **State Management**:
   - Use separate state for intervals
   - Decouple monitoring from status updates
   - Store auth configs separately from API configs

6. **Configuration**:
   - Support intervals in seconds, minutes, hours
   - Environment variables for dynamic values
   - Export/import configurations
   - Change history tracking

## Common Patterns

### Monitoring Interval

```javascript
useEffect(() => {
  // Clear all intervals on cleanup
  return () => {
    Object.values(intervalsRef.current).forEach(clearInterval);
  };
}, []);

useEffect(() => {
  Object.entries(apiConfigs).forEach(([id, config]) => {
    if (config.enabled) {
      const interval = calculateInterval(config.interval, config.intervalUnit);
      intervalsRef.current[id] = setInterval(() => testApi(config), interval);
    }
  });
}, [apiConfigs]);
```

### Log Entry Format

```javascript
const logEntry = {
  id: Date.now(),
  timestamp: new Date().toISOString(),
  apiName: config.name,
  status: 'success' | 'error',
  duration: endTime - startTime,
  error: errorObject || null,
  response: responseData || null,
  request: {
    headers: parsedHeaders,
    body: parsedBody,
    url: replacedUrl
  }
};
```

### Status Tracking

```javascript
// Use separate state to avoid interval re-creation
setApiStatus(prev => ({
  ...prev,
  [config.id]: {
    lastCheck: logEntry.timestamp,
    lastStatus: status
  }
}));
```

## Troubleshooting

- **401 Unauthorized**: Check auth config is linked, verify token is added to headers
- **Intervals running too fast**: Ensure separate state for intervals, check calculation
- **Token not persisting**: Store in state, retrieve before each request
- **Headers not sending**: Auto-add Content-Type if body present
- **Charts not showing**: Verify Chart.js imported, check data format

## Security Considerations

1. **Token Visibility**: Use type="password" input with toggle button
2. **Storage**: Don't save sensitive tokens in localStorage
3. **DevTools**: Only open in development mode
4. **Error Messages**: Don't expose sensitive info in logs
5. **CORS**: Handle CORS errors gracefully

