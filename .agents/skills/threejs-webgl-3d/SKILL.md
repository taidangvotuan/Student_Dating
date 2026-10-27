---
name: threejs-webgl-3d
description: Three.js and WebGL 3D scene architecture, geometry instancing, PBR materials, render loops, and performance profiling.
---

# Three.js & WebGL 3D Scene Architecture

## Overview
Builds fluid, 60fps 3D interactive web experiences using Three.js, instanced meshes, and hardware-accelerated shaders.

## InstancedMesh Performance Pattern
```javascript
import * as THREE from 'three';

// Render 10,000 objects in a single draw call instead of 10,000 separate meshes
const count = 10000;
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ roughness: 0.4 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, count);

const dummy = new THREE.Object3D();
for (let i = 0; i < count; i++) {
  dummy.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100);
  dummy.updateMatrix();
  instancedMesh.setMatrixAt(i, dummy.matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
```

## Optimization Checklist
- Keep draw calls under 100 per frame.
- Compress 3D models with glTF + Draco compression.
- Dispose unused geometries, textures, and materials to prevent WebGL memory leaks.
