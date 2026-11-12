# Revue Ateliers et programmation — 12 novembre 2026

## Ajustements v0.3
1. Compteur d’ateliers remplacé par le nombre d’activités sélectionnées.
2. Résumé explicite de la sélection : année, mois, période avec dates, ateliers, types, états et personnes.
3. Moyenne réalisée affichée seulement si un seul type est sélectionné ; limites de comparabilité à conserver.
4. Filtre personnes : référent OU intervenant, sans double comptage d’une même activité. Ce filtre porte sur les activités associées ; il n’attribue pas leurs durées à la personne.
5. Reformulation de la limite des données : les temps de préparation/coordination par agent et la capacité ne sont pas modélisés.
6. Le sélecteur d’année du calendrier actualise le filtre global. Le sélecteur d’unité change uniquement la mesure du calendrier. En toutes années, l’année particulière du calendrier est indiquée explicitement.
7. Les cellules ouvrent les activités du mois et de l’atelier. Les heures ne totalisent que les durées renseignées hors annulées ; la liste peut aussi contenir des activités sans durée ou annulées.
8. Pour un seul atelier, la comparaison devient une répartition par type ; les panneaux ne sont plus artificiellement étirés à la hauteur du tableau des personnes.
9. Tableau des personnes conservé, noms cliquables pour ouvrir leurs activités.

## Calendrier
La couleur est relative au maximum affiché ; elle ne mesure pas une surcharge. L’échelle peut donc changer avec les filtres. Les mois hors sélection sont distingués des mois à zéro. L’activité est encore affectée à sa première date de référence ; une activité sur plusieurs mois n’est pas ventilée.

## Suite : temps mobilisés par personne
Le référentiel COLLABORATEURS identifie les personnes et leur rattachement. ACTIVITES possède des durées prévues/réelles, des intervenants et un temps de transport au format texte. Cela ne fournit pas de temps individuel de préparation ou coordination, de durée d’intervention propre à chaque agent ni de capacité disponible.

Proposition à examiner : une table MOBILISATIONS, avec une ligne pour une personne, une activité, une date et une phase (préparation, intervention, coordination, transport), des heures prévues et éventuellement réalisées. Les lignes doivent pouvoir être prévues avant l’activité et ventilées sur les dates réellement concernées.

Ne pas attribuer automatiquement toute la durée de l’activité à chaque référent et intervenant. Ne pas diviser les heures à parts égales sans règle validée.

Une capacité disponible validée par personne et période constituerait un deuxième jeu de données nécessaire avant de calculer un taux d’occupation. Les activités multi-ateliers doivent distinguer atelier organisateur et atelier d’affectation de l’agent.

Aucune table ni donnée Grist n’a été modifiée au cours de cette revue. Les nouvelles tables et les modalités de saisie restent à concevoir avec l’utilisateur.

