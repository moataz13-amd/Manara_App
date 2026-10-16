export interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let pending: InstallEvent | null = null;
export function pendingInstall() { return pending; }
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pending = event as InstallEvent;
});
window.addEventListener("appinstalled", () => {
  pending = null;
  try { localStorage.setItem("manara-installed", "1"); } catch {}
});
