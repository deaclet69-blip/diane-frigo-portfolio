import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './services/api'; // configure les intercepteurs axios au démarrage

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
