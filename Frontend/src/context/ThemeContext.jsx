import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
    theme: 'light',
    setTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            // If saved, use it
            if (savedTheme) {
                return savedTheme;
            }
            // If system preference is dark, default to dark
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'light'; // Default fallback
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        // Force removal of old class to prevent "dark light" class list
        root.classList.remove('light', 'dark');

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }

        localStorage.setItem('theme', theme);
        
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};