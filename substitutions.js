// Table de substitutions "healthy" : gras et sucre réduits.
// Chaque entrée : mots-clés de correspondance, catégorie visée, substitut,
// ratio de quantité à appliquer, conseils d'adaptation, et une mise en garde.
// Table volontairement petite au départ : on l'étoffera après les premiers retours.

const SUBSTITUTIONS = [
  {
    id: "beurre-patisserie",
    match: ["beurre"],
    category: "gras",
    substitute: "compote de pomme sans sucre ajouté",
    ratio: 0.75,
    adjustments: [
      "Réduis les autres liquides de la recette d'environ 2 c. à soupe par 100 g de beurre remplacé.",
      "Diminue le temps de cuisson au four de 5 à 10 min et surveille la coloration : la compote garde le moelleux plus longtemps."
    ],
    caveat: "Ne convient pas aux recettes où le beurre doit rester solide (sablés, pâte feuilletée, croustillant recherché).",
    impact: ["gras"]
  },
  {
    id: "creme-epaisse",
    match: ["crème fraîche", "crème fraiche", "crème épaisse", "crème liquide entière", "crème entière"],
    category: "gras",
    substitute: "yaourt grec nature",
    ratio: 1,
    adjustments: [
      "Ajoute-le hors du feu ou en toute fin de cuisson : à forte ébullition, le yaourt peut trancher.",
      "Pour lier une sauce chaude, mélange d'abord une cuillère de la sauce chaude au yaourt avant de l'incorporer."
    ],
    caveat: "Texture un peu moins onctueuse dans les sauces réduites longtemps.",
    impact: ["gras"]
  },
  {
    id: "creme-chantilly",
    match: ["crème liquide", "crème à fouetter", "crème chantilly"],
    category: "gras",
    substitute: "lait concentré non sucré bien froid, fouetté",
    ratio: 1,
    adjustments: ["Place le lait concentré et le bol au congélateur 15 min avant de fouetter pour qu'il monte correctement."],
    caveat: "Tenue moins ferme dans le temps qu'une vraie chantilly : à consommer rapidement.",
    impact: ["gras"]
  },
  {
    id: "mayonnaise",
    match: ["mayonnaise", "mayo"],
    category: "gras",
    substitute: "yaourt grec + moutarde + citron",
    ratio: 1,
    adjustments: ["Mélange environ 2/3 de yaourt grec pour 1/3 de moutarde, avec un filet de citron pour l'acidité."],
    caveat: "Goût plus frais et acidulé, moins « riche » qu'une vraie mayonnaise.",
    impact: ["gras"]
  },
  {
    id: "lait-entier",
    match: ["lait entier"],
    category: "gras",
    substitute: "lait demi-écrémé",
    ratio: 1,
    adjustments: ["Aucun ajustement de recette nécessaire, le remplacement est direct."],
    caveat: "Léger changement de texture dans les crèmes/béchamels très riches.",
    impact: ["gras"]
  },
  {
    id: "fromage-rape",
    match: ["fromage râpé", "fromage rape", "gruyère râpé", "emmental râpé"],
    category: "gras",
    substitute: "parmesan (quantité réduite de moitié)",
    ratio: 0.5,
    adjustments: ["Le parmesan a plus de goût à quantité égale : la moitié suffit pour un résultat aussi savoureux."],
    caveat: "Moins filant/gratiné qu'un fromage à raclette ou emmental.",
    impact: ["gras"]
  },
  {
    id: "lardons",
    match: ["lardons", "bacon", "poitrine fumée"],
    category: "gras",
    substitute: "lardons de dinde ou jambon blanc maigre coupé en dés",
    ratio: 1,
    adjustments: ["Fais-les revenir un peu plus longtemps à sec : ils rendent moins de gras que des vrais lardons de porc."],
    caveat: "Moins de goût fumé ; ajoute un peu de paprika fumé si besoin.",
    impact: ["gras"]
  },
  {
    id: "viande-hachee-grasse",
    match: ["viande hachée", "boeuf haché", "bœuf haché", "chair à saucisse"],
    category: "gras",
    substitute: "viande hachée à 5 % de matière grasse",
    ratio: 1,
    adjustments: ["Ajoute une cuillère à soupe d'eau ou de bouillon en cuisson si le mélange attache : il y a moins de gras pour graisser la poêle."],
    caveat: "Un peu moins juteux dans les préparations mijotées longtemps.",
    impact: ["gras"]
  },
  {
    id: "huile-friture",
    match: ["huile de friture", "bain de friture", "huile pour friture"],
    category: "gras",
    substitute: "cuisson au four avec un filet d'huile sur papier cuisson",
    ratio: 0.3,
    adjustments: ["Four préchauffé à 200°C, retourne les morceaux à mi-cuisson pour un résultat croustillant sur les deux faces."],
    caveat: "Texture plus proche du rôti que du frit, moins craquant.",
    impact: ["gras"]
  },
  {
    id: "chocolat-lait",
    match: ["chocolat au lait", "pépites de chocolat au lait"],
    category: "sucre",
    substitute: "chocolat noir 70 % ou plus",
    ratio: 1,
    adjustments: ["Si la recette est déjà peu sucrée par ailleurs, ajoute une pointe de sucre ou de miel pour rééquilibrer le goût."],
    caveat: "Goût plus intense et légèrement amer.",
    impact: ["sucre", "gras"]
  },
  {
    id: "sucre-blanc",
    match: ["sucre", "sucre blanc", "sucre en poudre", "sucre semoule"],
    category: "sucre",
    substitute: "purée de dattes",
    ratio: 1,
    adjustments: [
      "Réduis les autres liquides de la recette d'environ 3 c. à soupe par 200 g de sucre remplacé.",
      "La texture sera plus dense et moelleuse, avec une couleur plus foncée."
    ],
    caveat: "Apporte un léger goût caramélisé, à éviter si tu veux un goût neutre.",
    impact: ["sucre"]
  },
  {
    id: "cassonade",
    match: ["cassonade", "sucre roux", "sucre brun"],
    category: "sucre",
    substitute: "sirop d'agave",
    ratio: 0.75,
    adjustments: ["Réduis les autres liquides de la recette d'environ 2 c. à soupe par 100 g de cassonade remplacée."],
    caveat: "Texture plus moelleuse, moins de « croustillant » en surface (ex. cookies).",
    impact: ["sucre"]
  },
  {
    id: "confiture",
    match: ["confiture"],
    category: "sucre",
    substitute: "compote sans sucre ajouté",
    ratio: 1,
    adjustments: ["Aucun ajustement de recette nécessaire, le remplacement est direct."],
    caveat: "Moins de tenue/brillance qu'une vraie confiture en garniture ou glaçage.",
    impact: ["sucre"]
  },
  {
    id: "miel-exces",
    match: ["sirop d'érable", "miel"],
    category: "sucre",
    substitute: "purée de banane bien mûre",
    ratio: 0.8,
    adjustments: ["Réduis légèrement les autres liquides de la recette : la banane apporte de l'humidité."],
    caveat: "Ajoute un goût de banane perceptible, à réserver aux recettes qui s'y prêtent.",
    impact: ["sucre"]
  }
];
