/*
  Simple PKCE Auth module for Keycloak (SPA)
  - Reads config from window.KEYCLOAK_CONFIG
  - Stores tokens in sessionStorage
  - Auto refreshes access token
  - Exposes Auth API on window.Auth
*/

(function () {
    const cfg = window.KEYCLOAK_CONFIG || {};
    if (!cfg || !cfg.authServerUrl) {
        console.warn('Keycloak config not found on window.KEYCLOAK_CONFIG');
    }

    const STORAGE_KEYS = {
        tokenSet: 'kc_token_set',
        codeVerifier: 'kc_pkce_code_verifier',
        state: 'kc_oauth_state'
    };

    let refreshTimerId = null;
    let refreshInFlightPromise = null;

    function base64UrlEncode(buffer) {
        return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    function generateRandomString(length) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array).map(b => ('0' + b.toString(16)).slice(-2)).join('');
    }

    async function sha256(input) {
        const data = new TextEncoder().encode(input);
        return await window.crypto.subtle.digest('SHA-256', data);
    }

    async function generatePkcePair() {
        const codeVerifier = base64UrlEncode(await sha256(generateRandomString(64))).slice(0, 128);
        const challengeBuffer = await sha256(codeVerifier);
        const codeChallenge = base64UrlEncode(challengeBuffer);
        return { codeVerifier, codeChallenge };
    }

    function resolveEndpoint(endpoint) {
        if (!endpoint) return null;
        if (/^https?:\/\//i.test(endpoint)) return endpoint; // absolute URL provided
        const base = cfg.authServerUrl || '';
        if (!base) return endpoint;
        if (base.endsWith('/') && endpoint.startsWith('/')) return base + endpoint.substring(1);
        if (!base.endsWith('/') && !endpoint.startsWith('/')) return base + '/' + endpoint;
        return base + endpoint;
    }

    function setTokenSet(tokenResponse) {
        const nowEpoch = Math.floor(Date.now() / 1000);
        const expiresAt = nowEpoch + (tokenResponse.expires_in || 300);
        const refreshExpiresAt = nowEpoch + (tokenResponse.refresh_expires_in || 1800);
        const tokenSet = {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            id_token: tokenResponse.id_token,
            token_type: tokenResponse.token_type || 'Bearer',
            expires_at: expiresAt,
            refresh_expires_at: refreshExpiresAt
        };
        sessionStorage.setItem(STORAGE_KEYS.tokenSet, JSON.stringify(tokenSet));
        scheduleRefresh();
        return tokenSet;
    }

    function getTokenSet() {
        const raw = sessionStorage.getItem(STORAGE_KEYS.tokenSet);
        return raw ? JSON.parse(raw) : null;
    }

    function clearTokenSet() {
        sessionStorage.removeItem(STORAGE_KEYS.tokenSet);
        sessionStorage.removeItem(STORAGE_KEYS.codeVerifier);
        sessionStorage.removeItem(STORAGE_KEYS.state);
        if (refreshTimerId) {
            clearTimeout(refreshTimerId);
            refreshTimerId = null;
        }
    }

    function isAccessTokenExpired(bufferSeconds = 30) {
        const tokenSet = getTokenSet();
        if (!tokenSet || !tokenSet.expires_at) return true;
        const nowEpoch = Math.floor(Date.now() / 1000);
        return nowEpoch >= (tokenSet.expires_at - bufferSeconds);
    }

    function scheduleRefresh() {
        const tokenSet = getTokenSet();
        if (!tokenSet || !tokenSet.expires_at) return;
        if (refreshTimerId) clearTimeout(refreshTimerId);
        const nowMs = Date.now();
        const refreshAtMs = (tokenSet.expires_at - 60) * 1000; // refresh 60s before expiry
        const delay = Math.max(1000, refreshAtMs - nowMs);
        refreshTimerId = setTimeout(() => {
            refreshAccessToken().catch(() => {
                // if refresh fails, force login
                login();
            });
        }, delay);
    }

    async function refreshAccessToken() {
        if (refreshInFlightPromise) return refreshInFlightPromise;
        const tokenSet = getTokenSet();
        if (!tokenSet || !tokenSet.refresh_token) {
            throw new Error('No refresh token');
        }
        const url = resolveEndpoint(cfg.tokenEndpoint);
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenSet.refresh_token,
            client_id: cfg.clientId
        });
        refreshInFlightPromise = fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        }).then(async (res) => {
            refreshInFlightPromise = null;
            if (!res.ok) throw new Error('Refresh failed: ' + res.status);
            const data = await res.json();
            return setTokenSet(data);
        }).catch((e) => {
            refreshInFlightPromise = null;
            clearTokenSet();
            throw e;
        });
        return refreshInFlightPromise;
    }

    function buildAuthorizeUrl(codeChallenge, state) {
        const authUrl = resolveEndpoint(cfg.authEndpoint);
        const url = new URL(authUrl);
        url.searchParams.set('client_id', cfg.clientId);
        url.searchParams.set('redirect_uri', cfg.redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid profile email');
        url.searchParams.set('code_challenge', codeChallenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('state', state);
        return url.toString();
    }

    async function login() {
        const { codeVerifier, codeChallenge } = await generatePkcePair();
        const state = generateRandomString(16);
        sessionStorage.setItem(STORAGE_KEYS.codeVerifier, codeVerifier);
        sessionStorage.setItem(STORAGE_KEYS.state, state);
        const authUrl = buildAuthorizeUrl(codeChallenge, state);
        window.location.replace(authUrl);
    }

    async function handleRedirectCallback() {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        if (!code) return false;
        const storedState = sessionStorage.getItem(STORAGE_KEYS.state);
        const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier);
        if (!storedState || returnedState !== storedState) {
            clearTokenSet();
            throw new Error('Invalid OAuth state');
        }
        const tokenUrl = resolveEndpoint(cfg.tokenEndpoint);
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: cfg.redirectUri,
            client_id: cfg.clientId,
            code_verifier: codeVerifier
        });
        const res = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        if (!res.ok) throw new Error('Token exchange failed: ' + res.status);
        const data = await res.json();
        setTokenSet(data);
        // Clean URL params
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
        return true;
    }

    async function ensureAuthenticated() {
        const handled = await handleRedirectCallback();
        if (handled) return; // tokens are set
        const tokenSet = getTokenSet();
        if (!tokenSet) {
            await login();
            return; // redirected
        }
        if (isAccessTokenExpired()) {
            await refreshAccessToken().catch(login);
        } else {
            scheduleRefresh();
        }
    }

    async function getAccessToken() {
        const tokenSet = getTokenSet();
        if (!tokenSet) return null;
        if (isAccessTokenExpired()) {
            try {
                const updated = await refreshAccessToken();
                return updated.access_token;
            } catch (e) {
                return null;
            }
        }
        return tokenSet.access_token;
    }

    function logout() {
        const tokenSet = getTokenSet();
        clearTokenSet();
        if (cfg.logoutEndpoint) {
            const url = new URL(resolveEndpoint(cfg.logoutEndpoint));
            url.searchParams.set('client_id', cfg.clientId);
            url.searchParams.set('post_logout_redirect_uri', cfg.postLogoutRedirectUri);
            if (tokenSet && tokenSet.id_token) {
                url.searchParams.set('id_token_hint', tokenSet.id_token);
            }
            window.location.replace(url.toString());
        } else {
            window.location.replace(cfg.redirectUri || '/');
        }
    }

    const Auth = {
        init: ensureAuthenticated,
        login,
        logout,
        getAccessToken,
        getAuthHeader: async function () {
            const token = await getAccessToken();
            return token ? 'Bearer ' + token : null;
        }
    };

    window.Auth = Auth;
})();


