// Sample episode: "Your first prompt"
import React from "react";
import { Badge, Big, episode, Fact, Headline, Note, Pill, Prompt, Row, Step } from "../Brand";

const ep = episode({
  slug: "sample-02",
  code: "SAMPLE · 02",
  // episodes/sample-02/durations.json (seconds, gap included)
  durations: {"hook": 3.34, "s2": 5.18, "s3": 5.2, "s4": 5.33, "s5": 5.75, "s6": 3.51, "end": 2.06},
  next: { code: "S1 · BAS · 01", title: "Who built Claude?" },
  views: {
    // "Do you know why your first prompt to Claude usually falls flat?"
    hook: (
      <>
        <Pill>Do you know...</Pill>
        <Headline size={140} text="why your first prompt falls flat?" at={0.3} over={1.9} />
        <Row gap={70} justify="center">
          <Badge at={0.8} size={280}>
            ?
          </Badge>
          <Badge at={1.0} size={280} style={{ marginTop: 110 }}>
            ?
          </Badge>
        </Row>
      </>
    ),
    // "Most people type a few words, like, write an email. Then Claude has to guess the rest."
    s2: (
      <>
        <Headline text="Most people type a few words." at={0.1} over={1.5} />
        <Prompt text="write an email" at={1.2} over={0.9} />
        <Pill at={3.0} align="end" tilt={-5}>
          Claude has to guess the rest
        </Pill>
      </>
    ),
    // "Instead, brief Claude like a brilliant new teammate, who knows nothing about your situation."
    s3: (
      <>
        <Headline text="Brief Claude like a brilliant new teammate." at={0.4} over={2.2} />
        <Fact icon="chat" at={2.8}>
          Smart, but knows nothing about your situation.
        </Fact>
        <Note at={3.4}>Source: Anthropic's prompting guide, "Be clear and direct".</Note>
      </>
    ),
    // "Tell it three things. One, who it is for. Two, what you want. Three, what good looks like."
    s4: (
      <>
        <Headline text="Tell it three things." at={0.1} over={1.0} />
        <Step n={1} at={1.3}>
          Who it is for
        </Step>
        <Step n={2} at={2.6}>
          What you want
        </Step>
        <Step n={3} at={3.8} tone="coral">
          What good looks like
        </Step>
      </>
    ),
    // "For example. Write a short, friendly email to my landlord, asking to fix the heater this week."
    s5: (
      <>
        <Pill>For example</Pill>
        <Prompt text="Write a short, friendly email to my landlord, asking to fix the heater this week." at={0.5} over={3.6} />
        <Row gap={20}>
          <Pill at={2.2} tone="green" tilt={0} size={32}>
            Who: landlord
          </Pill>
          <Pill at={3.2} tone="green" tilt={0} size={32}>
            What: fix heater
          </Pill>
        </Row>
        <Pill at={4.0} tone="green" tilt={0} size={32}>
          Good: short, friendly, this week
        </Pill>
      </>
    ),
    // "Same Claude. A far better answer. Clear beats clever."
    s6: (
      <>
        <Fact icon="check" at={0.1}>
          Same Claude. A far better answer.
        </Fact>
        <Big text="Clear" at={1.7} />
        <Headline size={110} text="beats clever." at={2.1} over={0.6} />
      </>
    ),
  },
});

export const durationInFrames = ep.durationInFrames;
export default ep.Component;
