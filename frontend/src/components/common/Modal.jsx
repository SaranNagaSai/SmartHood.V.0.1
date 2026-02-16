import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-4xl'
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden animate-fade-in`}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className="bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] p-4 flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white p-1 transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
