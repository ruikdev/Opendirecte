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

// Charger les notes
async function loadNotes() {
    try {
        const response = await fetch('/api/v1/notes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load notes');
        }
        
        const data = await response.json();
        const container = document.getElementById('notesContainer');
        
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
                                            ${user.role === 'eleve' ? 'Prof: ' + note.teacher : 'Élève: ' + note.student}
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
        document.getElementById('notesContainer').innerHTML = '<p class="text-red-500">Erreur lors du chargement des notes.</p>';
    }
}

// Charger les notes au chargement de la page
loadNotes();
