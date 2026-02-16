import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import useNotifications from '../../hooks/useNotifications';

const Layout = ({ children }) => {
    const location = useLocation();

    // Hide layout on Entry pages
    const hideLayoutRoutes = ['/', '/login', '/register', '/language'];
    const shouldHide = hideLayoutRoutes.includes(location.pathname);

    // Initialize Global Notifications
    useNotifications();

    if (shouldHide) {
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 fixed h-full z-30">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 pb-20 md:pb-0">
                {children}
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 w-full z-30">
                <BottomNav />
            </div>
        </div>
    );
};

export default Layout;
