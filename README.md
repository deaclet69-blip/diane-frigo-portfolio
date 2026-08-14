# DIANE FRIGO — Phase 1 + Phase 2

## Phase 1
- ✅ Schéma PostgreSQL complet (`backend/prisma/schema.prisma`)
- ✅ Backend NestJS : authentification JWT + refresh token, garde de rôles, module Users, module Dashboard
- ✅ Frontend React + TypeScript + MUI : layout, sidebar (9 sections), header avec recherche, page de connexion, dashboard connecté à l'API
- ✅ Design system repris de la maquette

## Phase 2 — Produits, stock, inventaire, alertes
- ✅ Module Products : CRUD produits (prix de référence, seuil d'alerte), Paramètres > Produits
- ✅ Module Categories (référentiel simple)
- ✅ Module Stock :
  - Stock actuel calculé par produit (`Entrées + Ajustements − Sorties`, indépendant de l'ordre des lignes — corrige la fragilité du calcul en cascade de l'Excel)
  - Statuts automatiques 🟢 En stock / 🟠 Stock faible / 🔴 Rupture
  - Historique des mouvements par produit (fiche produit détaillée)
  - Formulaire de mouvement (entrée, sortie manuelle/perte, ajustement d'inventaire), avec blocage si stock insuffisant
  - Endpoint `/stock/alerts`
- ✅ Module Audit (`AuditService` global) : toute création de produit ou mouvement de stock est journalisée dans `audit_logs` — pas besoin d'attendre la Phase 5 pour ça
- ✅ Dashboard mis à jour : les KPI stock (valeur, alertes) viennent maintenant du vrai module Stock, plus d'une approximation

**Volontairement absent à ce stade** (arrive en Phase 3-5) : Ventes, Clients, Dépôts, Finances, Rapports, import Excel. Le dashboard n'affiche donc pas encore CA réel, graphiques, "dernières ventes" ni "top clients" — ils dépendent du module Ventes (Phase 3). La fiche produit affiche le stock et l'historique des mouvements, mais pas encore les ventes/CA/bénéfice par produit (message explicite affiché dans l'app en attendant).

## Phase 3 — Clients, Ventes, Factures, Paiements, Dépôts

- ✅ Module Customers : liste/recherche, fiche client (CA généré, quantité achetée, dettes en cours, historique d'achats, dépôts en cours), **fusion de doublons** (`POST /customers/:id/merge`) qui réattribue tout l'historique sans rien supprimer — répond directement au point NATIF/NATIFE/Natif identifié à l'Étape 1
- ✅ Module Sales : orchestrateur transactionnel `POST /sales` — une seule transaction PostgreSQL crée la facture, les lignes, les mouvements de stock (toujours, même en dépôt), le dépôt éventuel et le paiement ; vérifie le stock disponible avant tout (override réservé ADMIN)
- ✅ Module Invoices : liste, détail, ajout de paiement (gère les statuts Payé/Partiel/Crédit), **annulation** qui recrédite automatiquement le stock et annule les mouvements de dépôt liés — jamais de suppression physique
- ✅ Module Deposits : soldes calculés en direct (`Σ dépôts − Σ retraits`), formulaire de retrait avec contrôle de solde disponible
- ✅ Frontend : écran "Nouvelle vente" complet (client, produits multi-lignes, sous-total/remise/total en direct, paiement Payé/Partiel/Crédit, case "laisser en dépôt", écran de confirmation avec n° facture/montant/bénéfice), liste des ventes, détail facture (paiement complémentaire, annulation), pages Clients, page Dépôts

**Volontairement absent à ce stade** (arrive en Phase 4-5) : Finances (recettes/charges/trésorerie/objectif de récupération), Rapports, import Excel. Le dashboard affiche maintenant un vrai CA (Phase 3 alimente les `invoice_items`), mais les charges/résultat net dépendent encore du module Finances.

## Phase 4 — Finances, Charges, Bénéfices, Trésorerie, Rapports

- ✅ Module Expenses : création de charges avec distinction explicite **Charge d'exploitation / Mouvement de trésorerie**, reclassement en un clic (`PATCH /expenses/:id/reclassify`) — répond directement au point de l'Étape 1 sur la ligne "Argent débiter du compte"
- ✅ Module Finances :
  - `GET /finances/summary` — CA, coût des marchandises, marge brute, charges, trésorerie, résultat net (mensuel par défaut, cumulé sur demande — conforme à l'hypothèse validée à l'Étape 2)
  - `GET /finances/recovery` — objectif de récupération **cumulé depuis le début**, avec le détail par produit (combien de cartons vendre pour combler l'écart, et si le stock actuel suffit)
  - `GET /finances/monthly-chart` — CA vs Charges sur 12 mois, pour le graphique du dashboard
  - `MonthlyGoal` (nouvelle table, absente du schéma initial) pour fixer un objectif mensuel
- ✅ Module Reports : ventes par produit, top clients, charges par catégorie
- ✅ Frontend : page Finances (KPI + barre de progression "objectif de récupération" + tableau par produit), page Charges (création + reclassement), page Rapports, **dashboard enrichi** avec un vrai graphique CA vs Charges (recharts) et la carte "Objectif de récupération"

**Volontairement absent à ce stade** (arrive en Phase 5) : import Excel, page Paramètres complète (Utilisateurs/Rôles/Général — seuls les Produits sont gérables aujourd'hui), permissions avancées affinées, responsive mobile poussé, tests.

## Phase 5 — Import Excel, Audit, Permissions avancées, Sécurité, Responsive, Tests

- ✅ **Import Excel** (`POST /import/excel/preview` puis `/confirm`) : pipeline complet du §21 — lecture de la feuille "Stock" par nom d'en-tête (robuste aux variations de mise en forme), validation, détection des doublons (n° de facture déjà importé), regroupement des lignes multi-produits par facture, import dans **une seule transaction**, rapport détaillé (lignes importées / ignorées / doublons / erreurs). Rien n'est jamais écrit avant confirmation explicite, et aucune donnée existante n'est supprimée.
- ✅ **Audit** : page de consultation (`Paramètres > Audit`) de tout `audit_logs` — qui a fait quoi et quand, sur toute l'application (ventes, stock, charges, produits, utilisateurs, imports)
- ✅ **Permissions avancées** : gestion complète des utilisateurs (`Paramètres > Utilisateurs`) — création, activation/désactivation, changement de rôle, réservé ADMIN
- ✅ **Sécurité** : en-têtes HTTP durcis (helmet), limitation du taux de requêtes globale (100/min/IP) et renforcée sur `/auth/login` (5/min/IP anti brute-force)
- ✅ **Responsive** : sidebar compacte icônes-seules sous 1100px (tablette), navigation basse mobile sous 600px avec accès direct à "Nouvelle vente" en un tap (§17)
- ✅ **Tests** : suite Jest initialisée (`npm test` dans `backend/`), exemple sur `StockService` (calcul du stock actuel) — base à étendre sur `SalesService` et `InvoicesService.voidInvoice`

### Import Excel — mode d'emploi
1. Se connecter en ADMIN
2. Paramètres > Import Excel > choisir le fichier `.xlsx`
3. Vérifier l'aperçu (lignes lues, factures détectées, doublons, erreurs)
4. Confirmer — l'import se fait alors réellement, dans une transaction unique

**Hypothèses reprises de l'Étape 1** : les ventes importées sont marquées "Payé" (l'Excel ne trace pas de crédit/partiel), les clients ne sont pas dédoublonnés automatiquement (NATIF/NATIFE resteront deux fiches — utiliser la fusion manuelle dans Clients), les sorties de stock sans numéro de facture sont ignorées avec un message explicite.

## Ce qui resterait à faire pour une mise en production réelle
- Compléter la suite de tests (Sales, Invoices, Finances)
- Ajouter une page "Paramètres généraux" (nom de l'entreprise, devise, fuseau horaire)
- Génération de factures PDF téléchargeables
- Notifications (alertes stock, dettes clients) au-delà de l'icône cloche actuellement statique
- Déploiement (Docker, CI/CD) — non couvert par ce livrable de code source

## Lancer le backend

```bash
cd backend
cp .env.example .env        # renseigner DATABASE_URL avec ton PostgreSQL
npm install
npx prisma migrate dev --name init
npm run seed                 # crée les rôles, les 3 produits, et un compte admin
npm run start:dev
```

## Démarrage en un double-clic (Windows)

Une fois l'installation initiale faite une première fois (voir ci-dessus), le fichier
**`Demarrer-DianeFrigo.bat`** à la racine du projet permet de tout relancer d'un
double-clic : il ouvre le backend, le frontend, et le navigateur automatiquement.
Ne pas fermer les deux fenêtres cmd qui s'ouvrent — elles doivent rester actives
tant que l'application est utilisée.

Compte de test créé par le seed : `admin@dianefrigo.local` / `ChangeMoi123!` — **à changer immédiatement en production**.

## Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Ouvrir http://localhost:5173 — le frontend proxy automatiquement `/api` vers `http://localhost:3000`.

## Prochaine étape

Une fois cette Phase 1 validée : **Phase 2** — gestion des produits, mouvements de stock, inventaire, alertes (voir §23 du brief initial).
