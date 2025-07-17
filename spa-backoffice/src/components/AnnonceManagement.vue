<template>
  <div class="annonce-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Annonces</h2>
      <p class="page-subtitle">Administrez et modifiez les annonces de livraison</p>
    </div>

    <!-- Barre de recherche et filtres -->
    <div class="search-section">
      <div class="search-container">
        <div class="search-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input
          v-model.trim="searchTerm"
          type="text"
          placeholder="Rechercher une annonce..."
          class="search-input"
        />
      </div>
      <select v-model="filterStatus" class="filter-select">
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
      class="error-message"
    >
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      {{ error }}
    </div>

    <!-- Modal d'édition -->
    <div
      v-if="editMode"
      class="modal-overlay"
      @click="cancelEdit"
    >
      <div
        class="modal-container"
        @click.stop
      >
        <div class="modal-header">
          <h3 class="modal-title">Modifier l'annonce</h3>
          <button
            @click="cancelEdit"
            class="modal-close"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form @submit.prevent="saveAnnonce" class="modal-form">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Titre</label>
              <input
                v-model.trim="editForm.titre"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Type</label>
              <select
                v-model="editForm.type"
                required
                class="form-input"
              >
                <option value="" disabled>Choisir un type</option>
                <option v-for="type in typesAnnonces" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Départ</label>
              <input
                v-model.trim="editForm.depart"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Arrivée</label>
              <input
                v-model.trim="editForm.arrivee"
                type="text"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Date</label>
              <input
                v-model="editForm.date"
                type="datetime-local"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Rémunération (€)</label>
              <input
                v-model.number="editForm.remuneration"
                type="number"
                step="0.01"
                required
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Statut</label>
              <select
                v-model="editForm.statut"
                required
                class="form-input"
              >
                <option value="ouverte">Ouverte</option>
                <option value="en_cours">En cours</option>
                <option value="terminée">Terminée</option>
                <option value="annulée">Annulée</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model.trim="editForm.description"
              required
              class="form-textarea"
              rows="4"
            />
          </div>
          <div class="modal-actions">
            <button
              type="button"
              @click="cancelEdit"
              class="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn-primary"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Liste des annonces -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Type</th>
            <th>Trajet</th>
            <th>Date</th>
            <th>Rémunération</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="annonce in filteredAnnonces" :key="annonce.id" class="table-row">
            <td class="table-cell">{{ annonce.titre }}</td>
            <td class="table-cell">{{ annonce.type }}</td>
            <td class="table-cell">
              <div class="route-info">
                <span class="route-from">{{ annonce.depart }}</span>
                <svg class="route-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
                <span class="route-to">{{ annonce.arrivee }}</span>
              </div>
            </td>
            <td class="table-cell">{{ formatDate(annonce.date) }}</td>
            <td class="table-cell">
              <span class="price">{{ annonce.remuneration }}€</span>
            </td>
            <td class="table-cell">
              <span
                :class="getStatusClass(annonce.statut)"
              >
                {{ annonce.statut }}
              </span>
            </td>
            <td class="table-cell">
              <div class="action-buttons">
                <button
                  @click="editAnnonce(annonce)"
                  class="btn-edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Modifier
                </button>
                <button
                  @click="deleteAnnonce(annonce.id)"
                  class="btn-delete"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Supprimer
                </button>
              </div>
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
  baseURL: 'https://api.axia.quest',
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
    const editMode = ref(false);
    const selectedAnnonce = ref(null);
    const showEditModal = ref(false);
    const searchTerm = ref('');
    const typeFilter = ref('');
    const statusFilter = ref('');
    const filterStatus = ref('all');
    const sortBy = ref('date');
    const sortOrder = ref('desc');
    const error = ref(null);

    // Ajouter la liste des types d'annonces
    const typesAnnonces = ref(TYPES_ANNONCES);

    return {
      annonces,
      editForm,
      editMode,
      selectedAnnonce,
      showEditModal,
      searchTerm,
      typeFilter,
      statusFilter,
      filterStatus,
      sortBy,
      sortOrder,
      typesAnnonces,
      error,
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

    getStatusClass(status) {
      switch (status) {
        case 'ouverte':
          return 'status-badge bg-green-100 text-green-800';
        case 'en_cours':
          return 'status-badge bg-blue-100 text-blue-800';
        case 'terminée':
          return 'status-badge bg-gray-100 text-gray-800';
        case 'annulée':
          return 'status-badge bg-red-100 text-red-800';
        default:
          return 'status-badge bg-gray-100 text-gray-800';
      }
    },

    handleError(err) {
      console.error('Erreur:', err);
      if (err.response) {
        this.error = err.response.data.error || `Erreur ${err.response.status}: ${err.response.data.message || 'Erreur serveur'}`;
        if (err.response.status === 401) {
          window.location.href = 'https://axia.quest/';
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

.header-section {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.page-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.search-container {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  flex-grow: 1;
  margin-right: 1rem;
}

.search-icon {
  color: #a0aec0;
  margin-right: 0.75rem;
}

.search-input {
  border: none;
  background-color: transparent;
  width: 100%;
  font-size: 0.95rem;
  color: #4a5568;
}

.search-input:focus {
  outline: none;
}

.filter-select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  color: #4a5568;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.error-message {
  background-color: #fef3f2;
  border: 1px solid #f56565;
  color: #972626;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  animation: shake 0.5s ease-in-out;
}

.error-message svg {
  margin-right: 0.75rem;
  color: #f56565;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #a0aec0;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #3b82f6;
}

.modal-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  color: #475569;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-input,
.form-textarea {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.95rem;
  color: #1e293b;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background-color: #cbd5e0;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2b6cb0;
}

.btn-edit,
.btn-delete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.btn-edit {
  background-color: #3b82f6;
  color: white;
}

.btn-edit:hover {
  background-color: #2b6cb0;
}

.btn-delete {
  background-color: #f56565;
  color: white;
}

.btn-delete:hover {
  background-color: #e53e3e;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table th {
  background-color: #f8fafc;
  padding: 1rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.data-table td {
  padding: 1rem;
  color: #1e293b;
  font-size: 0.95rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.data-table tr:hover {
  background-color: #f8fafc;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #4a5568;
  font-size: 0.95rem;
}

.route-from,
.route-to {
  font-weight: 500;
  color: #2c3e50;
}

.route-arrow {
  color: #a0aec0;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.price {
  font-weight: 600;
  color: #2b6cb0;
  font-size: 1rem;
}

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
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-container {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .annonce-management {
    padding: 1rem;
  }
  
  .data-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}
</style> 