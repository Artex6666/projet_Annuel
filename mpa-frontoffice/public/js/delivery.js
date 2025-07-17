// Système de livraison avancé avec modal, carte et validation
// Namespace pour éviter les conflits avec script.js
const DeliverySystem = {
  modal: null,
  map: null,
  currentAnnonce: null,
  routeMarkers: [],
  routeLine: null,
  deliveryMarkers: [],
  routeControl: null,
  originalRoute: null,
  deliveryRoute: null,
  addressSearchTimeouts: {}, // Pour le debounce par champ
  addressCache: new Map(), // Cache pour les suggestions d'adresses
  currentSearchRequests: new Map(), // Pour annuler les requêtes en cours
  searchStates: new Map() // Pour gérer les états de recherche
};

// Ajout d'une variable globale pour la validité de la route
DeliverySystem.lastRouteValid = false;

// Initialisation du modal de livraison
document.addEventListener('DOMContentLoaded', function() {
  // Préchargement désactivé pour éviter les timeouts
  // preloadCommonAddresses();
  
  const modalElement = document.getElementById('deliveryModal');
  if (modalElement) {
    DeliverySystem.modal = new bootstrap.Modal(modalElement);
    
    // Initialiser la carte et l'autocomplétion quand le modal s'ouvre
    modalElement.addEventListener('shown.bs.modal', function() {
      initDeliveryMap();
      
      // Initialiser l'autocomplétion maintenant que le modal est ouvert
      const departLivraisonInput = document.getElementById('departLivraison');
      const arriveeLivraisonInput = document.getElementById('arriveeLivraison');
      
      if (departLivraisonInput) {
        setupProfessionalAddressSearch(departLivraisonInput, 'depart');
      }
      
      if (arriveeLivraisonInput) {
        setupProfessionalAddressSearch(arriveeLivraisonInput, 'arrivee');
      }
    });
  }
});

// Précharger des adresses communes pour améliorer les performances
async function preloadCommonAddresses() {
  const commonAddresses = [
    'Paris',
    'Lyon'
  ];
  
  for (const address of commonAddresses) {
    try {
      const response = await fetch(`http://localhost:3000/annonces/geocode?q=${encodeURIComponent(address)}&countrycodes=fr&limit=3`);
      const data = await response.json();
      
      if (data.length > 0) {
        const normalizedAddress = address.toLowerCase().trim();
        DeliverySystem.addressCache.set(normalizedAddress, data.map(item => ({
          ...item,
          priority: 'France'
        })));
      }
    } catch (error) {
      console.log('Erreur lors du préchargement de', address, error);
    }
  }
}

// Configuration d'une recherche d'adresse professionnelle
function setupProfessionalAddressSearch(inputElement, fieldId) {
  let searchTimeout;
  let isSearching = false;
  let lastSearchTerm = '';
  
  // Ajouter un indicateur de chargement
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'address-loading';
  loadingIndicator.style.cssText = `
    position: absolute;
    top: 50%;
    right: 10px;
    transform: translateY(-50%);
    display: none;
    z-index: 1001;
  `;
  loadingIndicator.innerHTML = '<div class="spinner-border spinner-border-sm text-primary" role="status"></div>';
  
  // Conteneur relatif pour le champ
  inputElement.parentElement.style.position = 'relative';
  inputElement.parentElement.appendChild(loadingIndicator);
  
  // Event listener avec debounce intelligent
  inputElement.addEventListener('input', function() {
    const currentValue = this.value.trim();
    
    // Annuler la recherche précédente
    clearTimeout(searchTimeout);
    
    // Annuler la requête en cours si elle existe
    if (DeliverySystem.currentSearchRequests.has(fieldId)) {
      DeliverySystem.currentSearchRequests.get(fieldId).abort();
      DeliverySystem.currentSearchRequests.delete(fieldId);
    }
    
    // Cacher les suggestions si le champ est vide
    if (currentValue.length === 0) {
      hideSuggestions(inputElement);
      hideLoadingIndicator(loadingIndicator);
      updateDeliveryRouteDebounced();
      return;
    }
    
    // Mettre à jour la route après 2 secondes d'inactivité (délai augmenté)
    updateDeliveryRouteDebounced();
    
    // Recherche instantanée dans le cache
    if (currentValue.length >= 2) {
      const cachedResults = searchInCache(currentValue);
      if (cachedResults.length > 0) {
        displaySuggestions(cachedResults, inputElement);
        hideLoadingIndicator(loadingIndicator);
        return;
      }
    }
    
    // Recherche différée pour les nouvelles requêtes
    if (currentValue.length >= 3 && currentValue !== lastSearchTerm) {
      showLoadingIndicator(loadingIndicator);
      
      searchTimeout = setTimeout(async () => {
        lastSearchTerm = currentValue;
        await performProfessionalAddressSearch(currentValue, inputElement, fieldId, loadingIndicator);
      }, 200); // Délai réduit à 200ms pour plus de réactivité
    }
  });
  
  // Gestion du focus et blur
  inputElement.addEventListener('focus', function() {
    if (this.value.trim().length >= 2) {
      const cachedResults = searchInCache(this.value.trim());
      if (cachedResults.length > 0) {
        displaySuggestions(cachedResults, inputElement);
      }
    }
  });
  
  inputElement.addEventListener('blur', function() {
    // Déclencher la mise à jour de la route immédiatement (désactivé temporairement)
    // updateDeliveryRoute();
    
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => {
      // Vérifier si on a cliqué sur une suggestion
      const suggestions = inputElement.parentElement.querySelector('.delivery-address-suggestions');
      if (suggestions) {
        // Vérifier si le focus est maintenant sur une suggestion
        const activeElement = document.activeElement;
        const isClickingOnSuggestion = activeElement && (
          activeElement.closest('.delivery-address-suggestions') ||
          activeElement.classList.contains('delivery-suggestion-item')
        );
        
        if (!isClickingOnSuggestion) {
          hideSuggestions(inputElement);
        }
      }
    }, 500);
  });
  
  // Gestion des touches clavier
  inputElement.addEventListener('keydown', function(e) {
    const suggestions = inputElement.parentElement.querySelector('.delivery-address-suggestions');
    if (!suggestions) return;
    
    const items = suggestions.querySelectorAll('.delivery-suggestion-item');
    let selectedIndex = -1;
    
    // Trouver l'élément sélectionné
    items.forEach((item, index) => {
      if (item.classList.contains('selected')) {
        selectedIndex = index;
      }
    });
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items, selectedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(items, selectedIndex);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          items[selectedIndex].click();
        }
        break;
      case 'Escape':
        hideSuggestions(inputElement);
        break;
    }
  });
}

