// src/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './axiosConfig'; // Importa la configuración del interceptor
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
