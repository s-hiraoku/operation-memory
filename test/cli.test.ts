import { execFile } from "node:child_process";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();
const cliPath = path.join(repoRoot, "dist", "cli.js");
const recipePath = path.join(repoRoot, "examples", "recipes", "eks-rollout-check.yml");

let cwd: string | undefined;

async function runOpmem(args: string[]) {
  if (!cwd) throw new Error("CLI test cwd was not initialized");
  return execFileAsync(process.execPath, [cliPath, ...args], { cwd });
}

function parseJson(stdout: string): unknown {
  return JSON.parse(stdout);
}

beforeAll(async () => {
  await execFileAsync("npm", ["run", "build"], { cwd: repoRoot });
});

afterEach(async () => {
  if (cwd) {
    await rm(cwd, { recursive: true, force: true });
    cwd = undefined;
  }
});

describe("opmem CLI", () => {
  it("supports init, add, list, search, show, and validate with JSON output", async () => {
    cwd = await mkdtemp(path.join(tmpdir(), "opmem-cli-"));

    const init = parseJson((await runOpmem(["init", "--json"])).stdout);
    expect(init).toMatchObject({ ok: true });
    expect(init).toHaveProperty("path", path.join(await realpath(cwd), ".operation-memory", "recipes"));

    const added = parseJson((await runOpmem(["add", recipePath, "--json"])).stdout);
    expect(added).toMatchObject({ id: "eks-rollout-check" });

    const list = parseJson((await runOpmem(["list", "--json"])).stdout);
    expect(list).toEqual([expect.objectContaining({ id: "eks-rollout-check" })]);

    const search = parseJson((await runOpmem(["search", "kubectl", "--json"])).stdout);
    expect(search).toEqual([expect.objectContaining({ recipe: expect.objectContaining({ id: "eks-rollout-check" }) })]);

    const shown = parseJson((await runOpmem(["show", "eks-rollout-check", "--json"])).stdout);
    expect(shown).toMatchObject({ id: "eks-rollout-check", scope: { tool: "kubectl" } });

    const validation = parseJson((await runOpmem(["validate", recipePath, "--json"])).stdout);
    expect(validation).toMatchObject({
      ok: true,
      results: [expect.objectContaining({ valid: true, id: "eks-rollout-check" })],
    });
  });

  it("validates stored recipe files and reports invalid files without aborting", async () => {
    cwd = await mkdtemp(path.join(tmpdir(), "opmem-cli-"));

    await runOpmem(["init"]);
    await runOpmem(["add", recipePath]);
    await writeFile(
      path.join(cwd, ".operation-memory", "recipes", "broken.yml"),
      "id: broken\nname: Broken\n",
      "utf8",
    );

    const validation = await runOpmem(["validate", "--json"]).catch((error: unknown) => error);

    expect(validation).toMatchObject({ code: 1 });
    expect(parseJson(validation.stdout)).toMatchObject({
      ok: false,
      results: [
        expect.objectContaining({ valid: false, file: expect.stringContaining("broken.yml") }),
        expect.objectContaining({ valid: true, id: "eks-rollout-check" }),
      ],
    });
  });
});
