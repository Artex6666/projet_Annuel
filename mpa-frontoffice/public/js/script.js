////////////////////// OUTILS ADRESSE //////////////////////
console.log('Script chargé');

async function validateAddress(address) {
  try {
    // Recherche prioritaire en France, puis Europe, puis monde
    const searches = [
      { countrycodes: 'fr' },
      { countrycodes: 'fr,be,ch,lu,mc,ad' },
      { countrycodes: '' }
    ];
    
    for (const search of searches) {
      const url = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(address)}&limit=1${search.countrycodes ? '&countrycodes=' + search.countrycodes : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.length > 0) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la validation de l\'adresse:', error);
    return true; // En cas d'erreur réseau, on accepte l'adresse
  }
}

const addressCache = new Map();

function normalizeAddressQuery(query) {
  return query
    .toLowerCase()
    .trim()
    // Remplacer les abréviations courantes
    .replace(/\bbd\b/g, 'boulevard')
    .replace(/\bboul\b/g, 'boulevard')
    .replace(/\bav\b/g, 'avenue')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\br\b/g, 'rue')
    .replace(/\bpl\b/g, 'place')
    .replace(/\bsq\b/g, 'square')
    .replace(/\bimp\b/g, 'impasse')
    .replace(/\ball\b/g, 'allée')
    .replace(/\bch\b/g, 'chemin')
    .replace(/\bfg\b/g, 'faubourg')
    .replace(/\bqua\b/g, 'quai')
    .replace(/\bpas\b/g, 'passage')
    .replace(/\bcrs\b/g, 'cours')
    .replace(/\bpte\b/g, 'porte')
    .replace(/\bst\b/g, 'saint')
    .replace(/\bste\b/g, 'sainte')
    // Supprimer les caractères spéciaux et normaliser les espaces
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatAddressProfessional(item) {
  const parts = item.display_name.split(', ');
  const address = item.address || {};
  
  // Construire l'adresse formatée
  let formatted = '';
  
  // Numéro et nom de rue
  if (address.house_number && address.road) {
    formatted += `${address.house_number} ${address.road}`;
  } else if (address.road) {
    formatted += address.road;
  } else if (parts[0]) {
    formatted += parts[0];
  }
  
  // Ville
  const city = address.city || address.town || address.village || address.municipality;
  if (city) {
    formatted += formatted ? `, ${city}` : city;
  }
  
  // Code postal
  if (address.postcode) {
    formatted += ` ${address.postcode}`;
  }
  
  // Pays (seulement si pas France)
  if (address.country && address.country !== 'France') {
    formatted += `, ${address.country}`;
  }
  
  return formatted || item.display_name.split(', ').slice(0, 2).join(', ');
}

async function showAddressSuggestions(address, inputElement) {
  if (address.length < 3) return; // Minimum 3 caractères pour éviter les recherches trop courtes
  
  // Normaliser la requête pour améliorer la recherche
  const normalizedAddress = normalizeAddressQuery(address);
  
  // Vérifier le cache d'abord
  const cacheKey = normalizedAddress;
  if (addressCache.has(cacheKey)) {
    displaySuggestions(addressCache.get(cacheKey), inputElement);
    return;
  }
  
  try {
    // Recherche prioritaire France avec requête normalisée
    const frenchUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=fr&limit=8`;
    const frenchResponse = await fetch(frenchUrl);
    const frenchData = await frenchResponse.json();
    
    let allResults = [];
    
    if (frenchData.length > 0) {
      allResults = frenchData.map(item => ({
        ...item,
        priority: 'France'
      }));
    } else {
      // Si pas de résultats avec la requête normalisée, essayer la requête originale
      const originalUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(address)}&countrycodes=fr&limit=5`;
      const originalResponse = await fetch(originalUrl);
      const originalData = await originalResponse.json();
      
      if (originalData.length > 0) {
        allResults = originalData.map(item => ({
          ...item,
          priority: 'France'
        }));
      } else {
        // Essayer Europe
        const europeUrl = `https://api.axia.quest/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=be,ch,lu,mc,ad,it,es,de,gb&limit=3`;
        const europeResponse = await fetch(europeUrl);
        const europeData = await europeResponse.json();
        
        if (europeData.length > 0) {
          allResults = europeData.map(item => ({
            ...item,
            priority: 'Europe'
          }));
        }
      }
    }
    
    // Mettre en cache
    addressCache.set(cacheKey, allResults);
    
    // Limiter la taille du cache
    if (addressCache.size > 200) {
      const firstKey = addressCache.keys().next().value;
      addressCache.delete(firstKey);
    }
    
    displaySuggestions(allResults, inputElement);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
  }
}

