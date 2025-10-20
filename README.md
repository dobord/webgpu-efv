# WebGPU Electrostatic Field Visualizer

An interactive visualization of electrostatic potential and field lines from point charges, built with WebGPU.

This is a modern WebGPU reimplementation of [@dobord/silow-pole](https://github.com/dobord/silow-pole), migrated from WebGL to WebGPU with TypeScript.

## Features

- **Interactive Visualization**: Real-time rendering of electrostatic potential fields using WebGPU compute shaders
- **Point Charges**: Add, remove, and drag positive and negative charges
- **Field Lines**: Visualize electric field lines flowing from charges
- **Equipotential Lines**: Display equipotential surfaces
- **GPU-Accelerated**: All field calculations performed in parallel on the GPU using WGSL shaders
- **Responsive**: Works on desktop and mobile devices with touch support

## Physics

The visualizer calculates and displays:

**Electric Potential:**
```
V(r) = k Σᵢ qᵢ / |r - rᵢ|
```

**Electric Field:**
```
E(r) = -∇V(r) = k Σᵢ qᵢ (r - rᵢ) / |r - rᵢ|³
```

Color mapping represents potential magnitude:
- Red: Positive potential
- Blue: Negative potential
- Green lines: Equipotential surfaces

## Requirements

- Modern browser with WebGPU support:
  - Chrome 113+ or Edge 113+
  - Firefox Nightly with `dom.webgpu.enabled` flag
  - Safari Technology Preview (experimental)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3000 in a WebGPU-enabled browser.

## Building

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Usage

### Mouse/Touch Controls

- **Left Click**: Add positive charge at cursor position
- **Right Click**: Add negative charge at cursor position
- **Drag**: Move existing charges
- **Delete Key**: Remove selected charge
- **Home Key**: Clear all charges

### Keyboard Shortcuts

- `+` or `=`: Add positive charge at last cursor position
- `-`: Add negative charge at last cursor position
- `*`: Add equipotential line at cursor position
- `Shift`: Temporarily show charge positions
- `Delete`: Remove selected charge
- `Home`: Clear all charges and equipotentials

### UI Controls

- **Charge Slider**: Adjust charge magnitude for new charges
- **Show Charges**: Toggle visibility of charge indicators
- **Show Lines**: Toggle field line visualization
- **Equipotentials**: Toggle equipotential line display
- **Mode**: Switch between adding charges and equipotentials
- **Clear All**: Remove all charges and reset
- **Delete Selected**: Remove the currently selected charge

## Technical Details

### Architecture

The application uses a modern TypeScript architecture with:

- **WebGPU Renderer**: Core rendering engine using WebGPU API
- **WGSL Shaders**: GPU shaders written in WebGPU Shading Language
- **Storage Buffers**: Efficient charge data storage on GPU
- **Compute Pipeline**: Parallel field calculations per fragment

### Shaders

1. **Field Fragment Shader**: Calculates electric potential at each pixel
2. **Geometry Shaders**: Renders charge indicators and field lines
3. **Color Mapping**: Converts potential values to visual colors

### Performance

- Supports up to 16 simultaneous charges
- Real-time rendering at 60 FPS
- GPU-accelerated field calculations
- Efficient line rendering with dynamic buffers

## Project Structure

```
webgpu-efv/
├── src/
│   ├── main.ts              # Application entry point
│   ├── webgpu-renderer.ts   # WebGPU rendering engine
│   └── shaders.ts           # WGSL shader code
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

## Differences from Original

This WebGPU version improves upon the original WebGL implementation:

- Modern TypeScript codebase (vs vanilla JavaScript)
- WebGPU API (vs WebGL)
- WGSL shaders (vs GLSL ES)
- Storage buffers for charge data (vs uniform arrays)
- Vite build system (vs standalone HTML file)
- Modular architecture
- Better mobile support
- Improved performance

## License

LGPL-3.0 License (same as original project)

## Credits

Original concept and WebGL implementation: [@dobord/silow-pole](https://github.com/dobord/silow-pole)

WebGPU reimplementation: dobord (2024)

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## References

- [WebGPU Specification](https://gpuweb.github.io/gpuweb/)
- [WGSL Specification](https://gpuweb.github.io/gpuweb/wgsl/)
- [Electrostatics on Wikipedia](https://en.wikipedia.org/wiki/Electrostatics)
- [Original silow-pole project](https://github.com/dobord/silow-pole)