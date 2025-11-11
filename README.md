# OpenDirecte

**OpenDirecte** est un ENT (Espace Numérique de Travail) open source pour écoles, collèges et lycées. C'est une alternative libre, simple et moderne à EcoleDirecte.

## 🌟 Caractéristiques

- **Open Source** : Licence AGPLv3
- **Monolithique** : Frontend et Backend intégrés sur un seul serveur Flask
- **Moderne** : Interface utilisateur avec TailwindCSS
- **Complet** : Gestion des utilisateurs, groupes, devoirs, notes, messages, calendrier
- **Comptes Parents** : Les parents peuvent suivre la scolarité de leurs enfants avec sélecteur d'enfant
- **Multi-rôles** : Élèves, Professeurs, Parents et Administrateurs
- **Extensible** : API REST complète et documentée

## 🏗️ Architecture

### Stack Technique

- **Backend** : Flask + SQLAlchemy + Flask-JWT-Extended + Flask-Bcrypt
- **Base de données** : SQLite (par défaut)
- **Frontend** : HTML + TailwindCSS + Vanilla JavaScript
- **Authentification** : JWT (stockage localStorage)

### Structure du projet

```
opendirecte/
├── app.py                    # Application Flask principale
├── config.py                 # Configuration
├── core/                     # Modules core
│   ├── extensions.py         # Extensions Flask
│   ├── models.py            # Modèles de base de données
│   ├── permissions.py       # Gestion des permissions
│   └── utils.py             # Utilitaires
├── api/                      # API REST
│   ├── auth/                # Authentification
│   ├── users/               # Gestion utilisateurs
│   ├── groups/              # Gestion groupes
│   ├── feed/                # Fil d'actualités
│   ├── homeworks/           # Devoirs
│   ├── mail/                # Messagerie
│   ├── calendar/            # Calendrier
│   ├── notes/               # Notes
│   └── attachments/         # Pièces jointes
├── frontend/                 # Interface utilisateur
│   ├── index.html           # Page de connexion
│   ├── dashboard.html       # Tableau de bord
│   ├── homework.html        # Page devoirs
│   ├── messages.html        # Messagerie
│   ├── notes.html           # Notes
│   ├── grades.html          # Notes (vue détaillée)
│   ├── calendar.html        # Calendrier
│   ├── admin.html           # Interface d'administration
│   └── assets/              # CSS, JS
└── requirements.txt          # Dépendances Python
```

## 🚀 Installation

### Prérequis

- Python 3.11+
- pip

### Étapes

1. **Cloner le repository**
```bash
git clone https://github.com/ruikdev/Opendirecte.git
cd Opendirecte
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Lancer l'application**
```bash
python app.py
```

L'application sera accessible sur `http://localhost:5000`

## 👤 Compte par défaut

Un compte administrateur est créé automatiquement au premier lancement :

- **Nom d'utilisateur** : `admin`
- **Mot de passe** : `admin123`

⚠️ **Important** : Changez ce mot de passe en production !

## 🎨 Interface Utilisateur

### Panneau d'Administration

L'interface admin (`/admin`) offre une gestion complète via 4 onglets :

1. **👥 Utilisateurs** : 
   - Liste de tous les utilisateurs avec badges colorés par rôle
   - Création, édition, suppression
   - Gestion des groupes pour chaque utilisateur
   - Recherche et filtrage en temps réel

2. **📚 Groupes/Classes** :
   - Gestion des classes et clubs
   - Visualisation du nombre de membres
   - CRUD complet

3. **📢 Annonces** :
   - Publier des annonces sur le fil d'actualités
   - Modifier et supprimer les annonces existantes

4. **👨‍👩‍👧‍👦 Parents** (Nouveau !) :
   - Vue dédiée aux comptes parents
   - Association graphique parent-enfant
   - Visualisation des enfants avec leurs classes
   - Modale interactive pour gérer les associations

### Pages Utilisateur

- **🏠 Dashboard** : Accès rapide à tous les modules
- **📝 Devoirs** : Gestion et suivi des devoirs avec filtres
- **📊 Notes** : Visualisation des notes par matière avec moyennes
- **📅 Calendrier** : Emploi du temps hebdomadaire
- **💬 Messages** : Système de messagerie interne

### Design

- Interface moderne avec **TailwindCSS**
- Design responsive (mobile, tablette, desktop)
- Badges colorés pour identifier les rôles :
  - 🟣 Violet : Admin
  - 🔵 Bleu : Professeur
  - 🟢 Vert : Élève
  - 🟡 Jaune : Parent
