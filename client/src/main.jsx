import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { QuestProvider } from './context/QuestContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <UserProvider>
        <QuestProvider>
          <App />
        </QuestProvider>
      </UserProvider>
    </HashRouter>
  </StrictMode>
);
