const resultsEl = document.getElementById("results");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const aiBtn = document.getElementById("aiBtn");
const aiInput = document.getElementById("aiInput");

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (query) searchMeals(query);
});

aiBtn.addEventListener("click", () => {
  const lower = aiInput.value.toLowerCase();
  let keyword = "chicken";

  if (lower.includes("beef")) keyword = "beef";
  if (lower.includes("vegetarian")) keyword = "vegetable";
  if (lower.includes("pasta")) keyword = "pasta";

  searchMeals(keyword);
});

async function searchMeals(query) {
  resultsEl.innerHTML = "Loading...";
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
  const data = await res.json();

  if (!data.meals) {
    resultsEl.innerHTML = "No results.";
    return;
  }

  resultsEl.innerHTML = data.meals.map(meal => `
    <div class="card">
      <img src="${meal.strMealThumb}" />
      <div class="card-body">
        <h3>${meal.strMeal}</h3>
        <button onclick="openRecipe('${meal.idMeal}')">View</button>
      </div>
    </div>
  `).join("");
}

async function openRecipe(id) {
  const modal = document.getElementById("modal");
  const detail = document.getElementById("recipeDetail");
  modal.style.display = "flex";

  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await res.json();
  const meal = data.meals[0];

  let ingredients = "";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing) ingredients += `<li>${meas} ${ing}</li>`;
  }

  detail.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <ul>${ingredients}</ul>
    <div class="instructions">${meal.strInstructions}</div>
  `;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

searchMeals("chicken");
