console.log('Script chargé');

// Ajout d'une fonction pour afficher un popup Bootstrap
document.body.insertAdjacentHTML('beforeend', `
<div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title" id="errorModalLabel">Erreur</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" id="errorModalBody"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fermer</button>
      </div>
    </div>
  </div>
</div>
`);
function showErrorModal(message) {
  document.getElementById('errorModalBody').innerText = message;
  const modal = new bootstrap.Modal(document.getElementById('errorModal'));
  modal.show();
}

// Gestion de l'inscription
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
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, type })
      });
      if (res.ok) {
        // Connexion automatique après inscription
        const loginRes = await fetch('http://localhost:3000/api/users/login', {
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

// Gestion de la connexion
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = this.email.value;
    const password = this.password.value;
    try {
      const res = await fetch('http://localhost:3000/api/users/login', {
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

// Affichage du compte et gestion "devenir livreur"
if (window.location.pathname === '/account') {
  fetch('http://localhost:3000/api/users/me', {
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
            const res = await fetch(`http://localhost:3000/api/users/${user.id}/documents`, {
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
      fetch(`http://localhost:3000/api/users/${user.id}/documents`, {
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

// === Gestion des annonces utilisateur (version avec image et tarif, modal) ===
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
    new bootstrap.Modal(document.getElementById('annonceModal')).show();
  };
}

function loadMesAnnonces() {
  fetch('http://localhost:3000/annonces/mes', {
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
      const backendUrl = 'http://localhost:3000';
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
  annonceForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    annonceMsg.innerText = '';
    let url = 'http://localhost:3000/annonces';
    let method = 'POST';
    if (editingAnnonceId) {
      url = 'http://localhost:3000/annonces/' + editingAnnonceId;
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
      if (annonceModal) annonceModal.hide();
      this.reset();
      editingAnnonceId = null;
    })
    .catch((err) => {
      annonceMsg.innerText = 'Erreur lors de l\'envoi.';
      console.log('Erreur lors de l\'envoi de l\'annonce:', err);
    });
  });
}

window.editAnnonce = function(id) {
  fetch('http://localhost:3000/annonces/' + id)
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
      annonceForm.image.required = false;
      document.getElementById('annonceModalLabel').innerText = 'Modifier l\'annonce';
      annonceMsg.innerText = '';
      annonceModal.show();
    });
}

window.deleteAnnonce = function(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  fetch('http://localhost:3000/annonces/' + id, {
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

  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
  }

  // Charger les types d'annonces au chargement de la page
  const typeSelect = document.getElementById('type');
  if (typeSelect) {
    fetch('/api/annonces/types')
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

  // Gestion du formulaire d'annonce
  const bsAnnonceModal = document.getElementById('annonceModal') ? new bootstrap.Modal(document.getElementById('annonceModal')) : null;

  if (annonceForm) {
    annonceForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      
      try {
        const response = await fetch('/api/annonces', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        if (response.ok) {
          // Afficher le message de succès
          document.getElementById('annonceMsg').innerHTML = `
            <div class="alert alert-success">
              ${data.message}
            </div>
          `;
          
          // Fermer le modal après 1 seconde
          setTimeout(() => {
            bsAnnonceModal.hide();
            // Recharger la liste des annonces
            loadUserAnnonces();
            // Réinitialiser le formulaire
            annonceForm.reset();
            document.getElementById('annonceMsg').innerHTML = '';
          }, 1000);
        } else {
          // Afficher le message d'erreur
          document.getElementById('annonceMsg').innerHTML = `
            <div class="alert alert-danger">
              ${data.error}
              ${data.message ? '<br>' + data.message : ''}
            </div>
          `;
        }
      } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('annonceMsg').innerHTML = `
          <div class="alert alert-danger">
            Une erreur est survenue lors de la création de l'annonce
          </div>
        `;
      }
    });
  }

  // Fonction pour charger les annonces de l'utilisateur
  function loadUserAnnonces() {
    const userAnnoncesDiv = document.getElementById('userAnnonces');
    if (userAnnoncesDiv) {
      fetch('/api/annonces/mes')
        .then(response => response.json())
        .then(data => {
          if (Array.isArray(data)) {
            userAnnoncesDiv.innerHTML = data.map(annonce => `
              <div class="card mb-3 position-relative">
                <button class="edit-btn" onclick="editAnnonce(${annonce.id})">
                  <img src="/images/edit_icon.png" alt="Modifier" class="edit-icon">
                  Modifier
                </button>
                ${annonce.image ? `
                  <img src="${annonce.image}" class="card-img-top" alt="${annonce.titre}" style="height: 200px; object-fit: cover;">
                ` : ''}
                <div class="card-body">
                  <h5 class="card-title">${annonce.titre}</h5>
                  <p class="card-text">${annonce.description}</p>
                  <div class="row">
                    <div class="col-md-6">
                      <p><strong>Départ:</strong> ${annonce.depart}</p>
                      <p><strong>Arrivée:</strong> ${annonce.arrivee}</p>
                    </div>
                    <div class="col-md-6">
                      <p><strong>Date:</strong> ${new Date(annonce.date).toLocaleDateString()}</p>
                      <p><strong>Type:</strong> ${annonce.type}</p>
                      <p><strong>Rémunération:</strong> ${annonce.remuneration}€</p>
                    </div>
                  </div>
                </div>
              </div>
            `).join('');
          }
        })
        .catch(error => console.error('Erreur:', error));
    }
  }

  // Charger les annonces au chargement de la page
  loadUserAnnonces();
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
