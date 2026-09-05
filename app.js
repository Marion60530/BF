function normalize(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Extrait quantité / unité / nom d'une ligne du type "200g de beurre" ou "2 c. à soupe de sucre".
// Si le format n'est pas reconnu, la ligne entière est traitée comme le nom de l'ingrédient.
function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const unitPattern =
    "kg|g|gr|grammes?|ml|cl|l|" +
    "c\\.?\\s?à\\s?(?:soupe|s\\.?)(?=\\s|$)|" +
    "c\\.?\\s?à\\s?(?:café|c\\.?)(?=\\s|$)|" +
    "cuill(?:ère|eres)?s?\\s?à\\s?(?:soupe|café)|tasses?|verres?|pincées?";
  const re = new RegExp(
    `^(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?\\s*(?:d[e'’]\\s*)?(.+)$`,
    "i"
  );

  const match = trimmed.match(re);
  if (match) {
    return {
      raw: trimmed,
      qty: parseFloat(match[1].replace(",", ".")),
      unit: match[2] ? match[2].trim() : null,
      name: match[3].trim()
    };
  }
  return { raw: trimmed, qty: null, unit: null, name: trimmed };
}

function findSubstitution(name) {
  const normalizedName = normalize(name);
  for (const entry of SUBSTITUTIONS) {
    for (const keyword of entry.match) {
      if (normalizedName.includes(normalize(keyword))) {
        return entry;
      }
    }
  }
  return null;
}

