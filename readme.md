# EcoDeli — Projet Annuel 2A2

**Thomas Gallois et Loris Rameau**

## Description
EcoDeli est un projet annuel qui se compose de trois parties :
- **API** : Développée avec Node.js/Express, utilisant SQLite en développement (ou PostgreSQL en production) et documentée avec Swagger.
- **SPA** : Application Vue.js pour le back-office, permettant de gérer les utilisateurs, leurs documents et autres fonctionnalités.
- **MPA** : Application multi-page pour le site public.

L'objectif est de fournir une plateforme complète de gestion pour EcoDeli.

## Compte Administrateur
- **Email** : admin@admin.com
- **Mot de passe** : azerty

## Instructions de démarrage

### Back-office (SPA)
```bash
cd spa-backoffice
npm install
npm run serve
```

### Serveur (API)
```bash
cd server
npm install
node app.js
```

### Front-office (MPA)
```bash
cd mpa-frontoffice
npm install
node app.js
```

