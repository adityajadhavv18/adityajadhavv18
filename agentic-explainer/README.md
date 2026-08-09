# agentic-explainer

A short [Remotion](https://www.remotion.dev/) explainer video on how an agentic system
actually works: a goal comes in and gets decomposed, the reason → tool call → observe
loop runs until the job is done, and every run gets measured.

Rendered output is meant to be embedded in the "In Motion" section of the profile README
one directory up.

## Structure

| File | What it is |
| --- | --- |
| [src/index.ts](src/index.ts) | Entry point, registers the Remotion root |
| [src/Root.tsx](src/Root.tsx) | Declares the `AgenticLoop` composition (1280×720, 30fps, 690 frames) |
| [src/AgenticLoop.tsx](src/AgenticLoop.tsx) | Design tokens, building blocks, and all five scenes |
| [src/index.css](src/index.css) | Tailwind entry, imported by `Root.tsx` |

## Commands

```console
npm i              # install
npm run dev        # open Remotion Studio
npm run lint       # eslint + tsc
npm run build      # bundle to ./build
```

## Rendering

The profile README embeds the GIF (it autoplays inline on GitHub; an MP4 does not).

**Render the MP4 first, then convert.** Remotion's direct `--codec=gif` produces a
~37 MB file here: the animated backdrop changes every pixel every frame, so there
are no frame deltas to compress, and 256-colour dithering of smooth gradients adds
noise. Going through an ffmpeg palette instead gets the same 23s down to ~8.5 MB.

```console
npx remotion render AgenticLoop out/agentic-loop.mp4 --codec=h264

npx remotion ffmpeg -y -i out/agentic-loop.mp4 \
  -filter_complex "scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -r 12 -loop 0 out/agentic-loop.gif

cp out/agentic-loop.gif ../assets/agentic-loop.gif
```

Current output: 800×450, 12fps, ~8.5 MB. Keep it under ~10 MB so the profile loads
fast — if it grows, drop `scale` to 720, `max_colors` to 64, or `-r` to 10.

Two constraints worth knowing before you edit that command:

- **Do not use `--width`/`--height` on the Remotion render.** They override the
  canvas and force a re-layout at a different aspect ratio, which clips the intro
  title and rewraps the outro. Use `--scale` if you want a smaller render.
- **Remotion bundles a minimal ffmpeg** (`--disable-filters` plus a whitelist).
  `palettegen`, `paletteuse`, `scale`, and `split` are compiled in; `fps` is *not*,
  which is why the frame rate is set with `-r` rather than an `fps=` filter.

Single frame, to check one scene without rendering all 690:

```console
npx remotion still AgenticLoop out/frame.png --frame=340
```

## Scene timing

| Frames | Scene |
| --- | --- |
| 0–110 | Intro |
| 110–250 | Plan — goal decomposition |
| 250–420 | Loop — reason / tool call / observe |
| 420–570 | Eval — traces, success rate, cost |
| 570–690 | Outro |

If you change a scene's `durationInFrames`, update `durationInFrames` on the
`Composition` in [src/Root.tsx](src/Root.tsx) to match the new total.
