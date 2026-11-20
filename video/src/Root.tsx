import React from "react";
import { Composition, Still } from "remotion";
import { FPS, HEIGHT, WIDTH } from "./Brand";

type SceneModule = { default: React.FC; durationInFrames: number; Thumbnail?: React.FC };

// Every file in scenes/ becomes a composition named after the file, plus a
// "<name>-thumb" still for its cover image. No edits here per episode.
const scenes = require.context("./scenes", false, /\.tsx$/);

export const Root: React.FC = () => (
  <>
    {scenes.keys().map((key) => {
      const mod = scenes(key) as SceneModule;
      const id = key.replace(/^\.\//, "").replace(/\.tsx$/, "");
      return (
        <React.Fragment key={id}>
          <Composition
            id={id}
            component={mod.default}
            durationInFrames={mod.durationInFrames}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
          {mod.Thumbnail ? <Still id={`${id}-thumb`} component={mod.Thumbnail} width={WIDTH} height={HEIGHT} /> : null}
        </React.Fragment>
      );
    })}
  </>
);
