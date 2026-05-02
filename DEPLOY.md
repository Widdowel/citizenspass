# Déploiement Vercel + Turso

Le projet est configuré pour fonctionner sur Vercel avec une base **Turso** (libSQL distribuée). En local, il continue à utiliser SQLite (`dev.db`).

## 1 — Créer la base Turso (gratuit, ~30 sec)

```bash
# Installer le CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Se connecter
turso auth signup   # ou: turso auth login

# Créer la DB
turso db create citizenpass

# Récupérer l'URL et le token
turso db show citizenpass --url
turso db tokens create citizenpass
```

Note les deux valeurs : `TURSO_DATABASE_URL` (commence par `libsql://…`) et `TURSO_AUTH_TOKEN`.

## 2 — Pousser le schéma sur Turso

Depuis ta machine, avec les variables d'environnement :

```bash
TURSO_DATABASE_URL="libsql://..." \
TURSO_AUTH_TOKEN="..." \
DATABASE_URL="file:./dev.db" \
npm run db:setup
```

`db:setup` exécute `prisma migrate deploy` puis le seed. Les comptes de démo seront créés sur Turso.

> **Important** : `DATABASE_URL` doit rester défini (Prisma le requiert) mais il n'est pas utilisé quand Turso est configuré.

## 3 — Déployer sur Vercel

```bash
# Installer le CLI Vercel
npm i -g vercel

# Depuis la racine du projet
vercel
# Répondre aux questions, puis :
vercel --prod
```

**Ou** : connecter le repo GitHub directement sur https://vercel.com/new.

## 4 — Configurer les variables d'environnement Vercel

Dans le dashboard Vercel → Settings → Environment Variables, ajoute :

| Variable | Valeur |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://citizenpass-xxx.turso.io` |
| `TURSO_AUTH_TOKEN` | `eyJhbG…` |
| `DATABASE_URL` | `file:./dev.db` (placeholder, requis par Prisma) |
| `NEXTAUTH_SECRET` | une longue chaîne aléatoire (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | l'URL de ta preview Vercel (ex: `https://citizenpass.vercel.app`) |

Puis redéploie : `vercel --prod` ou bouton "Redeploy" dans le dashboard.

## 5 — Tester

Ouvre l'URL Vercel, login avec un compte de démo :

| CIP | Mot de passe | Cas |
|---|---|---|
| `1234-5678-9012` | `demo123` | Koffi Adégbola — clean, tous documents OK |
| `2345-6789-0123` | `demo123` | Adjoa Mensah — fisc PENDING |
| `3456-7890-1234` | `demo123` | Yves Houngbédji — judiciaire ONGOING (exception sur casier) |
| `4567-8901-2345` | `demo123` | Fatouma Bio Sani — fisc OVERDUE (exception sur quitus) |
| `ADMIN-001` | `admin123` | Admin (centre d'orchestration national) |

## Re-seeder en cas de besoin

```bash
TURSO_DATABASE_URL="..." TURSO_AUTH_TOKEN="..." DATABASE_URL="file:./dev.db" npm run db:seed
```

## Rotation des clés cryptographiques

Les clés RSA des autorités sont générées au premier lancement et stockées dans la table `SigningKey`. Pour rotation : supprimer la ligne, la prochaine signature recréera une clé. Les anciens documents restent vérifiables tant que la clé d'origine existe.
