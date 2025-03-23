# EcoDeli Server

Ce dossier contient l'API du projet EcoDeli, développée avec **Node.js/Express**.  
La base de données peut être **SQLite** en développement (par défaut) ou **PostgreSQL** en production.

## Installation

1. **Cloner** le dépôt principal ou se placer dans le dossier `server` :
   ```bash
   cd EcoDeli/server

## Installer les dépendances :

`npm install` 

-> Cela installera tous les modules nécessaires (Express, sqlite3, cors, etc.).


## Configurer les variables d'environnement :

Créez un fichier .env:

```
    PORT=3000
    DATABASE_URL=database.sqlite
```

## Démarrage

`node app.js`

Par défaut, l'API écoute sur le port défini dans .env (3000 si non spécifié).

## Documentation (Swagger)

Une documentation Swagger est disponible à l'adresse :

http://localhost:3000/api-docs

___________________________________________________________________________


### Dépendances Principales

    express : framework minimaliste pour gérer les routes HTTP

    cors : gestion du Cross-Origin Resource Sharing

    sqlite3 ou pg : accès à la base de données (SQLite ou PostgreSQL)

    swagger-ui-express : affichage de la documentation Swagger

    dotenv : chargement des variables d'environnement

### Auteur(s)

    Thomas Gallois (2A2)

    Loris Rameau (2A2)