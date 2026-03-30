import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase';

export default function ProfileIcon() {
  const { user } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'white',
          color: 'black',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
      >
        {/* Default user icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: '#0c0c0c',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.625rem',
          padding: '0.5rem 0',
          minWidth: '200px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.7)',
          }}>
            <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.25rem' }}>
              {user?.displayName || 'User'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              {user?.email}
            </div>
          </div>
          
          <button
            onClick={() => {
              setShowDropdown(false);
              // Navigate to profile or settings page
              window.location.href = '/home';
            }}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8125rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
          >
            Dashboard
          </button>
          
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.8125rem',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor='rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
          >
            Sign out
          </button>
        </div>
      )}

      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
