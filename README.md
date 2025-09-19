# Application de Chat en Temps Réel

## 📋 Description
Application de messagerie instantanée sécurisée avec authentification, conversations privées, partage de fichiers et appels vidéo en temps réel.

## ✨ Fonctionnalités

- 🔐 Authentification sécurisée avec JWT
- 💬 Messagerie instantanée en temps réel
- 👥 Gestion des conversations privées
- 📁 Partage de fichiers multimédias
- 📞 Appels vidéo WebRTC
- 🔄 Notifications en temps réel
- 👤 Gestion des profils utilisateurs
- 🔒 Sécurité avancée avec Spring Security

## 🚀 Technologies Utilisées

### Backend
- **Spring Boot 3.5.5**
- **Spring Security** - Authentification et autorisation
- **WebSocket/STOMP** - Communication en temps réel
- **JPA/Hibernate** - Persistance des données
- **PostgreSQL** - Base de données principale
- **H2** - Base de données en mémoire pour le développement
- **JWT** - Gestion des jetons d'authentification
- **WebRTC** - Communication peer-to-peer pour les appels vidéo

### Frontend (dans le dossier `Front App Chat`)
- **React.js** - Bibliothèque JavaScript pour les interfaces utilisateur
- **Material-UI** - Composants d'interface utilisateur
- **Axios** - Requêtes HTTP
- **Socket.IO** - Communication en temps réel
- **WebRTC** - Appels vidéo

## 🛠 Configuration Requise

- Java 17 ou supérieur
- Node.js 16+ et npm 8+
- PostgreSQL 13+ (ou H2 pour le développement)
- Maven 3.8+

## 🚀 Installation et Exécution

### Backend

1. **Cloner le dépôt**
   ```bash
   git clone [URL_DU_REPO]
   cd chat
   ```

2. **Configurer la base de données**
   - Créer une base de données PostgreSQL
   - Configurer les paramètres dans `application.properties`

3. **Compiler et exécuter**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

### Frontend

1. **Accéder au dossier frontend**
   ```bash
   cd "Front App Chat"
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Démarrer l'application**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Fichier `application.properties`
```properties
# Configuration de la base de données
spring.datasource.url=jdbc:postgresql://localhost:5432/chat_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.datasource.driver-class-name=org.postgresql.Driver

# JWT Configuration
jwt.secret=votre_cle_secrete_tres_longue_et_securisee
jwt.expiration=86400000

# Configuration WebSocket
websocket.endpoint=/ws
websocket.topic.messages=/topic/messages

# Configuration de stockage des fichiers
file.upload-dir=./uploads
file.max-size=10MB
```

## 🌐 Points de Terminaison API

### Authentification
- `POST /api/auth/signin` - Connexion utilisateur
- `POST /api/auth/signup` - Création de compte
- `POST /api/auth/refresh` - Rafraîchir le token

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/{id}` - Détails d'un utilisateur
- `PUT /api/users/{id}` - Mettre à jour un utilisateur

### Conversations
- `GET /api/conversations` - Liste des conversations
- `POST /api/conversations` - Créer une conversation
- `GET /api/conversations/{id}/messages` - Messages d'une conversation

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /ws` - WebSocket pour les messages en temps réel

## 🔒 Sécurité

L'application utilise :
- Authentification JWT
- Protection CSRF
- Validation des entrées
- Chiffrement des mots de passe avec BCrypt
- Protection contre les attaques par force brute

## 📦 Déploiement

### Avec Docker (recommandé)

1. **Construire l'image**
   ```bash
   docker-compose build
   ```

2. **Démarrer les conteneurs**
   ```bash
   docker-compose up -d
   ```

### Manuellement

1. **Backend**
   ```bash
   mvn clean package
   java -jar target/chat-0.0.1-SNAPSHOT.jar
   ```

2. **Frontend**
   ```bash
   cd "Front App Chat"
   npm run build
   serve -s build
   ```

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue dans le dépôt.

---

Développé avec ❤️ par [Votre Nom] | © 2025 Tous droits réservés
