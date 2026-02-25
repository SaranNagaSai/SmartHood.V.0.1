import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const DeviceContext = createContext();

const MOBILE_BREAKPOINT = 768; // matches Tailwind's md breakpoint

export const DeviceProvider = ({ children }) => {
    const [isMobile, setIsMobile] = useState(() => {
        // Check screen width on initial load
        return window.innerWidth < MOBILE_BREAKPOINT;
    });

    const updateDeviceClass = useCallback((mobile) => {
        if (mobile) {
            document.body.classList.add('device-mobile');
            document.body.classList.remove('device-desktop');
        } else {
            document.body.classList.add('device-desktop');
            document.body.classList.remove('device-mobile');
        }
    }, []);

    useEffect(() => {
        // Set initial class
        updateDeviceClass(isMobile);

        // Listen for resize events
        const handleResize = () => {
            const mobile = window.innerWidth < MOBILE_BREAKPOINT;
            setIsMobile(mobile);
            updateDeviceClass(mobile);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, updateDeviceClass]);

    return (
        <DeviceContext.Provider value={{ isMobile }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => useContext(DeviceContext);
