import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/common/VoiceInput';
import {
    MessageSquare, Send, Clock, CheckCircle, XCircle,
    AlertCircle, Plus, X, Filter
} from 'lucide-react';

const Complaints = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'Service'
    });

    const categories = ['Service', 'User', 'Technical', 'Payment', 'Other'];
    const statusColors = {
        'pending': 'bg-yellow-100 text-yellow-700',
        'in_progress': 'bg-blue-100 text-blue-700',
        'resolved': 'bg-green-100 text-green-700',
        'rejected': 'bg-red-100 text-red-700'
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/complaints', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setComplaints(data || []);
        } catch (err) {
            console.error('Failed to fetch complaints', err);
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!formData.subject || !formData.description) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            setComplaints([data, ...complaints]);
            setShowCreate(false);
            setFormData({ subject: '', description: '', category: 'Service' });
            alert('Complaint submitted successfully');
        } catch (err) {
            alert('Failed to submit complaint');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending':
                return <Clock size={16} />;
            case 'in_progress':
                return <AlertCircle size={16} />;
            case 'resolved':
                return <CheckCircle size={16} />;
            case 'rejected':
                return <XCircle size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    const filteredComplaints = filter === 'all'
        ? complaints
        : complaints.filter(c => c.status === filter);

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-b-[2rem]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <MessageSquare size={24} />
                            Complaints
                        </h1>
                        <p className="text-white/70 text-sm mt-1">
                            Submit and track your complaints
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 transition"
                    >
                        <Plus size={18} />
                        New
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'pending', label: 'Pending' },
                        { id: 'in_progress', label: 'In Progress' },
                        { id: 'resolved', label: 'Resolved' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === f.id
                                    ? 'bg-white text-red-600'
                                    : 'bg-white/20 text-white'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Complaints List */}
            <div className="px-4 mt-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading complaints...</div>
                ) : filteredComplaints.length > 0 ? (
                    filteredComplaints.map((complaint) => (
                        <div
                            key={complaint._id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-800">{complaint.subject}</h3>
                                    <span className="text-xs text-gray-400">
                                        {new Date(complaint.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColors[complaint.status] || statusColors.pending}`}>
                                    {getStatusIcon(complaint.status)}
                                    {complaint.status?.replace('_', ' ') || 'pending'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {complaint.description}
                            </p>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                    {complaint.category}
                                </span>
                                {complaint.ticketId && (
                                    <span className="text-xs text-gray-400 font-mono">
                                        #{complaint.ticketId}
                                    </span>
                                )}
                            </div>
                            {complaint.adminResponse && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium mb-1">Admin Response:</p>
                                    <p className="text-sm text-blue-800">{complaint.adminResponse}</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No complaints found</p>
                    </div>
                )}
            </div>

            {/* Create Complaint Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 p-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Submit Complaint</h3>
                            <button onClick={() => setShowCreate(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <VoiceInput
                                label="Subject *"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Brief subject of your complaint"
                            />
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <VoiceInput
                                label="Description *"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your issue in detail..."
                                type="textarea"
                            />
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 p-3 border border-gray-200 rounded-xl font-semibold text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    <Send size={18} />
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Complaints;
