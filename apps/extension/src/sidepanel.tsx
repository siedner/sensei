import { Workbench } from "@sensei/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

async function captureSelection(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab is available.");
  if (!tab.url?.startsWith("https://www.notion.so/") && !tab.url?.startsWith("https://notion.so/")) {
    throw new Error("Open a Notion page, select text, then try again.");
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => window.getSelection()?.toString() ?? ""
  });
  return results[0]?.result ?? "";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Workbench
      apiBase="http://localhost:3131"
      surface="extension"
      captureSelection={captureSelection}
    />
  </StrictMode>
);
