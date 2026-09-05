# Estimation calories par photo

Appli web mono-fichier (`index.html`), 100% côté navigateur, sans backend.
Prend une photo de repas, l'envoie à l'API Anthropic (Claude, vision) pour
estimer les calories et macros, et affiche un chiffre unique par valeur
(marge de sécurité de +10% déjà appliquée) — pratique pour ressaisir
rapidement dans une appli de tracking type Yazio quand la pesée n'est pas
possible.

## Utilisation

1. Ouvre `index.html` dans un navigateur (double-clic, ou héberge-le en
   statique, ex. GitHub Pages).
2. Renseigne ta clé API Anthropic dans les réglages (stockée uniquement en
   local dans le navigateur, jamais envoyée ailleurs qu'à l'API Anthropic).
3. Prends/choisis une photo, clique "Analyser".
4. Si le modèle a besoin de précisions (huile utilisée, sauce sucrée,
   cuisson...), réponds aux questions posées.
5. Le résultat final (calories, protéines, glucides, lipides) s'affiche en
   chiffre unique, prêt à être recopié.

Chaque estimation consomme quelques centimes de crédit API sur ton compte
Anthropic (facturation à l'usage, indépendante de ton abonnement Claude).