// Recherche dans le cache
function searchInCache(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const results = [];
  
  for (const [key, value] of DeliverySystem.addressCache.entries()) {
    if (key.includes(normalizedQuery) || normalizedQuery.includes(key)) {
      results.push(...value);
      if (results.length >= 8) break;
    }
  }
  
  return results.slice(0, 8);
}

// Recherche d'adresse professionnelle
async function performProfessionalAddressSearch(address, inputElement, fieldId, loadingIndicator) {
  try {
    // Vérifier le cache d'abord
    const cacheKey = address.toLowerCase().trim();
    if (DeliverySystem.addressCache.has(cacheKey)) {
      const cachedResults = DeliverySystem.addressCache.get(cacheKey);
      displaySuggestions(cachedResults, inputElement);
      hideLoadingIndicator(loadingIndicator);
      return;
    }
    
    // Créer un AbortController pour cette requête
    const controller = new AbortController();
    DeliverySystem.currentSearchRequests.set(fieldId, controller);
    
    // Normaliser la requête
    const normalizedAddress = normalizeAddressQuery(address);
    
    // Recherche prioritaire France
    const frenchUrl = `http://localhost:3000/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=fr&limit=8`;
    
    const frenchResponse = await fetch(frenchUrl, {
      signal: controller.signal
    });
    
    if (!frenchResponse.ok) {
      throw new Error(`HTTP error! status: ${frenchResponse.status}`);
    }
    
    const frenchData = await frenchResponse.json();
    let allResults = [];
    
    if (frenchData.length > 0) {
      allResults = frenchData.map(item => ({
        ...item,
        priority: 'France',
        relevance: calculateRelevance(address, item.display_name)
      }));
    } else {
      // Essayer avec la requête originale si la normalisée ne donne rien
      const originalUrl = `http://localhost:3000/annonces/geocode?q=${encodeURIComponent(address)}&countrycodes=fr&limit=5`;
      const originalResponse = await fetch(originalUrl, {
        signal: controller.signal
      });
      
      if (originalResponse.ok) {
        const originalData = await originalResponse.json();
        if (originalData.length > 0) {
          allResults = originalData.map(item => ({
            ...item,
            priority: 'France',
            relevance: calculateRelevance(address, item.display_name)
          }));
        }
      }
      
      // Si toujours pas de résultats, essayer Europe
      if (allResults.length === 0) {
        const europeUrl = `http://localhost:3000/annonces/geocode?q=${encodeURIComponent(normalizedAddress)}&countrycodes=be,ch,lu,mc,ad,it,es,de,gb&limit=3`;
        const europeResponse = await fetch(europeUrl, {
          signal: controller.signal
        });
        
        if (europeResponse.ok) {
          const europeData = await europeResponse.json();
          if (europeData.length > 0) {
            allResults = europeData.map(item => ({
              ...item,
              priority: 'Europe',
              relevance: calculateRelevance(address, item.display_name)
            }));
          }
        }
      }
    }
    
    // Trier par pertinence
    allResults.sort((a, b) => b.relevance - a.relevance);
    
    // Mettre en cache
    DeliverySystem.addressCache.set(cacheKey, allResults);
    
    // Limiter la taille du cache
    if (DeliverySystem.addressCache.size > 200) {
      const firstKey = DeliverySystem.addressCache.keys().next().value;
      DeliverySystem.addressCache.delete(firstKey);
    }
    
    // Afficher les résultats
    displaySuggestions(allResults, inputElement);
    hideLoadingIndicator(loadingIndicator);
    
    // Nettoyer la requête
    DeliverySystem.currentSearchRequests.delete(fieldId);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Recherche annulée');
    } else {
      console.error('Erreur lors de la recherche d\'adresses:', error);
      hideLoadingIndicator(loadingIndicator);
    }
    DeliverySystem.currentSearchRequests.delete(fieldId);
  }
}

// Calculer la pertinence d'un résultat
function calculateRelevance(query, displayName) {
  const queryLower = query.toLowerCase();
  const displayLower = displayName.toLowerCase();
  
  let score = 0;
  
  // Correspondance exacte au début
  if (displayLower.startsWith(queryLower)) {
    score += 100;
  }
  
  // Correspondance dans le nom
  if (displayLower.includes(queryLower)) {
    score += 50;
  }
  
  // Correspondance des mots
  const queryWords = queryLower.split(/\s+/);
  const displayWords = displayLower.split(/\s+/);
  
  queryWords.forEach(queryWord => {
    displayWords.forEach(displayWord => {
      if (displayWord.includes(queryWord)) {
        score += 10;
      }
    });
  });
  
  return score;
}