function formatQty(qty) {
  if (qty === null || qty === undefined) return null;
  const rounded = Math.round(qty * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function buildResult(parsedIngredient) {
  const sub = findSubstitution(parsedIngredient.name);
  if (!sub) {
    return { ingredient: parsedIngredient, substitution: null };
  }

  let adjustedQtyText = null;
  if (parsedIngredient.qty !== null) {
    const adjustedQty = formatQty(parsedIngredient.qty * sub.ratio);
    adjustedQtyText = `${adjustedQty}${parsedIngredient.unit ? " " + parsedIngredient.unit : ""}`;
  }

  return { ingredient: parsedIngredient, substitution: sub, adjustedQtyText };
}

function categoryLabel(category) {
  return category === "gras" ? "Moins de gras" : "Moins de sucre";
}

function renderResults(results) {
  const container = document.getElementById("results");
  const summary = document.getElementById("summary");
  container.innerHTML = "";

  const matched = results.filter((r) => r.substitution);
  const categoriesTouched = new Set(matched.map((r) => r.substitution.category));

  if (results.length === 0) {
    summary.textContent = "";
    return;
  }

  if (matched.length === 0) {
    summary.textContent =
      "Aucun ingrédient de la liste ne correspond à une substitution répertoriée pour l'instant.";
  } else {
    const parts = [];
    if (categoriesTouched.has("gras")) parts.push("gras");
    if (categoriesTouched.has("sucre")) parts.push("sucre");
    summary.textContent = `${matched.length} ingrédient(s) sur ${results.length} peuvent être remplacés pour réduire : ${parts.join(" et ")}.`;
  }

  results.forEach((result) => {
    const card = document.createElement("div");
    card.className = "card";

    if (!result.substitution) {
      card.classList.add("card--neutral");
      card.innerHTML = `
        <div class="card__original">${escapeHtml(result.ingredient.raw)}</div>
        <div class="card__note">Aucune alternative répertoriée pour cet ingrédient.</div>
      `;
      container.appendChild(card);
      return;
    }

    const sub = result.substitution;
    const badges = sub.impact
      .map(
        (cat) =>
          `<span class="badge badge--${cat}">${categoryLabel(cat)}</span>`
      )
      .join("");

    const adjustmentsHtml = sub.adjustments
      .map((a) => `<li>${escapeHtml(a)}</li>`)
      .join("");

    card.innerHTML = `
      <div class="card__badges">${badges}</div>
      <div class="card__original">${escapeHtml(result.ingredient.raw)}</div>
      <div class="card__arrow">→</div>
      <div class="card__substitute">
        ${result.adjustedQtyText ? escapeHtml(result.adjustedQtyText) + " " : ""}${escapeHtml(sub.substitute)}
      </div>
      ${sub.adjustments.length > 0 ? `<ul class="card__adjustments">${adjustmentsHtml}</ul>` : ""}
      ${sub.caveat ? `<div class="card__caveat">⚠️ ${escapeHtml(sub.caveat)}</div>` : ""}
    `;
    container.appendChild(card);
  });
}

// --- Conversion d'unités, pour appliquer réellement les ajustements du type
// "réduis les autres liquides de X" sur un ingrédient liquide de la recette,
// plutôt que de laisser ce conseil comme simple texte non exploité.

const MASS_TO_G = { g: 1, kg: 1000 };
const VOLUME_TO_ML = { ml: 1, cl: 10, l: 1000, tbsp: 15, tsp: 5, cup: 250, glass: 200 };

function canonicalUnit(unit) {
  if (!unit) return null;
  const u = normalize(unit);
  if (/^kg$/.test(u)) return "kg";
  if (/^(g|gr|grammes?|gramme)$/.test(u)) return "g";
  if (/^ml$/.test(u)) return "ml";
  if (/^cl$/.test(u)) return "cl";
  if (/^l$/.test(u)) return "l";
  if (u.includes("soupe")) return "tbsp";
  if (u.includes("cafe")) return "tsp";
  if (/^tasses?$/.test(u)) return "cup";
  if (/^verres?$/.test(u)) return "glass";
  return null;
}

function gramsOf(qty, unit) {
  const cu = canonicalUnit(unit);
  return cu && cu in MASS_TO_G ? qty * MASS_TO_G[cu] : null;
}

function mlOf(qty, unit) {
  const cu = canonicalUnit(unit);
  return cu && cu in VOLUME_TO_ML ? qty * VOLUME_TO_ML[cu] : null;
}

function mlToUnit(ml, unit) {
  const cu = canonicalUnit(unit);
  return ml / VOLUME_TO_ML[cu];
}

// Calcule la réduction de liquide totale exigée par les substitutions actives,
// l'applique à un ingrédient liquide trouvé dans la liste, et renvoie les
// conseils qui n'ont pas pu être appliqués automatiquement.
function applyOtherIngredientAdjustments(results) {
  const triggers = results.filter((r) => r.substitution && r.substitution.otherIngredientAdjustment);
  const unresolvedNotes = [];
  if (triggers.length === 0) return unresolvedNotes;

  let totalReductionMl = 0;

  triggers.forEach((result) => {
    const adj = result.substitution.otherIngredientAdjustment;
    const grams = adj.amount !== undefined && result.ingredient.qty !== null
      ? gramsOf(result.ingredient.qty, result.ingredient.unit)
      : null;
    const amountMl = adj.amount !== undefined ? mlOf(adj.amount, adj.unit) : null;

    if (adj.amount !== undefined && adj.perQty && grams !== null && amountMl !== null) {
      totalReductionMl += (grams / adj.perQty) * amountMl;
    } else {
      unresolvedNotes.push(
        adj.note ||
          `Réduis les autres liquides de la recette d'environ ${adj.amount} ${adj.unit} par ${adj.perQty} ${adj.perUnit} de ${result.ingredient.name} remplacé(e).`
      );
    }
  });

  if (totalReductionMl === 0) return unresolvedNotes;

  const candidate = results.find((r) => {
    if (triggers.includes(r)) return false;
    const effectiveQty = r.adjustedQtyText ? parseFloat(r.adjustedQtyText) : r.ingredient.qty;
    return effectiveQty !== null && mlOf(effectiveQty, r.ingredient.unit) !== null;
  });

  if (!candidate) {
    unresolvedNotes.unshift(
      `Réduis les liquides de la recette d'environ ${Math.round(totalReductionMl)} ml au total pour compenser l'humidité des alternatives (aucun ingrédient liquide détecté automatiquement dans ta liste).`
    );
    return unresolvedNotes;
  }

  const effectiveQty = candidate.adjustedQtyText ? parseFloat(candidate.adjustedQtyText) : candidate.ingredient.qty;
  const currentMl = mlOf(effectiveQty, candidate.ingredient.unit);
  const newMl = Math.max(0, currentMl - totalReductionMl);
  const newQty = formatQty(mlToUnit(newMl, candidate.ingredient.unit));

  candidate.liquidAdjustedQtyText = `${newQty} ${candidate.ingredient.unit}`;
  candidate.liquidAdjustedNote =
    "quantité réduite pour compenser l'humidité apportée par les autres alternatives";

  return unresolvedNotes;
}

function finalIngredientLine(result) {
  if (result.liquidAdjustedQtyText) {
    const name = result.substitution ? result.substitution.substitute : result.ingredient.name;
    return `${result.liquidAdjustedQtyText} ${name} (${result.liquidAdjustedNote})`;
  }
  if (!result.substitution) {
    return result.ingredient.raw;
  }
  const qtyPart = result.adjustedQtyText ? result.adjustedQtyText + " " : "";
  return `${qtyPart}${result.substitution.substitute}`;
}

function renderFinalRecipe(results, unresolvedNotes) {
  const section = document.getElementById("final-recipe");
  const list = document.getElementById("final-recipe-list");
  const notesEl = document.getElementById("final-recipe-notes");
  list.innerHTML = "";
  notesEl.innerHTML = "";
  notesEl.hidden = true;

  if (results.length === 0) {
    section.hidden = true;
    return;
  }

  results.forEach((result) => {
    const li = document.createElement("li");
    li.textContent = finalIngredientLine(result);
    list.appendChild(li);
  });

  if (unresolvedNotes && unresolvedNotes.length > 0) {
    notesEl.hidden = false;
    const heading = document.createElement("p");
    heading.className = "final-recipe-notes__heading";
    heading.textContent = "À ajuster toi-même :";
    notesEl.appendChild(heading);

    const notesList = document.createElement("ul");
    unresolvedNotes.forEach((note) => {
      const li = document.createElement("li");
      li.textContent = note;
      notesList.appendChild(li);
    });
    notesEl.appendChild(notesList);
  }

  section.hidden = false;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById("transform-btn").addEventListener("click", () => {
  const input = document.getElementById("ingredients-input").value;
  const lines = input.split("\n").map((l) => l.trim()).filter(Boolean);
  const results = lines.map(parseLine).map(buildResult);
  const unresolvedNotes = applyOtherIngredientAdjustments(results);
  renderResults(results);
  renderFinalRecipe(results, unresolvedNotes);
});
