export type Theme = "light" | "dark";

export const getTheme = (): Theme => {
  const saved = localStorage.getItem("theme") as Theme | null;
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const applyTheme = (t: Theme) => {
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem("theme", t);
};