// Normaliser une requête d'adresse
function normalizeAddressQuery(query) {
  return query
    .toLowerCase()
    .trim()
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
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Afficher l'indicateur de chargement
function showLoadingIndicator(indicator) {
  indicator.style.display = 'block';
}

// Cacher l'indicateur de chargement
function hideLoadingIndicator(indicator) {
  indicator.style.display = 'none';
}

// Cacher les suggestions
function hideSuggestions(inputElement) {
  const suggestions = inputElement.parentElement.querySelector('.delivery-address-suggestions');
  if (suggestions) {
    suggestions.remove();
  }
}

// Mettre à jour la sélection au clavier
function updateSelection(items, selectedIndex) {
  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
      item.style.backgroundColor = '#007bff';
      item.style.color = 'white';
    } else {
      item.classList.remove('selected');
      item.style.backgroundColor = 'white';
      item.style.color = 'black';
    }
  });
}

// Fonction pour afficher les suggestions (améliorée)
function displaySuggestions(data, inputElement) {
  // Supprimer les anciennes suggestions
  hideSuggestions(inputElement);
  
  if (data.length === 0) {
    return;
  }
  
  const suggestionsDiv = document.createElement('div');
  suggestionsDiv.className = 'delivery-address-suggestions'; // Changé pour éviter le conflit
  suggestionsDiv.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 0 0 8px 8px;
  `;
  
  data.forEach((item, index) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'delivery-suggestion-item'; // Changé pour éviter le conflit
    suggestionItem.style.cssText = `
      padding: 12px 15px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s ease;
    `;
    
    // Stocker les données dans les attributs data
    suggestionItem.dataset.fullAddress = item.display_name;
    suggestionItem.dataset.lat = item.lat;
    suggestionItem.dataset.lon = item.lon;
    
    // Formater l'adresse de manière professionnelle
    const addressParts = item.display_name.split(', ');
    const mainAddress = addressParts.slice(0, 2).join(', ');
    const details = addressParts.slice(2).join(', ');
    
    const countryFlag = item.priority === 'France' ? '🇫🇷' : 
                       item.priority === 'Europe' ? '🇪🇺' : '🌍';
    
    suggestionItem.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 500; color: #333; margin-bottom: 2px;">${mainAddress}</div>
        <div style="font-size: 0.8em; color: #666; line-height: 1.2;">${details}</div>
      </div>
      <div style="margin-left: 15px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.2em;">${countryFlag}</span>
      </div>
    `;
    
    // Gestion du hover seulement (le clic est géré par délégation)
    suggestionItem.addEventListener('mouseenter', () => {
      suggestionItem.style.backgroundColor = '#f8f9fa';
    });
    
    suggestionItem.addEventListener('mouseleave', () => {
      if (!suggestionItem.classList.contains('selected')) {
        suggestionItem.style.backgroundColor = 'white';
      }
    });
    
    suggestionsDiv.appendChild(suggestionItem);
  });
  
  inputElement.parentElement.appendChild(suggestionsDiv);
  
  // Gestionnaire d'événements avec click et mousedown
  function handleSuggestionSelection(e) {
    const suggestionItem = e.target.closest('.delivery-suggestion-item');
    
    if (suggestionItem) {
      e.preventDefault();
      e.stopPropagation();
      
      // Récupérer les données de la suggestion
      const titleElement = suggestionItem.querySelector('div[style*="font-weight: 500"]');
      const mainAddress = titleElement ? titleElement.textContent : 'Adresse non trouvée';
      const fullAddress = suggestionItem.dataset.fullAddress;
      const lat = suggestionItem.dataset.lat;
      const lon = suggestionItem.dataset.lon;
      
      // Stocker les coordonnées AVANT de changer la valeur (pour éviter le conflit avec blur)
      inputElement.dataset.fullAddress = fullAddress;
      inputElement.dataset.lat = lat;
      inputElement.dataset.lon = lon;
      
      // Changer la valeur et fermer les suggestions
      inputElement.value = mainAddress;
      hideSuggestions(inputElement);
      
      // Déclencher la mise à jour de la route avec un petit délai pour s'assurer que les coordonnées sont bien mises à jour
      setTimeout(() => {
        updateDeliveryRoute();
      }, 100);
    }
  }
  
  // Ajouter les deux types d'événements
  suggestionsDiv.addEventListener('click', handleSuggestionSelection);
  suggestionsDiv.addEventListener('mousedown', handleSuggestionSelection);
}

// Debounce pour la mise à jour de la route
let routeUpdateTimeout;
function updateDeliveryRouteDebounced() {
  clearTimeout(routeUpdateTimeout);
  routeUpdateTimeout = setTimeout(() => {
    updateDeliveryRoute();
  }, 2000); // Délai augmenté à 2 secondes
}

