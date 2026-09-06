# Recette plus healthy

App web pour transformer une recette en version moins grasse / moins sucrée.

Colle ta liste d'ingrédients (une ligne par ingrédient, idéalement avec la quantité),
l'app te propose des alternatives issues d'une table de substitutions courantes
(gras et sucre), avec la quantité ajustée, des conseils pour adapter la cuisson,
et une estimation calories/macros avant-après sourcée sur la table Ciqual (ANSES).

## Utiliser l'app

Aucune installation ni backend : ouvre `index.html` dans un navigateur,
ou sers le dossier avec n'importe quel serveur statique (ex. `python3 -m http.server`).

## Structure

- `index.html` — page unique
- `styles.css` — style
- `substitutions.js` — table de substitutions (gras/sucre, ratio, conseils, mise en garde)
- `nutrition.js` — table nutritionnelle (kcal/protéines/glucides/lipides pour 100 g),
  sourcée sur la table Ciqual 2025 (ANSES) — chaque entrée cite l'aliment Ciqual utilisé
- `app.js` — parsing de la liste d'ingrédients, application des substitutions,
  calcul calories/macros avant-après

## Limites de cette première version

- Table de substitutions volontairement restreinte (~15 entrées) : couvre les cas
  les plus courants, à étoffer avec l'usage.
- Le matching se fait par mot-clé sur le nom de l'ingrédient, pas par IA :
  fiable sur les entrées connues, silencieux sur le reste plutôt que d'inventer.
- Table nutritionnelle limitée à ~30 aliments (ceux de la table de substitutions +
  quelques bases de recette) : un ingrédient absent est exclu du calcul et listé,
  jamais estimé au hasard.
- L'estimation calories/macros reste approximative même avec des valeurs Ciqual
  fiables : aliment Ciqual le plus proche choisi manuellement, conversion volume→poids
  approximative pour les ingrédients mesurés en volume, poids moyen supposé pour les
  ingrédients comptés (ex. un oeuf ≈ 50 g).
