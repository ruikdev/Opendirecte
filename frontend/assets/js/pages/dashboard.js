// Vérifier l'authentification
const token = localStorage.getItem('access_token');
if (!token) {
    window.location.href = '/';
}

// Afficher le nom d'utilisateur
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

// Afficher le lien admin si l'utilisateur est admin
if (user.role === 'admin') {
    document.getElementById('adminLink').classList.remove('hidden');
}

// Menu utilisateur
document.getElementById('userMenuButton').addEventListener('click', () => {
    document.getElementById('userMenu').classList.toggle('hidden');
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const button = document.getElementById('userMenuButton');
    if (!button.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Profile
function showProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileCurrentPassword').value = '';
    document.getElementById('profileNewPassword').value = '';
    document.getElementById('profileError').classList.add('hidden');
    document.getElementById('profileSuccess').classList.add('hidden');
    document.getElementById('profileModal').classList.remove('hidden');
    document.getElementById('userMenu').classList.add('hidden');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.add('hidden');
}

async function saveProfile() {
    const email = document.getElementById('profileEmail').value;
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;
    
    const data = { email };
    
    if (newPassword) {
        if (!currentPassword) {
            document.getElementById('profileError').textContent = 'Mot de passe actuel requis';
            document.getElementById('profileError').classList.remove('hidden');
            return;
        }
        data.current_password = currentPassword;
        data.password = newPassword;
    }
    
    try {
        const response = await fetch('/api/v1/auth/me', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update profile');
        }
        
        const result = await response.json();
        localStorage.setItem('user', JSON.stringify(result.user));
        
        document.getElementById('profileSuccess').textContent = 'Profil mis à jour !';
        document.getElementById('profileSuccess').classList.remove('hidden');
        document.getElementById('profileError').classList.add('hidden');
        
        setTimeout(() => {
            closeProfileModal();
        }, 1500);
    } catch (error) {
        document.getElementById('profileError').textContent = error.message;
        document.getElementById('profileError').classList.remove('hidden');
        document.getElementById('profileSuccess').classList.add('hidden');
    }
}

// Configurer la carte Notes selon le rôle
if (user.role === 'prof' || user.role === 'admin') {
    document.getElementById('notesCard').onclick = () => window.location.href = '/grades';
    document.getElementById('notesDescription').textContent = 'Gérer les notes de vos élèves';
} else {
    document.getElementById('notesCard').onclick = () => window.location.href = '/notes';
}

// Charger le fil d'actualités
async function loadFeed() {
    try {
        const response = await apiRequest('/feed', {
            method: 'GET'
        });
        
        if (!response || !response.ok) {
            throw new Error('Failed to load feed');
        }
        
        const data = await response.json();
        const feedContainer = document.getElementById('feedContainer');
        
        if (data.announcements && data.announcements.length > 0) {
            // Limiter à 3 annonces sur le dashboard
            const recentAnnouncements = data.announcements.slice(0, 3);
            feedContainer.innerHTML = recentAnnouncements.map(announcement => `
                <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-3 hover:shadow-md transition-shadow">
                    <h3 class="font-bold text-gray-800">${announcement.title}</h3>
                    <p class="text-gray-700 mt-1 text-sm line-clamp-2">${announcement.content}</p>
                    <div class="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                        <span>${announcement.author}</span>
                        <span>•</span>
                        <span>${new Date(announcement.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                </div>
            `).join('');
        } else {
            feedContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-6">
                    <p class="text-gray-400 text-sm">Aucune annonce pour le moment</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        document.getElementById('feedContainer').innerHTML = '<p class="text-red-500 text-sm">Erreur lors du chargement des actualités.</p>';
    }
}

// Charger les devoirs à venir
async function loadUpcomingHomeworks() {
    try {
        const response = await apiRequest('/homeworks?status=pending', {
            method: 'GET'
        });
        
        if (!response || !response.ok) {
            throw new Error('Failed to load homeworks');
        }
        
        const data = await response.json();
        const container = document.getElementById('upcomingHomeworksContainer');
        
        if (data.homeworks && data.homeworks.length > 0) {
            // Limiter à 4 devoirs
            const upcomingHomeworks = data.homeworks.slice(0, 4);
            container.innerHTML = upcomingHomeworks.map(homework => {
                const dueDate = new Date(homework.due_date);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                
                let urgencyClass = 'bg-blue-100 text-blue-700';
                let urgencyText = `Dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`;
                
                if (daysUntilDue <= 1) {
                    urgencyClass = 'bg-red-100 text-red-700';
                    urgencyText = daysUntilDue === 0 ? 'Aujourd\'hui' : 'Demain';
                } else if (daysUntilDue <= 3) {
                    urgencyClass = 'bg-orange-100 text-orange-700';
                }
                
                return `
                    <div class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer" onclick="window.location.href='/homework'">
                        <div class="flex items-start justify-between">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-800 text-sm">${homework.title}</h4>
                                ${homework.subject ? `<p class="text-xs text-gray-600 mt-1">📚 ${homework.subject}</p>` : ''}
                                <p class="text-xs text-gray-600 mt-1">${homework.group_name}</p>
                            </div>
                            <span class="px-2 py-1 ${urgencyClass} rounded text-xs font-semibold whitespace-nowrap ml-2">
                                ${urgencyText}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-6">
                    <p class="text-gray-400 text-sm">Aucun devoir à venir</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading homeworks:', error);
        document.getElementById('upcomingHomeworksContainer').innerHTML = '<p class="text-red-500 text-sm">Erreur lors du chargement.</p>';
    }
}

// Charger le fil au chargement de la page
loadFeed();
loadUpcomingHomeworks();
