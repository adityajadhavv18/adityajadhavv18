import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* ------------------------------------------------------------------ */
/*  Design tokens: graphite + steel blue, matching the profile theme.  */
/* ------------------------------------------------------------------ */
const C = {
  bg: "#0D1117",
  panel: "#161B22",
  panelDeep: "#11151C",
  panelEdge: "#30363D",
  accent: "#1F6FEB",
  accentDeep: "#1552B8",
  accentSoft: "#58A6FF",
  violet: "#7B2FF7",
  cyan: "#00E5FF",
  text: "#E6EDF3",
  muted: "#8B949E",
  mono: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
};

/* Deterministic pseudo-random. Remotion renders frames independently, so
   Math.random() here would flicker — every frame must derive the same
   value from the same seed. */
const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

/* Always-positive modulo, for wrapping drifting particles. */
const wrap = (v: number, max: number) => ((v % max) + max) % max;

/* ------------------------------------------------------------------ */
/*  Backdrop: renders once behind every scene, so the atmosphere       */
/*  keeps flowing across scene cuts instead of resetting.              */
/* ------------------------------------------------------------------ */

/* Slow-drifting colour fields. These do the heavy lifting — they keep
   the frame from ever being flat black. */
const Aurora: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const blobs = [
    { c: C.accent, x: 26 + Math.sin(t * 0.21) * 9, y: 32 + Math.cos(t * 0.17) * 8, r: 58, a: "5E" },
    { c: C.violet, x: 78 + Math.cos(t * 0.15) * 10, y: 68 + Math.sin(t * 0.23) * 9, r: 52, a: "40" },
    { c: C.cyan, x: 58 + Math.sin(t * 0.12 + 2) * 14, y: 16 + Math.cos(t * 0.19 + 1) * 7, r: 44, a: "24" },
  ];

  return (
    <AbsoluteFill>
      {blobs.map((b, i) => (
        <AbsoluteFill
          key={i}
          style={{
            background: `radial-gradient(circle at ${b.x}% ${b.y}%, ${b.c}${b.a}, transparent ${b.r}%)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* Faint technical grid, parallaxing slowly. Masked so it fades out
   before it reaches the text. */
const Grid: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = frame * 0.22;
  const mask = "radial-gradient(ellipse 72% 66% at 50% 50%, #000 25%, transparent 82%)";

  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${C.accentSoft}14 1px, transparent 1px), linear-gradient(90deg, ${C.accentSoft}14 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
        backgroundPosition: `${shift}px ${shift}px`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

/* Small drifting monospace glyphs — motion in the periphery without
   pulling attention off the diagram. */
const GLYPHS = ["{", "}", "<", ">", "/", "→", "λ", "0", "1", "[", "]", "•", "≈", "·", "▢"];

const Glyphs: React.FC<{ count?: number }> = ({ count = 34 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const span = height + 160;

  return (
    <AbsoluteFill>
      {new Array(count).fill(0).map((_, i) => {
        const speed = 0.18 + rnd(i + 57) * 0.42;
        const twinkle = 0.5 + 0.5 * Math.sin(frame / (14 + rnd(i + 307) * 22) + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: rnd(i + 1) * width,
              top: wrap(rnd(i + 131) * span - frame * speed, span) - 80,
              fontFamily: C.mono,
              fontSize: 11 + rnd(i + 211) * 11,
              color: rnd(i + 401) > 0.72 ? C.accentSoft : C.muted,
              opacity: 0.05 + twinkle * 0.13,
            }}
          >
            {GLYPHS[i % GLYPHS.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Backdrop: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Aurora />
    <Grid />
    <Glyphs />
    {/* Vignette last: pulls the edges down so the centre copy stays crisp. */}
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 76% 72% at 50% 50%, transparent 38%, ${C.bg}E6 100%)`,
      }}
    />
  </AbsoluteFill>
);

/* Hairline at the very bottom tracking progress through the whole video. */
const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div
        style={{
          height: 2,
          width: `${(frame / (durationInFrames - 1)) * 100}%`,
          background: `linear-gradient(90deg, ${C.violet}, ${C.accent}, ${C.cyan})`,
          opacity: 0.55,
        }}
      />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Small building blocks                                             */
/* ------------------------------------------------------------------ */

const Node: React.FC<{
  label: string;
  sub?: string;
  delay: number;
  accent?: boolean;
  width?: number;
}> = ({ label, sub, delay, accent = false, width = 260 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.6 },
  });

  /* Slow breathing glow so settled cards never look like dead rectangles. */
  const breathe = 0.5 + 0.5 * Math.sin((frame - delay) / 26);

  return (
    <div
      style={{
        width,
        padding: "20px 24px",
        borderRadius: 14,
        background: accent
          ? `linear-gradient(135deg, ${C.accent}, ${C.accentDeep})`
          : `linear-gradient(160deg, ${C.panel}, ${C.panelDeep})`,
        border: `1px solid ${accent ? C.accentSoft : C.panelEdge}`,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px) scale(${interpolate(
          enter,
          [0, 1],
          [0.94, 1]
        )})`,
        boxShadow: accent
          ? `0 0 ${34 + breathe * 22}px ${C.accent}${breathe > 0.5 ? "4D" : "33"}, inset 0 1px 0 #ffffff1F`
          : `0 8px 26px #00000059, inset 0 1px 0 #ffffff0A`,
      }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 22,
          fontWeight: 600,
          color: accent ? "#fff" : C.text,
          letterSpacing: -0.3,
        }}
      >
        {label}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 14,
            color: accent ? "#dbeafe" : C.muted,
            marginTop: 6,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

const Arrow: React.FC<{ delay: number; length?: number; label?: string }> = ({
  delay,
  length = 70,
  label,
}) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame - delay, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* Once the line is drawn, send a packet down it on a loop. */
  const since = frame - delay - 14;
  const travel = wrap(since / 34, 1);
  const packet = since > 0 ? Math.sin(travel * Math.PI) : 0;

  return (
    <div style={{ position: "relative", width: length, height: 40 }}>
      <div
        style={{
          position: "absolute",
          top: 19,
          left: 0,
          height: 2,
          width: length * grow,
          background: `linear-gradient(90deg, ${C.accent}, ${C.accentSoft})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 17,
          left: length * travel - 3,
          width: 6,
          height: 6,
          borderRadius: 3,
          background: C.cyan,
          boxShadow: `0 0 10px ${C.cyan}`,
          opacity: packet * 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 13,
          left: length * grow - 8,
          opacity: grow,
          color: C.accentSoft,
          fontSize: 16,
          lineHeight: "16px",
        }}
      >
        ▶
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: 0,
            width: length,
            textAlign: "center",
            fontFamily: C.mono,
            fontSize: 12,
            color: C.muted,
            opacity: grow,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

const SceneTitle: React.FC<{ kicker: string; title: string }> = ({
  kicker,
  title,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 16], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div style={{ opacity: o, marginBottom: 46, textAlign: "center" }}>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 14,
          letterSpacing: 3,
          color: C.accentSoft,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 40,
          fontWeight: 700,
          color: C.text,
          letterSpacing: -1,
        }}
      >
        {title}
      </div>
    </div>
  );
};

const Row: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Scenes                                                            */
/* ------------------------------------------------------------------ */

const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });
  const sub = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 64,
          fontWeight: 700,
          color: C.text,
          letterSpacing: -2,
          opacity: s,
          transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
        }}
      >
        How an Agentic System Works
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 22,
          color: C.muted,
          marginTop: 18,
          opacity: sub,
        }}
      >
        a model call is not an agent. this is.
      </div>
      <div
        style={{
          width: interpolate(frame, [24, 60], [0, 420], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 3,
          background: C.accent,
          marginTop: 34,
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};

const ScenePlan: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      padding: 60,
    }}
  >
    <SceneTitle kicker="step 01" title="A goal comes in, and gets decomposed" />
    <Row>
      <Node label="User Goal" sub="high level, ambiguous" delay={0} accent width={240} />
      <Arrow delay={16} />
      <Node label="Planner" sub="break into subgoals" delay={26} width={250} />
    </Row>
    <div style={{ height: 34 }} />
    <Row>
      <Node label="subgoal 01" delay={44} width={190} />
      <div style={{ width: 18 }} />
      <Node label="subgoal 02" delay={52} width={190} />
      <div style={{ width: 18 }} />
      <Node label="subgoal 03" delay={60} width={190} />
    </Row>
  </AbsoluteFill>
);

const SceneLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = Math.sin(frame / 9) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      <SceneTitle kicker="step 02" title="Then it loops until the job is done" />
      <Row>
        <Node label="Reason" sub="what next?" delay={0} width={200} />
        <Arrow delay={12} label="select" />
        <Node label="Tool Call" sub="validated schema" delay={22} width={215} />
        <Arrow delay={34} label="execute" />
        <Node label="Observe" sub="verify + ground" delay={44} width={205} />
      </Row>

      <div
        style={{
          marginTop: 30,
          fontFamily: C.mono,
          fontSize: 16,
          color: C.accentSoft,
          opacity: interpolate(frame, [58, 74], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        ↺ failed or incomplete? replan and go again
      </div>

      <div style={{ height: 40 }} />
      <Row>
        <Node
          label="Memory"
          sub="working · episodic · semantic"
          delay={78}
          width={320}
        />
        <div style={{ width: 24 }} />
        <Node label="Guardrails" sub="scoped permissions" delay={88} width={280} />
      </Row>

      <div
        style={{
          marginTop: 28,
          width: 10,
          height: 10,
          borderRadius: 5,
          background: C.accent,
          opacity: 0.35 + pulse * 0.65,
        }}
      />
    </AbsoluteFill>
  );
};

const SceneEval: React.FC = () => {
  const frame = useCurrentFrame();
  const bar = interpolate(frame, [30, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
      }}
    >
      <SceneTitle
        kicker="step 03"
        title="And every run is measured, not assumed"
      />
      <Row>
        <Node label="Traces" sub="every step, replayable" delay={0} width={250} />
        <div style={{ width: 20 }} />
        <Node label="Success Rate" sub="on held-out tasks" delay={10} width={250} />
        <div style={{ width: 20 }} />
        <Node label="Cost + Latency" sub="per task, tracked" delay={20} width={250} />
      </Row>

      <div style={{ height: 50 }} />
      <div style={{ width: 640 }}>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 14,
            color: C.muted,
            marginBottom: 10,
          }}
        >
          task success rate
        </div>
        <div
          style={{
            height: 14,
            background: C.panel,
            border: `1px solid ${C.panelEdge}`,
            borderRadius: 7,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${bar * 87}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.violet}, ${C.accent} 55%, ${C.cyan})`,
              boxShadow: `0 0 16px ${C.accent}80`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: C.mono,
            fontSize: 13,
            color: C.accentSoft,
            marginTop: 10,
          }}
        >
          measured, versioned, gated in CI
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 200 } });

  return (
    <AbsoluteFill
      style={{ justifyContent: "center", alignItems: "center" }}
    >
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 44,
          fontWeight: 700,
          color: C.text,
          opacity: s,
          textAlign: "center",
          lineHeight: 1.35,
          letterSpacing: -1,
        }}
      >
        Anyone can demo an agent that works once.
        <br />
        <span style={{ color: C.accentSoft }}>
          I build the ones you can measure.
        </span>
      </div>
      <div
        style={{
          fontFamily: C.mono,
          fontSize: 20,
          color: C.muted,
          marginTop: 32,
          opacity: interpolate(frame, [24, 46], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Aditya · Agentic AI Engineer
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/*  Master composition                                                */
/* ------------------------------------------------------------------ */

export const AgenticLoop: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    {/* Sits outside the Sequences so the atmosphere runs continuously
        across scene cuts rather than restarting on each one. */}
    <Backdrop />
    <Sequence durationInFrames={110}>
      <SceneIntro />
    </Sequence>
    <Sequence from={110} durationInFrames={140}>
      <ScenePlan />
    </Sequence>
    <Sequence from={250} durationInFrames={170}>
      <SceneLoop />
    </Sequence>
    <Sequence from={420} durationInFrames={150}>
      <SceneEval />
    </Sequence>
    <Sequence from={570} durationInFrames={120}>
      <SceneOutro />
    </Sequence>
    <Progress />
  </AbsoluteFill>
);