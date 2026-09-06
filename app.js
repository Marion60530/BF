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

// --- Estimation calories / macros (avant vs après), à partir de la table
// NUTRITION. Toute ligne sans correspondance ou sans quantité exploitable
// est exclue du total plutôt que d'inventer une valeur, et listée en note.

function findNutrition(name) {
  const normalizedName = normalize(name);
  for (const entry of NUTRITION) {
    for (const keyword of entry.match) {
      if (normalizedName.includes(normalize(keyword))) {
        return entry;
      }
    }
  }
  return null;
}

function gramsForIngredient(qty, unit, entry) {
  if (qty === null) return null;
  if (unit === null) {
    return entry.gramsPerUnit ? qty * entry.gramsPerUnit : null;
  }
  const grams = gramsOf(qty, unit);
  if (grams !== null) return grams;
  const ml = mlOf(qty, unit);
  if (ml !== null) return ml * (entry.densityGPerMl || 1);
  return null;
}

function macrosFor(grams, entry) {
  const factor = grams / 100;
  return {
    kcal: entry.kcal100 * factor,
    protein: entry.protein100 * factor,
    carbs: entry.carbs100 * factor,
    fat: entry.fat100 * factor
  };
}

function parseQtyText(text) {
  const match = text.match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/);
  if (!match) return { qty: null, unit: null };
  return { qty: parseFloat(match[1]), unit: match[2] ? match[2].trim() : null };
}

function addMacros(totals, m) {
  totals.kcal += m.kcal;
  totals.protein += m.protein;
  totals.carbs += m.carbs;
  totals.fat += m.fat;
}

function computeBeforeTotals(results) {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const excluded = [];
  results.forEach((result) => {
    const entry = findNutrition(result.ingredient.name);
    const grams = entry ? gramsForIngredient(result.ingredient.qty, result.ingredient.unit, entry) : null;
    if (!entry || grams === null) {
      excluded.push(result.ingredient.raw);
      return;
    }
    addMacros(totals, macrosFor(grams, entry));
  });
  return { totals, excluded };
}

function computeAfterTotals(results) {
  const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const excluded = [];
  results.forEach((result) => {
    let name, qty, unit;

    if (result.liquidAdjustedQtyText) {
      name = result.substitution ? result.substitution.substitute : result.ingredient.name;
      ({ qty, unit } = parseQtyText(result.liquidAdjustedQtyText));
    } else if (result.substitution) {
      name = result.substitution.substitute;
      ({ qty, unit } = result.adjustedQtyText ? parseQtyText(result.adjustedQtyText) : { qty: null, unit: null });
    } else {
      name = result.ingredient.name;
      qty = result.ingredient.qty;
      unit = result.ingredient.unit;
    }

    const entry = findNutrition(name);
    const grams = entry ? gramsForIngredient(qty, unit, entry) : null;
    if (!entry || grams === null) {
      excluded.push(finalIngredientLine(result));
      return;
    }
    addMacros(totals, macrosFor(grams, entry));
  });
  return { totals, excluded };
}

function fillMacroRows(bodyEl, before, after, divisor) {
  bodyEl.innerHTML = "";
  const rows = [
    ["Calories", `${Math.round(before.totals.kcal / divisor)} kcal`, `${Math.round(after.totals.kcal / divisor)} kcal`],
    ["Protéines", `${(before.totals.protein / divisor).toFixed(1)} g`, `${(after.totals.protein / divisor).toFixed(1)} g`],
    ["Glucides", `${(before.totals.carbs / divisor).toFixed(1)} g`, `${(after.totals.carbs / divisor).toFixed(1)} g`],
    ["Lipides", `${(before.totals.fat / divisor).toFixed(1)} g`, `${(after.totals.fat / divisor).toFixed(1)} g`]
  ];

  rows.forEach(([label, beforeVal, afterVal]) => {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    tdLabel.textContent = label;
    const tdBefore = document.createElement("td");
    tdBefore.textContent = beforeVal;
    const tdAfter = document.createElement("td");
    tdAfter.textContent = afterVal;
    tr.append(tdLabel, tdBefore, tdAfter);
    bodyEl.appendChild(tr);
  });
}

function renderMacros(before, after, servings) {
  const section = document.getElementById("macros");
  const body = document.getElementById("macros-body");
  const notes = document.getElementById("macros-notes");
  const perServingLabel = document.getElementById("macros-per-serving-label");
  const perServingTable = document.getElementById("macros-per-serving-table");
  const perServingBody = document.getElementById("macros-per-serving-body");
  notes.innerHTML = "";
  notes.hidden = true;

  fillMacroRows(body, before, after, 1);

  if (servings && servings > 1) {
    perServingLabel.textContent = `Par part (recette divisée en ${servings}) :`;
    perServingLabel.hidden = false;
    fillMacroRows(perServingBody, before, after, servings);
    perServingTable.hidden = false;
  } else {
    perServingLabel.hidden = true;
    perServingTable.hidden = true;
  }

  const excludedAll = [...new Set([...before.excluded, ...after.excluded])];
  if (excludedAll.length > 0) {
    notes.hidden = false;
    const p = document.createElement("p");
    p.textContent = `Non comptabilisé (ingrédient non répertorié ou quantité imprécise) : ${excludedAll.join(", ")}.`;
    notes.appendChild(p);
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

  const macrosSection = document.getElementById("macros");
  if (results.length === 0) {
    macrosSection.hidden = true;
  } else {
    const servingsValue = parseInt(document.getElementById("servings-input").value, 10);
    const servings = Number.isInteger(servingsValue) && servingsValue > 0 ? servingsValue : null;
    renderMacros(computeBeforeTotals(results), computeAfterTotals(results), servings);
  }
});
