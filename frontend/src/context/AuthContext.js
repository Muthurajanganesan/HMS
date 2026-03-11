import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const logoutTimerRef = useRef(null);

    // Clear any existing auto-logout timer
    const clearLogoutTimer = useCallback(() => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
    }, []);

    // Logout function
    const logout = useCallback(() => {
        clearLogoutTimer();
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('tokenExpiry');
        sessionStorage.removeItem('issuedAt');
        setUser(null);
    }, [clearLogoutTimer]);

    // Set up auto-logout timer based on token expiry
    const setupAutoLogout = useCallback((expiryTime) => {
        clearLogoutTimer();
        const now = Date.now();
        const timeUntilExpiry = expiryTime - now;

        if (timeUntilExpiry <= 0) {
            // Token already expired
            logout();
            return;
        }

        // Set timer to auto-logout 30 seconds before token expires
        const warningBuffer = 30000; // 30 seconds
        const logoutIn = Math.max(timeUntilExpiry - warningBuffer, 0);

        logoutTimerRef.current = setTimeout(() => {
            logout();
            // Redirect to login page
            window.location.href = '/login';
        }, logoutIn);
    }, [clearLogoutTimer, logout]);

    // Check if current token is valid (not expired)
    const isTokenValid = useCallback(() => {
        const tokenExpiry = sessionStorage.getItem('tokenExpiry');
        if (!tokenExpiry) return false;
        return Date.now() < parseInt(tokenExpiry, 10);
    }, []);

    // Initialize from sessionStorage on mount
    useEffect(() => {
        const token = sessionStorage.getItem('token');
        const userData = sessionStorage.getItem('user');
        const tokenExpiry = sessionStorage.getItem('tokenExpiry');

        if (token && userData && tokenExpiry) {
            const expiryTime = parseInt(tokenExpiry, 10);

            if (Date.now() < expiryTime) {
                // Token is still valid
                setUser(JSON.parse(userData));
                setupAutoLogout(expiryTime);
            } else {
                // Token has expired — clear session
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                sessionStorage.removeItem('tokenExpiry');
                sessionStorage.removeItem('issuedAt');
            }
        }

        setLoading(false);
    }, [setupAutoLogout]);

    // Login function — stores data in sessionStorage
    const login = useCallback((authResponse) => {
        const { token, userId, name, email, role, expiresIn, issuedAt } = authResponse;

        // Calculate absolute expiry time
        const expiryTime = issuedAt ? issuedAt + expiresIn : Date.now() + expiresIn;

        // Store in sessionStorage (NOT localStorage — sessionStorage clears on tab close)
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify({ userId, name, email, role }));
        sessionStorage.setItem('tokenExpiry', expiryTime.toString());
        sessionStorage.setItem('issuedAt', (issuedAt || Date.now()).toString());

        setUser({ userId, name, email, role });

        // Set up auto-logout
        setupAutoLogout(expiryTime);
    }, [setupAutoLogout]);

    // Get remaining session time in minutes
    const getSessionTimeRemaining = useCallback(() => {
        const tokenExpiry = sessionStorage.getItem('tokenExpiry');
        if (!tokenExpiry) return 0;
        const remaining = parseInt(tokenExpiry, 10) - Date.now();
        return Math.max(0, Math.ceil(remaining / 60000));
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => clearLogoutTimer();
    }, [clearLogoutTimer]);

    if (loading) {
        return (
            <div className="loading" style={{ height: '100vh' }}>
                <div className="spinner"></div>
                Loading...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated: !!user && isTokenValid(),
            isTokenValid,
            getSessionTimeRemaining,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
