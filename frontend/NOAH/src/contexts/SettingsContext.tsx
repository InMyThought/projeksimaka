'use client'

import React, { createContext, useState, useEffect, useContext } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '@/utils/api';

export interface Settings {
  school_name: string;
  academic_year: string;
  semester: string;
  start_time: string;
  end_time: string;
  notifications: boolean;
  language: string;
  theme: string;
}

interface SettingsContextType {
  settings: Settings;
  updateSettingsContext: (newSettings: Settings) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: {
    school_name: 'SMAN 1 Jakarta',
    academic_year: '2025/2026',
    semester: 'Ganjil',
    start_time: '07:00',
    end_time: '15:00',
    notifications: true,
    language: 'id',
    theme: 'light'
  },
  updateSettingsContext: async () => {}
});

export default SettingsContext;

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    school_name: 'SMAN 1 Jakarta',
    academic_year: '2025/2026',
    semester: 'Ganjil',
    start_time: '07:00',
    end_time: '15:00',
    notifications: true,
    language: 'id',
    theme: 'light'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // First try to load from localStorage
        const savedSettings = localStorage.getItem('noah_settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          // Try to sync with server in background
          try {
            const serverSettings = await getSettings();
            // Only update localStorage if server settings are different
            const settingsChanged = JSON.stringify(serverSettings) !== JSON.stringify(parsedSettings);
            if (settingsChanged) {
              localStorage.setItem('noah_settings', JSON.stringify(serverSettings));
              setSettings(serverSettings);
            }
          } catch (syncError) {
            // If server sync fails, continue with local settings
            console.warn('Could not sync with server, using local settings');
          }
        } else {
          // If no saved settings, fetch from API
          const settingsData = await getSettings();
          setSettings(settingsData);
          // Save to localStorage for persistence
          localStorage.setItem('noah_settings', JSON.stringify(settingsData));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        // Try to load from localStorage as fallback
        const savedSettings = localStorage.getItem('noah_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          // Use default settings if everything fails
          setSettings({
            school_name: 'SMAN 1 Jakarta',
            academic_year: '2025/2026',
            semester: 'Ganjil',
            start_time: '07:00',
            end_time: '15:00',
            notifications: true,
            language: 'id',
            theme: 'light'
          });
        }
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Settings) => {
    try {
      // Update state immediately for responsive UI
      setSettings(newSettings);
      
      // Update in localStorage for immediate persistence
      localStorage.setItem('noah_settings', JSON.stringify(newSettings));
      
      // Update on server (API)
      await apiUpdateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update settings on server:', error);
      // Keep the new settings in state and localStorage even if server update fails
      // This ensures persistence even when offline
      throw new Error('Failed to save settings to server. Changes are saved locally.');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettingsContext: updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};