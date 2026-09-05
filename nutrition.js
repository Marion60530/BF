// Table nutritionnelle approximative (valeurs moyennes usuelles pour 100 g,
// pas issues d'une base vérifiée en direct) : sert à estimer calories et
// macros avant/après, PAS un chiffre certifié. Couvre les ingrédients de la
// table de substitutions + quelques bases de recette courantes. Un ingrédient
// absent de cette liste est exclu du calcul plutôt que d'inventer une valeur.
//
// densityGPerMl : utilisé quand l'ingrédient est mesuré en volume et que sa
// densité s'écarte notablement de celle de l'eau (huile, miel, sirops).
// gramsPerUnit : poids moyen d'une unité, pour les ingrédients comptés
// (ex. "2 oeufs") plutôt que pesés.

const NUTRITION = [
  { id: "cassonade", match: ["cassonade", "sucre roux", "sucre brun"], kcal100: 380, protein100: 0, carbs100: 98, fat100: 0 },
  { id: "viande-hachee-5", match: ["hachée à 5", "haché à 5", "5 % de matière grasse", "5% de matière grasse"], kcal100: 130, protein100: 21, carbs100: 0, fat100: 5 },
  { id: "viande-hachee", match: ["viande hachée", "boeuf haché", "bœuf haché", "chair à saucisse"], kcal100: 250, protein100: 18, carbs100: 0, fat100: 20 },
  { id: "jambon-maigre", match: ["jambon blanc", "jambon maigre", "lardons de dinde"], kcal100: 110, protein100: 18, carbs100: 1, fat100: 3.5 },
  { id: "lardons", match: ["lardons", "bacon", "poitrine fumée"], kcal100: 500, protein100: 14, carbs100: 0, fat100: 48 },
  { id: "lait-concentre", match: ["lait concentré"], kcal100: 135, protein100: 7, carbs100: 10, fat100: 7.5 },
  { id: "lait-entier", match: ["lait entier"], kcal100: 64, protein100: 3.3, carbs100: 4.8, fat100: 3.6 },
  { id: "lait-demi-ecreme", match: ["lait demi-écrémé", "lait demi écrémé"], kcal100: 46, protein100: 3.4, carbs100: 4.9, fat100: 1.6 },
  { id: "lait", match: ["lait"], kcal100: 50, protein100: 3.3, carbs100: 4.9, fat100: 1.8 },
  { id: "creme-fraiche", match: ["crème fraîche", "crème fraiche", "crème épaisse", "crème liquide entière", "crème entière"], kcal100: 300, protein100: 2, carbs100: 3, fat100: 30 },
  { id: "creme-liquide", match: ["crème liquide", "crème à fouetter", "crème chantilly"], kcal100: 300, protein100: 2, carbs100: 3, fat100: 30 },
  { id: "yaourt-grec", match: ["yaourt grec"], kcal100: 97, protein100: 9, carbs100: 4, fat100: 5 },
  { id: "mayonnaise", match: ["mayonnaise", "mayo"], kcal100: 680, protein100: 1, carbs100: 2, fat100: 75 },
  { id: "sirop-erable", match: ["sirop d'érable"], kcal100: 260, protein100: 0, carbs100: 67, fat100: 0, densityGPerMl: 1.33 },
  { id: "sirop-agave", match: ["sirop d'agave"], kcal100: 310, protein100: 0, carbs100: 76, fat100: 0, densityGPerMl: 1.33 },
  { id: "miel", match: ["miel"], kcal100: 304, protein100: 0.3, carbs100: 82, fat100: 0, densityGPerMl: 1.42 },
  { id: "confiture", match: ["confiture"], kcal100: 250, protein100: 0.3, carbs100: 62, fat100: 0 },
  { id: "compote", match: ["compote"], kcal100: 50, protein100: 0.2, carbs100: 12, fat100: 0.1 },
  { id: "puree-dattes", match: ["purée de dattes", "dattes"], kcal100: 280, protein100: 2, carbs100: 70, fat100: 0.4 },
  { id: "puree-banane", match: ["purée de banane", "banane"], kcal100: 90, protein100: 1.1, carbs100: 21, fat100: 0.3, gramsPerUnit: 120 },
  { id: "fromage-rape", match: ["fromage râpé", "fromage rape", "gruyère râpé", "emmental râpé"], kcal100: 380, protein100: 27, carbs100: 0.5, fat100: 30 },
  { id: "parmesan", match: ["parmesan"], kcal100: 400, protein100: 36, carbs100: 0.9, fat100: 28 },
  { id: "chocolat-lait", match: ["chocolat au lait"], kcal100: 535, protein100: 7.6, carbs100: 59, fat100: 30 },
  { id: "chocolat-noir", match: ["chocolat noir"], kcal100: 560, protein100: 7.8, carbs100: 35, fat100: 42 },
  { id: "beurre", match: ["beurre"], kcal100: 717, protein100: 0.9, carbs100: 0.1, fat100: 81 },
  { id: "huile", match: ["huile"], kcal100: 884, protein100: 0, carbs100: 0, fat100: 100, densityGPerMl: 0.92 },
  { id: "farine", match: ["farine"], kcal100: 364, protein100: 10, carbs100: 76, fat100: 1 },
  { id: "oeuf", match: ["oeuf", "œuf"], kcal100: 143, protein100: 13, carbs100: 0.7, fat100: 9.5, gramsPerUnit: 50 },
  // Mot-clé générique volontairement en dernier : "sucre" est une sous-chaîne
  // de descriptions comme "sans sucre ajouté" ou "non sucré" (compote, lait
  // concentré...), donc tous les substituts doivent être vérifiés avant lui.
  { id: "sucre-blanc", match: ["sucre"], kcal100: 387, protein100: 0, carbs100: 100, fat100: 0 }
];
