import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import axios from 'axios';
import {
    GraduationCap,
    Users,
    BookOpen,
    ChevronRight,
    Award,
    Target,
    ArrowLeft
} from 'lucide-react';

const StudentDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [peers, setPeers] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            if (!userData) return navigate('/login');
            setUser(userData);

            try {
                const [peersRes, mentorsRes, statsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/students/peers', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/students/mentors', { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get('http://localhost:5000/api/students/stats', { headers: { Authorization: `Bearer ${token}` } })
                ]);

                setPeers(peersRes.data);
                setMentors(mentorsRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error("Failed to fetch student data", error);
            }
            setLoading(false);
        };
        fetchData();
    }, [navigate]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin text-primary"><GraduationCap size={48} /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-8 rounded-b-[3rem] shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/home')} className="p-2 bg-white/10 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">Student Hub</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{user.name}</h2>
                        <p className="text-blue-100 text-sm opacity-80">{user.professionDetails?.course} • {user.professionDetails?.educationLevel}</p>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-4xl mx-auto space-y-8">
                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-blue-50">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                            <Users size={20} />
                        </div>
                        <span className="block text-2xl font-bold text-gray-800">{peers.length}</span>
                        <span className="text-xs text-gray-500 font-medium">Peers Nearby</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-50">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
                            <Award size={20} />
                        </div>
                        <span className="block text-2xl font-bold text-gray-800">{mentors.length}</span>
                        <span className="text-xs text-gray-500 font-medium">Local Mentors</span>
                    </div>
                </div>

                {/* Peer Discovery */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Target size={18} className="text-blue-600" />
                            Study Peers in {user.locality}
                        </h3>
                    </div>
                    {peers.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {peers.map(peer => (
                                <div key={peer._id} className="min-w-[160px] bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-400 mb-3">
                                        {peer.name.charAt(0)}
                                    </div>
                                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{peer.name}</h4>
                                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                                        {peer.uniqueId}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                            No peers found in your exact course yet.
                        </div>
                    )}
                </section>

                {/* Local Mentors */}
                <section>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-600" />
                        Community Mentors
                    </h3>
                    <div className="space-y-3">
                        {mentors.slice(0, 5).map(mentor => (
                            <div key={mentor._id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-indigo-400 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                                        {mentor.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{mentor.name}</h4>
                                        <p className="text-xs text-gray-500">{mentor.professionDetails?.jobRole || mentor.professionCategory}</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default StudentDashboard;
