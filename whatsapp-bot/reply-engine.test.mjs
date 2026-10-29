import assert from "node:assert/strict";
import { classifyMessage, buildReply } from "./reply-engine.mjs";
assert.equal(classifyMessage("Сколько стоит рекламный ролик?"), "client");
assert.equal(classifyMessage("Ищу работу, есть резюме"), "worker");
assert.equal(classifyMessage("СТОП"), "opt_out");
assert.equal(classifyMessage(""), "empty");
assert.equal(buildReply("Привет").needsHuman, true);
assert.equal(buildReply("Нужен бот").category, "client");
console.log("6 reply-engine assertions passed");
