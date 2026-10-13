import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { QuestProvider } from './context/QuestContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <QuestProvider>
          <App />
        </QuestProvider>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
