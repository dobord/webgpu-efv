# Contributing to WebGPU Electrostatic Field Visualizer

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/dobord/webgpu-efv.git
   cd webgpu-efv
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 in a WebGPU-enabled browser.

4. **Build for production**
   ```bash
   npm run build
   ```

## Browser Requirements

Development requires a browser with WebGPU support:

- **Chrome/Edge 113+**: WebGPU enabled by default
- **Firefox Nightly**: Enable `dom.webgpu.enabled` in about:config
- **Safari Technology Preview**: Experimental support

## Project Structure

```
src/
├── main.ts              # Application entry and UI logic
├── webgpu-renderer.ts   # WebGPU rendering engine
└── shaders.ts           # WGSL shader code
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and small

## Testing

Before submitting:

1. Run TypeScript type checking:
   ```bash
   npx tsc --noEmit
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Test in multiple browsers if possible

4. Verify all features work:
   - Adding/removing charges
   - Dragging charges
   - Field line visualization
   - Equipotential lines
   - UI controls

## Submitting Changes

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Commit with clear message
5. Submit a pull request

## Pull Request Guidelines

- Describe what your PR does
- Reference any related issues
- Include screenshots for visual changes
- Keep PRs focused on one feature/fix
- Update documentation if needed

## Adding Features

When adding new features:

1. Consider performance impact
2. Maintain WebGPU compatibility
3. Update README with new features
4. Add UI controls if needed
5. Test on different screen sizes

## Physics Accuracy

When modifying physics calculations:

- Verify formulas are correct
- Test edge cases (zero distance, etc.)
- Maintain numerical stability
- Document any approximations

## Shader Development

When working with WGSL shaders:

- Follow WGSL best practices
- Keep shaders efficient
- Comment complex calculations
- Test with different charge counts
- Profile performance impact

## Reporting Issues

When reporting bugs:

- Describe the issue clearly
- Include browser/version info
- Provide steps to reproduce
- Include screenshots if visual
- Note console errors if any

## Questions?

Feel free to open an issue for:
- Feature suggestions
- Bug reports
- Questions about the code
- Documentation improvements

Thank you for contributing!
