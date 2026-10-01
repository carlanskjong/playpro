// The page at #/hello. Loaded only when someone opens it (see lazy() in index.js).
import { esc, empty } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

export default async function helloView({ el }) {
  document.title = `${t("Hello")} · Playpro`;
  el.innerHTML = `
    <div class="page-head"><h1>${esc(t("Hello"))}</h1></div>
    ${empty(t("Nothing here yet"), esc(t("This page comes from the template feature.")), "", "popcorn")}`;
}