// Ouvrir le modal de livraison
function openDeliveryModal(button) {
  const annonceId = button.dataset.annonceId;
  const depart = button.dataset.depart;
  const arrivee = button.dataset.arrivee;
  const livraisonPartielle = button.dataset.livraisonPartielle === '1';
  
  DeliverySystem.currentAnnonce = {
    id: annonceId,
    depart: depart,
    arrivee: arrivee,
    livraisonPartielle: livraisonPartielle
  };
  
  // Remplir le formulaire
  document.getElementById('annonceId').value = annonceId;
  document.getElementById('fullRoute').innerHTML = `
    <strong>🚀 ${depart}</strong> → <strong>🎯 ${arrivee}</strong>
  `;
  
  const departInput = document.getElementById('departLivraison');
  const arriveeInput = document.getElementById('arriveeLivraison');
  
  // Gérer la logique selon si la livraison partielle est autorisée
  // LOGIQUE INVERSÉE : livraisons partielles autorisées par défaut
  if (livraisonPartielle) {
    // Livraison partielle autorisée (valeur par défaut)
    // Le point de départ n'est jamais modifiable (toujours l'adresse de départ de l'annonce)
    departInput.disabled = true;
    departInput.value = depart;
    departInput.placeholder = 'Point de départ fixe';
    
    // L'adresse d'arrivée est préremplie mais modifiable
    arriveeInput.disabled = false;
    arriveeInput.value = arrivee;
    arriveeInput.placeholder = 'Cliquez pour modifier l\'adresse d\'arrivée';
    
    // Vider le champ d'arrivée au focus pour permettre la modification
    arriveeInput.addEventListener('focus', function() {
      if (this.value === arrivee) {
        this.value = '';
        this.placeholder = 'Saisir une nouvelle adresse d\'arrivée';
      }
    });
  } else {
    // Livraison partielle NON autorisée : champs verrouillés
    departInput.disabled = true;
    arriveeInput.disabled = true;
    departInput.value = depart;
    arriveeInput.value = arrivee;
    departInput.placeholder = 'Adresse de départ (verrouillée)';
    arriveeInput.placeholder = 'Adresse d\'arrivée (verrouillée)';
  }
  
  // Réinitialiser la progression
  document.getElementById('progressBar').style.width = '0%';
  document.getElementById('progressText').textContent = '0%';
  document.getElementById('progressBar').className = 'progress-bar bg-warning';
  
  // Initialiser la carte immédiatement
  initMap();
  // Mettre à jour la route avec les valeurs par défaut après un court délai
  setTimeout(() => {
    updateDeliveryRoute();
  }, 500);
  
  const modal = new bootstrap.Modal(document.getElementById('deliveryModal'));
  modal.show();
}

// Fonction setupAddressAutocomplete supprimée - remplacée par setupProfessionalAddressSearch
// Fonction showAddressSuggestions supprimée - remplacée par performProfessionalAddressSearch
// Fonction displaySuggestions supprimée - remplacée par la version améliorée

// Initialiser la carte de livraison
function initDeliveryMap() {
  const mapContainer = document.getElementById('deliveryMap');
  if (!mapContainer) return;
  
  // Supprimer la carte existante si elle existe
  if (DeliverySystem.map) {
    try {
      DeliverySystem.map.remove();
    } catch (e) {
      console.log('Erreur lors de la suppression de la carte:', e);
    }
    DeliverySystem.map = null;
  }
  
  // Vider le conteneur de la carte
  mapContainer.innerHTML = '';
  
  // Créer une nouvelle carte centrée sur la France
  try {
    DeliverySystem.map = L.map('deliveryMap').setView([46.603354, 1.888334], 6);
    
    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(DeliverySystem.map);
    
    // Initialiser la route originale
    initOriginalRoute();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la carte:', error);
  }
}

// Initialiser la route originale sur la carte
async function initOriginalRoute() {
  if (!DeliverySystem.currentAnnonce) return;
  
  try {
    // Vérifier d'abord le cache côté client pour les adresses originales
    const departCacheKey = DeliverySystem.currentAnnonce.depart.toLowerCase().trim();
    const arriveeCacheKey = DeliverySystem.currentAnnonce.arrivee.toLowerCase().trim();
    
    let departCoords = null;
    let arriveeCoords = null;
    
    // Essayer le cache côté client d'abord
    if (DeliverySystem.addressCache.has(departCacheKey)) {
      const cachedData = DeliverySystem.addressCache.get(departCacheKey);
      if (cachedData.length > 0) {
        departCoords = {
          lat: parseFloat(cachedData[0].lat),
          lng: parseFloat(cachedData[0].lon),
          address: cachedData[0].display_name
        };
      }
    }
    
    if (DeliverySystem.addressCache.has(arriveeCacheKey)) {
      const cachedData = DeliverySystem.addressCache.get(arriveeCacheKey);
      if (cachedData.length > 0) {
        arriveeCoords = {
          lat: parseFloat(cachedData[0].lat),
          lng: parseFloat(cachedData[0].lon),
          address: cachedData[0].display_name
        };
      }
    }
    
    // Si pas en cache, faire les appels Nominatim
    if (!departCoords) {
      departCoords = await geocodeAddress(DeliverySystem.currentAnnonce.depart);
    }
    if (!arriveeCoords) {
      arriveeCoords = await geocodeAddress(DeliverySystem.currentAnnonce.arrivee);
    }
    
    if (departCoords && arriveeCoords) {
      DeliverySystem.originalRoute = {
        start: departCoords,
        end: arriveeCoords
      };
      
      // Initialiser les coordonnées des champs input avec les valeurs par défaut
      const departInput = document.getElementById('departLivraison');
      const arriveeInput = document.getElementById('arriveeLivraison');
      
      if (departInput) {
        departInput.dataset.lat = departCoords.lat;
        departInput.dataset.lon = departCoords.lng;
        departInput.dataset.fullAddress = departCoords.address;
      }
      
      if (arriveeInput) {
        arriveeInput.dataset.lat = arriveeCoords.lat;
        arriveeInput.dataset.lon = arriveeCoords.lng;
        arriveeInput.dataset.fullAddress = arriveeCoords.address;
      }
      
      // Afficher la route originale en pointillés bleus
      const originalPolyline = L.polyline([
        [DeliverySystem.originalRoute.start.lat, DeliverySystem.originalRoute.start.lng],
        [DeliverySystem.originalRoute.end.lat, DeliverySystem.originalRoute.end.lng]
      ], {
        color: '#007bff',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10'
      }).addTo(DeliverySystem.map);
      
      // Marqueurs pour la route originale
      L.marker([DeliverySystem.originalRoute.start.lat, DeliverySystem.originalRoute.start.lng])
        .addTo(DeliverySystem.map)
        .bindPopup(`<b>🏠 Départ original</b><br>${DeliverySystem.currentAnnonce.depart}`);
      
      L.marker([DeliverySystem.originalRoute.end.lat, DeliverySystem.originalRoute.end.lng])
        .addTo(DeliverySystem.map)
        .bindPopup(`<b>🎯 Destination finale</b><br>${DeliverySystem.currentAnnonce.arrivee}`);
      
      // Ne pas appeler displayRouteOnMap ici, laissons updateDeliveryRoute() s'en charger
      
      // Ajuster la vue pour inclure les points originaux
      const group = new L.featureGroup([
        L.marker([DeliverySystem.originalRoute.start.lat, DeliverySystem.originalRoute.start.lng]),
        L.marker([DeliverySystem.originalRoute.end.lat, DeliverySystem.originalRoute.end.lng])
      ]);
      DeliverySystem.map.fitBounds(group.getBounds().pad(0.1));
    }
  } catch (error) {
    console.error('Erreur lors du géocodage de la route originale:', error);
  }
}

