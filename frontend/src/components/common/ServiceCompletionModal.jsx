import React, { useState } from 'react';
import VoiceInput from './VoiceInput';
import { Check, X, DollarSign, User as UserIcon } from 'lucide-react';

const ServiceCompletionModal = ({ isOpen, onClose, onSubmit, serviceTitle }) => {
    const [formData, setFormData] = useState({
        providerUniqueId: '',
        amountSpent: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!formData.providerUniqueId.trim()) {
            setError('Provider Unique ID is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSubmit({
                providerUniqueId: formData.providerUniqueId.trim().toUpperCase(),
                amountSpent: formData.amountSpent ? parseFloat(formData.amountSpent) : 0
            });
            setFormData({ providerUniqueId: '', amountSpent: '' });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to submit completion');
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-bold text-lg">Service Completed! 🎉</h3>
                        <p className="text-white/70 text-xs mt-1">{serviceTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-sm text-green-700">
                            Please enter the provider's Unique ID to complete this service and update their profile.
                        </p>
                    </div>

                    <VoiceInput
                        label="Provider Unique ID *"
                        value={formData.providerUniqueId}
                        onChange={(e) => setFormData({ ...formData, providerUniqueId: e.target.value })}
                        placeholder="e.g., ABC12"
                    />

                    <VoiceInput
                        label="Amount Spent (₹) - Optional"
                        value={formData.amountSpent}
                        onChange={(e) => setFormData({ ...formData, amountSpent: e.target.value })}
                        placeholder="0"
                        type="number"
                    />

                    {error && (
                        <div className="bg-red-50 p-3 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 p-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-xl font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Submitting...' : (
                                <>
                                    <Check size={18} />
                                    Complete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceCompletionModal;
