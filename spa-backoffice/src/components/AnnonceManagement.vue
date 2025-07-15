<template>
  <div class="annonce-management">
    <h2 class="text-2xl font-bold mb-4">Gestion des Annonces</h2>

    <!-- Barre de recherche et filtres -->
    <div class="flex gap-4 mb-6">
      <input
        v-model.trim="searchTerm"
        type="text"
        placeholder="Rechercher une annonce..."
        class="flex-1 p-2 border rounded"
      />
      <select v-model="filterStatus" class="p-2 border rounded">
        <option value="all">Tous les statuts</option>
        <option value="ouverte">Ouverte</option>
        <option value="en_cours">En cours</option>
        <option value="terminée">Terminée</option>
        <option value="annulée">Annulée</option>
      </select>
    </div>

    <!-- Message d'erreur -->
    <div
      v-if="error"
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      {{ error }}
    </div>

    <!-- Mode édition -->
    <div
      v-if="editMode"
      class="bg-white p-6 rounded-lg shadow-lg mb-6"
    >
      <h3 class="text-xl font-semibold mb-4">Modifier l'annonce</h3>
      <form @submit.prevent="saveAnnonce" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Titre</label>
            <input
              v-model.trim="editForm.titre"
              type="text"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Type</label>
            <select
              v-model="editForm.type"
              required
              class="w-full p-2 border rounded"
            >
              <option value="" disabled>Choisir un type</option>
              <option v-for="type in typesAnnonces" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Départ</label>
            <input
              v-model.trim="editForm.depart"
              type="text"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Arrivée</label>
            <input
              v-model.trim="editForm.arrivee"
              type="text"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Date</label>
            <input
              v-model="editForm.date"
              type="datetime-local"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Rémunération (€)</label>
            <input
              v-model.number="editForm.remuneration"
              type="number"
              step="0.01"
              required
              class="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Statut</label>
            <select
              v-model="editForm.statut"
              required
              class="w-full p-2 border rounded"
            >
              <option value="ouverte">Ouverte</option>
              <option value="en_cours">En cours</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea
            v-model.trim="editForm.description"
            required
            class="w-full p-2 border rounded"
            rows="4"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Enregistrer
          </button>
          <button
            type="button"
            @click="cancelEdit"
            class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>

    <!-- Liste des annonces -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trajet</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rémunération</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="annonce in filteredAnnonces" :key="annonce.id">
            <td class="px-6 py-4 whitespace-nowrap">{{ annonce.titre }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ annonce.type }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ annonce.depart }} → {{ annonce.arrivee }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(annonce.date) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">{{ annonce.remuneration }}€</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="{
                  'px-2 py-1 rounded text-sm font-semibold': true,
                  'bg-green-100 text-green-800': annonce.statut === 'ouverte',
                  'bg-blue-100 text-blue-800': annonce.statut === 'en_cours',
                  'bg-gray-100 text-gray-800': annonce.statut === 'terminée',
                  'bg-red-100 text-red-800': annonce.statut === 'annulée'
                }"
              >
                {{ annonce.statut }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="editAnnonce(annonce)"
                class="text-blue-600 hover:text-blue-900 mr-2"
              >
                Modifier
              </button>
              <button
                @click="deleteAnnonce(annonce.id)"
                class="text-red-600 hover:text-red-900"
              >
                Supprimer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref } from 'vue';
import { TYPES_ANNONCES } from '../config/constants';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

export default {
  name: 'AnnonceManagement',
  setup() {
    const annonces = ref([]);
    const editForm = ref({
      id: null,
      titre: '',
      description: '',
      depart: '',
      arrivee: '',
      date: '',
      type: '',
      remuneration: 0,
      image: null,
      statut: 'ouverte'
    });
    const showEditModal = ref(false);
    const searchTerm = ref('');
    const typeFilter = ref('');
    const statusFilter = ref('');
    const sortBy = ref('date');
    const sortOrder = ref('desc');

    // Ajouter la liste des types d'annonces
    const typesAnnonces = ref(TYPES_ANNONCES);

    return {
      annonces,
      editForm,
      showEditModal,
      searchTerm,
      typeFilter,
      statusFilter,
      sortBy,
      sortOrder,
      typesAnnonces,
    };
  },

  computed: {
    filteredAnnonces() {
      return this.annonces
        .filter(annonce => {
          if (this.filterStatus !== 'all' && annonce.statut !== this.filterStatus) {
            return false;
          }
          
          if (this.searchTerm) {
            const searchLower = this.searchTerm.toLowerCase().trim();
            const searchTerms = searchLower.split(' ').filter(term => term.length > 0);
            
            return searchTerms.every(term => 
              annonce.titre.toLowerCase().includes(term) ||
              annonce.description.toLowerCase().includes(term) ||
              annonce.depart.toLowerCase().includes(term) ||
              annonce.arrivee.toLowerCase().includes(term) ||
              annonce.type.toLowerCase().includes(term) ||
              annonce.statut.toLowerCase().includes(term) ||
              annonce.remuneration.toString().includes(term)
            );
          }
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  },

  watch: {
    searchTerm: {
      handler() {
        if (this.searchTimeout) {
          clearTimeout(this.searchTimeout);
        }
        this.searchTimeout = setTimeout(() => {
          this.updateFilters();
        }, 300);
      }
    },
    
    filterStatus: {
      handler() {
        this.updateFilters();
      }
    }
  },

  methods: {
    updateFilters() {
      localStorage.setItem('annonceFilters', JSON.stringify({
        searchTerm: this.searchTerm,
        filterStatus: this.filterStatus
      }));
    },

    async fetchAnnonces() {
      try {
        const response = await api.get('/annonces');
        this.annonces = response.data;
        this.error = null;
      } catch (err) {
        this.handleError(err);
      }
    },

    async deleteAnnonce(id) {
      if (!confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
        return;
      }
      
      try {
        await api.delete(`/annonces/${id}`);
        this.annonces = this.annonces.filter(a => a.id !== id);
        this.error = null;
      } catch (err) {
        this.handleError(err);
      }
    },

    editAnnonce(annonce) {
      this.editMode = true;
      this.selectedAnnonce = annonce;
      this.editForm = { ...annonce };
      this.editForm.date = this.formatDateForInput(annonce.date);
    },

    async saveAnnonce() {
      try {
        const formData = new FormData();
        Object.keys(this.editForm).forEach(key => {
          formData.append(key, this.editForm[key]);
        });

        const response = await api.put(
          `/annonces/${this.selectedAnnonce.id}`,
          this.editForm,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const index = this.annonces.findIndex(a => a.id === this.selectedAnnonce.id);
        this.annonces[index] = response.data;
        this.editMode = false;
        this.selectedAnnonce = null;
        this.error = null;
      } catch (err) {
        this.handleError(err);
      }
    },

    cancelEdit() {
      this.editMode = false;
      this.selectedAnnonce = null;
      this.editForm = {
        titre: '',
        description: '',
        depart: '',
        arrivee: '',
        date: '',
        type: '',
        remuneration: 0,
        statut: ''
      };
    },

    formatDateForInput(dateStr) {
      const date = new Date(dateStr);
      return date.toISOString().slice(0, 16);
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleString('fr-FR');
    },

    handleError(err) {
      console.error('Erreur:', err);
      if (err.response) {
        this.error = err.response.data.error || `Erreur ${err.response.status}: ${err.response.data.message || 'Erreur serveur'}`;
        if (err.response.status === 401) {
          window.location.href = 'http://localhost:4000/';
        }
      } else if (err.request) {
        this.error = 'Erreur de connexion au serveur';
      } else {
        this.error = 'Erreur de configuration';
      }
    }
  },

  created() {
    const savedFilters = localStorage.getItem('annonceFilters');
    if (savedFilters) {
      const { searchTerm, filterStatus } = JSON.parse(savedFilters);
      this.searchTerm = searchTerm || '';
      this.filterStatus = filterStatus || 'all';
    }
    
    this.fetchAnnonces();
  },

  beforeUnmount() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.updateFilters();
  }
};
</script>

<style scoped>
.annonce-management {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.75rem;
}

/* Barre de recherche et filtres */
.flex.gap-4.mb-6 {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

input[type="text"],
select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

input[type="text"]:focus,
select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

/* Table des annonces */
.bg-white.rounded-lg.shadow {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

td {
  padding: 1rem;
  color: #1e293b;
  font-size: 0.95rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

tr:hover {
  background-color: #f8fafc;
}

/* Boutons */
button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

button:hover {
  transform: translateY(-1px);
}

/* Formulaire d'édition */
.bg-white.p-6.rounded-lg.shadow-lg {
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.grid.grid-cols-2.gap-4 {
  margin-bottom: 1.5rem;
}

label {
  color: #475569;
  margin-bottom: 0.5rem;
  display: block;
}

input[type="text"],
input[type="number"],
input[type="datetime-local"],
select,
textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

/* Badges de statut */
.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: capitalize;
}

/* Animation de transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Message d'erreur */
.bg-red-100 {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* Responsive */
@media (max-width: 1024px) {
  .grid.grid-cols-2.gap-4 {
    grid-template-columns: 1fr;
  }
  
  .flex.gap-4.mb-6 {
    flex-direction: column;
  }
  
  .flex.gap-4.mb-6 > * {
    margin-bottom: 1rem;
  }
}

@media (max-width: 768px) {
  .annonce-management {
    padding: 1rem;
  }
  
  table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style> 