function formatAddress(fullAddress) {
  // Séparer les éléments de l'adresse
  const parts = fullAddress.split(', ');
  
  // Essayer de garder : numéro + rue, ville, code postal
  if (parts.length >= 3) {
    // Prendre les 2-3 premiers éléments les plus importants
    const street = parts[0]; // Numéro et rue
    const city = parts.find(part => /^\d{5}/.test(part) || parts.indexOf(part) <= 2);
    const postalCode = parts.find(part => /^\d{5}/.test(part));
    
    if (street && city) {
      return `${street}, ${city}`;
    }
  }
  
  // Fallback : prendre les 2 premiers éléments
  return parts.slice(0, 2).join(', ');
}

function displaySuggestions(data, inputElement) {
  // Supprimer les anciennes suggestions
  const existingSuggestions = inputElement.parentElement.querySelector('.address-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }
  
  if (data.length > 0) {
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'address-suggestions';
    suggestionsDiv.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    data.forEach(item => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.style.cssText = `
        padding: 10px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      `;
      
      // Formater l'affichage avec une adresse professionnelle
      const professionalAddress = formatAddressProfessional(item);
      const countryFlag = item.priority === 'France' ? '🇫🇷' : 
                         item.priority === 'Europe' ? '🇪🇺' : '🌍';
      
      suggestionItem.innerHTML = `
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #333;">${professionalAddress}</div>
          <div style="font-size: 0.75em; color: #888; margin-top: 2px; line-height: 1.2;">${item.display_name}</div>
        </div>
        <span style="font-size: 1em; margin-left: 10px;">${countryFlag}</span>
      `;
      
      suggestionItem.addEventListener('click', () => {
        inputElement.value = professionalAddress; // Utiliser l'adresse professionnelle
        inputElement.dataset.fullAddress = item.display_name; // Stocker l'adresse complète
        suggestionsDiv.remove();
      });
      
      suggestionItem.addEventListener('mouseenter', () => {
        suggestionItem.style.backgroundColor = '#f5f5f5';
      });
      
      suggestionItem.addEventListener('mouseleave', () => {
        suggestionItem.style.backgroundColor = 'white';
      });
      
      suggestionsDiv.appendChild(suggestionItem);
    });
    
    inputElement.parentElement.style.position = 'relative';
    inputElement.parentElement.appendChild(suggestionsDiv);
  }
}

////////////////////// MODALES & NOTIFICATIONS //////////////////////
function showErrorModal(message) {
  document.getElementById('errorModalBody').innerText = message;
  const modal = new bootstrap.Modal(document.getElementById('errorModal'));
  modal.show();
}

function showSuccessNotification(message) {
  // Supprimer les anciennes notifications
  const existingNotifications = document.querySelectorAll('.success-notification');
  existingNotifications.forEach(notif => notif.remove());
  
  // Créer la notification
  const notification = document.createElement('div');
  notification.className = 'success-notification alert alert-success alert-dismissible position-fixed';
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: none;
    border-radius: 8px;
  `;
  
  notification.innerHTML = `
    <i class="bi bi-check-circle-fill me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-suppression après 5 secondes
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

////////////////////// FORMULAIRES //////////////////////
// Inscription
if (document.getElementById('registerForm')) {
  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('input', function() {
      this.value = this.value.toLowerCase();
    });
  }
  document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const firstname = this.firstname.value;
    const lastname = this.lastname.value;
    const name = firstname + ' ' + lastname;
    let email = this.email.value;
    email = email.toLowerCase();
    const password = this.password.value;
    const type = 'client'; // Par défaut
    // Vérification complexité mot de passe
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(password)) {
      showErrorModal('Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.');
      return;
    }
    try {
      const res = await fetch('https://api.axia.quest/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, type })
      });
      if (res.ok) {
        // Connexion automatique après inscription
        const loginRes = await fetch('https://api.axia.quest/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.user) {
          window.location.href = '/';
        } else {
          showErrorModal(loginData.error || 'Inscription réussie, mais connexion impossible.');
        }
      } else {
        const data = await res.json();
        showErrorModal(data.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      showErrorModal('Erreur réseau');
    }
  });
}

