// FEATURE: Import ratings
// A Settings section that reads the files IMDb and Letterboxd let you
// download (your ratings, watchlist or watched list) and adds them to your
// Playpro list. The file is read on your device; only the matched titles
// are saved. The work itself lives in run.js and loads when you pick a file.
import { register } from "../../core/registry.js";
import { esc, icon, toast, errorMessage } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

const section = {
  order: 20,
  render: () => `
    <h2>${esc(t("Bring your ratings"))}</h2>
    <p class="muted small">${t("Download your ratings or watchlist from {imdb} (Your ratings, then Export) or {lb} (Settings, then Import & Export), then pick the CSV file here. Titles you already have in Playpro are kept as they are.", {
      imdb: '<a href="https://www.imdb.com/list/ratings" target="_blank" rel="noopener">IMDb</a>',
      lb: '<a href="https://letterboxd.com/settings/data/" target="_blank" rel="noopener">Letterboxd</a>',
    })}</p>
    <div class="button-row">
      <label class="btn" for="import-file">${icon.upload}${esc(t("Choose CSV file"))}</label>
      <input class="visually-hidden" type="file" id="import-file" accept=".csv,text/csv">
    </div>
    <div class="import-progress" hidden>
      <progress max="1" value="0"></progress>
      <p class="muted small" aria-live="polite"></p>
    </div>`,
  wire: (box) => {
    const input = box.querySelector("#import-file");
    const progress = box.querySelector(".import-progress");
    const bar = progress.querySelector("progress");
    const status = progress.querySelector("p");
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      input.disabled = true;
      progress.hidden = false;
      try {
        const { importFile } = await import("./run.js");
        const result = await importFile(file, (done, total) => {
          bar.max = total;
          bar.value = done;
          status.textContent = t("Matching titles: {done} of {total}", { done, total });
        });
        status.textContent = t("Added {added}. Already in Playpro: {skipped}. Not found: {missing}.", result);
        toast(t("Import finished"), "good");
      } catch (err) {
        status.textContent = errorMessage(err);
        toast(errorMessage(err), "bad");
      } finally {
        input.disabled = false;
        input.value = "";
      }
    });
  },
};

register({
  id: "importer",
  settingsSections: [section],
});
