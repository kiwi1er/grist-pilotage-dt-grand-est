# Publication GitHub Pages et intégration dans Grist

## Publication
Publier uniquement le contenu de dist/ à la racine du dépôt dédié, ou dans un dossier réservé du dépôt choisi : index.html, styles.css, model.js, app.js et .nojekyll.

Ne pas publier preview/ ni un export Grist. Aucune clé API à fournir.

Dans les paramètres GitHub du dépôt, rubrique Pages, choisir la publication depuis la branche hébergeant ces fichiers et le dossier racine. Si le dépôt héberge déjà un widget, préserver son contenu et utiliser un sous-dossier dédié.

## Installation dans Grist
1. Ouvrir le document de test de programmation DT Grand Est.
2. Ajouter une nouvelle page, choisir Widget personnalisé et la table ACTIVITES.
3. Choisir URL personnalisée et coller l’URL HTTPS GitHub Pages du widget.
4. Accorder Accès complet au document. Ce niveau permet la lecture des tables de référence ; la v0.1 ne réalise aucune écriture.
5. Nommer la page Pilotage DT — Prototype et agrandir la section.

Le plugin utilisé pour modifier Grist ne permet pas d’ajouter cette page : l’installation se fait dans l’interface Grist.

## Tables utilisées
Obligatoires : ACTIVITES, ATELIERS, COLLABORATEURS, THEMATIQUES.
Complémentaires : SOUS_THEMATIQUES et PARTENAIRES. Si une table complémentaire est absente, la partie concernée est sans données.

Les identifiants techniques actuels des colonnes sont utilisés. Renommer une page est sans conséquence ; changer un identifiant technique nécessite d’adapter le code.

## Vérification dans Grist
- La barre indique Connecté à Grist et le bandeau Démonstration a disparu.
- Le nombre d’activités correspond au document.
- Filtrer sur un atelier et une période, puis ouvrir une fiche.
- Vérifier le partenaire de test et, sur une formation, les identifiants Noticia si renseignés.
- Actualiser après une modification dans Grist, notamment dans un référentiel.

Une lecture refusée produit une erreur explicite et ne déclenche jamais le remplacement par une démonstration.

## Limites
La v0.1 est destinée à la direction. Elle ne définit pas les restrictions par atelier. Ne pas la présenter comme un espace sécurisé par rôle avant configuration et vérification des droits Grist.

Les fiches sont en lecture seule. La création reste dans les formulaires existants.

## Mise à jour
Publier les quatre fichiers ensemble et conserver la version précédente. Utiliser une URL de test avant une évolution importante. Restaurer les fichiers précédents permet un retour à l’interface précédente ; la v0.1 ne change pas les données.