// Mettre à jour la route de livraison sur la carte
async function updateDeliveryRoute() {
  if (!DeliverySystem.map || !DeliverySystem.currentAnnonce) return;
  
  // Récupérer les adresses et coordonnées depuis les champs input
  const departInput = document.getElementById('departLivraison');
  const arriveeInput = document.getElementById('arriveeLivraison');
  const confirmBtn = document.querySelector('#deliveryModal .btn-success');
  
  const departLivraison = departInput.value.trim();
  const arriveeLivraison = arriveeInput.value.trim();
  
  if (!departLivraison || !arriveeLivraison) {
    clearDeliveryRoute();
    updateProgressBar(0);
    DeliverySystem.lastRouteValid = false;
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }
  
  try {
    // Utiliser les coordonnées déjà stockées si disponibles, sinon géocoder
    const getDepartCoords = async () => {
      if (departInput.dataset.lat && departInput.dataset.lon) {
        return {
          lat: parseFloat(departInput.dataset.lat),
          lng: parseFloat(departInput.dataset.lon),
          address: departInput.dataset.fullAddress || departLivraison
        };
      }
      return await geocodeAddress(departLivraison);
    };
    
    const getArriveeCoords = async () => {
      // Si ladresse a changé, forcer le géocodage
      const currentAddress = arriveeInput.dataset.fullAddress || arriveeLivraison;
      if (currentAddress !== arriveeLivraison) {
        try {
          const newCoords = await geocodeAddress(arriveeLivraison);
          if (newCoords) {
            // Mettre à jour le dataset avec les nouvelles coordonnées
            arriveeInput.dataset.lat = newCoords.lat.toString();
            arriveeInput.dataset.lon = newCoords.lng.toString();
            arriveeInput.dataset.fullAddress = newCoords.address;
            return newCoords;
          } else {
            // Si le géocodage échoue, vider les coordonnées pour forcer une nouvelle tentative
            delete arriveeInput.dataset.lat;
            delete arriveeInput.dataset.lon;
            delete arriveeInput.dataset.fullAddress;
          }
        } catch (error) {
          // En cas derreur, vider les coordonnées
          delete arriveeInput.dataset.lat;
          delete arriveeInput.dataset.lon;
          delete arriveeInput.dataset.fullAddress;
        }
      }
      
      if (arriveeInput.dataset.lat && arriveeInput.dataset.lon) {
        return {
          lat: parseFloat(arriveeInput.dataset.lat),
          lng: parseFloat(arriveeInput.dataset.lon),
          address: arriveeInput.dataset.fullAddress || arriveeLivraison
        };
      }
      return await geocodeAddress(arriveeLivraison);
    };
    
    // Utiliser le cache pour les adresses originales si disponibles
    const getOriginalDepartCoords = async () => {
      if (DeliverySystem.originalRoute && DeliverySystem.originalRoute.start) {
        return DeliverySystem.originalRoute.start;
      }
      return await geocodeAddress(DeliverySystem.currentAnnonce.depart);
    };
    
    const getOriginalArriveeCoords = async () => {
      if (DeliverySystem.originalRoute && DeliverySystem.originalRoute.end) {
        return DeliverySystem.originalRoute.end;
      }
      return await geocodeAddress(DeliverySystem.currentAnnonce.arrivee);
    };
    
    // Géocoder toutes les adresses (avec cache pour les champs input et route originale)
    const [departCoords, arriveeCoords, originalDepartCoords, originalArriveeCoords] = await Promise.all([
      getDepartCoords(),
      getArriveeCoords(),
      getOriginalDepartCoords(),
      getOriginalArriveeCoords()
    ]);
    
    if (!departCoords || !arriveeCoords || !originalDepartCoords || !originalArriveeCoords) {
      document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-warning">Impossible de localiser certaines adresses</div>';
      updateProgressBar(0);
      return;
    }
    
    // Valider que la route est cohérente
    const isValid = validateDeliveryRoute(originalDepartCoords, originalArriveeCoords, departCoords, arriveeCoords);
    DeliverySystem.lastRouteValid = isValid.valid;
    if (confirmBtn) confirmBtn.disabled = !isValid.valid;
    
    if (!isValid.valid) {
      document.getElementById('deliveryMsg').innerHTML = `<div class="alert alert-danger">${isValid.message}</div>`;
      updateProgressBar(0);
      return;
    }
    
    // Calculer et afficher la progression
    const progress = calculateRouteProgress(originalDepartCoords, originalArriveeCoords, departCoords, arriveeCoords);
    updateProgressBar(progress);
    
    // Afficher la route sur la carte
    displayRouteOnMap(originalDepartCoords, originalArriveeCoords, departCoords, arriveeCoords);
    
    // Effacer les messages d'erreur
    document.getElementById('deliveryMsg').innerHTML = '';
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la route:', error);
    document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Erreur lors de la validation des adresses</div>';
    updateProgressBar(0);
    DeliverySystem.lastRouteValid = false;
    if (confirmBtn) confirmBtn.disabled = true;
  }
}