// Connexion
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.email.value;
    const password = this.password.value;
    try {
      const res = await fetch('https://api.axia.quest/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok && data.user) {
        window.location.href = '/';
      } else {
        showErrorModal(data.error || 'Identifiants invalides');
      }
    } catch (err) {
      showErrorModal('Erreur réseau');
    }
  });
}

// Authentification pages protégées
if (window.location.pathname === '/mes-annonces') {
  fetch('https://api.axia.quest/api/users/me', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      if (!data.user) {
        window.location.href = '/';
        return;
      }
    })
    .catch(err => {
      console.error('Erreur vérification authentification:', err);
      window.location.href = '/';
  });
}

// Compte utilisateur
if (window.location.pathname === '/account') {
  fetch('https://api.axia.quest/api/users/me', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      if (!data.user) {
        window.location.href = '/';
        return;
      }
      const user = data.user;
      // Affichage infos utilisateur
      const userInfo = document.getElementById('userInfo');
      userInfo.innerHTML = `<div class='card p-3'><b>Nom :</b> ${user.name}<br><b>Email :</b> ${user.email}<br><b>Type :</b> ${user.type || 'client'}<br><b>Rôle :</b> ${user.role || 'membre'}</div>`;

      // Affichage bouton "devenir livreur" si pas livreur
      if (user.type !== 'livreur') {
        document.getElementById('becomeLivreurSection').style.display = 'block';
        document.getElementById('showDocFormBtn').onclick = function() {
          document.getElementById('docUploadForm').style.display = 'block';
        };
        // Upload document
        document.getElementById('docUploadForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          const formData = new FormData();
          formData.append('document', this.document.files[0]);
          formData.append('document_name', this.document_name.value);
          try {
            const res = await fetch(`https://api.axia.quest/api/users/${user.id}/documents`, {
              method: 'POST',
              credentials: 'include',
              body: formData
            });
            const data = await res.json();
            if (res.ok) {
              document.getElementById('docUploadMsg').innerText = 'Document envoyé !';
              document.getElementById('docUploadMsg').className = 'text-success mt-2';
            } else {
              document.getElementById('docUploadMsg').innerText = data.error || 'Erreur lors de l\'upload';
              document.getElementById('docUploadMsg').className = 'text-danger mt-2';
            }
          } catch (err) {
            document.getElementById('docUploadMsg').innerText = 'Erreur réseau';
            document.getElementById('docUploadMsg').className = 'text-danger mt-2';
          }
        });
      }
      // Affichage des documents déjà uploadés
      fetch(`https://api.axia.quest/api/users/${user.id}/documents`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.docs && data.docs.length > 0) {
            let html = '<h4>Mes documents</h4><ul class="list-group">';
            data.docs.forEach(doc => {
              html += `<li class="list-group-item">${doc.document_name} <a href="${doc.document_url}" target="_blank">[voir]</a></li>`;
            });
            html += '</ul>';
            document.getElementById('userDocs').innerHTML = html;
          }
        });
    });
}

////////////////////// ANNONCES UTILISATEUR //////////////////////
let editingAnnonceId = null;
let annonceModal;

const openAnnonceModalBtn = document.getElementById('openAnnonceModalBtn');
const annonceForm = document.getElementById('annonceForm');
const annonceMsg = document.getElementById('annonceMsg');

if (openAnnonceModalBtn) {
  openAnnonceModalBtn.onclick = function() {
    editingAnnonceId = null;
    annonceForm.reset();
    annonceForm.image.required = true;
    document.getElementById('annonceModalLabel').innerText = 'Nouvelle annonce';
    annonceMsg.innerText = '';
    annonceModal.show();
  };
}

