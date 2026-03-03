import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if we have saved credentials
        const creds = sessionStorage.getItem('admin_auth');
        if (creds) {
            // Verify credentials are still valid
            fetch('/api/v1/auth/verify', {
                cache: 'no-store',
                headers: { 'Authorization': `Basic ${creds}`, 'Accept': 'application/json' }
            })
                .then(r => {
                    if (r.ok) setIsAuthenticated(true);
                    else sessionStorage.removeItem('admin_auth');
                })
                .catch(() => sessionStorage.removeItem('admin_auth'))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const handleLogin = (credentials) => {
        sessionStorage.setItem('admin_auth', credentials);
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--bg-body)',
                color: 'var(--text-muted)', fontSize: '0.9rem'
            }}>
                Loading...
            </div>
        );
    }

    return (
        <BrowserRouter basename="/admin">
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated
                            ? <Navigate to="/" replace />
                            : <Login onLogin={handleLogin} />
                    }
                />
                <Route
                    path="/*"
                    element={
                        isAuthenticated
                            ? <AdminDashboard onLogout={handleLogout} />
                            : <Navigate to="/login" replace />
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
