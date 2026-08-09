import React from "react";
import { Composition } from "remotion";
import { AgenticLoop } from "./AgenticLoop";
import "./index.css";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AgenticLoop"
      component={AgenticLoop}
      durationInFrames={690}
      fps={30}
      width={1280}
      height={720}
    />
  );
};