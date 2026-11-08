import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AdminSessionGate } from './auth/AdminSessionGate';
import { MasterOwnerSessionGate } from './auth/MasterOwnerSessionGate';
import { SiteHelpSystem } from './help/SiteHelpSystem';
import { OperatorShell } from './operator/OperatorShell';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

function RootApp() {
  const [masterRoute, setMasterRoute] = useState(() => window.location.hash === '#/master');
  useEffect(() => {
    const onHashChange = () => setMasterRoute(window.location.hash === '#/master');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // The public proof preview remains separate from the private owner Auth route.
  // Entering #/master never falls back to the public operator preview.
  if (masterRoute) return <MasterOwnerSessionGate />;
  return (
    <AdminSessionGate>
      <OperatorShell />
      <SiteHelpSystem />
    </AdminSessionGate>
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
