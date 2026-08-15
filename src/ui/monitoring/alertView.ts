import type { AlertElements } from "../shell/appElements";

export function createAlertView(elements: AlertElements) {
  function flash() {
    elements.alertFlash.hidden = false;
    elements.alertFlash.classList.remove("alert--visible");
    requestAnimationFrame(() =>
      elements.alertFlash.classList.add("alert--visible"),
    );
    window.setTimeout(() => {
      elements.alertFlash.classList.remove("alert--visible");
      window.setTimeout(() => {
        elements.alertFlash.hidden = true;
      }, 300);
    }, 2200);
  }

  return { flash };
}

export type AlertView = ReturnType<typeof createAlertView>;
