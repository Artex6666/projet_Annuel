<template>
  <div class="user-management">
    <!-- BARRE DE RECHERCHE -->
    <div class="search-container">
      <input
        v-model="searchTerm"
        class="search-input"
        type="text"
        placeholder="Rechercher un utilisateur..."
      />
      <div class="filter-dropdown" @click.stop="toggleFilterDropdown">
        <i class="fas fa-filter"></i>
        <span>{{ getSearchLabel(searchBy) }}</span>
        <div v-if="filterDropdownOpen" class="dropdown-filter-content">
          <a @click="setSearchBy('global')">Recherche globale</a>
          <a @click="setSearchBy('name')">Rechercher par Nom</a>
          <a @click="setSearchBy('email')">Rechercher par Email</a>
          <a @click="setSearchBy('type')">Rechercher par Type</a>
        </div>
      </div>
    </div>

    <!-- SECTION 1 : Utilisateurs en attente -->
    <h2>Utilisateurs en attente</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Email</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredPendingUsers" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.type }}</td>
          <td>
            <!-- Boutons actions -->
            <button class="btn btn-green" @click="validateUser(user.id)">Valider</button>
            <button class="btn btn-red" @click="deleteUser(user.id)">Supprimer</button>
            <button class="btn btn-blue" @click="showDocuments(user.id)">Afficher Docs</button>
            <button class="btn btn-orange" @click="sendMessage(user.id)">Message</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- SECTION 2 : Utilisateurs validés -->
    <h2>Liste des utilisateurs</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Email</th>
          <th>Type</th>
          <th>Rôle</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredValidatedUsers" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.type }}</td>
          <td>
            <span class="role-badge" :class="getRoleClass(user.role)">
              {{ getRoleLabel(user.role) }}
            </span>
          </td>
          <td>
            <div class="dropdown-wrapper">
              <button class="btn btn-orange" @click="toggleDropdown(user.id)">Gérer</button>
              <div v-if="dropdownOpen === user.id" class="dropdown-content">
                <a class="role-link-membre" @click="updateRole(user.id, 'membre')">
                  Assigner en tant que Membre
                </a>
                <a class="role-link-moderateur" @click="updateRole(user.id, 'moderateur')">
                  Assigner en tant que Modérateur
                </a>
                <a class="role-link-administrateur" @click="updateRole(user.id, 'administrateur')">
                  Assigner en tant qu'Administrateur
                </a>
              </div>
            </div>
            <button class="btn btn-red" @click="deleteUser(user.id)">Supprimer</button>
            <button class="btn btn-orange" @click="recheckUser(user.id)">Renvoyer en vérification</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div 
      v-if="selectedUserDocs" 
      class="modal-overlay"
      @click="closeModal"
    >
      <div class="modal-content" @click.stop>
        <button class="close-button" @click="closeModal">X</button>
        <h3>Documents de {{ selectedUserDocs.userName }}</h3>
        <ul>
          <li v-for="doc in selectedUserDocs.docs" :key="doc.id">
            <div v-if="doc.document_url.endsWith('.pdf')">
              <object :data="doc.document_url" type="application/pdf" width="600" height="400">
                <p>Impossible d'afficher le PDF,
                  <a :href="doc.document_url" download>Télécharger</a>
                </p>
              </object>
            </div>
            <div v-else-if="doc.document_url.match(/\.(jpg|jpeg|png|gif)$/)">
              <img :src="doc.document_url" alt="Document" style="max-width: 400px; max-height: 400px;" />
            </div>
            <div v-else>
              <p>Type de document non géré ({{ doc.document_name }})</p>
            </div>
            <p>
              <a :href="doc.document_url" download>Télécharger {{ doc.document_name }}</a>
            </p>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

<<<<<<< HEAD
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

=======
// Configuration globale d'axios
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Création d'une instance axios avec la configuration de base
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

