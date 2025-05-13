import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import GlobalStyles from './styles/GlobalStyles';
import { AppProvider } from './context/AppContext'; // Importar AppProvider
import { ThemeProvider } from './context/ThemeContext'; // Importar ThemeProvider

function App() {
  return (
    <AppProvider> {/* Envolver com AppProvider */}
      <ThemeProvider> {/* Envolver com ThemeProvider */}
        <Router>
          <GlobalStyles />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AppProvider>
  );
}

export default App;