// Géocoder une adresse avec fallback vers le cache serveur
async function geocodeAddressWithFallback(address) {
  try {
    // 1Essayer d'abord le cache côté client
    const cacheKey = address.toLowerCase().trim();
    if (DeliverySystem.addressCache.has(cacheKey)) {
      const cachedData = DeliverySystem.addressCache.get(cacheKey);
      if (cachedData.length > 0) {
        return {
          lat: parseFloat(cachedData[0].lat),
          lng: parseFloat(cachedData[0].lon),
          address: cachedData[0].display_name
        };
      }
    }
    
    // 2. Essayer le cache côté serveur (plus fiable en cas de blocage Nominatim)
    const response = await fetch(`http://localhost:3000/annonces/geocode?q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur géocodage avec fallback:', error);
    return null;
  }
}

// Géocoder une adresse
async function geocodeAddress(address, existingCoords = null) {
  try {
    // Si on a déjà les coordonnées, les utiliser directement
    if (existingCoords && existingCoords.lat && existingCoords.lng) {
      return {
        lat: parseFloat(existingCoords.lat),
        lng: parseFloat(existingCoords.lng),
        address: existingCoords.address || address
      };
    }
    
    // Vérifier le cache d'abord
    const cacheKey = address.toLowerCase().trim();
    if (DeliverySystem.addressCache.has(cacheKey)) {
      const cachedData = DeliverySystem.addressCache.get(cacheKey);
      if (cachedData.length > 0) {
        return {
          lat: parseFloat(cachedData[0].lat),
          lng: parseFloat(cachedData[0].lon),
          address: cachedData[0].display_name
        };
      }
    }
    
    const response = await fetch(`http://localhost:3000/annonces/geocode?q=${encodeURIComponent(address)}&limit=1`);
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Erreur géocodage:', error);
    return null;
  }
}

// Valider que la route de livraison est cohérente
function validateDeliveryRoute(originalStart, originalEnd, deliveryStart, deliveryEnd) {
  // Calculer les distances
  const totalDistance = getDistanceKm(originalStart.lat, originalStart.lng, originalEnd.lat, originalEnd.lng);
  const deliveryDistance = getDistanceKm(deliveryStart.lat, deliveryStart.lng, deliveryEnd.lat, deliveryEnd.lng);
  
  // Vérifier que le point de départ de la livraison est raisonnablement proche du trajet original
  const distanceFromOriginalStart = getDistanceKm(originalStart.lat, originalStart.lng, deliveryStart.lat, deliveryStart.lng);
  const distanceFromOriginalEnd = getDistanceKm(originalEnd.lat, originalEnd.lng, deliveryEnd.lat, deliveryEnd.lng);
  
  // Tolérance de 50km pour le point de départ et d'arrivée
  const tolerance = 50;
  
  if (distanceFromOriginalStart > tolerance && distanceFromOriginalEnd > tolerance) {
    return {
      valid: false,
      message: 'Votre trajet doit être cohérent avec le trajet original. Vérifiez vos adresses de départ et d\'arrivée.'
    };
  }
  
  // Vérifier que la livraison ne fait pas un détour trop important
  if (deliveryDistance > totalDistance * 1.5) {
    return {
      valid: false,
      message: 'Votre trajet semble faire un détour trop important par rapport au trajet original.'
    };
  }
  
  // Si livraison partielle non autorisée, vérifier que c'est le trajet complet
  if (!DeliverySystem.currentAnnonce.livraisonPartielle) {
    if (distanceFromOriginalStart > 10 || distanceFromOriginalEnd > 10) {
      return {
        valid: false,
        message: 'Cette annonce ne permet pas la livraison partielle. Vous devez effectuer le trajet complet.'
      };
    }
  }
  
  return { valid: true };
}

// Calculer le pourcentage de progression de la route
function calculateRouteProgress(originalStart, originalEnd, deliveryStart, deliveryEnd) {
  const totalDistance = getDistanceKm(originalStart.lat, originalStart.lng, originalEnd.lat, originalEnd.lng);
  
  if (totalDistance === 0) return 100;
  
  // Vérifier si cest exactement le trajet complet
  const distanceFromOriginalStart = getDistanceKm(originalStart.lat, originalStart.lng, deliveryStart.lat, deliveryStart.lng);
  const distanceToOriginalEnd = getDistanceKm(deliveryEnd.lat, deliveryEnd.lng, originalEnd.lat, originalEnd.lng);
  
  // Si la livraison commence au départ original ET se termine à la destination finale (tolérance 10km)
  if (distanceFromOriginalStart < 10 && distanceToOriginalEnd <10) {
    return 100;
  }
  
  // Pour une livraison partielle, calculer le pourcentage basé sur la distance de la livraison
  // par rapport à la distance totale du trajet original
  const deliveryDistance = getDistanceKm(deliveryStart.lat, deliveryStart.lng, deliveryEnd.lat, deliveryEnd.lng);
  
  // Le pourcentage représente la proportion du trajet total que cette livraison effectue
  const progress = Math.min(100, (deliveryDistance / totalDistance) * 100);
  return Math.round(progress);
}

// Calculer la distance entre deux points en kilomètres
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Mettre à jour la barre de progression
function updateProgressBar(percentage) {
  // Fonction pour essayer de mettre à jour plusieurs fois si nécessaire
  function tryUpdate(attempts = 0) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progressBar && progressText) {
      progressBar.style.width = percentage + '%';
      progressText.textContent = percentage + '%';
      
      // Changer la couleur selon le pourcentage
      progressBar.className = 'progress-bar';
      if (percentage >= 75) {
        progressBar.classList.add('bg-success');
      } else if (percentage >= 50) {
        progressBar.classList.add('bg-warning');
      } else if (percentage >= 25) {
        progressBar.classList.add('bg-info');
      } else if (percentage > 0) {
        progressBar.classList.add('bg-danger');
      } else {
        // 0% = jaune (warning) par défaut
        progressBar.classList.add('bg-warning');
      }
    } else {
      // Réessayer jusqu'à 5 fois avec des délais croissants
      if (attempts < 5) {
        setTimeout(() => tryUpdate(attempts + 1), 100 * (attempts + 1));
      }
    }
  }
  
  // Commencer immédiatement, puis réessayer si nécessaire
  tryUpdate();
}