- Sélecteur d'enfant thématique par page :
  - 🔵 Bleu : Devoirs
  - 🟢 Vert : Notes
  - 🟠 Orange : Calendrier

## 📚 API Documentation

### Endpoints disponibles

#### Authentification (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Créer un utilisateur (admin)
- `POST /api/v1/auth/login` - Connexion → JWT
- `GET /api/v1/auth/me` - Utilisateur actuel
- `PUT /api/v1/auth/me` - Modifier profil
- `POST /api/v1/auth/refresh` - Rafraîchir token

#### Utilisateurs (`/api/v1/users`)
- `GET /api/v1/users` - Lister utilisateurs (admin)
- `POST /api/v1/users` - Créer utilisateur (admin)
- `GET /api/v1/users/<id>` - Détails utilisateur
- `PUT /api/v1/users/<id>` - Modifier utilisateur
- `DELETE /api/v1/users/<id>` - Supprimer utilisateur (admin)
- `PUT /api/v1/users/<id>/groups` - Gérer groupes
- `GET /api/v1/users/<parent_id>/children` - Liste des enfants d'un parent
- `PUT /api/v1/users/<parent_id>/children` - Associer/retirer des enfants (admin)
- `GET /api/v1/users/students` - Lister tous les élèves (admin)

#### Groupes (`/api/v1/groups`)
- `GET /api/v1/groups` - Lister groupes
- `POST /api/v1/groups` - Créer groupe (admin)
- `GET /api/v1/groups/<id>` - Détails groupe
- `PUT /api/v1/groups/<id>` - Modifier groupe (admin)
- `DELETE /api/v1/groups/<id>` - Supprimer groupe (admin)

#### Fil d'actualités (`/api/v1/feed`)
- `GET /api/v1/feed` - Lister annonces
- `POST /api/v1/feed` - Publier annonce (admin)
- `PUT /api/v1/feed/<id>` - Modifier annonce (admin)
- `DELETE /api/v1/feed/<id>` - Supprimer annonce (admin)

#### Devoirs (`/api/v1/homeworks`)
- `GET /api/v1/homeworks` - Lister devoirs (accepte `?child_id=X` pour les parents)
- `POST /api/v1/homeworks` - Créer devoir (prof/admin)
- `PUT /api/v1/homeworks/<id>` - Modifier devoir
- `DELETE /api/v1/homeworks/<id>` - Supprimer devoir

#### Messagerie (`/api/v1/mail`)
- `GET /api/v1/mail/inbox` - Boîte de réception
- `GET /api/v1/mail/sent` - Messages envoyés
- `POST /api/v1/mail/send` - Envoyer message
- `GET /api/v1/mail/<id>` - Lire message
- `DELETE /api/v1/mail/<id>` - Supprimer message

#### Calendrier (`/api/v1/calendar`)
- `GET /api/v1/calendar` - Lister événements (accepte `?child_id=X` pour les parents)
- `POST /api/v1/calendar` - Créer événement (prof/admin)
- `POST /api/v1/calendar/import` - Importer .ics (admin)
- `PUT /api/v1/calendar/<id>` - Modifier événement
- `DELETE /api/v1/calendar/<id>` - Supprimer événement (admin)

#### Notes (`/api/v1/notes`)
- `GET /api/v1/notes` - Lister notes (accepte `?child_id=X` pour les parents)
- `POST /api/v1/notes` - Ajouter note (prof/admin)
- `PUT /api/v1/notes/<id>` - Modifier note
- `DELETE /api/v1/notes/<id>` - Supprimer note

#### Pièces jointes (`/api/v1/attachments`)
- `POST /api/v1/attachments/upload` - Upload fichier
- `GET /api/v1/attachments/<id>` - Télécharger fichier

### Authentification JWT

Toutes les requêtes API (sauf `/auth/login`) nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

Le token JWT contient :
```json
{
  "user_id": 1,
  "role": "prof",
  "groups": ["3A", "club_IA"]
}
```

## 🔐 Rôles et Permissions

### Rôles disponibles
- **eleve** : Élève
- **prof** : Professeur
- **parent** : Parent d'élève
- **admin** : Administrateur

### Permissions par rôle

#### 👨‍🎓 Élève
- Consulter ses devoirs (avec marquage fait/non fait)
- Consulter ses notes avec moyennes par matière
- Envoyer et recevoir des messages
- Consulter son emploi du temps

