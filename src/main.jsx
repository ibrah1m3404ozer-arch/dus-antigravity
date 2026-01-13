import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 📱 Eruda Mobile Console - FORCE SHOW
import eruda from 'eruda';
eruda.init();

// Force show after 1 second
setTimeout(() => {
  eruda.show();
  window.eruda = eruda;
  console.log('🟢 Eruda SHOWN! Swipe left edge to access.');
}, 1000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
