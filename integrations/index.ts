import analyticsIntegration from "./AnalyticsIntegration";
import gmailIntegration from "./GmailIntegration";
import googleSheetsIntegration from "./GoogleSheetsIntegration";
import slackIntegration from "./SlackIntegration";
import bigcapitalIntegration from "./BigcapitalIntegration";

export const modules = {
  "./AnalyticsIntegration.ts": { integration: analyticsIntegration },
  "./GmailIntegration.ts": { integration: gmailIntegration },
  "./GoogleSheetsIntegration.ts": { integration: googleSheetsIntegration },
  "./SlackIntegration.ts": { integration: slackIntegration },
  "./BigcapitalIntegration.ts": { integration: bigcapitalIntegration },
};

export default modules;
