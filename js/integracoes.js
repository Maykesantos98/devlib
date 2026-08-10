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

function advisorSection(className, title, items) {
  if (!Array.isArray(items) || !items.length) return null;
  const section = document.createElement("section");
  section.className = className;
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("ul");
  items.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  });
  section.append(heading, list);
  return section;
}

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
    const summary = document.createElement("p");
    summary.className = "advisor-summary";
    summary.textContent = data.summary || "Seleção inicial fundamentada no catálogo DEVLIB.";
    advisorResult.append(heading, summary);

    if (Array.isArray(data.requirements) && data.requirements.length) {
      const requirements = document.createElement("section");
      requirements.className = "advisor-requirements";
      const requirementsTitle = document.createElement("h4");
      requirementsTitle.textContent = "Requisitos detectados";
      const requirementList = document.createElement("div");
      data.requirements.forEach((requirement) => {
        const badge = document.createElement("span");
        badge.dataset.coverage = requirement.coverage;
        badge.textContent = requirement.label;
        requirementList.append(badge);
      });
      requirements.append(requirementsTitle, requirementList);
      advisorResult.append(requirements);
    }

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

    const insights = document.createElement("div");
    insights.className = "advisor-insights";
    const tradeoffs = advisorSection("advisor-tradeoffs", "Trade-offs", data.tradeoffs);
    const risks = advisorSection("advisor-risks", "Riscos e lacunas", data.risks);
    if (tradeoffs) insights.append(tradeoffs);
    if (risks) insights.append(risks);
    if (insights.childElementCount) advisorResult.append(insights);

    const questions = advisorSection("advisor-questions", "Antes de implementar", data.next_questions);
    if (questions) advisorResult.append(questions);
    advisorResult.hidden = false;
    advisorStatus.textContent = `${data.recommendations.length} escolhas · análise ${data.engine}`;
  } catch (error) {
    advisorStatus.textContent = error.message;
  } finally {
    advisorForm.querySelector("button").disabled = false;
  }
});
