# MY RUNNER 3D — Godot edition

Native 3D game project built with Godot 4.x and GDScript. The previous React/Three.js version remains as a browser prototype/reference; Godot is the main game direction.

## Run

1. Install Godot 4.3 or newer.
2. Open \`godot/project.godot\`.
3. Press F6/F5 or Play.
4. Desktop: arrows/A-D to change lane, W/Up/Space to jump, S/Down to slide, Esc to pause.
5. Mobile: swipe or use the on-screen controls.

## Current vertical slice

- Three-lane movement, chase camera, track and procedural city blockout.
- Articulated placeholder player built from separate body, head, arms, legs, backpack and shoe meshes.
- Procedural AnimationPlayer clips: run cycle, jump pose, slide pose and hit reaction.
- Jump, slide, gravity, lane smoothing and collision.
- Random barriers, overhead arches and train obstacles.
- Coin lines, shield and magnet pickups; magnet attracts nearby coins.
- Increasing speed, spawn pressure, score, coins and local best score.
- Pause, restart, keyboard and touch/swipe input.

## Character pipeline

The current character is an articulated placeholder assembled from primitive meshes. It is not a final realistic human model and does not yet use a humanoid skeleton or motion-capture animation. The next art milestone is to replace it with a licensed/original GLB/GLTF character containing a humanoid armature and clips for idle, run, jump, slide and hit.

### GLB acceptance checklist

- Commercial/redistribution license and attribution recorded.
- Humanoid skeleton with consistent bone naming.
- Correct forward axis and realistic scale (about 1.7–1.9 m).
- Separate idle, run, jump, slide and hit animations.
- Materials/textures included; optimized polygon count for mobile.
- Root motion handled consistently; the runner controller owns forward movement.

## Structure

- \`scenes/main.tscn\`: main entry scene.
- \`scripts/main.gd\`: world, spawning, score, pickups and HUD.
- \`scripts/runner.gd\`: player controller, procedural character and animation clips.

## Production milestones

1. Replace the blockout with licensed modular environment and detailed train/track assets.
2. Import a production humanoid GLB and retarget animations.
3. Add object pooling and fair, deterministic spawn patterns.
4. Add missions, progression, cosmetics, settings and audio.
5. Add VFX, accessibility, localization and save migration.
6. Profile and export Windows/Linux/Android; validate touch and low-end devices.
7. Add automated gameplay tests and release pipeline.
