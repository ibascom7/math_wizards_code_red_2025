import React from 'react';
import ReactDOM from 'react-dom/client';
import SidePanel from './SidePanel';
import './styles.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);