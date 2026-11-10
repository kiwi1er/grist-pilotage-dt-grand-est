# Pilotage DT Grand Est — widget Grist

Première version de consultation pour la programmation des activités de Réseau Canopé Grand Est. Code statique, hébergeable sur GitHub Pages, sans compilation ni serveur applicatif.

## Fonctions
- Vue d’ensemble : volumes, états, thématiques, informations manquantes et relances.
- Ateliers et programmation : calendrier annuel, durées prévues, personnes mobilisées.
- Partenariats : organismes distincts, catégories et comparaison par atelier.
- Thématiques et publics : matrice croisée et répartitions.
- Activités : recherche, tri, pagination et fiches détaillées.
- Filtres partagés : année civile, atelier organisateur, type et état.
- Export CSV de la sélection avec neutralisation des formules de tableur.
- Navigation au clavier et mise en page adaptée aux écrans étroits.

## Données et sécurité
Les fichiers publiables dans dist/ ne contiennent aucune donnée du document Grist, aucune clé et aucun identifiant de connexion. L’ouverture hors de Grist affiche des données entièrement synthétiques clairement signalées. Dans Grist, le widget lit le document autorisé, ne transmet pas les données à GitHub et ne les conserve pas dans le navigateur.

La v0.1 appelle uniquement fetchTable : aucune création, modification, suppression ou migration. Grist exige cependant « Accès complet au document » pour la lecture de plusieurs tables ; cette permission permet techniquement l’écriture même si ce code ne l’utilise pas.

Les permissions Grist restent la protection des données. Un filtre d’atelier ne constitue pas une restriction d’accès. Cette v0.1 est destinée à la direction et à la validation du prototype. Les espaces atelier/formateur et leurs droits restent à construire.

Les polices sont chargées depuis Google Fonts, avec repli système. L’API officielle des widgets est chargée depuis docs.getgrist.com seulement en mode intégré.

## Architecture évolutive
- dist/index.html : structure et navigation.
- dist/styles.css : présentation et règles responsive.
- dist/model.js : calculs purs et règles métier.
- dist/app.js : vues, filtres, démonstration et adaptateur Grist.
- tests/model.cjs : vérification des règles de calcul.
- INSTALLATION.md : publication et branchement dans Grist.
- EVOLUTIONS.md : périmètre et prochaines évolutions.

Les vues sont enregistrées dans definitions et renderers. Les tables sont centralisées dans tableNames. Aucune bibliothèque JavaScript tierce n’est nécessaire.

## Développement
Lancer dans ce dossier : python3 -m http.server 8096 --bind 127.0.0.1

Ouvrir http://127.0.0.1:8096/dist/ pour la démonstration synthétique.

L’option ?preview=local, réservée à localhost, lit un extrait facultatif dans preview/data/snapshot.json. Le dossier preview/ est ignoré par Git et exclu des archives de publication.

Vérifications : node --test tests/model.cjs ; node --check dist/app.js ; node --check dist/model.js.

## Règles de calcul
1. Attribution unique à l’atelier organisateur ; aucune duplication des heures sur les ateliers associés.
2. Année de la date de contact pour un démarchage, de la date prévue sinon. Toutes les années conserve les activités sans date.
3. Heures prévues : durées renseignées hors annulées, y compris le prévisionnel des activités déjà réalisées.
4. Heures réalisées, durées moyennes et participations : activités réalisées uniquement.
5. Absence distincte de zéro : les moyennes excluent les valeurs absentes et les écrans indiquent la complétude.
6. Les participations ne sont pas des personnes uniques. Référents et intervenants sont dédoublonnés pour compter les personnes mobilisées.
7. Catégories de partenaires potentiellement multiples par activité : leurs totaux ne s’additionnent pas.
8. Calendrier à la première date de référence, sans ventilation multi-dates.
9. Aucun taux d’occupation, temps de préparation, coût complet ou rentabilité inventé.
10. Identifiants Noticia facultatifs pour les seules formations PDFC-PrAF ; aucune lecture des tables d’import Noticia.


## v0.2 — revue de la vue d’ensemble
Logo fourni, filtres multiples (ateliers, types, états), mois et périodes lues depuis PERIODES, aides sur les indicateurs et les relances.
Dans Grist, lecture automatique à l’ouverture, lors des événements de la table sélectionnée, au retour sur la page et toutes les 30 secondes lorsque la page est visible. Le rafraîchissement périodique est différé pendant l’utilisation des filtres ouverts ou d’une fiche. Il ne s’agit pas d’une garantie de synchronisation instantanée. Une heure de dernière actualisation est affichée.
Les différents filtres se combinent ; aucun choix d’atelier/type/état signifie tous. Un filtre de date exclut les activités sans date. Les périodes utilisent leurs bornes, et non uniquement le champ Periode de l’activité.
Le chantier des exports doit être repris à la fin de la revue des écrans : destinataires, contenu, regroupements et formats.
