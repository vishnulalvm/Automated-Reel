// Claude4All house style, matched to the S1 · BAS · 01 reference film:
// off-white dotted paper, soft drifting circles, a header with the episode code,
// top-aligned content, ink-outlined cards with hard shadows, tilted pills,
// headlines that appear word by word, and a logo end card.
//
// Everything that may change (brand name, logo, colours, sections, intro and outro
// wording) comes from reel.config.json at the project root, not from this file.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSpaceGrotesk } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import cfg from "../../reel.config.json";
import { ASSETS } from "./assets.gen";

const display = loadSpaceGrotesk("normal", { weights: ["500", "700"], subsets: ["latin"] });
const body = loadInter("normal", { weights: ["400", "600", "700"], subsets: ["latin"] });

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const CONFIG = cfg;
export const COLORS = { ...cfg.brand.colors, white: "#FFFFFF" };

/** "#E8674A" + 0.15 -> "rgba(232,103,74,0.15)" */
const rgba = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
};

export const FONTS = { display: display.fontFamily, body: body.fontFamily } as const;

/** Content lives between the header and the Instagram caption area. */
export const LAYOUT = { headerY: 262, contentTop: 366, contentBottom: 1500, side: 60 } as const;

const LINE = 4;
const SHADOW = 12;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const toFrames = (seconds: number) => Math.round(seconds * FPS);

/**
 * Turn durations.json (seconds per scene, gap already included) into frame
 * offsets. Rounds cumulative time, so the picture never drifts from the voice.
 */
export const timeline = (durations: Record<string, number>) => {
  let t = 0;
  const scenes = Object.entries(durations).map(([id, seconds]) => {
    const from = toFrames(t);
    t += seconds;
    return { id, from, durationInFrames: toFrames(t) - from };
  });
  return { scenes, totalFrames: toFrames(t) };
};

// ───────────────────────── motion ─────────────────────────

type EnterKind = "rise" | "slide" | "pop" | "fade";

/**
 * Entrance for any block. `at` is seconds from the start of the scene.
 * rise: up from below · slide: in from the left, tilted · pop: scale up (pills) · fade.
 */
export const Enter: React.FC<{
  at?: number;
  kind?: EnterKind;
  tilt?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at = 0, kind = "rise", tilt = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 15, stiffness: 150 } });
  const from = {
    rise: { x: 0, y: 56, r: tilt, s: 1 },
    slide: { x: -460, y: 40, r: tilt - 14, s: 1 },
    pop: { x: 0, y: 0, r: tilt - 9, s: 0.5 },
    fade: { x: 0, y: 0, r: tilt, s: 1 },
  }[kind];
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 0.25], [0, 1], CLAMP),
        translate: `${interpolate(p, [0, 1], [from.x, 0])}px ${interpolate(p, [0, 1], [from.y, 0])}px`,
        rotate: `${interpolate(p, [0, 1], [from.r, tilt])}deg`,
        scale: interpolate(p, [0, 1], [from.s, 1]),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Reveals a line word by word, like the reference film. `at` is when the first
 * word appears and `over` is how many seconds the line takes, so it can follow
 * the voice. Longer words take proportionally longer.
 */
