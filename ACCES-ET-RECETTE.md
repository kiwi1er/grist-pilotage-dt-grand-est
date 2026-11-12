# Préparation des droits et de la recette

## Matrice proposée, non appliquée

| Profil | Lecture activités | Mise à jour |
|---|---|---|
| Administration | Toutes | Toutes et configuration |
| Direction territoriale | Toutes | Toutes les activités |
| Direction d’atelier | Toutes par défaut, limitation atelier possible | Activités organisées par son atelier |
| Personnel | Activités de son atelier ou auxquelles il participe ailleurs | Activités où il est référent ou intervenant |

Le périmètre de lecture des personnels inclut ici leurs interventions hors atelier : proposition à valider. La création, la suppression et les colonnes sensibles nécessitent des règles distinctes. Suppression réservée à l’administration dans la première proposition. Les droits de structure et de modification des rôles restent réservés aux administrateurs.

## Mise en œuvre Grist

Les filtres du widget et les pages masquées ne définissent pas les autorisations. Appliquer les règles avancées sur les tables, lignes et colonnes. Le widget lit les seules données autorisées à l’utilisateur. L’accès complet demandé par le widget concerne les capacités de son code, sans remplacer les droits de l’utilisateur connecté.

Identifier les utilisateurs connectés par leur email de compte Grist et une table d’attributs protégée. La table COLLABORATEURS dispose d’Email, Rattachements, Directeur et DT ; vérifier les emails et les rôles avant utilisation. Distinguer le rôle de propriétaire technique de l’appartenance à la direction. Ne pas permettre aux utilisateurs de changer leur rôle ni leur atelier.

Vérifier rec ET newRec : un utilisateur ne doit pas déplacer une activité vers un autre atelier ou changer les personnes pour élargir ses droits. Protéger les colonnes d’attribution si nécessaire. Décider du cas des activités multi-ateliers et du rôle des ateliers associés. Les agrégats/formules, références et anciennes tables Noticia doivent être vérifiés pour éviter une exposition indirecte.

Le connecteur actuel ne permet pas de configurer les règles avancées ni de modifier le widget d’une page. Cette partie nécessite une intervention dans l’interface Grist. Aucun droit n’a été changé.

## Tests avant ouverture

Tester comme propriétaire, direction, directeur 08 et personnel 08 : lecture des lignes, consultation des références, modification autorisée et refusée, tentative de changement d’atelier/intervenants, création, suppression, exports et widget. Vérifier les contributions hors atelier et l’absence de fuite par indicateurs. Ne jamais considérer un filtre comme un test d’autorisation.

## Suite

1. Publier le widget v0.4 et recharger sa page dans Grist.
2. Ajouter les données fictives via les propositions du connecteur, puis vérifier les références.
3. Valider la matrice et appliquer/tester les droits avant partage aux équipes.
4. Reprendre le chantier des exports après la recette des accès ; le CSV actuel reste un prototype.

Documentation : https://support.getgrist.com/access-rules/ et https://support.getgrist.com/widget-custom/