export default {
  name: "UserManagement",
  data() {
    return {
<<<<<<< HEAD
      allUsers: [],
=======
      pendingUsers: [],
      validatedUsers: [],
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      dropdownOpen: null,
      selectedUserDocs: null,
      searchTerm: "",
      searchBy: "global",        
      filterDropdownOpen: false,
      error: null
    };
  },
  computed: {
    filteredPendingUsers() {
<<<<<<< HEAD
      return this.applySearch(this.allUsers.filter(user => !user.is_validated));
    },
    filteredValidatedUsers() {
      return this.applySearch(this.allUsers.filter(user => user.is_validated));
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const res = await api.get("/api/users");
        this.allUsers = res.data;
        this.error = null;
      } catch (err) {
        this.handleError(err);
      }
    },

    applySearch(users) {
      if (!this.searchTerm) return users;
=======
      return this.applySearch(this.pendingUsers);
    },
    filteredValidatedUsers() {
      return this.applySearch(this.validatedUsers);
    }
  },
  methods: {
    async created() {
      console.log("Component created - Fetching users...");
      await this.fetchUsers();
    },
    async fetchUsers() {
      console.log("fetchUsers called - Starting API request...");
      try {
        console.log("Making API request to /api/users/with-documents");
        const usersWithDocsRes = await api.get("/api/users/with-documents");
        console.log("API response received:", usersWithDocsRes);
        
        // Sépare les utilisateurs en attente et validés
        this.pendingUsers = usersWithDocsRes.data.filter(user => !user.is_validated);
        this.validatedUsers = usersWithDocsRes.data.filter(user => user.is_validated);
        this.error = null;
      } catch (err) {
        console.log("API request failed:", err);
        console.error('Erreur lors de la récupération des utilisateurs:', err);
        if (err.response) {
          console.error('Réponse du serveur:', err.response.data);
          console.error('Status:', err.response.status);
          console.error('Headers:', err.response.headers);
          this.error = `Erreur ${err.response.status}: ${err.response.data.message || 'Erreur serveur'}`;
          if (err.response.status === 401) {
            window.location.href = 'http://localhost:4000/';
          }
        } else if (err.request) {
          console.error('Pas de réponse reçue:', err.request);
          this.error = 'Erreur de connexion au serveur';
        } else {
          console.error('Erreur de configuration:', err.message);
          this.error = 'Erreur de configuration';
        }
      }
    },
    // Applique la recherche selon searchBy
    applySearch(users) {
      if (!this.searchTerm) {
        return users;
      }
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      const term = this.searchTerm.toLowerCase();
      return users.filter(user => {
        switch (this.searchBy) {
          case "name":
            return user.name.toLowerCase().includes(term);
          case "email":
            return user.email.toLowerCase().includes(term);
          case "type":
            return user.type.toLowerCase().includes(term);
<<<<<<< HEAD
          default:
=======
          default: // "global"
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
            return (
              user.name.toLowerCase().includes(term) ||
              user.email.toLowerCase().includes(term) ||
              user.type.toLowerCase().includes(term)
            );
        }
      });
    },

    async validateUser(userId) {
      try {
        await api.post(`/api/users/${userId}/validate`);
        this.fetchUsers();
<<<<<<< HEAD
=======
        this.error = null;
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      } catch (err) {
        this.handleError(err);
      }
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    async deleteUser(userId) {
      if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
      try {
        await api.delete(`/api/users/${userId}`);
        this.fetchUsers();
<<<<<<< HEAD
=======
        this.error = null;
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      } catch (err) {
        this.handleError(err);
      }
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    async recheckUser(userId) {
      try {
        await api.post(`/api/users/${userId}/recheck`);
        this.fetchUsers();
<<<<<<< HEAD
=======
        this.error = null;
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      } catch (err) {
        this.handleError(err);
      }
    },

    async showDocuments(userId) {
      try {
        const [docsRes, userRes] = await Promise.all([
          api.get(`/api/users/${userId}/documents`),
          api.get(`/api/users/${userId}`)
        ]);
<<<<<<< HEAD
=======
        
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
        this.selectedUserDocs = { 
          userId,
          userName: userRes.data.name,
          docs: docsRes.data.docs 
        };
<<<<<<< HEAD
=======
        this.error = null;
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      } catch (err) {
        this.handleError(err);
      }
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    closeModal() {
      this.selectedUserDocs = null;
    },

    sendMessage(userId) {
      alert(`Envoyer un message à l'utilisateur ID ${userId}`);
    },

    toggleDropdown(userId) {
      this.dropdownOpen = this.dropdownOpen === userId ? null : userId;
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    async updateRole(userId, role) {
      try {
        await api.post(`/api/users/${userId}/role`, { role });
        this.fetchUsers();
        this.dropdownOpen = null;
<<<<<<< HEAD
=======
        this.error = null;
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      } catch (err) {
        this.handleError(err);
      }
    },

    toggleFilterDropdown() {
      this.filterDropdownOpen = !this.filterDropdownOpen;
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    setSearchBy(mode) {
      this.searchBy = mode;
      this.filterDropdownOpen = false;
    },

    getSearchLabel(mode) {
      switch (mode) {
        case "global": return "Recherche globale";
        case "name": return "Par nom";
        case "email": return "Par email";
        case "type": return "Par type";
        default: return "Recherche globale";
      }
    },

<<<<<<< HEAD
=======
    // Couleurs pour les rôles
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    getRoleClass(role) {
      switch (role) {
        case 'membre': return 'role-green';
        case 'moderateur': return 'role-yellow';
        case 'administrateur': return 'role-red';
        default: return 'role-green';
      }
    },
<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
    getRoleLabel(role) {
      switch (role) {
        case 'membre': return 'Membre';
        case 'moderateur': return 'Modérateur';
        case 'administrateur': return 'Administrateur';
        default: return 'Membre';
      }
    },

<<<<<<< HEAD
    handleError(err) {
      console.error("Erreur :", err);
      if (err.response) {
        this.error = `Erreur ${err.response.status}: ${err.response.data.message || 'Erreur serveur'}`;
        if (err.response.status === 401) {
          alert("Session expirée. Veuillez vous reconnecter.");
          window.location.href = "http://localhost:4000/";
        }
      } else if (err.request) {
        this.error = "Erreur de connexion au serveur";
      } else {
        this.error = "Erreur de configuration";
=======
    // Méthode utilitaire pour gérer les erreurs
    handleError(err) {
      console.error('Erreur:', err);
      if (err.response) {
        this.error = `Erreur ${err.response.status}: ${err.response.data.message || 'Erreur serveur'}`;
        if (err.response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          window.location.href = 'http://localhost:4000/';
        }
      } else if (err.request) {
        this.error = 'Erreur de connexion au serveur';
      } else {
        this.error = 'Erreur de configuration';
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
      }
    }
  },
  mounted() {
    this.fetchUsers();
  }
};
</script>

<<<<<<< HEAD

=======
>>>>>>> c827518a763d41e5a870ee35132d41d3a024090a
<style scoped>
/* CONTENEUR GÉNÉRAL */
.user-management {
  width: 100%;
}

/* BARRE DE RECHERCHE */
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}
.search-input {
  width: 300px;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
  margin-right: 10px;
}
.filter-dropdown {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
}
.filter-dropdown i {
  font-size: 1.2rem;
  margin-right: 5px;
}
.dropdown-filter-content {
  position: absolute;
  top: 24px;
  right: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  z-index: 99;
}
.dropdown-filter-content a {
  display: block;
  padding: 8px 12px;
  text-decoration: none;
  color: #333;
}
.dropdown-filter-content a:hover {
  background: #f0f0f0;
}


table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
thead tr {
  background-color: #f0f0f0;
}
th, td {
  padding: 10px;
  border: 1px solid #ddd;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  margin-right: 5px;
  font-size: 0.9rem;
}
.btn-green {
  background-color: #27ae60;
}
.btn-red {
  background-color: #c0392b;
}
.btn-blue {
  background-color: #2980b9;
}
.btn-orange {
  background-color: #e67e22;
}

/* DROPDOWN (RÔLE) */
.dropdown-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 5px;
}
.dropdown-content {
  position: absolute;
  background-color: #fff;
  min-width: 220px;
  box-shadow: 0px 8px 16px rgba(0,0,0,0.2);
  z-index: 10;
}
.dropdown-content a {
  display: block;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
  transition: background 0.2s;
  cursor: pointer;
  -webkit-user-select: none; /* Chrome/Safari */
  -moz-user-select: none;    /* Firefox */
  -ms-user-select: none;     /* Internet Explorer/Edge */
  user-select: none;         /* Standard */
}

.role-link-membre {
  background-color: #d4edda; 
}
.role-link-moderateur {
  background-color: #fff3cd;
}
.role-link-administrateur {
  background-color: #f8d7da;
}
.dropdown-content a:hover {
  opacity: 0.9;
}

/* BADGES DE RÔLE */
.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
}
.role-green {
  background-color: #27ae60; 
}
.role-yellow {
  background-color: #f1c40f; 
  color: #333;
}
.role-red {
  background-color: #c0392b;
}

/* MODAL OVERLAY */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.modal-content {
  position: relative;
  background-color: #fff;
  padding: 20px;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 8px;
}
.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #eee;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-weight: bold;
  cursor: pointer;
}
</style>
