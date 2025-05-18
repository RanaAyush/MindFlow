import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import MindMapEditor from './components/MindMapEditor';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Header />
        <main className="flex-1 overflow-hidden">
          <MindMapEditor />
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;