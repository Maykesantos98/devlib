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
