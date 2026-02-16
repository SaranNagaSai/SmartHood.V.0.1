import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import VoiceInput from '../components/common/VoiceInput';
import {
    Calendar, MapPin, Clock, Users, Plus, X,
    ChevronRight, Filter, Check, Trash2, Image as ImageIcon
} from 'lucide-react';
import { API_URL, SERVER_URL } from '../utils/apiConfig';

const Events = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('upcoming');

    // New State for Premium Features
    const [showAttendees, setShowAttendees] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);

    // Create Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        category: 'Community',
        image: null // File object
    });

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const categories = ['Community', 'Cultural', 'Sports', 'Educational', 'Religious', 'Other'];

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/events`, {
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
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('date', formData.date);
            data.append('time', formData.time);
            data.append('venue', formData.venue);
            data.append('category', formData.category);
            if (formData.image) {
                data.append('image', formData.image);
            }

            const res = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type must be undefined for FormData to work
                },
                body: data
            });
            const newEvent = await res.json();
            setEvents([newEvent, ...events]);
            setShowCreate(false);
            setFormData({ title: '', description: '', date: '', time: '', venue: '', category: 'Community', image: null });
        } catch (err) {
            alert('Failed to create event');
        }
    };

    const handleDelete = async (e, eventId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setEvents(events.filter(ev => ev._id !== eventId));
        } catch (err) {
            console.error('Failed to delete event', err);
        }
    };

    const handleViewAttendees = (e, event) => {
        e.stopPropagation();
        setSelectedEvent(event);
        setAttendees(event.rsvps || []); // Assuming population or we might need to fetch
        setShowAttendees(true);
    };

    const handleRSVP = async (eventId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/events/${eventId}/rsvp`, {
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
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 sm:p-6 rounded-b-[1.5rem] sm:rounded-b-[2rem]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                            <Calendar size={20} sm:size={24} />
                            {t('community_events')}
                        </h1>
                        <p className="text-white/70 text-xs sm:text-sm mt-1">
                            {events.length} {t('events_locality')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center justify-center gap-1 px-4 py-2.5 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition shadow-md w-full sm:w-auto"
                    >
                        <Plus size={18} />
                        {t('create')}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                    {['upcoming', 'past', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition whitespace-nowrap ${filter === f
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'bg-white/20 text-white'
                                }`}
                        >
                            {t(f)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Events List */}
            <div className="px-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {loading ? (
                    <div className="col-span-full text-center py-8 text-gray-400">Loading events...</div>
                ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                        <div
                            key={event._id}
                            className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group relative"
                        >
                            {/* Event Image Banner */}
                            <div className="h-40 bg-gray-100 relative">
                                {event.image ? (
                                    <img
                                        src={`${SERVER_URL}${event.image}`}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop' }} // Fallback
                                    />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center`}>
                                        <Calendar size={48} className="text-white/50" />
                                    </div>
                                )}

                                {/* Date Badge */}
                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-2 text-center shadow-sm min-w-[60px]">
                                    <span className="block text-xs font-bold text-gray-500 uppercase">
                                        {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                    </span>
                                    <span className="block text-2xl font-black text-gray-800 leading-none">
                                        {new Date(event.date).getDate()}
                                    </span>
                                </div>

                                {/* Delete Button (Owner Only) */}
                                {(currentUser._id === event.createdBy?._id || currentUser._id === event.createdBy) && (
                                    <button
                                        onClick={(e) => handleDelete(e, event._id)}
                                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 transition shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="text-xs font-bold tracking-wider text-orange-500 uppercase mb-1 block">
                                            {event.category}
                                        </span>
                                        <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">{event.title}</h3>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                    {event.description}
                                </p>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} className="text-orange-400" />
                                        <span>{event.time || 'Time TBD'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-orange-400" />
                                        <span>{event.venue}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <button
                                        onClick={(e) => handleViewAttendees(e, event)}
                                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-orange-500 transition"
                                    >
                                        <Users size={16} />
                                        <span>{event.rsvpCount || 0} Attending</span>
                                    </button>

                                    <button
                                        onClick={() => handleRSVP(event._id)}
                                        className={`px-6 py-2 rounded-xl text-sm font-bold transition shadow-sm ${event.hasRSVPd
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90'
                                            }`}
                                    >
                                        {event.hasRSVPd ? (
                                            <span className="flex items-center gap-1"><Check size={16} /> Going</span>
                                        ) : 'RSVP'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16">
                        <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar size={40} className="text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">No Events Found</h3>
                        <p className="text-gray-500 mt-2">Be the first to create an event in your locality!</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-6 text-orange-600 font-bold hover:underline"
                        >
                            + Create New Event
                        </button>
                    </div>
                )}
            </div>

            {/* Create Event Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-slide-up">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">{t('create_event')}</h3>
                            <button onClick={() => setShowCreate(false)} className="text-white/80 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <ImageIcon size={32} className="text-orange-400" />
                                    <span className="text-sm font-medium">
                                        {formData.image ? formData.image.name : 'Upload Event Banner'}
                                    </span>
                                </div>
                            </div>

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

            {/* Attendees Modal */}
            {showAttendees && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">
                                Attendees for {selectedEvent?.title}
                            </h3>
                            <button onClick={() => setShowAttendees(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {attendees.length > 0 ? (
                                <ul className="space-y-3">
                                    {attendees.map((att, idx) => (
                                        <li key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                                                {att.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{att.name}</div>
                                                <div className="text-xs text-gray-400 font-mono">{att.uniqueId}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400 py-8">No attendees yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
