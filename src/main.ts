import { WebGPURenderer, Charge } from './webgpu-renderer';

// Early WebGPU check
if (!navigator.gpu) {
  document.body.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1a1a1a;
      color: white;
      padding: 40px;
      border-radius: 15px;
      max-width: 600px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    ">
      <h2 style="color: #ff6b6b; margin-bottom: 20px;">⚠️ WebGPU Недоступен</h2>
      <p style="margin-bottom: 20px; line-height: 1.6;">
        Этому приложению требуется поддержка WebGPU, которая не обнаружена в вашем браузере.
      </p>
      <button onclick="location.reload()" style="
        background: #4ecdc4;
        color: #1a1a1a;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin: 10px 5px;
      ">🔄 Перезагрузить страницу</button>
      <button onclick="window.location.href='./fallback.html'" style="
        background: #ffa500;
        color: #1a1a1a;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin: 10px 5px;
      ">🎨 Упрощенная версия</button>
    </div>
  `;
  // Stop execution if WebGPU is not available
  throw new Error('WebGPU not supported');
}

class ElectrostaticFieldVisualizer {
  private canvas: HTMLCanvasElement;
  private renderer!: WebGPURenderer;
  
  private charges: Charge[] = [];
  private equipotentials: number[] = [];
  private selectedChargeIndex: number | null = null;
  private isDragging = false;
  private dragOffset = { x: 0, y: 0 };
  private lastMousePos = { x: 0, y: 0 };

  // UI state
  private showCharges = true;
  private showLines = false;
  private showEquipotentials = false;
  private chargeValue = 100;
  private mode: 'add' | 'add-equipotential' = 'add';

  // UI elements
  private chargeValueSlider: HTMLInputElement;
  private chargeDisplay: HTMLElement;
  private showChargesCheckbox: HTMLInputElement;
  private showLinesCheckbox: HTMLInputElement;
  private showEquipotentialsCheckbox: HTMLInputElement;
  private modeSelect: HTMLSelectElement;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    
    // Get UI elements
    this.chargeValueSlider = document.getElementById('chargeValue') as HTMLInputElement;
    this.chargeDisplay = document.getElementById('chargeDisplay') as HTMLElement;
    this.showChargesCheckbox = document.getElementById('showCharges') as HTMLInputElement;
    this.showLinesCheckbox = document.getElementById('showLines') as HTMLInputElement;
    this.showEquipotentialsCheckbox = document.getElementById('showEquipotentials') as HTMLInputElement;
    this.modeSelect = document.getElementById('mode') as HTMLSelectElement;

    this.setupEventListeners();
    this.resizeCanvas();
  }

  async init(): Promise<void> {
    try {
      this.renderer = new WebGPURenderer(this.canvas);
      await this.renderer.init();

      // Add initial charges
      this.charges.push(
        { x: 100, y: 75, q: 100, aux: 0 },
        { x: -100, y: 0, q: -100, aux: 0 }
      );

      this.startRenderLoop();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : 'Failed to initialize WebGPU');
      throw error;
    }
  }

  private setupEventListeners(): void {
    // Window events
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.onMouseUp());

    // Keyboard events
    window.addEventListener('keydown', (e) => this.onKeyDown(e));

    // UI controls
    this.chargeValueSlider.addEventListener('input', () => {
      this.chargeValue = parseInt(this.chargeValueSlider.value);
      this.chargeDisplay.textContent = this.chargeValue.toString();
      
      // Update selected charge if any
      if (this.selectedChargeIndex !== null) {
        this.charges[this.selectedChargeIndex].q = this.chargeValue;
      }
    });

    this.showChargesCheckbox.addEventListener('change', () => {
      this.showCharges = this.showChargesCheckbox.checked;
    });

    this.showLinesCheckbox.addEventListener('change', () => {
      this.showLines = this.showLinesCheckbox.checked;
    });

    this.showEquipotentialsCheckbox.addEventListener('change', () => {
      this.showEquipotentials = this.showEquipotentialsCheckbox.checked;
      // Clear equipotentials if disabled
      if (!this.showEquipotentials) {
        this.equipotentials = [];
      }
    });

    this.modeSelect.addEventListener('change', () => {
      this.mode = this.modeSelect.value as 'add' | 'add-equipotential';
    });

    document.getElementById('clearBtn')?.addEventListener('click', () => {
      this.clearAll();
    });

    document.getElementById('deleteBtn')?.addEventListener('click', () => {
      this.deleteSelected();
    });
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    if (this.renderer) {
      this.renderer.resize(this.canvas.width, this.canvas.height);
    }
  }

  private getCanvasCoordinates(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left - this.canvas.width / 2,
      y: this.canvas.height / 2 - (clientY - rect.top),
    };
  }

  private onMouseDown(e: MouseEvent): void {
    const pos = this.getCanvasCoordinates(e.clientX, e.clientY);
    this.lastMousePos = pos;

    const button = e.button;
    
    // Try to select existing charge
    this.selectedChargeIndex = this.findChargeAt(pos);

    if (this.selectedChargeIndex !== null) {
      // Start dragging
      const charge = this.charges[this.selectedChargeIndex];
      this.dragOffset.x = charge.x - pos.x;
      this.dragOffset.y = charge.y - pos.y;
      this.isDragging = true;

      // Update charge value slider
      this.chargeValueSlider.value = charge.q.toString();
      this.chargeDisplay.textContent = charge.q.toString();
      this.chargeValue = charge.q;
    } else if (this.mode === 'add') {
      // Add new charge
      if (this.charges.length < 16) {
        const chargeValue = button === 2 ? -this.chargeValue : this.chargeValue;
        this.charges.push({ x: pos.x, y: pos.y, q: chargeValue, aux: 0 });
      }
    } else if (this.mode === 'add-equipotential' && this.showEquipotentials) {
      // Add equipotential line
      this.addEquipotentialAtPosition(pos);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    const pos = this.getCanvasCoordinates(e.clientX, e.clientY);
    this.lastMousePos = pos;

    if (this.selectedChargeIndex !== null && this.isDragging) {
      this.charges[this.selectedChargeIndex].x = pos.x + this.dragOffset.x;
      this.charges[this.selectedChargeIndex].y = pos.y + this.dragOffset.y;
    }
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0,
      });
      this.onMouseDown(mouseEvent);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      this.onMouseMove(mouseEvent);
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Delete':
        this.deleteSelected();
        break;
      case 'Home':
        this.clearAll();
        break;
      case '+':
      case '=':
        if (this.charges.length < 16) {
          this.charges.push({
            x: this.lastMousePos.x,
            y: this.lastMousePos.y,
            q: 25,
            aux: 0,
          });
        }
        break;
      case '-':
        if (this.charges.length < 16) {
          this.charges.push({
            x: this.lastMousePos.x,
            y: this.lastMousePos.y,
            q: -25,
            aux: 0,
          });
        }
        break;
      case '*':
        if (this.showEquipotentials) {
          this.addEquipotentialAtPosition(this.lastMousePos);
        }
        break;
      case 'Shift':
        this.showCharges = true;
        this.showChargesCheckbox.checked = true;
        break;
    }
  }

  private findChargeAt(pos: { x: number; y: number }): number | null {
    const threshold = 15;
    for (let i = 0; i < this.charges.length; i++) {
      const charge = this.charges[i];
      const dx = pos.x - charge.x;
      const dy = pos.y - charge.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold) {
        return i;
      }
    }
    return null;
  }

  private addEquipotentialAtPosition(pos: { x: number; y: number }): void {
    if (this.equipotentials.length >= 16) return;

    // Calculate potential at position
    let phi = 0;
    for (const charge of this.charges) {
      const dx = pos.x - charge.x;
      const dy = pos.y - charge.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      phi += charge.q / Math.max(dist, 0.1);
    }

    if (Math.abs(phi) > 0.01) {
      this.equipotentials.push(phi);
    }
  }

  private deleteSelected(): void {
    if (this.selectedChargeIndex !== null) {
      this.charges.splice(this.selectedChargeIndex, 1);
      this.selectedChargeIndex = null;
    }
  }

  private clearAll(): void {
    this.charges = [];
    this.equipotentials = [];
    this.selectedChargeIndex = null;
    this.isDragging = false;
  }

  private startRenderLoop(): void {
    const render = () => {
      // Only render if renderer is properly initialized
      if (this.renderer) {
        this.renderer.setCharges(this.charges);
        
        if (this.showEquipotentials) {
          this.renderer.setEquipotentials(this.equipotentials);
        } else {
          this.renderer.setEquipotentials([]);
        }

        this.renderer.render(this.showCharges, this.showLines);
      }
      requestAnimationFrame(render);
    };
    render();
  }

  private showError(message: string): void {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <h2>WebGPU Ошибка</h2>
      <p style="color: #ff6b6b; font-weight: bold;">${message}</p>
      <div style="margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px;">
        <h3>Как включить WebGPU:</h3>
        <div style="margin: 10px 0;">
          <strong>Chrome/Edge:</strong>
          <ol>
            <li>Откройте <code>chrome://flags</code> или <code>edge://flags</code></li>
            <li>Найдите "Unsafe WebGPU" и включите его</li>
            <li>Перезапустите браузер</li>
          </ol>
        </div>
        <div style="margin: 10px 0;">
          <strong>Альтернативные браузеры:</strong>
          <ul>
            <li>Chrome Canary с включенным WebGPU</li>
            <li>Firefox Nightly с включенным <code>dom.webgpu.enabled</code></li>
          </ul>
        </div>
        <div style="margin: 10px 0;">
          <strong>Системные требования:</strong>
          <ul>
            <li>Современная видеокарта (DirectX 12 / Vulkan)</li>
            <li>Обновленные драйверы видеокарты</li>
            <li>Windows 10+, macOS 10.15+, или современный Linux</li>
          </ul>
        </div>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        <button onclick="window.location.href='/fallback.html'" style="
          background: #4ecdc4;
          color: #1a1a1a;
          border: none;
          padding: 15px 25px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          margin: 5px;
        ">🎨 Попробовать упрощенную версию</button>
        <button onclick="window.location.reload()" style="
          background: #ffa500;
          color: #1a1a1a;
          border: none;
          padding: 15px 25px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-size: 16px;
          margin: 5px;
        ">🔄 Перезагрузить</button>
      </div>
      <div style="margin-top: 15px; font-size: 0.9em; color: #888;">
        <strong>Техническая информация:</strong><br>
        Браузер: ${navigator.userAgent}<br>
        WebGPU доступен: ${!!navigator.gpu ? 'Да' : 'Нет'}
      </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Add some basic styling
    const style = document.createElement('style');
    style.textContent = `
      .error-message {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1a1a1a;
        color: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
      }
      .error-message h2 {
        margin-top: 0;
        color: #ff6b6b;
      }
      .error-message h3 {
        color: #4ecdc4;
        margin-bottom: 10px;
      }
      .error-message code {
        background: #333;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: Monaco, Consolas, monospace;
      }
      .error-message ol, .error-message ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      .error-message li {
        margin: 5px 0;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize the application
const app = new ElectrostaticFieldVisualizer();
app.init().catch(console.error);