function loadMesAnnonces() {
  fetch('https://api.axia.quest/annonces/mes', {
    credentials: 'include'
  })
    .then(res => res.json())
    .then(annonces => {
      const container = document.getElementById('userAnnonces');
      if (!container) return;
      container.innerHTML = '';
      if (!annonces.length) {
        container.innerHTML = `
          <div class="alert alert-primary d-flex flex-column align-items-center justify-content-center p-4">
            <div class="mb-0">Aucune annonce personnelle pour le moment.</div>
          </div>
        `;
        return;
      }
      const backendUrl = 'https://api.axia.quest';
      annonces.forEach(a => {
        container.innerHTML += `
          <div class="card mb-3 position-relative">
            <button class="edit-btn" onclick="editAnnonce(${a.id})">
              <img src="/images/edit_icon.png" alt="Modifier" class="edit-icon"> <span class="d-none d-md-inline">Modifier</span>
            </button>
            <div class="card-body">
              <div class="row">
                <div class="col-md-4 text-center">
                  <img src="${a.image ? backendUrl + a.image : '/images/no-image.png'}" alt="Image annonce" class="img-fluid rounded mb-2" style="max-height:120px;object-fit:cover;">
                  <div class="fw-bold text-success">${a.remuneration ? a.remuneration + ' €' : ''}</div>
                </div>
                <div class="col-md-8">
                  <h5>${a.titre}</h5>
                  <p>${a.description}</p>
                  <div><b>Départ :</b> ${a.depart} <b>Arrivée :</b> ${a.arrivee} <b>Date :</b> ${a.date}</div>
                  <div><b>Type :</b> ${a.type}</div>
                  <div><b>Rémunération :</b> ${a.remuneration ? a.remuneration + ' €' : ''}</div>
                  <button class="btn btn-sm btn-danger mt-2" onclick="deleteAnnonce(${a.id})">Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    });
}

if (annonceForm) {
  annonceForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const depart = this.depart.dataset.fullAddress || this.depart.value.trim();
    const arrivee = this.arrivee.dataset.fullAddress || this.arrivee.value.trim();
    
    // Validation des adresses
    annonceMsg.innerHTML = '<div class="alert alert-info">Validation des adresses en cours...</div>';
    
    const departValid = await validateAddress(depart);
    const arriveeValid = await validateAddress(arrivee);
    
    if (!departValid) {
      annonceMsg.innerHTML = '<div class="alert alert-danger">L\'adresse de départ n\'est pas valide. Veuillez saisir une adresse réelle.</div>';
      return;
    }
    
    if (!arriveeValid) {
      annonceMsg.innerHTML = '<div class="alert alert-danger">L\'adresse d\'arrivée n\'est pas valide. Veuillez saisir une adresse réelle.</div>';
      return;
    }
    
    const formData = new FormData(this);
    
    // Utiliser les adresses complètes si disponibles
    if (this.depart.dataset.fullAddress) {
      formData.set('depart', this.depart.dataset.fullAddress);
    }
    if (this.arrivee.dataset.fullAddress) {
      formData.set('arrivee', this.arrivee.dataset.fullAddress);
    }
    
    annonceMsg.innerText = '';
    let url = 'https://api.axia.quest/annonces';
    let method = 'POST';
    if (editingAnnonceId) {
      url = 'https://api.axia.quest/annonces/' + editingAnnonceId;
      method = 'PUT';
      // Si pas de nouvelle image, ne pas rendre le champ obligatoire
      if (!annonceForm.image.value) {
        formData.delete('image');
      }
    }
    fetch(url, {
      method,
      credentials: 'include',
      body: formData
    })
    .then(async res => {
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.log('Réponse non JSON du serveur:', raw);
        throw new Error('Réponse non JSON: ' + raw);
      }
      if (!res.ok) throw new Error(data.error || 'Erreur inconnue');
      return data;
    })
    .then(res => {
      // Afficher une alerte Bootstrap verte en haut du formulaire
      let alert = document.createElement('div');
      alert.className = 'alert alert-success alert-dismissible fade show';
      alert.role = 'alert';
      alert.innerHTML = (editingAnnonceId ? 'Annonce modifiée !' : 'Annonce publiée !') + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>';
      annonceForm.parentElement.prepend(alert);
      setTimeout(() => { if (alert.parentElement) alert.parentElement.removeChild(alert); }, 3000);
      loadMesAnnonces();
      // Fermer le modal après succès
      setTimeout(() => {
        if (annonceModal) {
          annonceModal.hide();
        }
        annonceForm.reset();
      editingAnnonceId = null;
        // Nettoyer le message
        annonceMsg.innerHTML = '';
        
        // Afficher une notification Bootstrap persistante
        showSuccessNotification(editingAnnonceId ? 'Annonce modifiée avec succès !' : 'Annonce publiée avec succès !');
      }, 500);
    })
    .catch((err) => {
      annonceMsg.innerText = 'Erreur lors de l\'envoi.';
      console.log('Erreur lors de l\'envoi de l\'annonce:', err);
    });
  });
}

window.editAnnonce = function(id) {
  fetch('https://api.axia.quest/annonces/' + id)
    .then(res => res.json())
    .then(a => {
      editingAnnonceId = a.id;
      annonceForm.titre.value = a.titre;
      annonceForm.description.value = a.description;
      annonceForm.depart.value = a.depart;
      annonceForm.arrivee.value = a.arrivee;
      annonceForm.date.value = a.date;
      annonceForm.type.value = a.type;
      annonceForm.remuneration.value = a.remuneration;
      
      // Gérer la logique inversée pour livraison_complete
      // Si livraison_partielle = 0, alors livraison_complete = true
      const livraisonCompleteCheckbox = document.getElementById('livraison_complete');
      if (livraisonCompleteCheckbox) {
        livraisonCompleteCheckbox.checked = a.livraison_partielle === 0;
      }
      
      annonceForm.image.required = false;
      document.getElementById('annonceModalLabel').innerText = 'Modifier l\'annonce';
      annonceMsg.innerText = '';
      annonceModal.show();
    });
}

window.deleteAnnonce = function(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  fetch('https://api.axia.quest/annonces/' + id, {
    method: 'DELETE',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(res => {
      loadMesAnnonces();
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialisation du modal Bootstrap
  const modalElement = document.getElementById('annonceModal');
  if (modalElement) {
    annonceModal = new bootstrap.Modal(modalElement);
  }
  // Initialisation des sliders et chargement des annonces
  if (document.getElementById('annoncesTrack')) {
    sliderShow3('annoncesTrack', 'annonce-item', 'annoncePrevBtn', 'annonceNextBtn');
  }
  if (document.getElementById('avisTrack')) {
    sliderShow3('avisTrack', 'avis-item', 'avisPrevBtn', 'avisNextBtn');
  }
  loadMesAnnonces();
  
  // Vérifier si on doit ouvrir le modal d'édition
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  if (editId && annonceModal) {
    // Attendre que les annonces soient chargées puis ouvrir le modal
    setTimeout(() => {
      editAnnonce(editId);
    }, 500);
  }

  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Charger les types d'annonces au chargement de la page
  const typeSelect = document.getElementById('type');
  if (typeSelect) {
    fetch('https://api.axia.quest/annonces/types')
      .then(response => response.json())
      .then(data => {
        typeSelect.innerHTML = '<option value="" disabled selected>Choisir un type</option>';
        data.types.forEach(type => {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        });
      })
      .catch(error => console.error('Erreur lors du chargement des types:', error));
  }

  // Ajouter l'autocomplétion pour les champs d'adresse
  const departInput = document.getElementById('depart');
  const arriveeInput = document.getElementById('arrivee');

  if (departInput) {
    let departTimeout;
    departInput.addEventListener('input', function() {
      clearTimeout(departTimeout);
      departTimeout = setTimeout(() => {
        showAddressSuggestions(this.value, this);
      }, 500); // Délai de 500ms pour éviter les recherches trop fréquentes
    });
          
    // Fermer les suggestions quand on clique ailleurs
    document.addEventListener('click', function(e) {
      if (!departInput.contains(e.target)) {
        const suggestions = departInput.parentElement.querySelector('.address-suggestions');
        if (suggestions) suggestions.remove();
      }
    });
  }

  if (arriveeInput) {
    let arriveeTimeout;
    arriveeInput.addEventListener('input', function() {
      clearTimeout(arriveeTimeout);
      arriveeTimeout = setTimeout(() => {
        showAddressSuggestions(this.value, this);
      }, 500); // Délai de 500ms pour éviter les recherches trop fréquentes
    });
    
    // Fermer les suggestions quand on clique ailleurs
    document.addEventListener('click', function(e) {
      if (!arriveeInput.contains(e.target)) {
        const suggestions = arriveeInput.parentElement.querySelector('.address-suggestions');
        if (suggestions) suggestions.remove();
      }
    });
  }
});

function sliderShow3(trackId, itemClass, prevBtnId, nextBtnId, auto = true) {
  const track = document.getElementById(trackId);
  const allItems = Array.from(track.querySelectorAll('.' + itemClass));
  const data = allItems.map(item => item.outerHTML);
  let center = 1;
  if (data.length < 1) return;
  function render(visibleCount = 3) {
    track.classList.remove('animating');
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.innerHTML = '';
    for (let i = 0; i < visibleCount; i++) {
      let idx = (center - Math.floor(visibleCount/2) + i + data.length) % data.length;
      let temp = document.createElement('div');
      temp.innerHTML = data[idx];
      let el = temp.firstElementChild;
      el.classList.remove('center', 'side');
      if (visibleCount === 1) {
        el.classList.add('center');
      } else if (i === 1) {
        el.classList.add('center');
      } else {
        el.classList.add('side');
      }
      el.style.display = '';
      track.appendChild(el);
    }
  }
  function slide(direction) {
    const isMobile = window.matchMedia('(max-width: 600px), (orientation: portrait)').matches;
    let visibleCount = isMobile ? 1 : 3;
    // Ajoute un 4e élément (à droite ou à gauche)
    let newIdx = direction === 'left'
      ? (center + Math.ceil(visibleCount/2)) % data.length
      : (center - Math.ceil(visibleCount/2) + data.length) % data.length;
    render(visibleCount);
    // Retire la classe 'center' de tous les éléments avant l'animation
    Array.from(track.children).forEach(el => el.classList.remove('center'));
    let temp = document.createElement('div');
    temp.innerHTML = data[newIdx];
    let el = temp.firstElementChild;
    el.classList.remove('center', 'side');
    el.classList.add('side');
    el.style.display = '';
    if (direction === 'left') {
      track.appendChild(el); // à droite
    } else {
      track.insertBefore(el, track.firstChild); // à gauche
    }
    // Prépare la largeur et la translation
    track.classList.add('animating');
    track.style.transition = 'none';
    if (direction === 'left') {
      track.style.transform = 'translateX(0)';
    } else {
      track.style.transform = isMobile ? 'translateX(-100%)' : 'translateX(-33.3333%)';
    }
    setTimeout(() => {
      track.style.transition = 'transform 0.5s cubic-bezier(.4,2,.6,1)';
      if (direction === 'left') {
        track.style.transform = isMobile ? 'translateX(-100%)' : 'translateX(-33.3333%)';
      } else {
        track.style.transform = 'translateX(0)';
      }
    }, 10);
    setTimeout(() => {
      center = direction === 'left'
        ? (center + 1) % data.length
        : (center - 1 + data.length) % data.length;
      render(visibleCount);
    }, 510);
  }
  function renderResponsive() {
    const isMobile = window.matchMedia('(max-width: 600px), (orientation: portrait)').matches;
    render(isMobile ? 1 : 3);
  }
  renderResponsive();
  document.getElementById(prevBtnId).onclick = () => slide('right');
  document.getElementById(nextBtnId).onclick = () => slide('left');
  let interval = null;
  if (auto) {
    interval = setInterval(() => slide('left'), 3500);
    track.parentElement.addEventListener('mouseenter', () => clearInterval(interval));
    track.parentElement.addEventListener('mouseleave', () => {
      interval = setInterval(() => slide('left'), 3500);
    });
  }
  window.addEventListener('resize', renderResponsive);
}
