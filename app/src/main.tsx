import React from 'react';
import ReactDOM from 'react-dom/client';
import { AdminSessionGate } from './auth/AdminSessionGate';
import { SiteHelpSystem } from './help/SiteHelpSystem';
import { OperatorShell } from './operator/OperatorShell';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AdminSessionGate>
      <OperatorShell />
      <SiteHelpSystem />
    </AdminSessionGate>
  </React.StrictMode>
);
