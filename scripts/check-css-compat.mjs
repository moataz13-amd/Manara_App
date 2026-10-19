import { readdir, readFile } from "node:fs/promises";

const directory = new URL("../dist/assets/", import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith(".css"));
if (!files.length) throw new Error("No production CSS found.");
const css = (await Promise.all(files.map((file) => readFile(new URL(file, directory), "utf8")))).join("\n");
const queries = css.match(/@media[^{}]+/g) ?? [];
if (queries.some((query) => /(?:width|height)\s*[<>]|[<>]=?\s*(?:width|height)/.test(query))) {
  throw new Error("Production CSS contains media range syntax unsupported by older mobile browsers.");
}
if (!queries.some((query) => /max-width:\s*700px/.test(query))) {
  throw new Error("The mobile layout breakpoint is missing from production CSS.");
}
console.log("Production mobile CSS compatibility check passed.");