// Afficher la route sur la carte
function displayRouteOnMap(originalStart, originalEnd, deliveryStart, deliveryEnd) {
  if (!DeliverySystem.map) {
    return;
  }
  
  // Effacer seulement les marqueurs et lignes de livraison précédents
  clearDeliveryRoute();
  
  // Récupérer les adresses depuis les champs input (avec préférence pour les adresses complètes)
  const departInput = document.getElementById('departLivraison');
  const arriveeInput = document.getElementById('arriveeLivraison');
  
  const departAddress = departInput.dataset.fullAddress || departInput.value;
  const arriveeAddress = arriveeInput.dataset.fullAddress || arriveeInput.value;
  
  // Ajouter les marqueurs de livraison avec les bonnes couleurs
  const deliveryStartMarker = L.marker([deliveryStart.lat, deliveryStart.lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(DeliverySystem.map)
    .bindPopup('<strong>🚀 Départ livraison</strong><br>' + departAddress);
  
  const deliveryEndMarker = L.marker([deliveryEnd.lat, deliveryEnd.lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(DeliverySystem.map)
    .bindPopup('<strong>📍 Arrivée livraison</strong><br>' + arriveeAddress);
  
  // Stocker les marqueurs de livraison
  DeliverySystem.deliveryMarkers = [deliveryStartMarker, deliveryEndMarker];
  
  // Ajouter la ligne de livraison (vert)
  const deliveryRouteLine = L.polyline([
    [deliveryStart.lat, deliveryStart.lng],
    [deliveryEnd.lat, deliveryEnd.lng]
  ], { color: '#28a745', weight: 4, opacity: 0.8 }).addTo(DeliverySystem.map);
  
  // Ligne pointillée jaune entre fin de livraison et destination finale si différente
  let yellowLine = null;
  if (getDistanceKm(deliveryEnd.lat, deliveryEnd.lng, originalEnd.lat, originalEnd.lng) > 10) {
    yellowLine = L.polyline([
      [deliveryEnd.lat, deliveryEnd.lng],
      [originalEnd.lat, originalEnd.lng]
    ], { color: '#ffc107', weight: 3, opacity: 0.8, dashArray: '8, 8' }).addTo(DeliverySystem.map);
  }
  
  // Stocker les lignes de livraison
  DeliverySystem.routeLine = yellowLine ? [deliveryRouteLine, yellowLine] : [deliveryRouteLine];
  
  // Ajuster la vue pour inclure tous les points avec un délai pour s'assurer que la carte est prête
  setTimeout(() => {
    // Inclure tous les marqueurs (originaux + livraison)
    const allMarkers = [
      L.marker([originalStart.lat, originalStart.lng]),
      L.marker([originalEnd.lat, originalEnd.lng]),
      ...DeliverySystem.deliveryMarkers
    ];
    const group = new L.featureGroup(allMarkers);
    DeliverySystem.map.fitBounds(group.getBounds().pad(0.1));
  }, 100);
}

// Effacer la route de la carte
function clearMapRoute() {
  if (DeliverySystem.routeMarkers) {
    DeliverySystem.routeMarkers.forEach(marker => DeliverySystem.map.removeLayer(marker));
    DeliverySystem.routeMarkers = [];
  }
  
  if (DeliverySystem.routeLine) {
    DeliverySystem.routeLine.forEach(line => DeliverySystem.map.removeLayer(line));
    DeliverySystem.routeLine = null;
  }
}

// Effacer seulement les éléments de livraison (garder la route originale)
function clearDeliveryRoute() {
  if (DeliverySystem.deliveryMarkers) {
    DeliverySystem.deliveryMarkers.forEach(marker => {
      try {
        DeliverySystem.map.removeLayer(marker);
      } catch (e) {
        console.log('Erreur suppression marqueur:', e);
      }
    });
    DeliverySystem.deliveryMarkers = [];
  }
  
  if (DeliverySystem.routeLine) {
    DeliverySystem.routeLine.forEach(line => {
      try {
        DeliverySystem.map.removeLayer(line);
      } catch (e) {
        console.log('Erreur suppression ligne:', e);
      }
    });
    DeliverySystem.routeLine = null;
  }
}

async function initMap() {
  const mapContainer = document.getElementById('deliveryMap');
  if (!mapContainer) return;
  
  // Supprimer la carte existante si elle existe
  if (DeliverySystem.map) {
    try {
      DeliverySystem.map.remove();
    } catch (e) {
      console.log('Erreur lors de la suppression de la carte (initMap):', e);
    }
    DeliverySystem.map = null;
  }
  
  // Vider le conteneur de la carte
  mapContainer.innerHTML = '';
  
  try {
    DeliverySystem.map = L.map('deliveryMap').setView([46.603354, 1.888334], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(DeliverySystem.map);
    
    // Initialiser la route originale immédiatement
    initOriginalRoute();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la carte (initMap):', error);
  }
}

// Soumettre la livraison
async function submitDelivery() {
  // Vérifier la validité de la route avant de soumettre
  if (!DeliverySystem.lastRouteValid) {
    document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Le trajet proposé n\'est pas valide. Veuillez corriger les adresses.</div>';
    return;
  }
  
  const annonceId = document.getElementById('annonceId').value;
  const departInput = document.getElementById('departLivraison');
  const arriveeInput = document.getElementById('arriveeLivraison');
  
  const departLivraison = departInput.value.trim();
  const arriveeLivraison = arriveeInput.value.trim();
  
  if (!departLivraison || !arriveeLivraison) {
    document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Veuillez renseigner les adresses de départ et d\'arrivée</div>';
    return;
  }
  
  try {
    // Utiliser les coordonnées déjà stockées dans les dataset
    let departCoords = null;
    let arriveeCoords = null;
    
    // Vérifier les coordonnées stockées pour le départ
    if (departInput.dataset.lat && departInput.dataset.lon) {
      departCoords = {
        lat: parseFloat(departInput.dataset.lat),
        lng: parseFloat(departInput.dataset.lon),
        address: departInput.dataset.fullAddress || departLivraison
      };
    }
    
    // Vérifier les coordonnées stockées pour l'arrivée
    if (arriveeInput.dataset.lat && arriveeInput.dataset.lon) {
      arriveeCoords = {
        lat: parseFloat(arriveeInput.dataset.lat),
        lng: parseFloat(arriveeInput.dataset.lon),
        address: arriveeInput.dataset.fullAddress || arriveeLivraison
      };
    }
    
    // Si les coordonnées ne sont pas stockées, essayer de les récupérer
    if (!departCoords) {
      departCoords = await geocodeAddressWithFallback(departLivraison);
      if (!departCoords) {
        document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Impossible de localiser l\'adresse de départ. Veuillez vérifier l\'adresse ou réessayer plus tard.</div>';
        return;
      }
    }
    
    if (!arriveeCoords) {
      arriveeCoords = await geocodeAddressWithFallback(arriveeLivraison);
      if (!arriveeCoords) {
        document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Impossible de localiser l\'adresse d\'arrivée. Veuillez vérifier l\'adresse ou réessayer plus tard.</div>';
        return;
      }
    }
    
    if (!departCoords || !arriveeCoords) {
      document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Coordonnées manquantes pour valider le trajet. Veuillez vérifier vos adresses.</div>';
      return;
    }
    
    // Préparer les données à envoyer
    const deliveryData = {
      annonce_id: annonceId,
      depart_livraison: departLivraison,
      arrivee_livraison: arriveeLivraison,
      depart_lat: departCoords.lat,
      depart_lng: departCoords.lng,
      arrivee_lat: arriveeCoords.lat,
      arrivee_lng: arriveeCoords.lng
    };
    
    // Envoyer la requête
    const response = await fetch('http://localhost:3000/api/livraisons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(deliveryData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Succès
      document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-success">Livraison prise en charge avec succès !</div>';
      
      // Fermer le modal après un délai
      setTimeout(() => {
        DeliverySystem.modal.hide();
        // Rediriger vers mes livraisons
        window.location.href = '/mes-livraisons';
      }, 2000);
      
    } else {
      // Erreur
      document.getElementById('deliveryMsg').innerHTML = `<div class="alert alert-danger">${result.error || 'Erreur lors de la prise en charge'}</div>`;
    }
    
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    document.getElementById('deliveryMsg').innerHTML = '<div class="alert alert-danger">Erreur réseau lors de la prise en charge</div>';
  }
} 

// Fonctions obsolètes supprimées - utilisation du système simplifié 