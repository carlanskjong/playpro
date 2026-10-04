// FEATURE: Import ratings
// A Settings section that reads the files IMDb and Letterboxd let you
// download (your ratings, watchlist or watched list) and adds them to your
// Playpro list. The file is read on your device; only the matched titles
// are saved. The work itself lives in run.js and loads when you pick a file.
import { register } from "../../core/registry.js";
import { esc, icon, toast, errorMessage } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;
const ratings = link("https://www.imdb.com/list/ratings", "imdb.com/list/ratings");
const exportsPage = link("https://www.imdb.com/exports/", "imdb.com/exports");
const steps = (items) => `<ol class="guide-steps">${items.map((x) => `<li>${x}</li>`).join("")}</ol>`;

// Step-by-step: getting your ratings file out of IMDb. IMDb only offers the
// export on its desktop website, so on a phone you ask for the desktop version.
const computerGuide = () => steps([
  t("Go to {link} and sign in. (Want your watchlist instead? Click your name at the top right, then <strong>Your watchlist</strong>.)", { link: ratings }),
  t("Click <strong>Export</strong> at the top of the list. On some screens it's in the <strong>⋮</strong> menu."),
  t("IMDb gets the file ready, which takes about a minute. Open {link} and click <strong>Download</strong> next to it. Not there yet? Reload the page.", { link: exportsPage }),
  t("The file ends in <strong>.csv</strong> and lands in your <strong>Downloads</strong> folder."),
  t("Come back here, click <strong>Choose CSV file</strong> and pick it."),
]);
const phoneGuide = () => steps([
  t("The IMDb app can't do this, so use the browser: open {link} in <strong>Safari</strong> (iPhone) or <strong>Chrome</strong> (Android) and sign in.", { link: ratings }),
  t("Switch to the desktop version of the page. iPhone: tap <strong>aA</strong> in the address bar, then <strong>Request Desktop Website</strong>. Android: tap <strong>⋮</strong> and tick <strong>Desktop site</strong>."),
  t("Tap <strong>Export</strong> at the top of the list (or <strong>⋮</strong>, then <strong>Export</strong>)."),
  t("Wait about a minute, open {link} (still as the desktop version) and tap <strong>Download</strong>. If the phone asks, tap <strong>Download</strong> again.", { link: exportsPage }),
  t("iPhone: the file is in the <strong>Files</strong> app, under <strong>Downloads</strong>. Android: in <strong>Downloads</strong>."),
  t("Come back here, tap <strong>Choose CSV file</strong>, find the file in Downloads and pick it."),
]);

const section = {
  order: 20,
  render: () => `
    <h2>${esc(t("Bring your ratings"))}</h2>
    <p class="muted small">${t("Pick the file you download from IMDb or {lb} (Settings, then Import & Export) with your ratings or watchlist. Titles you already have in Playpro are kept as they are.", {
      lb: link("https://letterboxd.com/settings/data/", "Letterboxd"),
    })}</p>
    <details class="guide">
      <summary>${esc(t("How to get the file from IMDb on a computer"))}</summary>
      ${computerGuide()}
    </details>
    <details class="guide">
      <summary>${esc(t("How to get the file from IMDb on a phone"))}</summary>
      ${phoneGuide()}
    </details>
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
