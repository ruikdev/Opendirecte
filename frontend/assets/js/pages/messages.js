// Vérifier l'authentification
const token = localStorage.getItem('access_token');
if (!token) {
    window.location.href = '/';
}

// Afficher le nom d'utilisateur
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

let currentTab = 'inbox';

// Changer d'onglet
function switchTab(tab) {
    currentTab = tab;
    
    const inboxTab = document.getElementById('inboxTab');
    const sentTab = document.getElementById('sentTab');
    
    if (tab === 'inbox') {
        inboxTab.className = 'px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md';
        sentTab.className = 'px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200';
        loadInbox();
    } else {
        sentTab.className = 'px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md';
        inboxTab.className = 'px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200';
        loadSent();
    }
}

// Charger les messages reçus
async function loadInbox() {
    try {
        const response = await fetch('/api/v1/mail/inbox', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load inbox');
        }
        
        const data = await response.json();
        displayMessages(data.messages);
    } catch (error) {
        console.error('Error loading inbox:', error);
        document.getElementById('messagesContainer').innerHTML = '<p class="text-red-500">Erreur lors du chargement des messages.</p>';
    }
}

// Charger les messages envoyés
async function loadSent() {
    try {
        const response = await fetch('/api/v1/mail/sent', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load sent messages');
        }
        
        const data = await response.json();
        displayMessages(data.messages);
    } catch (error) {
        console.error('Error loading sent messages:', error);
        document.getElementById('messagesContainer').innerHTML = '<p class="text-red-500">Erreur lors du chargement des messages.</p>';
    }
}

// Afficher les messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (messages && messages.length > 0) {
        container.innerHTML = messages.map(message => `
            <div class="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-gray-800">${message.subject}</h3>
                        <p class="text-sm text-gray-600 mt-1">
                            ${currentTab === 'inbox' ? 'De: ' + message.sender : 'À: ' + message.recipients.map(r => r.username).join(', ')}
                        </p>
                        <p class="text-gray-700 mt-2">${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}</p>
                    </div>
                    <div class="text-right ml-4">
                        <p class="text-sm text-gray-600">
                            ${new Date(message.created_at).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = '<p class="text-gray-500">Aucun message.</p>';
    }
}

// Charger la boîte de réception au chargement
loadInbox();
