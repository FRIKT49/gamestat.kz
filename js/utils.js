function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function debounce(fn, delayMs) {
  let timerId = null;
  return function debounced(...args) {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(function () {
      timerId = null;
      fn.apply(null, args);
    }, delayMs);
  };
}

function formatDateIso(isoOrDate) {
  if (!isoOrDate) {
    return "—";
  }
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) {
    return String(isoOrDate);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function truncateText(text, maxLen) {
  const s = text == null ? "" : String(text);
  if (s.length <= maxLen) {
    return s;
  }
  return s.slice(0, maxLen - 1).trim() + "…";
}

/**
 * Technical Component Initializers
 */

function initTechSelects(onUpdate) {
  document.querySelectorAll(".tech-select").forEach(select => {
      const trigger = select.querySelector(".tech-select-trigger");
      const hiddenInput = select.querySelector("input[type='hidden']");
      
      if (!trigger || !hiddenInput) return;

      trigger.addEventListener("click", () => {
          select.classList.toggle("is-open");
      });

      select.querySelectorAll(".tech-select-item").forEach(item => {
          item.addEventListener("click", () => {
              const val = item.getAttribute("data-value");
              const text = item.textContent;
              
              hiddenInput.value = val;
              trigger.textContent = text;
              
              select.querySelectorAll(".tech-select-item").forEach(i => i.classList.remove("is-selected"));
              item.classList.add("is-selected");
              
              select.classList.remove("is-open");
              if (onUpdate) onUpdate(val);
          });
      });
  });

  // Global click to close dropdowns
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".tech-select")) {
        document.querySelectorAll(".tech-select").forEach(s => s.classList.remove("is-open"));
    }
  });
}
