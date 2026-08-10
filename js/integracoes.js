document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copy);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      const previous = button.textContent;
      button.textContent = "Copiado ✓";
      window.setTimeout(() => { button.textContent = previous; }, 1800);
    } catch {
      button.textContent = "Selecione o código";
    }
  });
});

const advisorForm = document.querySelector("#advisor-form");
const advisorResult = document.querySelector("#advisor-result");
const advisorStatus = document.querySelector("#advisor-status");

advisorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const project = new FormData(advisorForm).get("project")?.toString().trim();
  if (!project || !advisorResult || !advisorStatus) return;
  advisorForm.querySelector("button").disabled = true;
  advisorStatus.textContent = "Analisando arquitetura…";
  try {
    const response = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível montar a stack.");
    advisorResult.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Stack recomendada";
    advisorResult.append(heading);
    const grid = document.createElement("div");
    grid.className = "advisor-grid";
    data.recommendations.forEach((item) => {
      const card = document.createElement("a");
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      const layer = document.createElement("span"); layer.textContent = item.layer;
      const name = document.createElement("b"); name.textContent = item.name;
      const reason = document.createElement("small"); reason.textContent = item.reason;
      card.append(layer, name, reason); grid.append(card);
    });
    advisorResult.append(grid);
    advisorResult.hidden = false;
    advisorStatus.textContent = `${data.recommendations.length} camadas · motor ${data.engine}`;
  } catch (error) {
    advisorStatus.textContent = error.message;
  } finally {
    advisorForm.querySelector("button").disabled = false;
  }
});
