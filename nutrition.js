// Référence (citation exigée par l'ANSES en cas de réutilisation des données) :
// Anses. 2025. Table de composition nutritionnelle des aliments Ciqual.
//
// Extrait fourni par l'utilisateur (Table_Ciqual_2025_FR_2025_11_03.xls, onglet
// "composition nutritionnelle"). Chaque entrée cite l'aliment Ciqual utilisé
// (alim_nom_fr) pour rester traçable. Couvre les ingrédients de la table de
// substitutions + quelques bases de recette courantes ; un ingrédient absent
// de cette liste est exclu du calcul plutôt que d'inventer une valeur.
//
// Une valeur Ciqual "-" (énergie du sirop d'agave) est recalculée par la
// formule Atwater standard (4 kcal/g protéines et glucides, 9 kcal/g lipides)
// à partir des macros Ciqual, comme le ferait toute table de composition.
//
// densityGPerMl : ne vient PAS de Ciqual (qui raisonne au poids) — densité
// approximative utilisée uniquement pour convertir un volume (c. à soupe,
// cl...) en grammes avant d'appliquer les valeurs par 100 g.
// gramsPerUnit : poids moyen d'une unité (ex. "2 oeufs" sans poids donné).

const NUTRITION = [
  // Ciqual: "Sucre roux"
  { id: "cassonade", match: ["cassonade", "sucre roux", "sucre brun"], kcal100: 393, protein100: 0.12, carbs100: 98.1, fat100: 0 },
  // Ciqual: "Boeuf, steak haché 5% MG cru"
  { id: "viande-hachee-5", match: ["hachée à 5", "haché à 5", "5 % de matière grasse", "5% de matière grasse"], kcal100: 130, protein100: 21.9, carbs100: 0.3, fat100: 4.59 },
  // Ciqual: "Boeuf, steak haché 15% MG cru"
  { id: "viande-hachee", match: ["viande hachée", "boeuf haché", "bœuf haché", "chair à saucisse"], kcal100: 215, protein100: 20.2, carbs100: 0.47, fat100: 14.8 },
  // Ciqual: "Jambon cuit, supérieur, découenné dégraissé"
  { id: "jambon-maigre", match: ["jambon blanc", "jambon maigre", "lardons de dinde"], kcal100: 115, protein100: 20.3, carbs100: 0.14, fat100: 3.66 },
  // Ciqual: "Lardon nature, cru"
  { id: "lardons", match: ["lardons", "bacon", "poitrine fumée"], kcal100: 269, protein100: 16.6, carbs100: 1.01, fat100: 22.1 },
  // Ciqual: "Lait concentré sans sucres ajoutés, entier"
  { id: "lait-concentre", match: ["lait concentré"], kcal100: 119, protein100: 6.31, carbs100: 9.91, fat100: 5.9 },
  // Ciqual: "Lait entier (aliment moyen)"
  { id: "lait-entier", match: ["lait entier"], kcal100: 63.9, protein100: 3.35, carbs100: 4.78, fat100: 3.49 },
  // Ciqual: "Lait demi-écrémé (aliment moyen)"
  { id: "lait-demi-ecreme", match: ["lait demi-écrémé", "lait demi écrémé"], kcal100: 47.5, protein100: 3.38, carbs100: 4.97, fat100: 1.55 },
  // Lait "générique" (pas de précision type) : valeur du demi-écrémé, le plus courant en France
  { id: "lait", match: ["lait"], kcal100: 47.5, protein100: 3.38, carbs100: 4.97, fat100: 1.55 },
  // Ciqual: "Crème 30% MG, épaisse, rayon frais"
  { id: "creme-fraiche", match: ["crème fraîche", "crème fraiche", "crème épaisse", "crème liquide entière", "crème entière"], kcal100: 285, protein100: 2.28, carbs100: 1.38, fat100: 29.9 },
  // Ciqual: "Crème 30% MG, fluide, UHT"
  { id: "creme-liquide", match: ["crème liquide", "crème à fouetter", "crème chantilly"], kcal100: 293, protein100: 2.16, carbs100: 3.69, fat100: 30 },
  // Ciqual: "Yaourt à la grecque nature"
  { id: "yaourt-grec", match: ["yaourt grec"], kcal100: 103, protein100: 2.96, carbs100: 3.73, fat100: 8.16 },
  // Ciqual: "Mayonnaise (70% MG min.), préemballée"
  { id: "mayonnaise", match: ["mayonnaise", "mayo"], kcal100: 692, protein100: 1.33, carbs100: 3.41, fat100: 74.5 },
  // Ciqual: "Sirop d'érable"
  { id: "sirop-erable", match: ["sirop d'érable"], kcal100: 269, protein100: 0.04, carbs100: 67.2, fat100: 0.06, densityGPerMl: 1.33 },
  // Ciqual: "Sirop d'agave" (énergie recalculée par Atwater, voir en-tête)
  { id: "sirop-agave", match: ["sirop d'agave"], kcal100: 318, protein100: 0.25, carbs100: 78, fat100: 0.5, densityGPerMl: 1.33 },
  // Ciqual: "Miel"
  { id: "miel", match: ["miel"], kcal100: 331, protein100: 0.65, carbs100: 82.1, fat100: 0, densityGPerMl: 1.42 },
  // Ciqual: "Confiture ou marmelade, tout type de fruits, sans précision sur la teneur en sucres (aliment moyen)"
  { id: "confiture", match: ["confiture"], kcal100: 235, protein100: 0.36, carbs100: 57.1, fat100: 0.27 },
  // Ciqual: "Compote de pomme, allégée en sucres, rayon ambiant" (le plus proche de "sans sucre ajouté")
  { id: "compote", match: ["compote"], kcal100: 64.3, protein100: 0.25, carbs100: 15.1, fat100: 0.13 },
  // Ciqual: "Datte, chair et peau, sans noyau, sèche"
  { id: "puree-dattes", match: ["purée de dattes", "dattes"], kcal100: 287, protein100: 1.81, carbs100: 64.7, fat100: 0.25 },
  // Ciqual: "Banane, chair sans peau, crue"
  { id: "puree-banane", match: ["purée de banane", "banane"], kcal100: 87.6, protein100: 1.06, carbs100: 19.7, fat100: 0.3, gramsPerUnit: 120 },
  // Ciqual: "Emmental ou emmenthal, râpé"
  { id: "fromage-rape", match: ["fromage râpé", "fromage rape", "gruyère râpé", "emmental râpé"], kcal100: 368, protein100: 27.1, carbs100: 0.58, fat100: 28.2 },
  // Ciqual: "Parmesan"
  { id: "parmesan", match: ["parmesan"], kcal100: 411, protein100: 30.5, carbs100: 1.14, fat100: 31 },
  // Ciqual: "Chocolat au lait, tablette"
  { id: "chocolat-lait", match: ["chocolat au lait"], kcal100: 550, protein100: 7.5, carbs100: 58.9, fat100: 30.8 },
  // Ciqual: "Chocolat noir 70 % de cacao environ, de dégustation, tablette"
  { id: "chocolat-noir", match: ["chocolat noir"], kcal100: 591, protein100: 10.4, carbs100: 26.9, fat100: 46.3 },
  // Ciqual: "Beurre à 80% MG minimum, doux"
  { id: "beurre", match: ["beurre"], kcal100: 753, protein100: 0.63, carbs100: 0.71, fat100: 83 },
  // Ciqual: "Huile d'olive vierge extra"
  { id: "huile", match: ["huile"], kcal100: 899, protein100: 0.25, carbs100: 0, fat100: 99.9, densityGPerMl: 0.92 },
  // Ciqual: "Farine de blé tendre ou froment T45 (pour pâtisserie)"
  { id: "farine", match: ["farine"], kcal100: 355, protein100: 9.25, carbs100: 76.5, fat100: 0.82 },
  // Ciqual: "Oeuf cru"
  { id: "oeuf", match: ["oeuf", "œuf"], kcal100: 140, protein100: 12.8, carbs100: 0.06, fat100: 9.83, gramsPerUnit: 50 },
  // Mot-clé générique volontairement en dernier : "sucre" est une sous-chaîne
  // de descriptions comme "sans sucre ajouté" ou "non sucré" (compote, lait
  // concentré...), donc tous les substituts doivent être vérifiés avant lui.
  // Ciqual: "Sucre blanc"
  { id: "sucre-blanc", match: ["sucre"], kcal100: 399, protein100: 0, carbs100: 99.7, fat100: 0 }
];
