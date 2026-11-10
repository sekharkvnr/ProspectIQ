// The toolbar action is the explicit user gesture that opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(error => console.error("ProspectIQ side panel setup failed:", error));
