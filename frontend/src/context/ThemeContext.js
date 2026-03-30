import React, { createContext, useContext } from 'react';

// Dark theme has been removed. This stub always returns light mode
// so that any component using useTheme() continues to work without changes.
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => (
    <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        {children}
    </ThemeContext.Provider>
);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
