// Admin panel
checkAuth();

const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

// Menu utilisateur
document.getElementById('userMenuButton').addEventListener('click', () => {
    document.getElementById('userMenu').classList.toggle('hidden');
});

// Tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(el => {
        el.classList.remove('border-blue-500', 'text-blue-600');
        el.classList.add('border-transparent', 'text-gray-500');
    });
    
    document.getElementById(`${tab}-content`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.remove('border-transparent', 'text-gray-500');
    document.getElementById(`tab-${tab}`).classList.add('border-blue-500', 'text-blue-600');
}

// Load users
async function loadUsers() {
    try {
        const response = await apiRequest('/users');
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        const table = document.getElementById('usersTable');
        
        if (data.users.length === 0) {
            table.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun utilisateur</p>';
            return;
        }
        
        table.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Groupes</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.users.map(u => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="font-medium text-gray-900">${u.username}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${u.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                    u.role === 'prof' ? 'bg-blue-100 text-blue-800' :
                                    'bg-green-100 text-green-800'
                                }">${u.role}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${u.groups.map(g => g.name).join(', ') || '-'}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="editUser(${u.id})" class="text-blue-600 hover:text-blue-900 mr-3">Éditer</button>
                                <button onclick="manageUserGroups(${u.id})" class="text-green-600 hover:text-green-900 mr-3">Groupes</button>
                                <button onclick="deleteUser(${u.id}, '${u.username}')" class="text-red-600 hover:text-red-900">Supprimer</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Load groups
async function loadGroups() {
    try {
        const response = await apiRequest('/groups');
        if (!response.ok) throw new Error('Failed to load groups');
        
        const data = await response.json();
        const table = document.getElementById('groupsTable');
        
        if (data.groups.length === 0) {
            table.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun groupe</p>';
            return;
        }
        
        table.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membres</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.groups.map(g => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${g.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    g.type === 'classe' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'
                                }">${g.type}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${g.members?.length || 0} membres</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="editGroup(${g.id})" class="text-blue-600 hover:text-blue-900 mr-3">Éditer</button>
                                <button onclick="deleteGroup(${g.id}, '${g.name}')" class="text-red-600 hover:text-red-900">Supprimer</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// User Modal
function showCreateUserModal() {
    document.getElementById('userModalTitle').textContent = 'Nouvel utilisateur';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function editUser(userId) {
    try {
        const response = await apiRequest(`/users/${userId}`);
        if (!response.ok) throw new Error('Failed to load user');
        
        const user = await response.json();
        document.getElementById('userModalTitle').textContent = 'Modifier l\'utilisateur';
        document.getElementById('userId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userPassword').required = false;
        document.getElementById('userPassword').placeholder = 'Laisser vide pour ne pas changer';
        document.getElementById('userModal').classList.remove('hidden');
    } catch (error) {
        alert('Erreur lors du chargement de l\'utilisateur');
    }
}

async function saveUser() {
    const userId = document.getElementById('userId').value;
    const data = {
        username: document.getElementById('userUsername').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) data.password = password;
    
    try {
        const url = userId ? `/users/${userId}` : '/users';
        const method = userId ? 'PUT' : 'POST';
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save user');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        document.getElementById('errorMessage').textContent = error.message;
        document.getElementById('errorMessage').classList.remove('hidden');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Supprimer l'utilisateur ${username} ?`)) return;
    
    try {
        const response = await apiRequest(`/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete user');
        loadUsers();
    } catch (error) {
        alert('Erreur lors de la suppression');
    }
}

async function manageUserGroups(userId) {
    try {
        const [userResp, groupsResp] = await Promise.all([
            apiRequest(`/users/${userId}`),
            apiRequest('/groups')
        ]);
        
        const user = await userResp.json();
        const allGroups = await groupsResp.json();
        
        const userGroupIds = user.groups.map(g => g.id);
        
        const groupsHtml = allGroups.groups.map(g => `
            <label class="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                <input type="checkbox" value="${g.id}" ${userGroupIds.includes(g.id) ? 'checked' : ''} 
                       class="rounded text-blue-600 focus:ring-blue-500">
                <span>${g.name} (${g.type})</span>
            </label>
        `).join('');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-xl font-bold">Groupes de ${user.username}</h3>
                </div>
                <div class="px-6 py-4 max-h-96 overflow-y-auto">
                    ${groupsHtml}
                </div>
                <div class="px-6 py-4 border-t flex justify-end space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border rounded-lg hover:bg-gray-50">Annuler</button>
                    <button onclick="saveUserGroups(${userId}, this)" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        alert('Erreur lors du chargement des groupes');
    }
}

async function saveUserGroups(userId, button) {
    const modal = button.closest('.fixed');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    const selectedGroups = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));
    
    try {
        const userResp = await apiRequest(`/users/${userId}`);
        const user = await userResp.json();
        const currentGroups = user.groups.map(g => g.id);
        
        const toAdd = selectedGroups.filter(id => !currentGroups.includes(id));
        const toRemove = currentGroups.filter(id => !selectedGroups.includes(id));
        
        const response = await apiRequest(`/users/${userId}/groups`, {
            method: 'PUT',
            body: JSON.stringify({
                add_groups: toAdd,
                remove_groups: toRemove
            })
        });
        
        if (!response.ok) throw new Error('Failed to update groups');
        
        modal.remove();
        loadUsers();
    } catch (error) {
        alert('Erreur lors de la sauvegarde');
    }
}

// Group Modal
function showCreateGroupModal() {
    document.getElementById('groupModalTitle').textContent = 'Nouveau groupe';
    document.getElementById('groupForm').reset();
    document.getElementById('groupId').value = '';
    document.getElementById('groupModal').classList.remove('hidden');
}

function closeGroupModal() {
    document.getElementById('groupModal').classList.add('hidden');
}

async function editGroup(groupId) {
    try {
        const response = await apiRequest(`/groups/${groupId}`);
        if (!response.ok) throw new Error('Failed to load group');
        
        const group = await response.json();
        document.getElementById('groupModalTitle').textContent = 'Modifier le groupe';
        document.getElementById('groupId').value = group.id;
        document.getElementById('groupName').value = group.name;
        document.getElementById('groupType').value = group.type;
        document.getElementById('groupModal').classList.remove('hidden');
    } catch (error) {
        alert('Erreur lors du chargement du groupe');
    }
}

async function saveGroup() {
    const groupId = document.getElementById('groupId').value;
    const data = {
        name: document.getElementById('groupName').value,
        type: document.getElementById('groupType').value
    };
    
    try {
        const url = groupId ? `/groups/${groupId}` : '/groups';
        const method = groupId ? 'PUT' : 'POST';
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save group');
        }
        
        closeGroupModal();
        loadGroups();
    } catch (error) {
        alert(error.message);
    }
}

async function deleteGroup(groupId, groupName) {
    if (!confirm(`Supprimer le groupe ${groupName} ?`)) return;
    
    try {
        const response = await apiRequest(`/groups/${groupId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete group');
        loadGroups();
    } catch (error) {
        alert('Erreur lors de la suppression');
    }
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
        const response = await apiRequest('/auth/me', {
            method: 'PUT',
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

// Search users
document.getElementById('userSearch').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#usersTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});

// Announcements
async function loadAnnouncements() {
    try {
        const response = await apiRequest('/feed');
        if (!response.ok) throw new Error('Failed to load announcements');
        
        const data = await response.json();
        const table = document.getElementById('announcementsTable');
        
        if (data.announcements.length === 0) {
            table.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune annonce</p>';
            return;
        }
        
        table.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contenu</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auteur</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.announcements.map(a => `
                        <tr>
                            <td class="px-6 py-4">
                                <div class="font-medium text-gray-900">${a.title}</div>
                            </td>
                            <td class="px-6 py-4 max-w-md">
                                <div class="text-sm text-gray-500 truncate">${a.content}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${a.author || 'Inconnu'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${new Date(a.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="editAnnouncement(${a.id})" class="text-blue-600 hover:text-blue-900 mr-3">Éditer</button>
                                <button onclick="deleteAnnouncement(${a.id})" class="text-red-600 hover:text-red-900">Supprimer</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

function showCreateAnnouncementModal() {
    document.getElementById('announcementModalTitle').textContent = 'Nouvelle annonce';
    document.getElementById('announcementForm').reset();
    document.getElementById('announcementId').value = '';
    document.getElementById('announcementError').classList.add('hidden');
    document.getElementById('announcementModal').classList.remove('hidden');
}

function closeAnnouncementModal() {
    document.getElementById('announcementModal').classList.add('hidden');
}

async function editAnnouncement(announcementId) {
    try {
        const response = await apiRequest('/feed');
        if (!response.ok) throw new Error('Failed to load announcements');
        
        const data = await response.json();
        const announcement = data.announcements.find(a => a.id === announcementId);
        
        if (!announcement) throw new Error('Announcement not found');
        
        document.getElementById('announcementModalTitle').textContent = 'Modifier l\'annonce';
        document.getElementById('announcementId').value = announcement.id;
        document.getElementById('announcementTitle').value = announcement.title;
        document.getElementById('announcementContent').value = announcement.content;
        document.getElementById('announcementError').classList.add('hidden');
        document.getElementById('announcementModal').classList.remove('hidden');
    } catch (error) {
        alert('Erreur lors du chargement de l\'annonce');
    }
}

async function saveAnnouncement() {
    const announcementId = document.getElementById('announcementId').value;
    const data = {
        title: document.getElementById('announcementTitle').value,
        content: document.getElementById('announcementContent').value
    };
    
    if (!data.title || !data.content) {
        document.getElementById('announcementError').textContent = 'Tous les champs sont requis';
        document.getElementById('announcementError').classList.remove('hidden');
        return;
    }
    
    try {
        const url = announcementId ? `/feed/${announcementId}` : '/feed';
        const method = announcementId ? 'PUT' : 'POST';
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save announcement');
        }
        
        closeAnnouncementModal();
        loadAnnouncements();
    } catch (error) {
        document.getElementById('announcementError').textContent = error.message;
        document.getElementById('announcementError').classList.remove('hidden');
    }
}

async function deleteAnnouncement(announcementId) {
    if (!confirm('Supprimer cette annonce ?')) return;
    
    try {
        const response = await apiRequest(`/feed/${announcementId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete announcement');
        loadAnnouncements();
    } catch (error) {
        alert('Erreur lors de la suppression');
    }
}

// Init
loadUsers();
loadGroups();
loadAnnouncements();
