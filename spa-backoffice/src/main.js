import { createApp } from 'vue'
import App from './App.vue'
import './assets/global.css';  
import "@fortawesome/fontawesome-free/css/all.min.css"

// Utiliser l'URL de production pour la redirection
const FRONT_URL = 'https://axia.quest/';
const API_URL = 'https://api.axia.quest/api/users/me';

fetch(API_URL, { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    const role = (data.user && data.user.role) ? data.user.role.toLowerCase() : '';
    if (!data.user || !['modérateur', 'administrateur'].includes(role)) {
      console.log("[DEBUG] Utilisateur non autorisé ou non connecté, redirection vers accueil");
      window.location.href = FRONT_URL;
    } else {
      createApp(App).mount('#app');
    }
  })
  .catch((err) => {
    console.log("[DEBUG] Erreur lors de la requête /api/users/me:", err);
    window.location.href = FRONT_URL;
  });
