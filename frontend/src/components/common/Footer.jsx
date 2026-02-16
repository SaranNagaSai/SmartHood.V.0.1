import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { Heart } from 'lucide-react';

const Footer = () => {
    const { language } = useLanguage();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-400 py-8">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[var(--col-primary)] to-[var(--col-secondary)] rounded-xl flex items-center justify-center font-bold text-white">
                                SH
                            </div>
                            <span className="font-bold text-xl text-white">SmartHood</span>
                        </div>
                        <p className="text-sm mb-2">మన పరిసర వేదిక</p>
                        <p className="text-sm">
                            Connecting local communities, one neighborhood at a time.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-white mb-3">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/home" className="hover:text-white transition">Home</Link></li>
                            <li><Link to="/service/offer" className="hover:text-white transition">Offer Service</Link></li>
                            <li><Link to="/service/request" className="hover:text-white transition">Request Help</Link></li>
                            <li><Link to="/alerts" className="hover:text-white transition">Alerts</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-bold text-white mb-3">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/complaints" className="hover:text-white transition">Submit Complaint</Link></li>
                            <li><Link to="/profile" className="hover:text-white transition">My Profile</Link></li>
                            <li><Link to="/activity" className="hover:text-white transition">My Activity</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm flex items-center gap-1">
                        Made with <Heart size={14} className="text-red-500 fill-red-500" /> for local communities
                    </p>
                    <p className="text-sm">
                        © {currentYear} SmartHood. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
