import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../utils/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Loader from '../components/common/Loader';

const AutoLogin = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const { setLanguage } = useLanguage();

    useEffect(() => {
        const performAutoLogin = async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/magic-login/${token}`);
                const data = res.data;

                // 1. Set Auth Data
                login(data, data.token);

                // 2. Set Language (Default to English if not provided, but usually it is)
                // If user was English, keep English.
                if (!sessionStorage.getItem('language')) {
                    setLanguage('English');
                }

                // 3. Redirect
                const redirectPath = searchParams.get('redirect') || '/home';
                navigate(redirectPath);

            } catch (err) {
                console.error("Auto Login Failed:", err);
                navigate('/login?error=magic_link_expired');
            }
        };

        if (token) {
            performAutoLogin();
        } else {
            navigate('/login');
        }
    }, [token, navigate, login, setLanguage, searchParams]);

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050507] text-white">
            <Loader size="lg" text="Authenticating Securely..." />
            <p className="mt-4 text-gray-500 text-sm animate-pulse tracking-widest uppercase">SmartHood Magic Link</p>
        </div>
    );
};

export default AutoLogin;
