import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MapPin, Menu } from 'lucide-react';
import { useNotificationsContext } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDevice } from '../../context/DeviceContext';
import logo from '../../assets/images/Smart Hood Logo.png';
import { API_URL } from '../../utils/apiConfig';

const Header = () => {
    const { unreadCount } = useNotificationsContext();
    const { t, translateValue } = useLanguage();
    const { isMobile } = useDevice();
    const navigate = useNavigate();
    const [isServerAwake, setIsServerAwake] = React.useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    // Server health ping
    React.useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_URL.replace('/api', '')}/api/health/ping`);
                if (res.ok) setIsServerAwake(true);
            } catch (err) {
                setIsServerAwake(false);
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-[50] bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between min-h-[80px] md:min-h-[90px]">
            {/* Left: Menu & Logo (Mobile) or Branding (Desktop) */}
            <div className="flex items-center gap-3">
                {isMobile ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-menu'))}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain" onClick={() => navigate('/home')} />
                        <div>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-tighter leading-none">SmartHood</p>
                            <div className="flex items-center gap-0.5 text-gray-500">
                                <div className={`w-1.5 h-1.5 rounded-full ${isServerAwake ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                <span className="text-[9px] font-bold truncate max-w-[70px]">
                                    {user ? translateValue(user.locality) : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain cursor-pointer" onClick={() => navigate('/home')} />
                        <div>
                            <h1 className="text-sm font-bold text-gray-800 leading-none">SmartHood</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-2 h-2 rounded-full ${isServerAwake ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                                <span className="text-[10px] text-gray-500 font-medium">
                                    {isServerAwake ? 'Server Active' : 'Waking Up...'}
                                </span>
                                <div className="h-3 w-[1px] bg-gray-200 mx-1"></div>
                                <div className="flex items-center gap-1 text-gray-400">
                                    <MapPin size={10} />
                                    <span className="text-[10px] font-bold">{user ? translateValue(user.locality) : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Notification Bell */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group active:scale-95"
                    aria-label="Notifications"
                >
                    <Bell
                        size={22}
                        className="text-gray-600 group-hover:text-primary transition-colors"
                    />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default Header;
