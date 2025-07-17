import { createApp } from 'vue'
import App from './App.vue'
import './assets/global.css';  
import "@fortawesome/fontawesome-free/css/all.min.css"

fetch('http://localhost:3000/api/users/me', { credentials: 'include' })
  .then(res => {
    return res.json();
  })
  .then(data => {
    if (!data.user || !['modérateur', 'administrateur'].includes((data.user.role || '').toLowerCase())) {
      console.log("[DEBUG] Utilisateur non autorisé ou non connecté, redirection vers accueil");
      window.location.href = 'http://localhost:4000/';
    } else {
      createApp(App).mount('#app');
    }
  })
  .catch((err) => {
    console.log("[DEBUG] Erreur lors de la requête /api/users/me:", err);
    window.location.href = 'http://localhost:4000/';
  });
