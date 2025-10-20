# WebGPU Technical Details

This document describes the WebGPU implementation details of the Electrostatic Field Visualizer.

## WebGPU Overview

WebGPU is a modern graphics API that provides:
- Low-level GPU access from the browser
- Compute and graphics capabilities
- Better performance than WebGL
- Modern shader language (WGSL)

## Architecture

### Render Pipeline

The application uses two render pipelines:

1. **Field Pipeline**: Renders the potential field background
2. **Geometry Pipeline**: Renders charge indicators and field lines

### Data Flow

```
CPU → GPU Storage Buffers → Shaders → Frame Buffer → Canvas
```

## Shaders (WGSL)

### Field Vertex Shader

Renders a fullscreen quad covering the entire canvas:

```wgsl
@vertex
fn main(@location(0) position: vec3f, @location(1) texCoord: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 1.0);
  output.texCoord = texCoord;
  return output;
}
```

### Field Fragment Shader

Calculates electric potential at each pixel:

```wgsl
@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
  let pos = (texCoord - vec2f(0.5)) * vec2f(canvasWidth, canvasHeight);
  
  var phi: f32 = 0.0;
  for (var i = 0u; i < numCharges; i = i + 1u) {
    let charge = charges[i];
    let dist = distance(pos, vec2f(charge.x, charge.y));
    phi = phi + charge.q / max(dist, 0.1);
  }
  
  return phi2color(phi);
}
```

Key features:
- Per-pixel potential calculation
- Reads charges from storage buffer
- Color mapping for visualization
- Equipotential line rendering

### Geometry Shaders

Render additional geometric elements (charges, field lines):

```wgsl
@vertex
fn main(input: VertexInput) -> VertexOutput {
  let mvp = projection.projectionMatrix * projection.viewMatrix;
  output.position = mvp * vec4f(input.position, 1.0);
  return output;
}
```

## Buffer Management

### Uniform Buffers

Store parameters that change per frame:

```typescript
struct Uniforms {
  canvasWidth: f32,
  canvasHeight: f32,
  numCharges: u32,
  numEquipotentials: u32,
  equipotentialPrecision: f32,
}
```

### Storage Buffers

Store arrays of charges and equipotentials:

```typescript
struct Charge {
  x: f32,
  y: f32,
  q: f32,  // charge magnitude
  aux: f32, // auxiliary data
}
```

Advantages over WebGL uniforms:
- No size limit (WebGL limited to ~256 uniforms)
- Better performance for large arrays
- Direct struct access

## Render Pass

Each frame executes:

1. **Clear**: Clear the canvas
2. **Field Pass**: Render potential field
3. **Geometry Pass**: Render charges and lines
4. **Present**: Display result

```typescript
const renderPass = commandEncoder.beginRenderPass({
  colorAttachments: [{
    view: textureView,
    clearValue: { r: 0, g: 0, b: 0, a: 1 },
    loadOp: 'clear',
    storeOp: 'store',
  }],
});
```

## Performance Optimizations

### GPU-Accelerated Calculations

All potential calculations happen in parallel on the GPU:
- Each pixel computed independently
- Millions of calculations per frame
- 60 FPS even with many charges

### Buffer Updates

Only update GPU buffers when data changes:
```typescript
if (charges.length > 0) {
  device.queue.writeBuffer(chargeStorageBuffer, 0, chargeData);
}
```

### Efficient Geometry

Minimize geometry:
- Charges: 4 vertices per quad
- Field lines: Dynamic buffer allocation
- Index buffers for triangle reuse

## Memory Layout

### Vertex Buffer Layout

Field quad vertices:
```
[position.x, position.y, position.z, texCoord.u, texCoord.v]
[   4 bytes,   4 bytes,   4 bytes,   4 bytes,    4 bytes  ]
```

Geometry vertices:
```
[position.xyz, texCoord.uv, color.rgba]
[   12 bytes,    8 bytes,    16 bytes  ]
```

### Alignment

WebGPU requires proper alignment:
- vec3: 16-byte alignment
- vec4: 16-byte alignment
- Structs: Largest member alignment

## Browser Compatibility

### Feature Detection

```typescript
if (!navigator.gpu) {
  throw new Error('WebGPU not supported');
}
```

### Adapter Selection

```typescript
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) {
  throw new Error('No adapter found');
}
```

### Device Features

Currently uses basic WebGPU features:
- No compute shaders (uses fragment shader instead)
- No advanced features required
- Maximum compatibility

## Debugging

### Shader Compilation

WGSL syntax errors reported at runtime:
```typescript
const shaderModule = device.createShaderModule({
  code: wgslCode,
});
```

Check browser console for shader errors.

### Validation

WebGPU provides excellent validation:
- Type checking
- Buffer overflow detection
- Pipeline state validation

Enable detailed errors in Chrome:
```
chrome://flags/#enable-webgpu-developer-features
```

## Future Enhancements

### Compute Shaders

Could use compute shader for field calculation:
- Pre-compute field to texture
- Use texture sampling in fragment shader
- Better for static charges

### Instanced Rendering

For many charges:
- Use instancing for charge circles
- Reduce CPU→GPU data transfer
- Better performance

### Advanced Features

- Antialiasing (MSAA)
- Higher precision (float32 → float64)
- Multiple render targets
- Texture-based field storage

## Migration from WebGL

### Key Differences

| WebGL | WebGPU |
|-------|--------|
| GLSL ES | WGSL |
| Uniforms limited | Storage buffers unlimited |
| Stateful API | Command-based API |
| `gl.drawElements()` | `renderPass.drawIndexed()` |
| Immediate rendering | Command encoding |

### Benefits

1. **Performance**: Better multi-threading
2. **Features**: Modern GPU capabilities
3. **Safety**: Better validation
4. **Future-proof**: Active development

## References

- [WebGPU Specification](https://gpuweb.github.io/gpuweb/)
- [WGSL Specification](https://gpuweb.github.io/gpuweb/wgsl/)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)
- [MDN WebGPU Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
