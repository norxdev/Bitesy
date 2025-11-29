const resultsEl = document.getElementById("results");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const aiBtn = document.getElementById("aiBtn");
const aiInput = document.getElementById("aiInput");
const categorySelect = document.getElementById("categorySelect");
const areaSelect = document.getElementById("areaSelect");
const ingredientSelect = document.getElementById("ingredientSelect");
const letterFiltersEl = document.getElementById("letterFilters");
const randomBtn = document.getElementById("randomBtn");
const proxy = "https://api.allorigins.win/raw?url=";

// Letters A-Z
for (let i = 65; i <= 90; i++) {
  const letter = String.fromCharCode(i);
  const btn = document.createElement("button");
  btn.textContent = letter;
  btn.addEventListener("click", () => searchByLetter(letter));
  letterFiltersEl.appendChild(btn);
}

// Load filters with proxy
async function loadFilters() {
  try {
    const [catRes, areaRes, ingRes] = await Promise.all([
      fetch(proxy + encodeURIComponent("https://www.themealdb.com/api/json/v1/1/categories.php")),
      fetch(proxy + encodeURIComponent("https://www.themealdb.com/api/json/v1/1/list.php?a=list")),
      fetch(proxy + encodeURIComponent("https://www.themealdb.com/api/json/v1/1/list.php?i=list"))
    ]);
    const catData = await catRes.json();
    const areaData = await areaRes.json();
    const ingData = await ingRes.json();

    categorySelect.innerHTML = "<option value=''>All Categories</option>" + catData.categories.map(c => `<option value="${c.strCategory}">${c.strCategory}</option>`).join("");
    areaSelect.innerHTML = "<option value=''>All Areas</option>" + areaData.meals.map(a => `<option value="${a.strArea}">${a.strArea}</option>`).join("");
    ingredientSelect.innerHTML = "<option value=''>All Ingredients</option>" + ingData.meals.map(i => `<option value="${i.strIngredient}">${i.strIngredient}</option>`).join("");

  } catch(err) {
    console.error(err);
    categorySelect.innerHTML = "<option>Error</option>";
    areaSelect.innerHTML = "<option>Error</option>";
    ingredientSelect.innerHTML = "<option>Error</option>";
  }
}

// Search events
searchBtn.addEventListener("click", () => {
  const q = searchInput.value.trim();
  if (q) searchMeals(q);
});

aiBtn.addEventListener("click", () => {
  const prompt = aiInput.value.toLowerCase();
  let keyword = "chicken";
  if (prompt.includes("beef")) keyword="beef";
  else if (prompt.includes("vegetarian") || prompt.includes("veggie")) keyword="vegetable";
  else if (prompt.includes("pasta")) keyword="pasta";
  else if (prompt.includes("seafood")) keyword="seafood";
  searchMeals(keyword);
});

// Random Meal
randomBtn.addEventListener("click", async () => {
  resultsEl.innerHTML = "Loading...";
  try {
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
    const data = await res.json();
    displayMeals(data.meals);
  } catch(err) {
    console.error(err);
    resultsEl.innerHTML = "Error loading meal.";
  }
});

// Dropdown filters
[categorySelect, areaSelect, ingredientSelect].forEach(sel => {
  sel.addEventListener("change", () => {
    filterMeals(categorySelect.value, areaSelect.value, ingredientSelect.value);
  });
});

// API calls
async function searchMeals(query) {
  resultsEl.innerHTML = "Loading...";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    const data = await res.json();
    displayMeals(data.meals);
  } catch(err) {
    console.error(err);
    resultsEl.innerHTML = "Error loading meals.";
  }
}

async function searchByLetter(letter) {
  resultsEl.innerHTML = "Loading...";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
    const data = await res.json();
    displayMeals(data.meals);
  } catch(err) {
    console.error(err);
    resultsEl.innerHTML = "Error loading meals.";
  }
}

async function filterMeals(category, area, ingredient) {
  resultsEl.innerHTML = "Loading...";
  try {
    let meals = null;
    if(ingredient) {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
      meals = (await res.json()).meals;
    } else if(category) {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
      meals = (await res.json()).meals;
    } else if(area) {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${area}`);
      meals = (await res.json()).meals;
    } else {
      meals = [];
    }
    displayMeals(meals);
  } catch(err) {
    console.error(err);
    resultsEl.innerHTML = "Error loading meals.";
  }
}

// Display meals
function displayMeals(meals) {
  if(!meals) { resultsEl.innerHTML="No results."; return; }
  resultsEl.innerHTML = meals.map(m => `
    <div class="card">
      <img src="${m.strMealThumb}" alt="${m.strMeal}" />
      <div class="card-body">
        <h3>${m.strMeal}</h3>
        <button onclick="openRecipe('${m.idMeal}')">View Recipe</button>
      </div>
    </div>
  `).join("");
}

// Modal
async function openRecipe(id) {
  const modal = document.getElementById("modal");
  const detail = document.getElementById("recipeDetail");
  modal.style.display = "flex";
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const data = await res.json();
    const meal = data.meals[0];
    let ingredientsHTML = "";
    for(let i=1;i<=20;i++){
      const ing = meal[`strIngredient${i}`];
      const meas = meal[`strMeasure${i}`];
      if(ing && ing.trim()) ingredientsHTML += `<li>${meas ? meas : ""} ${ing}</li>`;
    }
    detail.innerHTML = `
      <h2>${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="max-width:100%;border-radius:12px;margin-bottom:12px;">
      <h3>Ingredients:</h3><ul>${ingredientsHTML}</ul>
      <h3>Instructions:</h3><p class="instructions">${meal.strInstructions}</p>
      ${meal.strYoutube ? `<p><a href="${meal.strYoutube}" target="_blank">Watch on YouTube</a></p>` : ""}
    `;
  } catch(err) {
    console.error(err);
    detail.innerHTML = "Error loading recipe.";
  }
}

function closeModal() { document.getElementById("modal").style.display="none"; }

// Init
loadFilters();
searchMeals("chicken");
