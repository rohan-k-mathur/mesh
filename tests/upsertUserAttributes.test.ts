import fs from "fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const file = fs.readFileSync("lib/actions/userattributes.actions.ts", "utf8");

// Simple check that the update functions are called in upsertUserAttributes

test("upsertUserAttributes triggers friend suggestions", () => {
  assert.ok(file.includes("updateUserEmbedding"));
  assert.ok(file.includes("generateFriendSuggestions"));
});
