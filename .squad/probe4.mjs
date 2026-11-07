import { readdirSync } from "node:fs";
const names = readdirSync("node_modules").filter((n) => /dom|jsdom|linkedom|happy|test-render|testing-library/i.test(n));
console.log(names.join("\n"));
