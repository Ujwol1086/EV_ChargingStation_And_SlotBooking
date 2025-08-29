import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const tokenFromRedirect = searchParams.get('token');
        const isAdminStr = searchParams.get('is_admin');
        
        // If backend redirected with a token, store it and finish immediately
        if (tokenFromRedirect) {
          try {
            localStorage.setItem('token', tokenFromRedirect);
            // Try to fetch user info
            const meRes = await fetch('/api/auth/me', {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${tokenFromRedirect}` }
            });
            let userPayload = null;
            if (meRes.ok) {
              const meData = await meRes.json();
              userPayload = meData.user;
            }
            const isAdmin = isAdminStr === '1' || isAdminStr === 'true';
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_OAUTH_SUCCESS',
                token: tokenFromRedirect,
                user: userPayload,
                is_admin: isAdmin
              }, '*');
              setStatus('Authentication successful! You can close this window.');
              setTimeout(() => window.close(), 1200);
            } else {
              // Direct navigation if no opener
              window.location.replace(isAdmin ? '/admin' : '/dashboard');
            }
            return;
          } catch (e) {
            // Fall through to code-based flow
          }
        }

        if (!code) {
          setStatus('Error: No authorization code or token received');
          return;
        }

        // Send the authorization code to our backend (ensure we pass code)
        const response = await fetch(`/api/auth/google/callback?code=${encodeURIComponent(code)}&redirect=0`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to complete Google authentication');
        }

        const data = await response.json();
        
        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_SUCCESS',
            token: data.token,
            user: data.user,
            is_admin: data.is_admin
          }, '*');
          
          setStatus('Authentication successful! You can close this window.');
          
          // Close the popup after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setStatus('Error: Cannot communicate with parent window');
        }
        
      } catch (error) {
        console.error('Google OAuth callback error:', error);
        setStatus('Error: Authentication failed');
        
        // Send error message to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_OAUTH_ERROR',
            error: error.message
          }, '*');
        }
      }
    };

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center items-center p-8">
      <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl rounded-2xl border border-white/20 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Google Authentication
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          
          <p className="text-gray-600 text-sm">
            {status}
          </p>
          
          {status.includes('Error') && (
            <button
              onClick={() => window.close()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close Window
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
