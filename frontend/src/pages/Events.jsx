import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/common/VoiceInput';
import {
    Calendar, MapPin, Clock, Users, Plus, X,
    ChevronRight, Filter, Check
} from 'lucide-react';

const Events = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('upcoming');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        category: 'Community'
    });

    const categories = ['Community', 'Cultural', 'Sports', 'Educational', 'Religious', 'Other'];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/events', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setEvents(data || []);
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!formData.title || !formData.date || !formData.venue) {
            alert('Please fill required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            setEvents([data, ...events]);
            setShowCreate(false);
            setFormData({ title: '', description: '', date: '', time: '', venue: '', category: 'Community' });
        } catch (err) {
            alert('Failed to create event');
        }
    };

    const handleRSVP = async (eventId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEvents();
        } catch (err) {
            console.error('Failed to RSVP', err);
        }
    };

    const filteredEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        const now = new Date();
        if (filter === 'upcoming') return eventDate >= now;
        if (filter === 'past') return eventDate < now;
        return true;
    });

    return (
        <div className="pb-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6 rounded-b-[2rem]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Calendar size={24} />
                            {t('community_events')}
                        </h1>
                        <p className="text-white/70 text-sm mt-1">
                            {events.length} {t('events_locality')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition"
                    >
                        <Plus size={18} />
                        {t('create')}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4">
                    {['upcoming', 'past', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${filter === f
                                ? 'bg-white text-orange-600'
                                : 'bg-white/20 text-white'
                                }`}
                        >
                            {t(f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events List */}
            <div className="px-4 mt-4 space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading events...</div>
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <div
                            key={event._id}
                            className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex flex-col items-center justify-center">
                                    <span className="text-orange-600 font-bold text-lg">
                                        {new Date(event.date).getDate()}
                                    </span>
                                    <span className="text-orange-400 text-xs">
                                        {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{event.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                        {event.description}
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} /> {event.time || 'TBD'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={12} /> {event.venue}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={12} /> {event.rsvpCount || 0} attending
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRSVP(event._id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${event.hasRSVPd
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        }`}
                                >
                                    {event.hasRSVPd ? (
                                        <><Check size={14} className="inline mr-1" /> Going</>
                                    ) : 'RSVP'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No events found</p>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">{t('create_event')}</h3>
                            <button onClick={() => setShowCreate(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <VoiceInput
                                label={t('event_title') + " *"}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Community Cleanup Day"
                            />
                            <VoiceInput
                                label={t('description_label')}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What's the event about?"
                                type="textarea"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('date')} *</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('time')}</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full p-3 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>
                            <VoiceInput
                                label={t('venue') + " *"}
                                value={formData.venue}
                                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                placeholder="Event location"
                            />
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('category')}</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full p-3 border border-gray-300 rounded-lg"
                                >
                                    {categories.map(c => <option key={c} value={c}>{t(c.toLowerCase()) || c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="flex-1 p-3 border border-gray-200 rounded-xl font-semibold text-gray-600"
                                >
                                    {t('back')}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-xl font-bold"
                                >
                                    {t('create_event')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