export const Words: React.FC<{ text: string; at?: number; over?: number }> = ({ text, at = 0, over }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  const span = over ?? words.length * 0.22;
  let seen = 0;
  return (
    <>
      {words.map((w, i) => {
        const start = Math.round((at + (span * seen) / total) * fps);
        seen += w.length + 1;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                display: "inline-block",
                opacity: interpolate(frame, [start, start + 3], [0, 1], CLAMP),
                translate: `0px ${interpolate(frame, [start, start + 5], [14, 0], CLAMP)}px`,
              }}
            >
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

// ───────────────────────── text ─────────────────────────

type TextProps = { children?: React.ReactNode; text?: string; at?: number; over?: number; color?: string; size?: number };

const line = (p: TextProps) => (p.text !== undefined ? <Words text={p.text} at={p.at} over={p.over} /> : p.children);

/** Scene headline. Pass `text` for the word-by-word reveal. Sizes: 84 default, 150 for the hook. */
export const Headline: React.FC<TextProps> = (p) => (
  <div
    style={{
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: p.size ?? 84,
      lineHeight: 1.04,
      letterSpacing: (p.size ?? 84) > 120 ? -4 : -1.5,
      color: p.color ?? COLORS.ink,
      padding: "0 18px",
    }}
  >
    {line(p)}
  </div>
);

/** The one huge number or year of a scene, e.g. "2023", "200K". */
export const Big: React.FC<TextProps> = (p) => (
  <div
    style={{
      fontFamily: FONTS.display,
      fontWeight: 700,
      fontSize: p.size ?? 250,
      lineHeight: 0.9,
      letterSpacing: -8,
      color: p.color ?? COLORS.ink,
      padding: "0 18px",
      marginBottom: -8,
    }}
  >
    {line(p)}
  </div>
);

export const Body: React.FC<TextProps> = (p) => (
  <div
    style={{
      fontFamily: FONTS.body,
      fontWeight: 700,
      fontSize: p.size ?? 46,
      lineHeight: 1.16,
      letterSpacing: -0.5,
      color: p.color ?? COLORS.ink,
    }}
  >
    {line(p)}
  </div>
);

/** Small grey line under a card: sources and caveats. */
export const Note: React.FC<{ children: React.ReactNode; at?: number }> = ({ children, at = 0 }) => (
  <Enter at={at} kind="fade">
    <div style={{ fontFamily: FONTS.body, fontSize: 27, lineHeight: 1.3, color: COLORS.gray, padding: "0 8px" }}>
      {children}
    </div>
  </Enter>
);

// ───────────────────────── blocks ─────────────────────────

type Tone = "paper" | "coral" | "green" | "ink" | "solid";

const TONES: Record<Tone, { bg: string; color: string }> = {
  paper: { bg: COLORS.paper, color: COLORS.ink },
  coral: { bg: COLORS.coralTint, color: COLORS.ink },
  green: { bg: COLORS.greenTint, color: COLORS.ink },
  ink: { bg: COLORS.ink, color: COLORS.paper },
  solid: { bg: COLORS.coral, color: COLORS.ink },
};

const outlined = (shadow: number): React.CSSProperties => ({
  border: `${LINE}px solid ${COLORS.ink}`,
  boxShadow: `${shadow}px ${shadow}px 0 ${COLORS.ink}`,
});

/** Ink-outlined card with a hard shadow. Full width of the content column. */
export const Card: React.FC<{
  children: React.ReactNode;
  at?: number;
  tone?: Tone;
  enter?: EnterKind;
  style?: React.CSSProperties;
}> = ({ children, at = 0, tone = "paper", enter = "rise", style }) => (
  <Enter at={at} kind={enter}>
    <div
      style={{
        ...outlined(SHADOW),
        backgroundColor: TONES[tone].bg,
        color: TONES[tone].color,
        borderRadius: 26,
        padding: "34px 40px",
        marginRight: SHADOW,
        ...style,
      }}
    >
      {children}
    </div>
  </Enter>
);

/** Tilted label. Coral for the hook and takeaways, green or paper for calmer tags. */
export const Pill: React.FC<{
  children: React.ReactNode;
  at?: number;
  tone?: Tone;
  tilt?: number;
  align?: "start" | "end" | "center";
  size?: number;
}> = ({ children, at = 0, tone = "solid", tilt = -4, align = "start", size = 36 }) => (
  <Enter
    at={at}
    kind="pop"
    tilt={tilt}
    style={{ alignSelf: align === "center" ? "center" : `flex-${align}`, margin: "0 8px" }}
  >
    <div
      style={{
        ...outlined(7),
        backgroundColor: TONES[tone].bg,
        color: TONES[tone].color,
        borderRadius: 999,
        padding: "10px 30px",
        fontFamily: FONTS.body,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: -0.3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  </Enter>
);

/** Card with one big number and a bold line under it. */
export const Stat: React.FC<{ value: string; label: string; at?: number; tone?: Tone; size?: number }> = ({
  value,
  label,
  at = 0,
  tone = "coral",
  size = 210,
}) => (
  <Card at={at} tone={tone}>
    <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: size, lineHeight: 0.95, letterSpacing: -7 }}>
      {value}
    </div>
    <div style={{ marginTop: 18 }}>
      <Body>{label}</Body>
    </div>
  </Card>
);

/** Card with an icon on the left and a bold line of text. */
export const Fact: React.FC<{ icon: IconName; children: React.ReactNode; at?: number; tone?: Tone }> = ({
  icon,
  children,
  at = 0,
  tone = "paper",
}) => (
  <Card at={at} tone={tone} style={{ display: "flex", alignItems: "center", gap: 34 }}>
    <Icon name={icon} size={150} />
    <Body>{children}</Body>
  </Card>
);

/** Card with a round photo, a name and a role. `img` is a path inside video/public. */
export const Person: React.FC<{ img: string; name: string; role: string; at?: number }> = ({ img, name, role, at = 0 }) => (
  <Card at={at} style={{ display: "flex", alignItems: "center", gap: 34, padding: "24px 30px" }}>
    <Img
      src={staticFile(img)}
      style={{ ...outlined(6), width: 220, height: 220, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
    <div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 54, letterSpacing: -1 }}>{name}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 36, color: COLORS.gray, marginTop: 6, lineHeight: 1.2 }}>{role}</div>
    </div>
  </Card>
);

/** Ink circle with a coral character, e.g. the "?" pair in a hook. */
export const Badge: React.FC<{ children: React.ReactNode; at?: number; size?: number; style?: React.CSSProperties }> = ({
  children,
  at = 0,
  size = 360,
  style,
}) => (
  <Enter at={at} kind="pop" style={style}>
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: COLORS.ink,
        color: COLORS.coral,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: size * 0.5,
      }}
    >
      {children}
    </div>
  </Enter>
);

