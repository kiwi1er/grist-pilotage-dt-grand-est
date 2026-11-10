# Revue de la vue d’ensemble — 12 annotations du 10 novembre 2026

## Corrections préparées dans l’aperçu local
- 1 : remplacer le symbole seul d’actualisation par un libellé. Dans Grist, le bouton relit les tables. En aperçu local, il relit uniquement l’extrait enregistré. Les filtres sont conservés.
- 2 : identifier l’export CSV comme un prototype. La définition des extractions reste à faire.
- 4 et 7 : retirer les flèches décoratives de GE et des indicateurs ; conserver les flèches sur de véritables liens.
- 5 : supprimer la phrase introductive de la vue d’ensemble.
- 9 : afficher « Total incomplet : N activités sans durée prévue » et une explication du calcul. Les annulées sont exclues ; les absences ne sont pas zéro.
- 10 : expliciter le numérateur et le dénominateur, et préciser que la part réalisée n’est pas un taux d’atteinte d’objectif.
- 11 : conserver le graphique et ajouter le choix du nombre d’activités ou des heures prévues, avec la limite concernant la charge réelle.
- 12 : renommer la liste « Les activités à relancer », indiquer le motif par ligne et expliquer les deux critères actuels.

## Éléments à poursuivre après revue
- 3 : remplacer la marque provisoire quand le logo sera fourni.
- 6 : permettre plusieurs ateliers, types et états. OU à l’intérieur d’un filtre, ET entre les filtres. Conserver une remise à zéro explicite.
- 8 : ajouter une sélection par mois et par période. Réutiliser les bornes de PERIODES (par exemple 26-27#1), sans inventer un découpage. Prévoir le traitement des activités sans date et la cohérence des dates de référence selon le type.
- 2 : définir les destinataires, le périmètre et le contenu des extractions avant d’ajouter des formats ou bilans.

## Critères de relance vérifiés dans Grist
Une activité apparaît si son état est À relancer OU si Relance_COQ_a_prevoir est vrai.
Le second critère est calculé dans Grist : Statut_parcours parmi En attente de retour du porteur ou À relancer ; Date_retour_porteur absente ; date de relance explicite prioritaire sur l’échéance COQ ; date atteinte ou dépassée.
L’échéance COQ correspond à Date_preconisation_COQ plus Delai_retour_COQ_j, 15 jours par défaut.
Aucun changement de ces règles Grist n’a été réalisé pendant la revue.

## État de diffusion
Les corrections ci-dessus sont préparées dans les fichiers locaux. Les filtres multiples et les nouvelles périodes ne sont pas encore implémentés. La version GitHub reste celle déjà publiée jusqu’à la prochaine mise à jour regroupée.


## Complément v0.2
Le logo est fourni et intégré. Les filtres multiples, mois et périodes sont désormais développés. Une lecture automatique régulière est ajoutée. Les ajustements sont regroupés dans la mise à jour v0.2 ; les notes précédentes décrivent l’étape de revue initiale. Le chantier export est à reprendre après la revue des écrans.
