# Recette plus healthy

App web pour transformer une recette en version moins grasse / moins sucrée.

Colle ta liste d'ingrédients (une ligne par ingrédient, idéalement avec la quantité),
l'app te propose des alternatives issues d'une table de substitutions courantes
(gras et sucre), avec la quantité ajustée et des conseils pour adapter la cuisson.

## Utiliser l'app

Aucune installation ni backend : ouvre `index.html` dans un navigateur,
ou sers le dossier avec n'importe quel serveur statique (ex. `python3 -m http.server`).

## Structure

- `index.html` — page unique
- `styles.css` — style
- `substitutions.js` — table de substitutions (gras/sucre, ratio, conseils, mise en garde)
- `app.js` — parsing de la liste d'ingrédients + application des substitutions

## Limites de cette première version

- Table de substitutions volontairement restreinte (~15 entrées) : couvre les cas
  les plus courants, à étoffer avec l'usage.
- Le matching se fait par mot-clé sur le nom de l'ingrédient, pas par IA :
  fiable sur les entrées connues, silencieux sur le reste plutôt que d'inventer.
- Pas de calcul nutritionnel chiffré (calories, grammes de gras/sucre) : les résultats
  sont qualitatifs pour l'instant.
