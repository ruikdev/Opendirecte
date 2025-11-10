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

// Charger les événements du calendrier
async function loadEvents() {
    try {
        const response = await fetch('/api/v1/calendar', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        
        const data = await response.json();
        const container = document.getElementById('calendarContainer');
        
        if (data.events && data.events.length > 0) {
            // Trier les événements par date
            const sortedEvents = data.events.sort((a, b) => 
                new Date(a.start_time) - new Date(b.start_time)
            );
            
            container.innerHTML = sortedEvents.map(event => {
                const startDate = new Date(event.start_time);
                const endDate = new Date(event.end_time);
                const isPast = endDate < new Date();
                
                return `
                    <div class="border rounded-lg p-4 ${isPast ? 'bg-gray-50' : 'bg-white'}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="font-semibold text-lg text-gray-800">${event.title}</h3>
                                <p class="text-sm text-gray-600 mt-1">Groupe: ${event.group_name}</p>
                                ${event.description ? `<p class="text-gray-700 mt-2">${event.description}</p>` : ''}
                                ${event.location ? `<p class="text-sm text-gray-600 mt-1">📍 ${event.location}</p>` : ''}
                            </div>
                            <div class="text-right ml-4">
                                <p class="text-sm font-semibold text-gray-700">
                                    ${startDate.toLocaleDateString('fr-FR')}
                                </p>
                                <p class="text-sm text-gray-600">
                                    ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    - ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500">Aucun événement prévu.</p>';
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('calendarContainer').innerHTML = '<p class="text-red-500">Erreur lors du chargement du calendrier.</p>';
    }
}

// Charger les événements au chargement de la page
loadEvents();
