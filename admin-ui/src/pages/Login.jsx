import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);

        try {
            const credentials = btoa(`${email}:${password}`);

            const res = await fetch('/api/v1/auth/verify', {
                method: 'GET',
                cache: 'no-store',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                onLogin(credentials);
            } else if (res.status === 401) {
                setError('Invalid username or password.');
            } else {
                setError('Server error. Please try again.');
            }
        } catch (err) {
            setError('Unable to connect to server.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Left Panel — Branding */}
            <div className="login-brand-panel">
                <div className="login-brand-content">
                    <div className="login-brand-icon">
                        <span className="material-symbols-outlined">neurology</span>
                    </div>
                    <h1 className="login-brand-title">NeuralBot</h1>
                    <p className="login-brand-subtitle">Enterprise AI Assistant Platform</p>

                    <div className="login-features">
                        <div className="login-feature-item">
                            <span className="material-symbols-outlined">smart_toy</span>
                            <div>
                                <h4>AI-Powered Conversations</h4>
                                <p>Deploy intelligent chatbots trained on your content</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <span className="material-symbols-outlined">analytics</span>
                            <div>
                                <h4>Real-time Analytics</h4>
                                <p>Monitor performance and conversation quality</p>
                            </div>
                        </div>
                        <div className="login-feature-item">
                            <span className="material-symbols-outlined">shield</span>
                            <div>
                                <h4>Enterprise Security</h4>
                                <p>SOC 2 compliant with role-based access</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="login-brand-footer">
                    <p>© 2026 NeuralBot. All rights reserved.</p>
                </div>
            </div>

            {/* Right Panel — Login Form */}
            <div className="login-form-panel">
                <div className="login-form-wrapper">
                    <div className="login-form-header">
                        <div className="login-mobile-logo">
                            <span className="material-symbols-outlined">neurology</span>
                            <span>NeuralBot</span>
                        </div>
                        <h2>Welcome back</h2>
                        <p>Sign in to your admin dashboard</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error">
                                <span className="material-symbols-outlined">error</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="login-field">
                            <label htmlFor="login-email">Username</label>
                            <div className="login-input-wrapper">
                                <span className="material-symbols-outlined login-input-icon">person</span>
                                <input
                                    id="login-email"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="login-field">
                            <label htmlFor="login-password">Password</label>
                            <div className="login-input-wrapper">
                                <span className="material-symbols-outlined login-input-icon">lock</span>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="login-toggle-pw"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    <span className="material-symbols-outlined">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="login-submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="login-spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="login-form-footer">
                        <p>Protected by enterprise-grade encryption</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
