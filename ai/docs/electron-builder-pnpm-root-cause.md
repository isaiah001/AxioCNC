# electron-builder + pnpm: missing dependencies root cause

## What’s going wrong

The packaged app hits `Cannot find module 'X'` for transitive deps (e.g. `find-up`, `p-try`, `ajv`) even though:

- They’re in `apps/desktop/node_modules` or workspace root `node_modules`
- They’re in `package.json` dependencies (or deps of deps)
- `pnpm install` / `pnpm deploy` resolve them correctly

So the problem is **not** pnpm’s dependency resolution. It’s **how electron-builder decides what to put into the asar**.

## Root cause

1. **electron-builder** uses a **node-modules collector** (e.g. `pnpmNodeModulesCollector`) to decide which production deps to pack.

2. The collector:
   - Runs `pnpm list --prod --json --depth Infinity` from the **app dir** (`apps/desktop`)
   - Walks the tree and, for each package, calls `getProductionDependencies` (reads `package.json`) and `locatePackageVersion` (resolves paths, including `.pnpm` store)

3. When that fails for a package (e.g. **ENOENT** reading `package.json` under `.pnpm`, or `locatePackageVersion` failing on symlinks / store paths), the collector:
   - Returns `{ dependencies: {}, optionalDependencies: {} }` for that package
   - **Drops that package and its subtree** from the “production deps” set

4. electron-builder then **only packs** that reduced set. So `find-up`, `p-try`, `ajv`, etc. are **omitted** even though they exist on disk.

So the bug is **in the collector’s robustness** with pnpm’s layout (hoisted or not), not in pnpm itself. There is **no config knob** that says “trust pnpm, use existing node_modules as-is.” The collector always runs and can produce an incomplete list.

## Relevant config / code

- **`beforeBuild`** (config): if it returns `false`, electron-builder sets `areNodeModulesHandledExternally = true` and **skips** both:
  - install/rebuild
  - **`computeNodeModuleFileSets`** (i.e. the collector)

  So when `beforeBuild` → `false`, **no** production-deps discovery; you fully control what gets packed via `files`.

- **`files`**: globs / `FileSet` relative to the **app dir**. If we handle node_modules externally, we must include them explicitly (e.g. `node_modules/**/*`).

- **Rebuild**: Our **desktop** app has no native deps. We only rebuild for the **bundle** (server) in `package-desktop.js`. So skipping install/rebuild for the app is fine.

## Proper fix: use pnpm deps, skip collector

1. **Build the app from a deployment**, not from `apps/desktop`:
   - `pnpm deploy --prod --filter @axiocnc/desktop <staging>` creates a **self‑contained** layout with full production `node_modules` (no workspace hoisting).

2. **Use that dir as the app dir** for electron-builder:
   - e.g. deploy to `build/electron-app`, copy `apps/desktop/dist` (and anything else the app needs) into it, then run electron-builder with `projectDir = build/electron-app`.

3. **`beforeBuild` → `false`** in electron-builder config:
   - Skip install/rebuild and **skip the collector**.
   - electron-builder packs only what’s in `files` (e.g. `dist/**/*`, `package.json`, `node_modules/**/*`).

4. **Rebuild** only where needed:
   - Keep running `@electron/rebuild` in `package-desktop.js` on the **bundle** (server) for native modules. The **app** (asar) doesn’t need a rebuild step.

Result: we **use pnpm’s dependency resolution** (via deploy), **don’t use** electron-builder’s collector, and **only rebuild** native deps that are already in the bundle.

## Workaround we used (stop‑gap)

Explicit `FileSet` entries for known-missing packages (`find-up`, `locate-path`, `p-locate`, etc.) so they’re forced into the asar. This is fragile: any new transitive dep can cause another “Cannot find module” and has to be added manually.

## References

- `app-builder-lib`: `node-module-collector/pnpmNodeModulesCollector.js`, `platformPackager.js` (`areNodeModulesHandledExternally`), `packager.js` (`beforeBuild` → `_nodeModulesHandledExternally`).
- electron-builder config: `beforeBuild`, `files`, `directories.app`.
