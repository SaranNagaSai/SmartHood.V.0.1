import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';

// Pages
import LanguageSelection from './pages/LanguageSelection';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import OfferService from './pages/OfferService';
import RequestService from './pages/RequestService';
import ServiceDetail from './pages/ServiceDetail';
import Alerts from './pages/Alerts';
import ExploreCity from './pages/ExploreCity';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Events from './pages/Events';
import Complaints from './pages/Complaints';
import MyActivity from './pages/MyActivity';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserStats from './pages/AdminUserStats';
import Emergency from './pages/Emergency';
import StudentDashboard from './pages/StudentDashboard';
import Layout from './components/layout/Layout';

import Loader from './components/common/Loader';

// Guard to ensure language is selected
const LanguageGuard = ({ children }) => {
    const { language } = useLanguage();
    return language ? children : <Navigate to="/" />;
};

// Guard to ensure user is authenticated
const AuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const { language } = useLanguage();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[var(--col-bg)]">
                <Loader size="lg" text="Loading SmartHood..." />
            </div>
        );
    }

    if (!language) return <Navigate to="/" />;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return children;
};

function App() {
    const { language } = useLanguage();

    return (
        <Layout>
            <Routes>
                {/* Entry Flow - Always show Language Selection first */}
                <Route path="/" element={<LanguageSelection />} />

                <Route path="/register" element={
                    <LanguageGuard>
                        <Register />
                    </LanguageGuard>
                } />

                <Route path="/login" element={
                    <LanguageGuard>
                        <Login />
                    </LanguageGuard>
                } />

                {/* Main App Flow - Protected Routes */}
                <Route path="/home" element={
                    <AuthGuard>
                        <Home />
                    </AuthGuard>
                } />

                <Route path="/service/offer" element={
                    <AuthGuard>
                        <OfferService />
                    </AuthGuard>
                } />

                <Route path="/service/request" element={
                    <AuthGuard>
                        <RequestService />
                    </AuthGuard>
                } />

                <Route path="/service/:id" element={
                    <AuthGuard>
                        <ServiceDetail />
                    </AuthGuard>
                } />

                <Route path="/alerts" element={
                    <AuthGuard>
                        <Alerts />
                    </AuthGuard>
                } />

                <Route path="/activity" element={
                    <AuthGuard>
                        <MyActivity />
                    </AuthGuard>
                } />

                <Route path="/explore" element={
                    <AuthGuard>
                        <ExploreCity />
                    </AuthGuard>
                } />

                <Route path="/profile" element={
                    <AuthGuard>
                        <Profile />
                    </AuthGuard>
                } />

                <Route path="/notifications" element={
                    <AuthGuard>
                        <Notifications />
                    </AuthGuard>
                } />

                <Route path="/events" element={
                    <AuthGuard>
                        <Events />
                    </AuthGuard>
                } />

                <Route path="/complaints" element={
                    <AuthGuard>
                        <Complaints />
                    </AuthGuard>
                } />

                <Route path="/emergency" element={
                    <AuthGuard>
                        <Emergency />
                    </AuthGuard>
                } />

                <Route path="/student/dashboard" element={
                    <AuthGuard>
                        <StudentDashboard />
                    </AuthGuard>
                } />


                {/* Admin Routes */}
                <Route path="/admin" element={
                    <LanguageGuard>
                        <Admin />
                    </LanguageGuard>
                } />

                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/user/:id" element={<AdminUserStats />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Layout>
    );
}

export default App;
