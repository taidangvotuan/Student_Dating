import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/latin-ext-400.css';
import '@fontsource/inter/latin-ext-500.css';
import '@fontsource/inter/latin-ext-600.css';
import '@fontsource/inter/latin-ext-700.css';
import '@fontsource/inter/vietnamese-400.css';
import '@fontsource/inter/vietnamese-500.css';
import '@fontsource/inter/vietnamese-600.css';
import '@fontsource/inter/vietnamese-700.css';
import App from './app/App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
);
