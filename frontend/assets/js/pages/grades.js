// Grades management
checkAuth();

const user = JSON.parse(localStorage.getItem('user') || '{}');
document.getElementById('userName').textContent = user.username || '';

let students = [];
let notes = [];
let selectedChildId = null;

// Load students
async function loadStudents() {
    try {
        const response = await apiRequest('/notes/students');
        if (!response.ok) throw new Error('Failed to load students');
        
        const data = await response.json();
        students = data.students;
        
        const select = document.getElementById('noteStudent');
        select.innerHTML = '<option value="">Sélectionner un élève...</option>';
        students.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.username} (${s.groups.join(', ')})</option>`;
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// Load children for parents
async function loadChildren() {
    if (user.role !== 'parent') return;
    
    try {
        const response = await apiRequest(`/users/${user.id}/children`);
        if (!response.ok) throw new Error('Failed to load children');
        
        const data = await response.json();
        
        if (data.children && data.children.length > 0) {
            const container = document.getElementById('childSelectorContainer');
            container.innerHTML = `
                <select id="childSelectorGrades" onchange="onChildChangeGrades()" class="px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm">
                    <option value="">-- Tous les enfants --</option>
                    ${data.children.map(child => `
                        <option value="${child.id}">${child.username}</option>
                    `).join('')}
                </select>
            `;
        }
    } catch (error) {
        console.error('Error loading children:', error);
    }
}

// Child selector change handler
function onChildChangeGrades() {
    const selector = document.getElementById('childSelectorGrades');
    selectedChildId = selector ? (selector.value ? parseInt(selector.value) : null) : null;
    loadNotes();
}

// Load notes
async function loadNotes() {
    try {
        let url = '/notes';
        if (user.role === 'parent' && selectedChildId) {
            url += `?child_id=${selectedChildId}`;
        }
        
        const response = await apiRequest(url);
        if (!response.ok) throw new Error('Failed to load notes');
        
        const data = await response.json();
        notes = data.notes;
        displayNotes(notes);
    } catch (error) {
        console.error('Error loading notes:', error);
    }
}

function displayNotes(notesToDisplay) {
    const table = document.getElementById('notesTable');
    
    if (notesToDisplay.length === 0) {
        table.innerHTML = '<p class="text-gray-500 text-center py-8">Aucune note</p>';
        return;
    }
    
    table.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Élève</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matière</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commentaire</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${notesToDisplay.map(n => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="font-medium text-gray-900">${n.student || 'Inconnu'}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${n.subject}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 inline-flex text-sm font-semibold rounded-full ${
                                n.value / n.max_value >= 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">
                                ${n.value}/${n.max_value}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">${n.comment || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${new Date(n.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onclick="editNote(${n.id})" class="text-blue-600 hover:text-blue-900 mr-3">Éditer</button>
                            <button onclick="deleteNote(${n.id})" class="text-red-600 hover:text-red-900">Supprimer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modal
function showAddNoteModal() {
    document.getElementById('noteModalTitle').textContent = 'Nouvelle note';
    document.getElementById('noteForm').reset();
    document.getElementById('noteId').value = '';
    document.getElementById('noteStudent').disabled = false;
    document.getElementById('noteError').classList.add('hidden');
    document.getElementById('noteModal').classList.remove('hidden');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.add('hidden');
}

async function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    document.getElementById('noteModalTitle').textContent = 'Modifier la note';
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteStudent').value = note.student_id;
    document.getElementById('noteStudent').disabled = true;
    document.getElementById('noteSubject').value = note.subject;
    document.getElementById('noteValue').value = note.value;
    document.getElementById('noteMax').value = note.max_value;
    document.getElementById('noteComment').value = note.comment || '';
    document.getElementById('noteError').classList.add('hidden');
    document.getElementById('noteModal').classList.remove('hidden');
}

async function saveNote() {
    const noteId = document.getElementById('noteId').value;
    const data = {
        student_id: parseInt(document.getElementById('noteStudent').value),
        subject: document.getElementById('noteSubject').value,
        value: parseFloat(document.getElementById('noteValue').value),
        max_value: parseFloat(document.getElementById('noteMax').value),
        comment: document.getElementById('noteComment').value
    };
    
    if (!data.student_id || !data.subject || isNaN(data.value) || isNaN(data.max_value)) {
        document.getElementById('noteError').textContent = 'Tous les champs sont requis';
        document.getElementById('noteError').classList.remove('hidden');
        return;
    }
    
    try {
        const url = noteId ? `/notes/${noteId}` : '/notes';
        const method = noteId ? 'PUT' : 'POST';
        
        const response = await apiRequest(url, {
            method: method,
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save note');
        }
        
        closeNoteModal();
        loadNotes();
    } catch (error) {
        document.getElementById('noteError').textContent = error.message;
        document.getElementById('noteError').classList.remove('hidden');
    }
}

async function deleteNote(noteId) {
    if (!confirm('Supprimer cette note ?')) return;
    
    try {
        const response = await apiRequest(`/notes/${noteId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete note');
        loadNotes();
    } catch (error) {
        alert('Erreur lors de la suppression');
    }
}

// Search
document.getElementById('noteSearch').addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    const filtered = notes.filter(n => 
        n.student?.toLowerCase().includes(search) ||
        n.subject?.toLowerCase().includes(search) ||
        n.comment?.toLowerCase().includes(search)
    );
    displayNotes(filtered);
});

// Init
if (user.role === 'prof' || user.role === 'admin') {
    loadStudents();
} else if (user.role === 'parent') {
    loadChildren();
}
loadNotes();
