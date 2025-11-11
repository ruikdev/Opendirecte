// Vérifier l'authentification
const token = localStorage.getItem('access_token');
if (!token) {
    window.location.href = '/';
}

// Afficher le nom d'utilisateur
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

let currentFilter = 'all';
let allHomeworks = [];
let selectedChildId = null; // Pour les parents

// Fonction de déconnexion
function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Charger les enfants pour un parent
async function loadChildren() {
    if (user.role !== 'parent') return;
    
    try {
        const response = await fetch(`/api/v1/users/${user.id}/children`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load children');
        
        const data = await response.json();
        
        if (data.children && data.children.length > 0) {
            // Insérer le sélecteur d'enfant dans le header
            const headerActions = document.querySelector('.flex.items-center.justify-between').querySelector('.flex.items-center.space-x-2');
            
            const selector = document.createElement('div');
            selector.className = 'mr-4';
            selector.innerHTML = `
                <select id="childSelectorHomework" onchange="onChildChangeHomework()" class="px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm">
                    <option value="">-- Tous les enfants --</option>
                    ${data.children.map(child => `
                        <option value="${child.id}">${child.username}</option>
                    `).join('')}
                </select>
            `;
            headerActions.parentNode.insertBefore(selector, headerActions);
            
            // Afficher les filtres pour les parents
            document.getElementById('studentFilters').classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

// Gestionnaire de changement de sélection d'enfant pour les devoirs
function onChildChangeHomework() {
    const selector = document.getElementById('childSelectorHomework');
    selectedChildId = selector.value ? parseInt(selector.value) : null;
    loadHomeworks();
}

// Afficher les filtres et bouton d'ajout selon le rôle
if (user.role === 'eleve') {
    document.getElementById('studentFilters').classList.remove('hidden');
} else if (user.role === 'prof' || user.role === 'admin') {
    document.getElementById('addHomeworkBtn').classList.remove('hidden');
    document.getElementById('addHomeworkBtn').addEventListener('click', openNewHomeworkModal);
    loadGroups();
} else if (user.role === 'parent') {
    loadChildren();
}

// Charger les groupes pour le formulaire
async function loadGroups() {
    try {
        const response = await fetch('/api/v1/groups', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('homeworkGroup');
            select.innerHTML = '<option value="">Sélectionner...</option>';
            data.groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Filtrer les devoirs
function filterHomeworks(status) {
    currentFilter = status;
    
    // Update button styles
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('filter-active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    });
    event.target.classList.add('filter-active', 'bg-blue-600', 'text-white');
    event.target.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
    
    loadHomeworks();
}

// Charger les devoirs
async function loadHomeworks() {
    try {
        let url = '/api/v1/homeworks';
        const params = [];
        
        if ((user.role === 'eleve' || user.role === 'parent') && currentFilter !== 'all') {
            params.push(`status=${currentFilter}`);
        }
        
        if (user.role === 'parent' && selectedChildId) {
            params.push(`child_id=${selectedChildId}`);
        }
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load homeworks');
        }
        
        const data = await response.json();
        allHomeworks = data.homeworks || [];
        renderHomeworks(allHomeworks);
    } catch (error) {
        console.error('Error loading homeworks:', error);
        document.getElementById('homeworkContainer').innerHTML = '<p class="text-red-500">Erreur lors du chargement des devoirs.</p>';
    }
}

// Afficher les devoirs
function renderHomeworks(homeworks) {
    const container = document.getElementById('homeworkContainer');
    
    if (homeworks.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="bg-gray-100 rounded-full p-6 mb-4">
                    <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-gray-500 font-medium text-lg">Aucun devoir pour le moment</p>
                <p class="text-gray-400 text-sm mt-1">Les devoirs apparaîtront ici</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = homeworks.map(homework => {
        const dueDate = new Date(homework.due_date);
        const now = new Date();
        const isOverdue = dueDate < now && !homework.is_completed;
        const isCompleted = homework.is_completed;
        
        let statusBadge = '';
        let borderClass = 'border-gray-300';
        let bgClass = 'bg-white';
        
        if (isCompleted) {
            statusBadge = '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Terminé</span>';
            borderClass = 'border-green-300';
            bgClass = 'bg-green-50';
        } else if (isOverdue) {
            statusBadge = '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">⚠ En retard</span>';
            borderClass = 'border-red-300';
            bgClass = 'bg-red-50';
        } else {
            statusBadge = '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">À faire</span>';
        }
        
        const canEdit = user.role === 'admin' || homework.author_id === user.id;
        
        return `
            <div class="border ${borderClass} ${bgClass} rounded-xl p-5 hover:shadow-md transition-all">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-bold text-xl text-gray-800">${homework.title}</h3>
                            ${statusBadge}
                        </div>
                        ${homework.subject ? `<p class="text-sm text-gray-600 mb-2">📚 ${homework.subject}</p>` : ''}
                        <p class="text-sm text-gray-600 mb-2">👥 ${homework.group_name}</p>
                        <p class="text-gray-700 mt-2 leading-relaxed">${homework.description}</p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <div class="flex items-center space-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span class="${isOverdue ? 'text-red-600 font-semibold' : ''}">
                                ${dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div class="flex items-center space-x-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>${homework.author}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        ${user.role === 'eleve' ? `
                            <button onclick="toggleCompletion(${homework.id})" class="px-4 py-2 ${isCompleted ? 'bg-gray-200 text-gray-700' : 'bg-blue-600 text-white'} rounded-lg hover:opacity-80 transition-all font-medium text-sm">
                                ${isCompleted ? 'Marquer non fait' : 'Marquer fait'}
                            </button>
                        ` : ''}
                        ${canEdit ? `
                            <button onclick="editHomework(${homework.id})" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-medium text-sm">
                                Modifier
                            </button>
                            <button onclick="deleteHomework(${homework.id})" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-medium text-sm">
                                Supprimer
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Toggle completion
async function toggleCompletion(homeworkId) {
    try {
        const response = await fetch(`/api/v1/homeworks/${homeworkId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to toggle completion');
        }
        
        await loadHomeworks();
    } catch (error) {
        console.error('Error toggling completion:', error);
        alert('Erreur lors de la mise à jour du statut');
    }
}

// Ouvrir modal pour nouveau devoir
function openNewHomeworkModal() {
    document.getElementById('modalTitle').textContent = 'Nouveau devoir';
    document.getElementById('homeworkForm').reset();
    document.getElementById('homeworkId').value = '';
    document.getElementById('formError').classList.add('hidden');
    document.getElementById('formSuccess').classList.add('hidden');
    document.getElementById('homeworkModal').classList.remove('hidden');
}

// Fermer modal
function closeHomeworkModal() {
    document.getElementById('homeworkModal').classList.add('hidden');
}

// Éditer un devoir
async function editHomework(homeworkId) {
    try {
        const response = await fetch(`/api/v1/homeworks/${homeworkId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load homework');
        }
        
        const data = await response.json();
        const homework = data.homework;
        
        document.getElementById('modalTitle').textContent = 'Modifier le devoir';
        document.getElementById('homeworkId').value = homework.id;
        document.getElementById('homeworkTitle').value = homework.title;
        document.getElementById('homeworkSubject').value = homework.subject || '';
        document.getElementById('homeworkDescription').value = homework.description;
        document.getElementById('homeworkGroup').value = homework.group_id;
        
        // Format date for datetime-local input
        const dueDate = new Date(homework.due_date);
        const formattedDate = dueDate.toISOString().slice(0, 16);
        document.getElementById('homeworkDueDate').value = formattedDate;
        
        document.getElementById('formError').classList.add('hidden');
        document.getElementById('formSuccess').classList.add('hidden');
        document.getElementById('homeworkModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading homework:', error);
        alert('Erreur lors du chargement du devoir');
    }
}

// Sauvegarder devoir
async function saveHomework() {
    const homeworkId = document.getElementById('homeworkId').value;
    const title = document.getElementById('homeworkTitle').value;
    const subject = document.getElementById('homeworkSubject').value;
    const description = document.getElementById('homeworkDescription').value;
    const groupId = document.getElementById('homeworkGroup').value;
    const dueDate = document.getElementById('homeworkDueDate').value;
    
    if (!title || !description || !groupId || !dueDate) {
        document.getElementById('formError').textContent = 'Veuillez remplir tous les champs obligatoires';
        document.getElementById('formError').classList.remove('hidden');
        return;
    }
    
    const data = {
        title,
        description,
        group_id: parseInt(groupId),
        due_date: new Date(dueDate).toISOString(),
        subject: subject || null
    };
    
    try {
        const url = homeworkId ? `/api/v1/homeworks/${homeworkId}` : '/api/v1/homeworks';
        const method = homeworkId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save homework');
        }
        
        document.getElementById('formSuccess').textContent = 'Devoir enregistré avec succès !';
        document.getElementById('formSuccess').classList.remove('hidden');
        document.getElementById('formError').classList.add('hidden');
        
        setTimeout(() => {
            closeHomeworkModal();
            loadHomeworks();
        }, 1000);
    } catch (error) {
        console.error('Error saving homework:', error);
        document.getElementById('formError').textContent = error.message;
        document.getElementById('formError').classList.remove('hidden');
        document.getElementById('formSuccess').classList.add('hidden');
    }
}

// Supprimer devoir
async function deleteHomework(homeworkId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devoir ?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/v1/homeworks/${homeworkId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete homework');
        }
        
        await loadHomeworks();
    } catch (error) {
        console.error('Error deleting homework:', error);
        alert('Erreur lors de la suppression du devoir');
    }
}

// Charger les devoirs au chargement de la page
loadHomeworks();
