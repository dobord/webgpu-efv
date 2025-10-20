# WebGPU Electrostatic Field Visualizer

Интерактивный визуализатор электростатического поля с использованием WebGPU для высокопроизводительных расчетов и рендеринга.

Современная WebGPU реализация [@dobord/silow-pole](https://github.com/dobord/silow-pole), переписанная с WebGL на WebGPU с использованием TypeScript.

## 🚀 Возможности

- **Реалтайм визуализация** электростатических полей
- **Интерактивное добавление** положительных и отрицательных зарядов
- **Перетаскивание зарядов** мышью
- **Силовые линии** электрического поля
- **Эквипотенциальные поверхности**
- **Высокая производительность** благодаря WebGPU

## 🔧 Требования

### Поддерживаемые браузеры

- **Chrome 113+** (рекомендуется)
- **Microsoft Edge 113+**
- **Firefox 110+** (экспериментально)

### Системные требования

- **Видеокарта**: DirectX 12 или Vulkan
- **ОС**: Windows 10+, macOS 10.15+, или современный Linux
- **Драйверы**: Обновленные драйверы видеокарты

## ⚙️ Включение WebGPU

### Chrome / Chromium / Edge

1. Откройте `chrome://flags` (или `edge://flags`)
2. Найдите **"Unsafe WebGPU Support"**
3. Установите **"Enabled"**
4. Перезапустите браузер

### Firefox

1. Откройте `about:config`
2. Найдите `dom.webgpu.enabled`
3. Установите `true`
4. Перезапустите браузер

## 🎮 Управление

- **Клик мыши**: Добавить положительный заряд
- **Правый клик**: Добавить отрицательный заряд
- **Перетаскивание**: Перемещение зарядов
- **Delete**: Удалить выбранный заряд
- **Home**: Очистить все заряды
- **+/-**: Добавить заряд в позиции курсора
- **\***: Добавить эквипотенциальную линию

## 🏃 Запуск

```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build
```

Приложение будет доступно по адресу: http://localhost:3000

## 🔄 Fallback версия

Если WebGPU недоступен, вы можете использовать упрощенную версию на Canvas 2D:
http://localhost:3000/fallback.html

## 🛠️ Технические детали

- **Фронтенд**: TypeScript + Vite
- **Рендеринг**: WebGPU с WGSL шейдерами
- **Физика**: Электростатические расчеты в реальном времени
- **Fallback**: Canvas 2D API для совместимости

## 📚 Структура проекта

```
src/
├── main.ts              # Основное приложение
├── webgpu-renderer.ts   # WebGPU рендерер
└── shaders.ts           # WGSL шейдеры
index.html               # Главная страница
fallback.html            # Fallback версия
```

## 🐛 Устранение неполадок

### WebGPU недоступен
- Убедитесь, что WebGPU включен в флагах браузера
- Проверьте, что драйверы видеокарты обновлены
- Попробуйте другой поддерживаемый браузер

### Низкая производительность
- Закройте другие графически интенсивные приложения
- Уменьшите количество зарядов
- Проверьте, что используется дискретная видеокарта

### Ошибки шейдера
- Проверьте консоль браузера для подробностей
- Убедитесь, что используется совместимая версия WebGPU

## 📖 Дополнительно

Подробности об исправлении ошибок WebGPU см. в [WEBGPU_FIX.md](./WEBGPU_FIX.md)

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