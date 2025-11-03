import React from 'react';
import ApiMonitor from './components/ApiMonitor';
import logo from './assets/logo.svg';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <img src={logo} alt="API Monitor Logo" className="app-logo" />
          <div className="header-text">
            <h1>API Monitor</h1>
            <p>Herramienta moderna para monitorear y probar tus APIs</p>
          </div>
        </div>
      </header>
      <main className="app-main">
        <ApiMonitor />
      </main>
    </div>
  );
}

export default App;

