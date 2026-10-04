import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./ui/App";
import { InstallPrompt } from "./pwa/InstallPrompt";
import { requestPersistentStorage } from "./pwa/persist";

registerSW({ immediate: true });
void requestPersistentStorage();

const installRoot = document.createElement("div");
installRoot.id = "install-root";
document.body.prepend(installRoot);
createRoot(installRoot).render(<InstallPrompt />);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
