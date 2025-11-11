// Vérifier l'authentification
const token = localStorage.getItem('access_token');
if (!token) {
    window.location.href = '/';
}

// Afficher le nom d'utilisateur
const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

// Variable globale pour stocker l'enfant sélectionné (pour les parents)
let selectedChildId = null;

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
            // Créer le sélecteur d'enfant
            const container = document.getElementById('notesContainer');
            const selector = `
                <div class="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        Sélectionner un enfant
                    </label>
                    <select id="childSelector" onchange="onChildChange()" class="w-full px-4 py-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm">
                        <option value="">-- Tous les enfants --</option>
                        ${data.children.map(child => `
                            <option value="${child.id}">${child.username} (${child.email})</option>
                        `).join('')}
                    </select>
                </div>
                <div id="notesContent"></div>
            `;
            container.innerHTML = selector;
        }
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

// Gestionnaire de changement de sélection d'enfant
function onChildChange() {
    const selector = document.getElementById('childSelector');
    selectedChildId = selector.value ? parseInt(selector.value) : null;
    loadNotes();
}

// Charger les notes
async function loadNotes() {
    try {
        // Construire l'URL avec le paramètre child_id si nécessaire
        let url = '/api/v1/notes';
        if (user.role === 'parent' && selectedChildId) {
            url += `?child_id=${selectedChildId}`;
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load notes');
        }
        
        const data = await response.json();
        const container = user.role === 'parent' ? document.getElementById('notesContent') : document.getElementById('notesContainer');
        
        if (!container) {
            console.error('Container not found');
            return;
        }
        
        if (data.notes && data.notes.length > 0) {
            // Grouper les notes par matière
            const notesBySubject = {};
            data.notes.forEach(note => {
                if (!notesBySubject[note.subject]) {
                    notesBySubject[note.subject] = [];
                }
                notesBySubject[note.subject].push(note);
            });
            
            container.innerHTML = Object.entries(notesBySubject).map(([subject, notes]) => {
                const average = notes.reduce((sum, n) => sum + (n.value / n.max_value * 20), 0) / notes.length;
                
                return `
                    <div class="border rounded-lg p-4">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="font-semibold text-lg text-gray-800">${subject}</h3>
                            <span class="text-lg font-bold ${average >= 10 ? 'text-green-600' : 'text-red-600'}">
                                Moyenne: ${average.toFixed(2)}/20
                            </span>
                        </div>
                        <div class="space-y-2">
                            ${notes.map(note => `
                                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div>
                                        <p class="text-gray-700">${note.comment || 'Note'}</p>
                                        <p class="text-sm text-gray-500">
                                            ${user.role === 'eleve' || user.role === 'parent' ? 'Prof: ' + note.teacher : 'Élève: ' + note.student}
                                        </p>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold ${note.value / note.max_value >= 0.5 ? 'text-green-600' : 'text-red-600'}">
                                            ${note.value}/${note.max_value}
                                        </p>
                                        <p class="text-sm text-gray-500">
                                            ${new Date(note.created_at).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500">Aucune note pour le moment.</p>';
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        const container = user.role === 'parent' ? document.getElementById('notesContent') : document.getElementById('notesContainer');
        if (container) {
            container.innerHTML = '<p class="text-red-500">Erreur lors du chargement des notes.</p>';
        }
    }
}

// Initialisation
async function init() {
    if (user.role === 'parent') {
        await loadChildren();
    }
    await loadNotes();
}

init();
