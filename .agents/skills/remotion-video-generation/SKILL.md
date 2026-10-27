---
name: remotion-video-generation
description: Programmatic video authoring and automated rendering in React with Remotion, frame-based timing, Canvas/Three.js integration, and SSR.
---

# Programmatic Video Generation with Remotion

## Overview
Remotion allows developers to create MP4, WebM, and GIF videos programmatically using standard React components, CSS, SVG, and WebGL. It replaces brittle FFmpeg script pipelines with component-driven compositions, timeline interpolations, and scalable cloud rendering.

## Core Architectural Concepts
1. **Frames, Not Seconds**: Everything in Remotion operates on integer frame indexes (`useCurrentFrame()`) rather than timestamps to ensure deterministic rendering across different hardware.
2. **Composition Registry**: Define compositions with exact dimensions (width/height), FPS (default 30 or 60), and duration in frames.
3. **Interpolation Physics**: Use `interpolate()` and `spring()` for smooth easing and natural motion.
4. **Cloud Rendering**: Render server-side with `@remotion/renderer` or deploy to AWS Lambda via `@remotion/lambda`.

## Implementation Patterns

### 1. Root Video Composition Definition
```tsx
// src/Root.tsx
import { Composition } from 'remotion';
import { AlgorithmExplainerVideo } from './AlgorithmExplainerVideo';

export const Root: React.FC = () => {
  return (
    <Composition
      id="AlgorithmExplainer"
      component={AlgorithmExplainerVideo}
      durationInFrames={300} // 10 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        algorithmName: 'QuickSort Partitioning',
        timeComplexity: 'O(N log N)',
        arrayData: [34, 7, 23, 32, 5, 62],
      }}
    />
  );
};
```

### 2. Animated Sequence with Spring Physics
```tsx
// src/AlgorithmExplainerVideo.tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

interface ExplainerProps {
  algorithmName: string;
  timeComplexity: string;
  arrayData: number[];
}

export const AlgorithmExplainerVideo: React.FC<ExplainerProps> = ({
  algorithmName,
  timeComplexity,
  arrayData,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring animation
  const titleScale = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill className="bg-slate-950 flex flex-col items-center justify-center text-white">
      <div
        style={{
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
        }}
        className="text-center"
      >
        <h1 className="text-6xl font-black text-indigo-400 tracking-tight">
          {algorithmName}
        </h1>
        <p className="text-2xl text-slate-400 mt-4 font-mono">
          Complexity: {timeComplexity}
        </p>
      </div>

      <Sequence from={45}>
        <div className="flex gap-4 mt-16">
          {arrayData.map((val, idx) => {
            const barSpring = spring({
              frame: frame - 45 - idx * 5,
              fps,
              config: { damping: 14 },
            });
            return (
              <div
                key={idx}
                style={{
                  height: `${val * 4}px`,
                  transform: `scaleY(${Math.max(0, barSpring)})`,
                  transformOrigin: 'bottom',
                }}
                className="w-16 bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-lg flex items-end justify-center pb-2 font-bold font-mono"
              >
                {val}
              </div>
            );
          })}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Best Practices & Performance Optimization
- **Deterministic Math**: Avoid `Date.now()` or `Math.random()` inside render loops. Use `frame` and seedable PRNGs.
- **Preload Heavy Assets**: Use `delayRender()` and `continueRender()` when waiting for remote fonts, images, or audio assets.
- **OffscreenCanvas for 3D**: When rendering Three.js or WebGL inside Remotion, bind rendering to the Remotion frame clock, disabling standard `requestAnimationFrame`.\n