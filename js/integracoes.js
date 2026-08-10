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

function advisorBlueprint(data) {
  if (!Array.isArray(data.architecture) || !data.architecture.length) return null;
  const section = document.createElement("section");
  section.className = "advisor-blueprint";
  const title = document.createElement("h4");
  title.textContent = "Blueprint por camada";
  const grid = document.createElement("div");
  data.architecture.forEach((item) => {
    const card = document.createElement("article");
    const layer = document.createElement("span"); layer.textContent = item.layer;
    const decision = document.createElement("b"); decision.textContent = item.decision;
    const responsibility = document.createElement("small"); responsibility.textContent = item.responsibility;
    card.append(layer, decision, responsibility); grid.append(card);
  });
  section.append(title, grid);
  return section;
}

function advisorAlternatives(alternatives) {
  if (!alternatives || typeof alternatives !== "object" || !Object.keys(alternatives).length) return null;
  const section = document.createElement("section");
  section.className = "advisor-alternatives";
  const title = document.createElement("h4"); title.textContent = "Alternativas verificadas";
  const list = document.createElement("div");
  Object.entries(alternatives).forEach(([layerName, items]) => {
    items.forEach((item) => {
      const link = document.createElement("a");
      link.href = item.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.textContent = `${layerName}: ${item.name} ↗`;
      list.append(link);
    });
  });
  section.append(title, list);
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
      const layer = document.createElement("span"); layer.textContent = `${item.layer} · ${item.adoption || "principal"}`;
      const name = document.createElement("b"); name.textContent = item.name;
      const role = document.createElement("em"); role.textContent = item.role || "Recurso recomendado";
      const reason = document.createElement("small"); reason.textContent = item.reason;
      const repository = document.createElement("strong"); repository.textContent = "Abrir repositório ↗";
      card.append(layer, name, role, reason, repository); grid.append(card);
    });
    advisorResult.append(grid);

    const blueprint = advisorBlueprint(data);
    if (blueprint) advisorResult.append(blueprint);

    const steps = advisorSection(
      "advisor-steps",
      "Ordem de implementação",
      Array.isArray(data.implementation_steps) ? data.implementation_steps.map((item) => `${item.order}. ${item.layer}: ${item.action}`) : [],
    );
    if (steps) advisorResult.append(steps);

    const alternatives = advisorAlternatives(data.alternatives);
    if (alternatives) advisorResult.append(alternatives);

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
