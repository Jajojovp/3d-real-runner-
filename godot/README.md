# MY RUNNER 3D — Godot edition

This is the native game project. The previous React/Three.js build remains in the repository as a browser prototype/reference; new gameplay development should happen here.

## Engine

- Godot 4.x (GDScript, native 3D scene system).
- Compatibility renderer for broad desktop/mobile support.
- No paid plugins required for the core loop.

## Run

1. Install Godot 4.3 or newer.
2. Open this folder (`godot/project.godot`) in Godot.
3. Press F6/F5 or the Play button.
4. Desktop: arrows/A-D to change lane, W/Up/Space to jump, S/Down to slide, Esc to pause.
5. Mobile: swipe left/right/up/down or use the on-screen controls.

## Current playable vertical slice

- Three-lane runner movement and camera.
- Jump, slide, gravity and collision.
- Procedural city/track blockout.
- Randomized barriers, overhead arches and train obstacles.
- Coin lines, shield and magnet pickups.
- Increasing speed and spawn pressure.
- Score, coins, best score saved locally.
- Pause, restart and touch/swipe input.

## Project status and honest limitations

This is a playable systems prototype/blockout, not yet a final realistic art build. The player is a placeholder mesh. There are no production character rigs, authored animation clips, final train/environment models, sound design, missions, shop, cosmetics, cloud saves or platform export presets yet. Those are tracked in the root roadmap.

## Asset pipeline

Use original assets or assets with explicit compatible licenses. Prefer glTF 2.0 (.glb) for characters and props. For a character, require a humanoid skeleton, clear animation naming (run, jump, slide, hit, idle), and retarget/test the animations in Godot before replacing the placeholder. Do not assume an image-to-3D service produces a game-ready rig.

## Structure

- `scenes/main.tscn`: main entry scene.
- `scripts/main.gd`: world setup, spawning, score, pickups and HUD.
- `scripts/runner.gd`: player controller and movement state.

## Next milestones

1. Replace procedural blockout with licensed modular environment and train assets.
2. Add rigged character + animation state machine.
3. Build object pooling and deterministic spawn patterns.
4. Add missions, progression, cosmetics and settings.
5. Add audio, VFX, accessibility and localization.
6. Profile and export Windows/Linux/Android; validate touch and low-end devices.
7. Add automated gameplay tests and release pipeline.
