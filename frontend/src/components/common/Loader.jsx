import React from 'react';

import PropTypes from 'prop-types';

const Loader = ({ size = 'md', text = 'Loading...' }) => {
    // ... (rest of the component)
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16'
    };

    // Size mapping for border width
    const borderClasses = {
        sm: 'border-2',
        md: 'border-[3px]',
        lg: 'border-4'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 p-6">
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                {/* Outer Ring */}
                <div className={`absolute w-full h-full rounded-full border-t-transparent ${borderClasses[size]} border-blue-200 animate-[spin_1.5s_linear_infinite]`}></div>

                {/* Inner Ring (Counter-rotating or varied speed) */}
                <div className={`absolute w-full h-full rounded-full border-b-transparent ${borderClasses[size]} border-[var(--col-primary)] animate-[spin_1s_ease-in-out_infinite]`}></div>

                {/* Pulse Effect Background */}
                <div className="absolute w-full h-full bg-[var(--col-primary)] opacity-10 rounded-full animate-ping"></div>
            </div>

            {text && (
                <div className="flex flex-col items-center animate-pulse">
                    <p className="text-[var(--col-text-secondary)] text-sm font-semibold tracking-wide uppercase">{text}</p>
                </div>
            )}
        </div>
    );
};

Loader.propTypes = {
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
    text: PropTypes.string
};

export default Loader;
