import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import HamburgerMenu from './HamburgerMenu';
import useNotifications from '../../hooks/useNotifications';
import { useDevice } from '../../context/DeviceContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { isMobile } = useDevice();

    // Hide layout on Entry pages
    const hideLayoutRoutes = ['/', '/login', '/register', '/language'];
    const shouldHide = hideLayoutRoutes.includes(location.pathname);

    // Initialize Global Notifications
    useNotifications();

    if (shouldHide) {
        return <div className="min-h-screen bg-gray-50">{children}</div>;
    }

    return (
        <div className={`flex min-h-screen bg-gray-50 ${isMobile ? 'flex-col' : ''}`}>
            {/* Desktop Sidebar */}
            {!isMobile && (
                <div className="hidden md:block w-64 fixed h-full z-30">
                    <Sidebar />
                </div>
            )}

            {/* Mobile Navigation */}
            {isMobile && (
                <>
                    <HamburgerMenu />
                    <div className="md:hidden fixed bottom-0 w-full z-30">
                        <BottomNav />
                    </div>
                </>
            )}

            {/* Main Content */}
            <div className={`flex-1 ${!isMobile ? 'md:ml-64' : 'pb-24 pt-0'} mb-safe overflow-y-auto w-full`}>
                <Header />
                <div className="max-w-[1600px] mx-auto px-4 md:px-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
