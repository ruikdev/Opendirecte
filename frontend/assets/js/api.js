// Utilitaires API
const API_BASE = '/api/v1';

// Récupérer le token JWT du localStorage
function getToken() {
    return localStorage.getItem('access_token');
}

// Sauvegarder le token JWT
function saveToken(token) {
    localStorage.setItem('access_token', token);
}

// Supprimer le token JWT
function removeToken() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
}

// Requête API avec authentification
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });
    
    if (response.status === 401) {
        // Token expiré, rediriger vers login
        removeToken();
        window.location.href = '/';
        return null;
    }
    
    return response;
}

// Vérifier si l'utilisateur est authentifié
function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/';
        return false;
    }
    return true;
}

// Déconnexion
function logout() {
    removeToken();
    window.location.href = '/';
}

// Formater une date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Formater une date courte
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}
