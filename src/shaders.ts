// WGSL Shaders for WebGPU Electrostatic Field Visualizer

export const fieldVertexShader = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
}

@vertex
fn main(@location(0) position: vec3f, @location(1) texCoord: vec2f) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4f(position, 1.0);
  output.texCoord = texCoord;
  return output;
}
`;

export const fieldFragmentShader = `
struct Charge {
  x: f32,
  y: f32,
  q: f32,
  aux: f32,
}

struct Uniforms {
  canvasWidth: f32,
  canvasHeight: f32,
  numCharges: u32,
  numEquipotentials: u32,
  equipotentialPrecision: f32,
  padding: vec3f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> charges: array<Charge>;
@group(0) @binding(2) var<storage, read> equipotentials: array<f32>;

fn phi2color(phi: f32) -> vec4f {
  var color: vec4f;
  if (phi > 0.0) {
    if (phi > 1.0) {
      color = vec4f(1.0, 1.0 - 1.0 / phi, 0.0, 1.0);
    } else {
      color = vec4f(phi, 0.0, 0.0, 1.0);
    }
  } else {
    if (phi < -1.0) {
      color = vec4f(0.0, 1.0 + 1.0 / phi, 1.0, 1.0);
    } else {
      color = vec4f(0.0, 0.0, -phi, 1.0);
    }
  }
  return color;
}

@fragment
fn main(@location(0) texCoord: vec2f) -> @location(0) vec4f {
  // Convert texture coordinates to world position
  let pos = (texCoord - vec2f(0.5)) * vec2f(uniforms.canvasWidth, uniforms.canvasHeight);
  
  var phi: f32 = 0.0;
  
  // Calculate potential from all charges
  for (var i = 0u; i < uniforms.numCharges; i = i + 1u) {
    let charge = charges[i];
    let dx = pos.x - charge.x;
    let dy = pos.y - charge.y;
    let dist = sqrt(dx * dx + dy * dy);
    
    // Add small epsilon to avoid division by zero
    phi = phi + charge.q / max(dist, 0.1);
  }
  
  var color = phi2color(phi);
  
  // Draw equipotential lines
  for (var i = 0u; i < uniforms.numEquipotentials; i = i + 1u) {
    let targetPhi = equipotentials[i];
    let fp = abs((phi - targetPhi) / targetPhi) / uniforms.equipotentialPrecision;
    
    if (fp <= 1.0) {
      let intensity = sqrt(1.0 - fp * fp) * 0.8;
      color = mix(color, vec4f(0.0, 1.0, 0.0, 1.0), intensity);
    }
  }
  
  return color;
}
`;

export const geometryVertexShader = `
struct VertexInput {
  @location(0) position: vec3f,
  @location(1) texCoord: vec2f,
  @location(2) color: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) texCoord: vec2f,
  @location(1) color: vec4f,
}

struct ProjectionUniforms {
  projectionMatrix: mat4x4f,
  viewMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> projection: ProjectionUniforms;

@vertex
fn main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;
  let mvp = projection.projectionMatrix * projection.viewMatrix;
  output.position = mvp * vec4f(input.position, 1.0);
  output.texCoord = input.texCoord;
  output.color = input.color;
  return output;
}
`;

export const geometryFragmentShader = `
@fragment
fn main(
  @location(0) texCoord: vec2f,
  @location(1) color: vec4f
) -> @location(0) vec4f {
  return color;
}
`;
