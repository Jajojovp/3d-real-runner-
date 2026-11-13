---
name: my-runner-rea
description: Inspect, reverse-engineer, improve and verify MY RUNNER 3D with REA and Playwright MCP.
---

# MY RUNNER 3D — REA + Playwright workflow

Use this skill when changing gameplay, visuals, controls, assets, character generation, performance or browser behavior in this repository.

## Project facts

- The application is React, TypeScript, Vite, Three.js and React Three Fiber.
- The browser game is an original three-lane endless runner.
- The character generator is a server-side Replicate integration. Never expose REPLICATE_API_TOKEN in browser code or a VITE_ variable.
- The current image-to-3D provider is the official Replicate model `tencent/hunyuan-3d-3.1`. Its generated GLB is a single-image reconstruction; do not describe it as a measured scan or assume it is rigged.
- Automated browser tests live in `tests/runner.spec.ts`.

## Required investigation loop

1. Read the current implementation and identify the exact gameplay or visual behavior being changed. Do not replace existing systems without checking their dependencies.
2. Start the Vite app with `npm run dev`. Start the API separately with `npm run server` when testing character generation.
3. Use Playwright MCP for active browser interaction: open the local app, start a run, exercise lane changes, jump, slide, mobile controls, restart, and character upload UI. Capture screenshots at desktop and mobile sizes.
4. Use REA browser observation for evidence rather than relying only on visual memory:
   - Connect REA to the user-owned Chrome-family browser through CDP on an explicit debugging port.
   - Use `list_browser_targets` to select the local MY RUNNER page.
   - Use `inspect_web_page` to capture DOM, accessibility, scripts, resources, console/network metadata and a screenshot when needed.
   - Use `analyze_web_bundle` when a behavior depends on bundled JavaScript or route/module relationships.
   - Use `capture_web_screenshot` and `compare_web_screenshots` for repeatable visual checks.
   - Use `capture_browser_scenario` for declared browser actions and `compare_web_captures` when comparing before/after behavior.
5. Keep REA's Evidence provenance, limitations and unknowns with any conclusion. A partial capture is not proof that a feature is absent.
6. Implement the smallest coherent change. Keep gameplay logic separate from presentation where practical.
7. Run `npm run build` and `npm run test:e2e`. Fix failures before considering the work complete.
8. Repeat the same Playwright actions and REA observations after the change. Compare desktop and mobile evidence.
9. Report what was actually tested, what passed, what failed and what still needs a real Replicate token or generated asset.

## REA setup

Use the official project and instructions: https://github.com/morluto/rea

REA currently requires a supported Node.js release listed by its official README. Install and register it with the documented setup flow:

```bash
npx rea-agents@latest setup
```

Review setup changes, approve the registration, and restart the MCP client. For browser observation, use the official REA website-observation guide:
https://github.com/morluto/rea/blob/main/docs/guides/web/browser-observation.md

REA's browser observation is passive CDP inspection; Playwright MCP performs active navigation and interaction. Do not claim that one tool performed the other's role.

## Safety and quality rules

- Never commit API keys, private photos, generated personal models or .env files.
- Ask for permission before sending a personal photo to a third-party generation provider. The UI must explain that photo submission sends it to Replicate.
- Validate upload type and size on the server as well as in the browser.
- Do not claim realistic facial identity preservation from one image unless the generated result has been inspected and verified.
- A static GLB is not automatically a rigged character. Use a compatible skeleton and verified animation clips before claiming full-body run/jump/slide animation.
- Preserve the game's three-lane controls, score, coins, collision behavior and mobile layout when refactoring.
