// lib/workflow/bootstrap.server.ts
import "server-only";
import { registerDefaultWorkflowDefs } from "./registry.defaults";
registerDefaultWorkflowDefs();
