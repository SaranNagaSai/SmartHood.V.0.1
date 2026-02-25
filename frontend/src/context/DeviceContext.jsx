import React, { createContext, useState, useContext, useEffect } from 'react';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
    const [isMobile, setIsMobile] = useState(() => {
        const stored = localStorage.getItem('deviceType');
        return stored === 'mobile';
    });

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
        localStorage.setItem('deviceType', type);
        setIsMobile(type === 'mobile');
    };

    return (
        <DeviceContext.Provider value={{ isMobile, setDeviceType }}>
            {children}
        </DeviceContext.Provider>
    );
};

export const useDevice = () => useContext(DeviceContext);