/** Lays children out in a row (pills, icon chips, badges). */
export const Row: React.FC<{ children: React.ReactNode; gap?: number; justify?: React.CSSProperties["justifyContent"] }> = ({
  children,
  gap = 28,
  justify = "flex-start",
}) => <div style={{ display: "flex", alignItems: "center", gap, justifyContent: justify, padding: "0 8px" }}>{children}</div>;

/** App-window mock-up whose text lines type themselves in. */
export const Window: React.FC<{ at?: number; lines?: number[] }> = ({ at = 0, lines = [68, 76, 48] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = Math.round((at + 0.5) * fps);
  return (
    <Card at={at} enter="slide" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 14, padding: "26px 34px", borderBottom: `${LINE}px solid ${COLORS.ink}` }}>
        {[COLORS.coral, COLORS.coralTint, COLORS.greenTint].map((c) => (
          <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: c }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 30, padding: "50px 40px 60px" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `${LINE}px solid ${COLORS.ink}`,
            backgroundColor: COLORS.coral,
            boxShadow: `inset 0 0 0 9px ${COLORS.coral}, inset 0 0 0 30px ${COLORS.ink}`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26, paddingTop: 16 }}>
          {lines.map((w, i) => (
            <div
              key={i}
              style={{
                height: 16,
                borderRadius: 8,
                backgroundColor: "#3A3C42",
                width: `${interpolate(frame, [t0 + i * 12, t0 + i * 12 + 14], [0, w], CLAMP)}%`,
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

/** Bar chart in a card. `kind`: tint (earlier value), solid (the main value), dashed (target or estimate). */
export const Bars: React.FC<{
  bars: { label: string; value: number; display: string; kind?: "tint" | "solid" | "dashed" }[];
  at?: number;
  height?: number;
}> = ({ bars, at = 0, height = 400 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <Card at={at} style={{ padding: "50px 56px 40px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          height: height + 70,
          borderBottom: `${LINE}px solid ${COLORS.ink}`,
        }}
      >
        {bars.map((b, i) => {
          const start = Math.round((at + 0.5 + i * 0.45) * fps);
          const g = spring({ frame: frame - start, fps, config: { damping: 16, stiffness: 120 } });
          const kind = b.kind ?? "solid";
          return (
            <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 210 }}>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 700,
                  fontSize: 52,
                  marginBottom: 10,
                  opacity: interpolate(g, [0.5, 1], [0, 1], CLAMP),
                }}
              >
                {b.display}
              </div>
              <div
                style={{
                  width: "100%",
                  height: Math.max(0, g) * Math.max(14, (b.value / max) * height),
                  border: `${LINE}px ${kind === "dashed" ? "dashed" : "solid"} ${COLORS.ink}`,
                  borderBottom: "none",
                  borderRadius: "8px 8px 0 0",
                  background:
                    kind === "solid"
                      ? COLORS.coral
                      : kind === "tint"
                        ? COLORS.coralTint
                        : `repeating-linear-gradient(135deg, ${COLORS.coralTint} 0 10px, ${COLORS.paper} 10px 20px)`,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 18 }}>
        {bars.map((b) => (
          <div key={b.label} style={{ width: 210, textAlign: "center", fontFamily: FONTS.body, fontWeight: 700, fontSize: 30 }}>
            {b.label}
          </div>
        ))}
      </div>
    </Card>
  );
};

/** A prompt being typed into a card, with a caret. `over` is the typing time in seconds. */
export const Prompt: React.FC<{ text: string; at?: number; over?: number; label?: string }> = ({
  text,
  at = 0,
  over = 1.5,
  label = "Prompt",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = (at + 0.35) * fps;
  const shown = Math.round(interpolate(frame, [t0, t0 + over * fps], [0, text.length], CLAMP));
  return (
    <Card at={at} enter="slide" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "22px 34px",
          borderBottom: `${LINE}px solid ${COLORS.ink}`,
          fontFamily: FONTS.body,
          fontWeight: 700,
          fontSize: 28,
          color: COLORS.gray,
        }}
      >
        {[COLORS.coral, COLORS.coralTint, COLORS.greenTint].map((c) => (
          <div key={c} style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: c }} />
        ))}
        <span style={{ marginLeft: 12 }}>{label}</span>
      </div>
      <div
        style={{
          padding: "40px 40px 48px",
          fontFamily: FONTS.body,
          fontWeight: 600,
          fontSize: 50,
          lineHeight: 1.22,
          letterSpacing: -0.5,
          minHeight: 150,
        }}
      >
        {/* the full text reserves the final height, so the card does not grow while typing */}
        <span>{text.slice(0, shown)}</span>
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 50,
            marginLeft: 4,
            verticalAlign: "-8px",
            backgroundColor: COLORS.coral,
            opacity: shown < text.length || Math.floor(frame / 8) % 2 ? 1 : 0,
          }}
        />
        <span style={{ visibility: "hidden" }}>{text.slice(shown)}</span>
      </div>
    </Card>
  );
};

/** One numbered point in a list; stack several, each with a later `at`. */
export const Step: React.FC<{ n: number | string; children: React.ReactNode; at?: number; tone?: Tone }> = ({
  n,
  children,
  at = 0,
  tone = "paper",
}) => (
  <Card at={at} tone={tone} style={{ display: "flex", alignItems: "center", gap: 30, padding: "24px 34px" }}>
    <div
      style={{
        ...outlined(6),
        width: 96,
        height: 96,
        borderRadius: "50%",
        backgroundColor: COLORS.coral,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.display,
        fontWeight: 700,
        fontSize: 54,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
    <Body size={50}>{children}</Body>
  </Card>
);

// ───────────────────────── icons ─────────────────────────

const ICONS = {
  code: <path d="M9 7 4 12l5 5M15 7l5 5-5 5M13.5 5l-3 14" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="10" r="1.8" fill={COLORS.coral} />
      <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3.5h9l3.5 3.5v13.5H6z" />
      <path d="M9 9h6M9 12.5h6M9 16h3" />
      <path d="m13.5 17 1.5 1.5 3-3.5" stroke={COLORS.coral} />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <circle cx="10.5" cy="10.5" r="2.2" fill={COLORS.coral} stroke="none" />
      <path d="m15 15 5.5 5.5" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <rect x="5.5" y="13" width="3.4" height="7.5" fill={COLORS.coral} />
      <rect x="10.4" y="9" width="3.4" height="11.5" />
      <rect x="15.3" y="4.5" width="3.4" height="16" />
    </>
  ),
  table: (
    <>
      <rect x="3.5" y="6.5" width="15" height="14" rx="2" />
      <path d="M3.5 11.5h15M3.5 16h15M8.5 6.5v14M13.5 6.5v14" />
      <path d="M8 3.5h10a2.5 2.5 0 0 1 2.5 2.5v9" stroke={COLORS.coral} />
    </>
  ),
  atom: (
    <>
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
      <circle cx="12" cy="12" r="2.1" fill={COLORS.coral} />
    </>
  ),
  book: (
    <>
      <path d="M12 7C10 5.5 7 5 3.5 5.5V19c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5.5C17 5 14 5.5 12 7z" />
      <path d="M12 7v13.5" />
      <path d="M14.5 10.5c1.2-.5 2.4-.7 3.6-.7M14.5 14c1.2-.5 2.4-.7 3.6-.7" stroke={COLORS.coral} />
    </>
  ),
  memory: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill={COLORS.coral} />
      <path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v11h-9L6.5 20v-3.5H4z" />
      <path d="M8 9.5h8M8 12.5h5" stroke={COLORS.coral} />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" stroke={COLORS.coral} />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12.3 2.8 2.8L16.2 9.5" stroke={COLORS.coral} />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

/** Line icon in ink with a coral accent. */
export const Icon: React.FC<{ name: IconName; size?: number }> = ({ name, size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={COLORS.ink}
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    {ICONS[name]}
  </svg>
);

/** Icon inside an outlined circle; put several in a <Row>. */
export const IconChip: React.FC<{ name: IconName; at?: number; size?: number }> = ({ name, at = 0, size = 132 }) => (
  <Enter at={at} kind="pop">
    <div
      style={{
        ...outlined(7),
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: COLORS.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} size={size * 0.52} />
    </div>
  </Enter>
);

// ───────────────────────── frame ─────────────────────────

// Measured from the reference film: 5 px dots on a 48 px grid, first dot at (34, 24).
const Dots: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(circle, ${rgba(COLORS.ink, 0.135)} 2.9px, transparent 3.5px)`,
      backgroundSize: "48px 48px",
      backgroundPosition: "10.5px 0.5px",
    }}
  />
);

/**
 * Soft circles behind the content, as in the reference film: two coral and two
 * green, 300-520 px wide, see-through so they blend where they overlap, in a
 * new arrangement for each scene, drifting slowly.
 */
const Blobs: React.FC<{ seed: string }> = ({ seed }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {[0, 1, 2, 3].map((i) => {
        const r = (k: string) => random(`${seed}-${i}-${k}`);
        const size = 300 + r("s") * 220;
        const x = 80 + r("x") * (WIDTH - 160) + Math.sin(frame / 60 + i * 2) * 22;
        const y = 520 + r("y") * 1250 + Math.cos(frame / 75 + i) * 28;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              backgroundColor: i % 2 ? rgba(COLORS.green, 0.088) : rgba(COLORS.coral, 0.145),
              scale: interpolate(frame, [0, 12], [0.9, 1], CLAMP),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.26,
      backgroundColor: COLORS.coral,
      border: `${Math.max(3, size * 0.028)}px solid ${COLORS.ink}`,
      boxShadow: size > 80 ? `${size * 0.07}px ${size * 0.07}px 0 ${COLORS.ink}` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {size > 80 ? (
      <div
        style={{
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: "50%",
          border: `${size * 0.045}px solid ${COLORS.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ width: size * 0.12, height: size * 0.12, borderRadius: "50%", backgroundColor: COLORS.ink }} />
      </div>
    ) : null}
  </div>
);

/** The logo file named in reel.config.json if it is in the Assets folder, otherwise the drawn mark. */
const Logo: React.FC<{ size: number }> = ({ size }) =>
  ASSETS.includes(cfg.brand.logo) ? (
    <Img src={staticFile(`assets/${cfg.brand.logo}`)} style={{ width: size, height: size, objectFit: "contain" }} />
  ) : (
    <LogoMark size={size} />
  );

/** Channel name on the left, episode code pill on the right. On every scene but the end card. */
const Header: React.FC<{ code: string }> = ({ code }) => (
  <div
    style={{
      position: "absolute",
      top: LAYOUT.headerY,
      left: LAYOUT.side,
      right: LAYOUT.side + 76,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Logo size={36} />
      <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 34, color: COLORS.ink }}>{cfg.brand.name}</div>
    </div>
    <div
      style={{
        ...outlined(5),
        borderRadius: 999,
        padding: "6px 22px",
        backgroundColor: COLORS.paper,
        fontFamily: FONTS.body,
        fontWeight: 700,
        fontSize: 27,
        letterSpacing: 0.5,
        color: COLORS.ink,
      }}
    >
      {code}
    </div>
  </div>
);

/** Top-aligned content column; fades out over the last frames of the scene. */
const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        padding: `${LAYOUT.contentTop}px ${LAYOUT.side}px ${HEIGHT - LAYOUT.contentBottom}px`,
        display: "flex",
        flexDirection: "column",
        gap: 34,
        opacity: interpolate(frame, [durationInFrames - 5, durationInFrames - 1], [1, 0], CLAMP),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ───────────────────────── series ─────────────────────────

const section = (key: string) => {
  const found = cfg.series.sections.find((x) => x.key === key);
  if (!found) throw new Error(`Unknown section "${key}". Sections are set in reel.config.json.`);
  return found;
};

/** "S1 · BAS · 02" */
export const episodeCode = (key: string, number: number) =>
  `S${section(key).season} · ${key} · ${String(number).padStart(2, "0")}`;

const sectionLabel = (key: string, number: number) => `${section(key).name} · Episode ${String(number).padStart(2, "0")}`;

/** A question headline gets smaller as it gets longer, so it always fits in three or four lines. */
const questionSize = (text: string) => (text.length <= 22 ? 150 : text.length <= 34 ? 132 : text.length <= 48 ? 112 : 96);

// ───────────────────────── intro, outro, thumbnail ─────────────────────────

/** Opening scene, the same in every episode: the question pill, the question, and the section tag. */
const Intro: React.FC<{ question: string; label: string; tone: Tone; art?: React.ReactNode }> = ({
  question,
  label,
  tone,
  art,
}) => (
  <>
    <Pill>{cfg.intro.pill}</Pill>
    <Headline size={questionSize(question)} text={question} at={0.3} over={Math.min(2.2, question.split(" ").length * 0.3)} />
    {art ?? (
      <Row gap={70} justify="center">
        <Badge at={0.8} size={280}>
          ?
        </Badge>
        <Badge at={1.0} size={280} style={{ marginTop: 110 }}>
          ?
        </Badge>
      </Row>
    )}
    <Pill at={1.5} tone={tone} tilt={0} size={34}>
      {label}
    </Pill>
  </>
);

/** Outro part 1, the same in every episode: a short intro of the NEXT video. Its code in the header,
 *  the "curious" pill, the hint as a question, a peek at what is coming, and the next episode's tag. */
const Teaser: React.FC<{ hint: string; label: string; tone: Tone; peek?: React.ReactNode }> = ({ hint, label, tone, peek }) => (
  <>
    <Pill>{cfg.outro.pill}</Pill>
    <Headline size={questionSize(hint)} text={hint} at={0.3} over={Math.min(2.2, hint.split(" ").length * 0.3)} />
    {peek ?? (
      <Row gap={70} justify="center">
        <Badge at={0.9} size={240}>
          ?
        </Badge>
        <Badge at={1.1} size={240} style={{ marginTop: 90 }}>
          →
        </Badge>
      </Row>
    )}
    <Pill at={1.6} tone={tone} tilt={0} size={34}>
      {cfg.outro.nextLabel} · {label}
    </Pill>
  </>
);

/** Outro part 2, the last frame of every episode: logo, channel name, the follow and save buttons. */
const End: React.FC = () => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: 470, gap: 36, display: "flex", flexDirection: "column" }}>
    <Enter kind="pop">
      <div
        style={{
          width: 340,
          height: 340,
          borderRadius: "50%",
          backgroundColor: COLORS.coralTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Logo size={215} />
      </div>
    </Enter>
    <Enter at={0.15}>
      <Headline size={132}>{cfg.brand.name}</Headline>
    </Enter>
    <div style={{ display: "flex", gap: 60, marginTop: 50 }}>
      {cfg.outro.end.buttons.map((b, i) => (
        <Pill key={b} at={0.5 + i * 0.2} tilt={0} size={50} tone={i === 0 ? "solid" : "paper"}>
          {b}
        </Pill>
      ))}
    </div>
    <Note at={1}>{cfg.brand.disclaimer}</Note>
  </AbsoluteFill>
);

/** Cover image, the same layout in every episode: section and number, title, the intro question.
 *  The negative Sequence offset shows every block in its finished, fully entered state. */
const Thumb: React.FC<{ slug: string; code: string; label: string; tone: Tone; title: string; question: string }> = ({
  slug,
  code,
  label,
  tone,
  title,
  question,
}) => (
  <Sequence from={-90}>
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      <Blobs seed={`${slug}-thumb`} />
      <Dots />
      <Header code={code} />
      <AbsoluteFill
        style={{ padding: `520px ${LAYOUT.side}px 0`, display: "flex", flexDirection: "column", gap: 44 }}
      >
        <Pill tone={tone} tilt={-4} size={46}>
          {label}
        </Pill>
        <Headline size={questionSize(title) * 1.12}>{title}</Headline>
        <Card tone="coral">
          <Body size={40} color={COLORS.gray}>
            {cfg.intro.pill}
          </Body>
          <div style={{ marginTop: 8 }}>
            <Body size={58}>{question}</Body>
          </div>
        </Card>
      </AbsoluteFill>
    </AbsoluteFill>
  </Sequence>
);

/**
 * Builds a whole episode in the house style. The intro, outro, header and thumbnail
 * are built in, so they are identical in every episode.
 *
 *   const ep = episode({
 *     slug: "s1-bas-02", section: "BAS", number: 2, title: "Your first prompt",
 *     durations,                              // durations.json: intro, ..., outro
 *     intro: { question: "why your first prompt falls flat?" },
 *     views: { s2: <>...</>, s3: <>...</> },  // every scene between intro and outro
 *     outro: { hint: "What if Claude knew your whole situation?" },  // + optional peek: <>...</>
 *   });
 *   export const { durationInFrames, Thumbnail } = ep;
 *   export default ep.Component;
 *
 * The outro is two scenes: "outro" teases the next video like a short intro (the hint, plus the
 * optional `outro.peek` blocks), then "end" is the logo, follow and save frame. tts.py adds "end".
 * The next episode is the same section, number + 1, unless `outro.next` says otherwise.
 * `voice: false` skips the voiceover (demo only).
 */
export const episode = (o: {
  slug: string;
  section: string;
  number: number;
  title: string;
  durations: Record<string, number>;
  intro: { question: string; art?: React.ReactNode };
  views: Record<string, React.ReactNode>;
  outro: { hint: string; peek?: React.ReactNode; next?: { section: string; number: number } };
  voice?: boolean;
}) => {
  const { scenes, totalFrames } = timeline(o.durations);
  const ids = scenes.map((s) => s.id);
  if (ids[0] !== "intro" || ids[ids.length - 2] !== "outro" || ids[ids.length - 1] !== "end") {
    throw new Error(`${o.slug}: the first scene must be "intro" and the last two "outro" and "end" (re-run tts.py)`);
  }
  const code = episodeCode(o.section, o.number);
  const next = o.outro.next ?? { section: o.section, number: o.number + 1 };
  const tone = section(o.section).tone as Tone;
  const label = sectionLabel(o.section, o.number);

  const Component: React.FC = () => (
    <AbsoluteFill style={{ backgroundColor: COLORS.paper }}>
      {o.voice === false ? null : <Audio src={staticFile(`${o.slug}/voiceover.wav`)} />}
      {scenes.map((s) => (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.durationInFrames}>
          <Blobs seed={`${o.slug}-${s.id}`} />
          <Dots />
          {s.id === "end" ? (
            <End />
          ) : (
            <>
              <Header code={s.id === "outro" ? episodeCode(next.section, next.number) : code} />
              <Scene>
                {s.id === "intro" ? (
                  <Intro question={o.intro.question} label={label} tone={tone} art={o.intro.art} />
                ) : s.id === "outro" ? (
                  <Teaser
                    hint={o.outro.hint}
                    label={sectionLabel(next.section, next.number)}
                    tone={section(next.section).tone as Tone}
                    peek={o.outro.peek}
                  />
                ) : (
                  o.views[s.id]
                )}
              </Scene>
            </>
          )}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
  const Thumbnail: React.FC = () => (
    <Thumb slug={o.slug} code={code} label={label} tone={tone} title={o.title} question={o.intro.question} />
  );
  return { Component, Thumbnail, durationInFrames: totalFrames };
};
