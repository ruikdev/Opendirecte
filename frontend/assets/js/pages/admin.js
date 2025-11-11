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
                                    u.role === 'parent' ? 'bg-yellow-100 text-yellow-800' :
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
loadParents();

// Parents management
async function loadParents() {
    try {
        const response = await apiRequest('/users');
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        const parents = data.users.filter(u => u.role === 'parent');
        const table = document.getElementById('parentsTable');
        
        if (parents.length === 0) {
            table.innerHTML = '<p class="text-gray-500 text-center py-8">Aucun compte parent</p>';
            return;
        }
        
        // Charger les informations des enfants pour chaque parent
        const parentsWithChildren = await Promise.all(parents.map(async (parent) => {
            try {
                const childrenResp = await apiRequest(`/users/${parent.id}/children`);
                const childrenData = await childrenResp.json();
                return { ...parent, children: childrenData.children || [] };
            } catch {
                return { ...parent, children: [] };
            }
        }));
        
        table.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enfants</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${parentsWithChildren.map(p => `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                    <div class="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <div class="ml-4">
                                        <div class="text-sm font-medium text-gray-900">${p.username}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.email}</td>
                            <td class="px-6 py-4">
                                <div class="text-sm text-gray-900">
                                    ${p.children.length > 0 ? 
                                        p.children.map(c => `
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2 mb-1">
                                                ${c.username}
                                                ${c.groups && c.groups.length > 0 ? `<span class="ml-1 text-green-600">(${c.groups.join(', ')})</span>` : ''}
                                            </span>
                                        `).join('') 
                                        : '<span class="text-gray-400 italic">Aucun enfant associé</span>'
                                    }
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="manageParentChildren(${p.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                    Gérer les enfants
                                </button>
                                <button onclick="editUser(${p.id})" class="text-green-600 hover:text-green-900 mr-3">Éditer</button>
                                <button onclick="deleteUser(${p.id}, '${p.username}')" class="text-red-600 hover:text-red-900">Supprimer</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading parents:', error);
    }
}

async function manageParentChildren(parentId) {
    try {
        const [parentResp, studentsResp, childrenResp] = await Promise.all([
            apiRequest(`/users/${parentId}`),
            apiRequest('/users/students'),
            apiRequest(`/users/${parentId}/children`)
        ]);
        
        const parent = await parentResp.json();
        const studentsData = await studentsResp.json();
        const childrenData = await childrenResp.json();
        
        const currentChildIds = childrenData.children.map(c => c.id);
        
        const studentsHtml = studentsData.students.map(s => `
            <label class="flex items-center justify-between p-3 hover:bg-gray-50 rounded border border-gray-200 mb-2">
                <div class="flex items-center space-x-3">
                    <input type="checkbox" value="${s.id}" ${currentChildIds.includes(s.id) ? 'checked' : ''} 
                           class="rounded text-blue-600 focus:ring-blue-500">
                    <div>
                        <div class="font-medium text-gray-900">${s.username}</div>
                        <div class="text-sm text-gray-500">${s.email}</div>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    ${s.groups && s.groups.length > 0 ? s.groups.join(', ') : 'Aucun groupe'}
                </div>
            </label>
        `).join('');
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900">Enfants de ${parent.username}</h3>
                    <p class="text-sm text-gray-600 mt-1">Sélectionnez les élèves associés à ce compte parent</p>
                </div>
                <div class="px-6 py-4 max-h-96 overflow-y-auto">
                    ${studentsData.students.length > 0 ? studentsHtml : '<p class="text-gray-500 text-center py-4">Aucun élève disponible</p>'}
                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
                    <button onclick="saveParentChildren(${parentId}, this)" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors du chargement des données');
    }
}

async function saveParentChildren(parentId, button) {
    const modal = button.closest('.fixed');
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    const selectedChildren = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => parseInt(cb.value));
    
    try {
        const childrenResp = await apiRequest(`/users/${parentId}/children`);
        const childrenData = await childrenResp.json();
        const currentChildren = childrenData.children.map(c => c.id);
        
        const toAdd = selectedChildren.filter(id => !currentChildren.includes(id));
        const toRemove = currentChildren.filter(id => !selectedChildren.includes(id));
        
        const response = await apiRequest(`/users/${parentId}/children`, {
            method: 'PUT',
            body: JSON.stringify({
                add_children: toAdd,
                remove_children: toRemove
            })
        });
        
        if (!response.ok) throw new Error('Failed to update children');
        
        modal.remove();
        loadParents();
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors de la sauvegarde');
    }
}

// Search parents
document.getElementById('parentSearch').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#parentsTable tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
});
