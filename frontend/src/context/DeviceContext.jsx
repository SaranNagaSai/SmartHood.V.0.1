import React, { createContext, useState, useContext, useEffect } from 'react';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
    const [isMobile, setIsMobile] = useState(() => {
        const stored = sessionStorage.getItem('deviceType');
        if (stored) return stored === 'mobile';
        // Fallback to screen width if no stored preference
        return window.innerWidth < 768;
    });

    useEffect(() => {
        const handleResize = () => {
            if (!sessionStorage.getItem('deviceType')) {
                setIsMobile(window.innerWidth < 768);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            document.body.classList.add('device-mobile');
            document.body.classList.remove('device-desktop');
        } else {
            document.body.classList.add('device-desktop');
            document.body.classList.remove('device-mobile');
        }
    }, [isMobile]);

    const setDeviceType = (type) => {
        sessionStorage.setItem('deviceType', type);
        setIsMobile(type === 'mobile');
    };

    return (
        <DeviceContext.Provider value={{ isMobile, setDeviceType }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => useContext(DeviceContext);
