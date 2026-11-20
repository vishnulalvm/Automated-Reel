// Reference episode: copy this structure for scenes/<slug>.tsx.
// It shows every house-style block once. A real episode drops `voice: false`.
import React from "react";
import { Bars, Big, episode, Fact, Headline, IconChip, Note, Pill, Row, Stat, Window } from "../Brand";

const ep = episode({
  slug: "demo",
  code: "S0 · DEMO · 00",
  voice: false,
  // seconds per scene, gap included (the contents of episodes/<slug>/durations.json)
  durations: { hook: 3, stat: 4, launch: 4, chart: 4, end: 3 },
  next: { code: "S1 · BAS · 01", title: "Who built Claude?" },
  views: {
    // every `at` is seconds from the start of the scene: time each block to the narration
    hook: (
      <>
        <Pill>Do you know...</Pill>
        <Headline size={150} text="how a scene is built?" at={0.2} over={1} />
      </>
    ),
    stat: (
      <>
        <Headline text="One idea per scene." at={0.1} over={1} />
        <Stat value="8" label="words or fewer on screen. The voice carries the rest." at={1.2} />
        <Fact icon="check" at={2}>
          Cards stack from the top, under the headline.
        </Fact>
        <Note at={2.6}>Sources and caveats go in a small grey line like this.</Note>
      </>
    ),
    launch: (
      <>
        <Big text="2023" at={0.1} />
        <Headline size={96} text="A year and a line." at={0.5} over={0.8} />
        <Window at={1} />
        <Row>
          <Pill at={2} tone="green" tilt={0}>
            Calm tag
          </Pill>
          <Pill at={2.2}>Takeaway tag</Pill>
        </Row>
        <Row gap={22}>
          {(["code", "image", "doc", "search", "chart", "table"] as const).map((n, i) => (
            <IconChip key={n} name={n} at={2.6 + i * 0.08} />
          ))}
        </Row>
      </>
    ),
    chart: (
      <>
        <Pill>Numbers get a chart</Pill>
        <Headline text="Earlier, now, target" at={0.2} over={1} />
        <Bars
          at={0.4}
          bars={[
            { label: "Earlier", value: 38, display: "38", kind: "tint" },
            { label: "Now", value: 96, display: "96", kind: "solid" },
            { label: "Target", value: 120, display: "120", kind: "dashed" },
          ]}
        />
      </>
    ),
  },
});

export const durationInFrames = ep.durationInFrames;
export default ep.Component;
