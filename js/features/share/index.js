// FEATURE: Share
// A "Share" button on title pages. On phones it opens the normal share sheet
// (Messages, Messenger…); elsewhere it copies the link. The link opens the
// title in Playpro for anyone with an account.
import { register } from "../../core/registry.js";
import { esc, icon, toast } from "../../lib/ui.js";
import { t } from "../../lib/i18n.js";

const shareButton = {
  order: 80,
  render: () => `<button class="btn btn-ghost" data-share>${icon.share}${esc(t("Share"))}</button>`,
  wire: (box, { item }) => {
    box.querySelector("[data-share]").addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#/${item.type}/${item.id}`;
      const text = item.year ? `${item.title} (${item.year})` : item.title;
      try {
        if (navigator.share) return await navigator.share({ title: text, text: t("Shall we watch {title}?", { title: text }), url });
        await navigator.clipboard.writeText(url);
        toast(t("Link copied"), "good");
      } catch (err) {
        if (err?.name !== "AbortError") toast(t("Couldn't share. Copy the address from the address bar instead."), "bad");
      }
    });
  },
};

register({
  id: "share",
  titleActions: [shareButton],
});
