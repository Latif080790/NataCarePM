import React from 'react';

import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

interface ThemeSettings {
  colorScheme: 'light' | 'dark' | 'auto';
  accentColor: string;
  glassmorphism: boolean;
  animations: boolean;
  compactMode: boolean;
  highContrast: boolean;
  borderRadius: 'sharp' | 'rounded' | 'pill';
  fontScale: number;
}

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>(() => {
    const saved = localStorage.getItem('themeSettings');
    return saved
      ? JSON.parse(saved)
      : {
          colorScheme: 'dark',
          accentColor: 'coral',
          glassmorphism: true,
          animations: true,
          compactMode: false,
          highContrast: false,
          borderRadius: 'rounded',
          fontScale: 1,
        };
  });

  useEffect(() => {
    // Apply theme settings to document
    const root = document.documentElement;

    root.setAttribute('data-theme', settings.colorScheme);
    root.setAttribute('data-accent', settings.accentColor);
    root.setAttribute('data-glassmorphism', settings.glassmorphism.toString());
    root.setAttribute('data-animations', settings.animations.toString());
    root.setAttribute('data-compact', settings.compactMode.toString());
    root.setAttribute('data-high-contrast', settings.highContrast.toString());
    root.setAttribute('data-border-radius', settings.borderRadius);

    // Font scaling
    root.style.setProperty('--font-scale', settings.fontScale.toString());

    // Save to localStorage
    localStorage.setItem('themeSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const themes = [
    {
      id: 'light' as const,
      name: 'Light Mode',
      preview: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      icon: '☀️',
    },
    {
      id: 'dark' as const,
      name: 'Dark Mode',
      preview: 'linear-gradient(135deg, #1a1625 0%, #2d2438 100%)',
      icon: '🌙',
    },
    {
      id: 'auto' as const,
      name: 'System Auto',
      preview: 'linear-gradient(45deg, #ffffff 50%, #1a1625 50%)',
      icon: '🔄',
    },
  ];

  const accentColors = [
    {
      id: 'coral',
      name: 'Coral Passion',
      color: '#ff6b6b',
      preview: 'linear-gradient(135deg, #ff6b6b 0%, #e55555 100%)',
    },
    {
      id: 'blue',
      name: 'Ocean Breeze',
      color: '#4ecdc4',
      preview: 'linear-gradient(135deg, #4ecdc4 0%, #3bb5ae 100%)',
    },
    {
      id: 'yellow',
      name: 'Golden Sun',
      color: '#ffe66d',
      preview: 'linear-gradient(135deg, #ffe66d 0%, #e6cf61 100%)',
    },
    {
      id: 'green',
      name: 'Mint Fresh',
      color: '#95e1d3',
      preview: 'linear-gradient(135deg, #95e1d3 0%, #82d4c6 100%)',
    },
    {
      id: 'purple',
      name: 'Royal Purple',
      color: '#644e71',
      preview: 'linear-gradient(135deg, #644e71 0%, #52405e 100%)',
    },
    {
      id: 'rose',
      name: 'Rose Garden',
      color: '#f43f5e',
      preview: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white hover:scale-105 transition-all duration-300 group"
        title="Customize Theme"
      >
        <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={() => setIsOpen(false)}
      />

      {/* Theme Customizer Panel */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white/10 backdrop-blur-xl border-l border-white/20 z-50 animate-slideInRight">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-lg">
                  🎨
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Theme Studio</h2>
                  <p className="text-sm text-white/70">Enterprise Design System</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Color Scheme */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🌈 Color Scheme
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateSetting('colorScheme', theme.id)}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      settings.colorScheme === theme.id
                        ? 'border-blue-400 ring-4 ring-blue-400/30 shadow-lg shadow-blue-400/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg relative overflow-hidden"
                        style={{ background: theme.preview }}
                      >
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-lg">{theme.icon}</span>
                        </div>
                      </div>
                      <span className="text-white font-semibold">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🎯 Accent Color
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => updateSetting('accentColor', color.id)}
                    className={`group relative p-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                      settings.accentColor === color.id
                        ? 'border-blue-400 ring-4 ring-blue-400/30 shadow-lg'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex-shrink-0 relative overflow-hidden group-hover:scale-110 transition-transform"
                        style={{ background: color.preview }}
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">{color.name}</div>
                        <div className="text-white/60 text-sm">{color.color}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ⚙️ Advanced Settings
              </h3>

              <div className="space-y-3">
                {/* Glassmorphism Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white text-sm">
                      ✨
                    </div>
                    <div>
                      <div className="text-white font-semibold">Glassmorphism</div>
                      <div className="text-white/60 text-sm">Enable glass effects</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.glassmorphism}
                      onChange={(e) => updateSetting('glassmorphism', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Animations Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm">
                      🎭
                    </div>
                    <div>
                      <div className="text-white font-semibold">Animations</div>
                      <div className="text-white/60 text-sm">Smooth transitions</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.animations}
                      onChange={(e) => updateSetting('animations', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Font Scale */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm">
                      Aa
                    </div>
                    <div>
                      <div className="text-white font-semibold">Font Scale</div>
                      <div className="text-white/60 text-sm">
                        {Math.round(settings.fontScale * 100)}%
                      </div>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.1"
                    value={settings.fontScale}
                    onChange={(e) => updateSetting('fontScale', parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                const defaultSettings: ThemeSettings = {
                  colorScheme: 'dark',
                  accentColor: 'coral',
                  glassmorphism: true,
                  animations: true,
                  compactMode: false,
                  highContrast: false,
                  borderRadius: 'rounded',
                  fontScale: 1,
                };
                setSettings(defaultSettings);
              }}
              className="w-full p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors duration-200 font-medium border border-white/20"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
