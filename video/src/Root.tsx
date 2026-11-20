import React from "react";
import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./Brand";

type SceneModule = { default: React.FC; durationInFrames: number };

// Every file in scenes/ becomes a composition named after the file
// (scenes/s1-bas-02.tsx → `npx remotion render s1-bas-02 ...`). No edits here per episode.
const scenes = require.context("./scenes", false, /\.tsx$/);

export const Root: React.FC = () => (
  <>
    {scenes.keys().map((key) => {
      const mod = scenes(key) as SceneModule;
      const id = key.replace(/^\.\//, "").replace(/\.tsx$/, "");
      return (
        <Composition
          key={id}
          id={id}
          component={mod.default}
          durationInFrames={mod.durationInFrames}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
      );
    })}
  </>
);
