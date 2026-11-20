// Test episode: "How much can Claude read at once?"
import React from "react";
import { Badge, Bars, Big, episode, Fact, Headline, Note, Pill, Row, Stat, Window } from "../Brand";

const ep = episode({
  slug: "test-01",
  code: "TEST · 01",
  // episodes/test-01/durations.json (seconds, gap included)
  durations: { hook: 3.47, s2: 5.48, s3: 5.67, s4: 6.16, s5: 3.37, s6: 4.18, end: 2.06 },
  next: { code: "S1 · BAS · 01", title: "Who built Claude?" },
  views: {
    // "Do you know Claude can read a five hundred page book in one go?"
    hook: (
      <>
        <Pill>Do you know...</Pill>
        <Headline size={140} text="how much can Claude read?" at={0.2} over={1.1} />
        <Row gap={70} justify="center">
          <Badge at={0.5} size={300}>
            ?
          </Badge>
          <Badge at={0.7} size={300} style={{ marginTop: 120 }}>
            ?
          </Badge>
        </Row>
        <Pill at={1.7} tone="paper" tilt={0} size={44}>
          A 500-page book, in one go
        </Pill>
      </>
    ),
    // "It's called the context window. Think of it as Claude's working memory for one conversation."
    s2: (
      <>
        <Headline text="It's called the context window." at={0.1} over={1.6} />
        <Fact icon="memory" at={2.3}>
          Claude's working memory for one conversation.
        </Fact>
        <Pill at={3.9} align="end" tilt={-5}>
          One chat = one window
        </Pill>
      </>
    ),
    // "Claude does not count words. It counts tokens. One token is about three quarters of a word."
    s3: (
      <>
        <Headline text="Claude counts tokens, not words." at={0.1} over={2.6} />
        <Stat value="1 token" label="is about ¾ of a word." at={3.1} size={170} />
      </>
    ),
    // "The standard window is two hundred thousand tokens. That is roughly one hundred fifty thousand words."
    s4: (
      <>
        <Big text="200K" at={0.5} />
        <Headline size={96} text="tokens. The standard window." at={1.0} over={1.3} />
        <Fact icon="book" at={3.2}>
          Roughly 150,000 words, or about 500 pages.
        </Fact>
        <Note at={4.0}>Sources: Anthropic Help Center, Claude docs. One token ≈ ¾ of a word is a rule of thumb.</Note>
      </>
    ),
    // "Some newer Claude models go up to one million tokens."
    s5: (
      <>
        <Pill>Newer models</Pill>
        <Headline text="Up to 1 million tokens" at={0.2} over={1.6} />
        <Bars
          at={0.3}
          height={380}
          bars={[
            { label: "Standard", value: 200, display: "200K", kind: "tint" },
            { label: "Some newer models", value: 1000, display: "1M", kind: "solid" },
          ]}
        />
      </>
    ),
    // "So paste the whole report, not just a piece. Then ask your question."
    s6: (
      <>
        <Headline text="So paste the whole report." at={0.1} over={1.2} />
        <Window at={0.6} lines={[72, 80, 76, 52]} />
        <Row>
          <Pill at={2.6} tone="green" tilt={0}>
            Not just a piece
          </Pill>
          <Pill at={2.9}>Then ask your question</Pill>
        </Row>
      </>
    ),
  },
});

export const durationInFrames = ep.durationInFrames;
export default ep.Component;
