import React, { useState, useRef } from 'react';
import { Settings } from 'lucide-react';
import { API_URL } from '../config/constants';

export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTokenSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings/telegram-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setMessage('Token updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update token');
      }
    } catch (error) {
      setMessage('Failed to update token');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMessage('Please select an image file');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image size must be less than 10MB');
      setTimeout(() => setMessage(''), 3000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if it's a PNG file
    if (!file.type.includes('png')) {
      setMessage('Only PNG files are allowed');
      setTimeout(() => setMessage(''), 3000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const formData = new FormData();
    formData.append('fallback', file);

    try {
      const response = await fetch(`${API_URL}/api/settings/fallback-image`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || 'Fallback image updated successfully');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to upload image');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup */}
          <div className="absolute right-0 top-12 w-80 bg-gray-800 rounded-lg shadow-lg p-4 z-50">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>

            {/* Telegram Token */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Telegram Bot Token
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm"
                placeholder="Enter your bot token"
              />
              <button
                onClick={handleTokenSubmit}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-2 text-sm transition-colors"
              >
                Update Token
              </button>
            </div>

            {/* Fallback Image */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Fallback Image
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-600 hover:bg-green-700 rounded-md px-3 py-2 text-sm transition-colors"
              >
                Upload New Fallback Image
              </button>
            </div>

            {/* Status Message */}
            {message && (
              <div className="text-sm text-center text-emerald-400">
                {message}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}