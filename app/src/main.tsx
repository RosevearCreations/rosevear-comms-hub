import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AdminSessionGate } from './auth/AdminSessionGate';
import { SiteHelpSystem } from './help/SiteHelpSystem';
import { DisabledOperatorConsole } from './operator/DisabledOperatorConsole';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AdminSessionGate>
      <App />
      <SiteHelpSystem />
      <DisabledOperatorConsole />
    </AdminSessionGate>
  </React.StrictMode>
);
