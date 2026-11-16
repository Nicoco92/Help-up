// Exécuté une seule fois, au premier démarrage de Mongo (volume vide).
// Crée l'utilisateur applicatif, limité à la base de l'app (pas d'accès admin).
const dbName = process.env.MONGO_APP_DB;

db.getSiblingDB(dbName).createUser({
  user: process.env.MONGO_APP_USER,
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: "readWrite", db: dbName }],
});
