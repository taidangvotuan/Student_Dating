---
name: shader-programming-glsl
description: Authoring custom GLSL fragment and vertex shaders, procedural generation, signed distance fields (SDF), and raymarching.
---

# GLSL Shader Programming & Visual FX

## Overview
Executes per-pixel GPU calculations for custom visual effects, post-processing filters, and generative art.

## Fragment Shader Template
```glsl
uniform vec2 u_resolution;
uniform float u_time;

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 color = vec3(0.5 + 0.5 * cos(u_time + st.xyx + vec3(0, 2, 4)));
    gl_FragColor = vec4(color, 1.0);
}
```