#### 👨‍🏫 Professeur
- Créer et gérer des devoirs pour ses groupes
- Attribuer et modifier des notes pour ses élèves
- Envoyer des messages aux élèves et collègues
- Consulter l'emploi du temps de ses groupes

#### 👨‍👩‍👧‍👦 Parent
- **Sélecteur d'enfant** sur toutes les pages (Devoirs, Notes, Calendrier)
- Consulter les devoirs de chaque enfant individuellement
- Voir les notes et moyennes par matière de chaque enfant
- Accéder à l'emploi du temps de chaque enfant
- Vue globale de tous les enfants ou vue filtrée par enfant

#### 👨‍💼 Administrateur
- Gérer tous les utilisateurs (création, modification, suppression)
- **Onglet dédié "Parents"** pour gérer les comptes parents et associer les enfants
- Créer et gérer les groupes/classes
- Publier des annonces sur le fil d'actualités
- Accès complet à toutes les fonctionnalités du système

### 👪 Fonctionnalités Comptes Parents

#### Pour l'Administrateur

1. **Créer un compte parent** :
   - Via l'onglet "Utilisateurs" → Nouveau utilisateur → Rôle "Parent"
   - Ou directement via l'onglet "Parents"

2. **Gérer les associations parent-enfant** :
   - Accéder à l'onglet "Parents" dans le panneau admin
   - Cliquer sur "Gérer les enfants" pour un parent
   - Sélectionner les élèves à associer via checkboxes
   - Visualiser en temps réel les enfants associés avec leurs classes

3. **Interface dédiée** :
   - Tableau récapitulatif : nom du parent, email, liste des enfants avec leurs groupes
   - Recherche rapide pour filtrer les parents
   - Actions : Gérer enfants, Éditer, Supprimer

#### Pour le Parent

1. **Connexion** :
   - Se connecter avec ses identifiants
   - Accès automatique au tableau de bord

2. **Sélecteur d'enfant** :
   - Présent sur les pages : **Devoirs**, **Notes**, **Calendrier**
   - Options : "Tous les enfants" ou sélection individuelle
   - Interface intuitive avec icône famille

3. **Consultation des données** :
   - **Notes** : Moyennes par matière, détail de chaque note
   - **Devoirs** : À faire, terminés, en retard (filtrable par enfant)
   - **Emploi du temps** : Cours et événements (filtrable par enfant)

#### API pour les Parents

Toutes les routes supportent le paramètre `child_id` :

```bash
# Notes d'un enfant spécifique
GET /api/v1/notes?child_id=5

# Devoirs d'un enfant spécifique  
GET /api/v1/homeworks?child_id=5

# Emploi du temps d'un enfant spécifique
GET /api/v1/calendar?child_id=5
```

**Configuration via API** :
```bash
# Associer des enfants à un parent
PUT /api/v1/users/<parent_id>/children
{
  "add_children": [1, 2, 3],
  "remove_children": [4]
}

# Lister les enfants d'un parent
GET /api/v1/users/<parent_id>/children
```

## 🛠️ Développement

### Variables d'environnement

Créer un fichier `.env` :

```env
FLASK_ENV=development
SECRET_KEY=votre-clé-secrète
JWT_SECRET_KEY=votre-clé-jwt
DATABASE_URL=sqlite:///opendirecte.db
```

### Commandes utiles

```bash
# Lancer en mode développement
python app.py

# Lancer avec Flask CLI
export FLASK_APP=app.py
flask run

# Mode debug
export FLASK_ENV=development
flask run --debug
```

## 📝 Licence

Ce projet est sous licence **AGPLv3**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🎯 Roadmap

### Fonctionnalités Prévues
- [ ] Notifications en temps réel (WebSocket)
- [ ] Export PDF des notes et bulletins
- [ ] Système de permissions granulaires
- [ ] Multi-établissements
- [ ] API GraphQL en complément de REST
- [ ] Application mobile (React Native)
- [ ] Intégration avec pronote.net

### Améliorations en cours
- [ ] Amélioration de l'import/export .ics
- [ ] Gestion des absences
- [ ] Système de punitions/récompenses
- [ ] Cahier de texte numérique

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Guidelines de contribution
- Code en français (commentaires et noms de variables)
- Respecter la structure existante
- Ajouter des tests si possible
- Mettre à jour la documentation

## 📧 Contact

Projet maintenu par [@ruikdev](https://github.com/ruikdev)

---

**OpenDirecte** - Une alternative libre et open source pour l'éducation 🎓
