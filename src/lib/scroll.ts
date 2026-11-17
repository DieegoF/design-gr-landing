import { scrollSuave } from "./smooth";

export function scrollToSection(id: string) {
  const element = document.getElementById(id);
  if (element) scrollSuave(element);
}
