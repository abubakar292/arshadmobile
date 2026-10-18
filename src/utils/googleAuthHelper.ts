import firebaseAppletConfig from '../../firebase-applet-config.json';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Ensures Google Identity Services (GIS) client script is loaded
 */
export function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
}

/**
 * Obtains a Google Drive access token using Google Identity Services (GIS),
 * with fallback to the provisioned applet OAuth credentials.
 */
export async function getGoogleDriveAccessToken(userEmail?: string): Promise<string> {
  const clientId = firebaseAppletConfig.oAuthClientId;

  // 1. Primary: Google Identity Services OAuth 2.0 token client
  if (clientId) {
    try {
      await loadGsiScript();
      if (window.google?.accounts?.oauth2) {
        return await new Promise<string>((resolve, reject) => {
          let hasResponded = false;
          try {
            const tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: 'https://www.googleapis.com/auth/drive.file',
              callback: (response: any) => {
                hasResponded = true;
                if (response.error) {
                  if (response.error === 'access_denied') {
                    reject(new Error(
                      'Access Denied (403): This Google account is not an approved test user. Please select your developer account (threadsandtailsshop@gmail.com) or add this email to Test Users in Google Cloud Console.'
                    ));
                    return;
                  }
                  reject(new Error(response.error_description || response.error));
                  return;
                }
                if (response.access_token) {
                  resolve(response.access_token);
                } else {
                  reject(new Error('No access token received from Google authorization.'));
                }
              },
            });

            // Request access token with prompt
            tokenClient.requestAccessToken({ prompt: 'select_account consent' });

            // Safety timeout if user closes popup without interacting
            setTimeout(() => {
              if (!hasResponded) {
                // don't reject immediately, user may still be selecting account
              }
            }, 30000);
          } catch (gisErr) {
            reject(gisErr);
          }
        });
      }
    } catch (gisError: any) {
      console.warn('GIS client failed, attempting fallback:', gisError);
    }
  }

  // 2. Secondary fallback: Provisioned applet Firebase Auth instance
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');

    let oauthApp;
    if (getApps().some(a => a.name === 'appletOauth')) {
      oauthApp = getApp('appletOauth');
    } else {
      oauthApp = initializeApp(firebaseAppletConfig, 'appletOauth');
    }

    const oauthAuth = getAuth(oauthApp);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    if (userEmail) {
      provider.setCustomParameters({ login_hint: userEmail });
    }

    const result = await signInWithPopup(oauthAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No access token returned from Google authorization.');
    }
    return credential.accessToken;
  } catch (fbErr: any) {
    if (fbErr?.code === 'auth/unauthorized-domain') {
      throw new Error(
        'Google popup was blocked or unauthorized. Please ensure popups are enabled for this page.'
      );
    }
    if (fbErr?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google authorization was cancelled.');
    }
    throw fbErr;
  }
}
