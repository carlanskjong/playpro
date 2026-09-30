// FEATURE: Profile picture
//  - upload a photo in Settings; it is cropped to a square and shrunk to
//    about 15 KB in your browser before it is saved
//  - shown instead of the coloured letter everywhere in the app
// The picture is saved with your profile, so "Delete my account" removes it
// and "Download my data" includes it.
import { register } from "../../core/registry.js";
import { state } from "../../lib/state.js";
import { sb, updateProfile } from "../../lib/db.js";
import { avatar, refreshAvatars, toast, errorMessage } from "../../lib/ui.js";

const SIZE = 256;

// Everyone's pictures, loaded once after sign-in (a group of friends is small).
async function loadPictures() {
  const { data, error } = await sb.from("profiles").select("username, avatar").not("avatar", "is", null);
  if (error) throw error;
  state.avatars.clear();
  for (const p of data) state.avatars.set(p.username, p.avatar);
}

// Crop to the middle square and shrink, so the saved picture stays small.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Couldn't read that picture. Try a JPG or PNG."));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    canvas.getContext("2d").drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    let result = canvas.toDataURL("image/jpeg", 0.85);
    if (result.length > 90000) result = canvas.toDataURL("image/jpeg", 0.6);
    return result;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function save(picture) {
  const name = state.profile.username;
  await updateProfile({ avatar: picture });
  if (picture) state.avatars.set(name, picture);
  else state.avatars.delete(name);
  refreshAvatars(name);
  window.dispatchEvent(new Event("playpro:profile-changed"));
}

const pictureSettings = {
  order: 5,
  render: () => {
    const name = state.profile?.username || "?";
    const has = state.avatars.has(name);
    return `
      <h2>Profile picture</h2>
      <p class="muted small">Other members see it next to your name. It's cropped to a square and made small before it's saved.</p>
      <div class="picture-row">
        ${avatar(name, "avatar-xl")}
        <div class="button-row">
          <label class="btn" for="picture-file">${has ? "Change picture" : "Choose picture"}</label>
          <input class="visually-hidden" type="file" id="picture-file" accept="image/*">
          ${has ? `<button class="btn btn-ghost" type="button" id="picture-remove">Remove</button>` : ""}
        </div>
      </div>`;
  },
  wire: function wire(box) {
    const again = () => { box.innerHTML = pictureSettings.render(); wire(box); };
    box.querySelector("#picture-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) return toast("That file isn't a picture", "bad");
      if (file.size > 25 * 1024 * 1024) return toast("That picture is too big (over 25 MB)", "bad");
      try {
        await save(await shrink(file));
        toast("Profile picture saved", "good");
        again();
      } catch (err) {
        toast(errorMessage(err), "bad");
      }
    });
    box.querySelector("#picture-remove")?.addEventListener("click", async () => {
      try {
        await save(null);
        toast("Profile picture removed");
        again();
      } catch (err) {
        toast(errorMessage(err), "bad");
      }
    });
  },
};

register({
  id: "profilepicture",
  onLogin: [loadPictures],
  settingsSections: [pictureSettings],
});
