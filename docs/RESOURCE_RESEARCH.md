# Research plan — open-source references

Reviewed on 2026-11-13. The links below are research indexes/reference material, not blanket permission to copy assets or code.

## How each source is used

| Source | Useful contribution | How it applies to MY RUNNER 3D |
|---|---|---|
| [bobeff/open-source-games](https://github.com/bobeff/open-source-games) | Catalog of open-source games/remakes across genres and engines. It lists Godot examples such as Liblast and a Godot port of Unknown Horizons. | Study complete game structure, scope, production patterns and how open projects organize releases. It is not a runner asset pack. |
| [StefanoCecere/awesome-opensource-unity](https://github.com/StefanoCecere/awesome-opensource-unity) | Curated Unity games and packages; notably lists [InfiniteRunner3D](https://github.com/dgkanatsios/InfiniteRunner3D) as a 3D infinite runner. | Use the runner entry as a design/feature reference only. Unity C# packages are not drop-in Godot addons; port only ideas after checking the original repository license and implementation. |
| [insthync/awesome-unity3d](https://github.com/insthync/awesome-unity3d) | Categorized index of Unity repositories for animation, character controllers, camera, input, procedural generation, pooling, shaders, audio and UI. | Use as a checklist of systems to implement or find Godot-native equivalents for. Unity-specific code requires a deliberate port and license review. |
| [dawdle-deer/awesome-learn-gamedev](https://github.com/dawdle-deer/awesome-learn-gamedev) | Learning index covering gameplay programming, graphics, rigging, VFX, 3D art, animation, level design, UI/UX, audio and production. | Use to guide technical-art, animation, UX and production learning/review, rather than treating it as a code library. |
| [Godot Engine](https://godotengine.org/) | Open-source engine with native 3D, scene/node architecture, scripting, animation and export workflows. | Main engine for the native game project. |

## Selection rules

1. Prefer Godot-native assets/addons or portable formats (glTF 2.0, PNG, WAV/OGG).
2. Record the source URL, author, exact license, attribution requirements and modifications for every imported asset.
3. Do not import a Unity package into Godot expecting compatibility.
4. Avoid assets with unclear/no redistribution rights.
5. Keep the core game playable without cloud services or paid APIs.

## Technical design decisions

- Engine: Godot 4.x, GDScript.
- Core loop: player remains near the origin; track pieces/hazards/collectibles travel toward the player. This simplifies endless streaming.
- Input: keyboard/controller-ready actions plus touch swipes and on-screen buttons.
- Art: graybox/procedural blockout first; replace with rigged GLB characters and modular environment after gameplay is stable.
- Performance: pool frequently spawned objects before mobile optimization; avoid expensive real-time effects on low-end devices.
