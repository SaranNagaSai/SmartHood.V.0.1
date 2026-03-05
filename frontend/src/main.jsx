import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './mobile.css';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <DeviceProvider>
            <LanguageProvider>
                <AuthProvider>
                    <NotificationProvider>
                        <App />
                    </NotificationProvider>
                </AuthProvider>
            </LanguageProvider>
        </DeviceProvider>
    </BrowserRouter>
);
