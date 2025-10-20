import { mat4 } from 'gl-matrix';
import {
  fieldVertexShader,
  fieldFragmentShader,
  geometryVertexShader,
  geometryFragmentShader,
} from './shaders';

export interface Charge {
  x: number;
  y: number;
  q: number;
  aux: number;
}

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private format!: GPUTextureFormat;

  private fieldPipeline!: GPURenderPipeline;
  private geometryPipeline!: GPURenderPipeline;

  private fieldVertexBuffer!: GPUBuffer;
  private fieldIndexBuffer!: GPUBuffer;
  private fieldUniformBuffer!: GPUBuffer;
  private chargeStorageBuffer!: GPUBuffer;
  private equipotentialStorageBuffer!: GPUBuffer;
  private fieldBindGroup!: GPUBindGroup;

  private geometryVertexBuffer!: GPUBuffer;
  private geometryIndexBuffer!: GPUBuffer;
  private geometryUniformBuffer!: GPUBuffer;
  private geometryBindGroup!: GPUBindGroup;

  private charges: Charge[] = [];
  private equipotentials: number[] = [];
  private equipotentialPrecision = 0.05;

  private projectionMatrix: mat4 = mat4.create();
  private viewMatrix: mat4 = mat4.create();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init(): Promise<void> {
    // Check WebGPU support with detailed error messages
    if (!navigator.gpu) {
      const userAgent = navigator.userAgent;
      let browserInfo = 'Unknown browser';
      
      if (userAgent.includes('Chrome')) {
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        const version = chromeMatch ? chromeMatch[1] : 'unknown';
        browserInfo = `Chrome ${version}`;
        if (parseInt(version) < 113) {
          throw new Error(`WebGPU требует Chrome 113+ (текущая версия: ${version}). Пожалуйста, обновите браузер.`);
        }
      } else if (userAgent.includes('Firefox')) {
        browserInfo = 'Firefox';
        throw new Error('WebGPU в Firefox находится в экспериментальной стадии. Рекомендуется использовать Chrome 113+ или Edge 113+.');
      } else if (userAgent.includes('Safari')) {
        browserInfo = 'Safari';
        throw new Error('WebGPU в Safari находится в экспериментальной стадии. Рекомендуется использовать Chrome 113+ или Edge 113+.');
      } else if (userAgent.includes('Edge')) {
        const edgeMatch = userAgent.match(/Edg\/(\d+)/);
        const version = edgeMatch ? edgeMatch[1] : 'unknown';
        browserInfo = `Edge ${version}`;
        if (parseInt(version) < 113) {
          throw new Error(`WebGPU требует Edge 113+ (текущая версия: ${version}). Пожалуйста, обновите браузер.`);
        }
      }
      
      throw new Error(`WebGPU не поддерживается в ${browserInfo}. Рекомендуемые браузеры: Chrome 113+, Edge 113+. Убедитесь, что WebGPU включен в настройках браузера.`);
    }

    // Get GPU adapter and device
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Не удалось получить GPU адаптер. Возможно, ваша видеокарта не поддерживает WebGPU или драйверы устарели.');
    }

    try {
      this.device = await adapter.requestDevice();
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.message.includes('blocklist') || error.message.includes('blocked')) {
          throw new Error('WebGPU заблокирован системой безопасности браузера или списком блокировки. Возможные причины:\n\n• Устаревшие драйверы видеокарты\n• Несовместимая видеокарта\n• Система безопасности предприятия\n• Экспериментальные флаги отключены\n\nПопробуйте:\n1. Обновить драйверы видеокарты\n2. Включить "Unsafe WebGPU Support" в chrome://flags\n3. Использовать упрощенную версию приложения');
        }
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Ошибка инициализации WebGPU устройства: ${errorMessage}`);
    }

    // Configure canvas context
    this.context = this.canvas.getContext('webgpu')!;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'premultiplied',
    });

    // Initialize pipelines and buffers
    this.createFieldPipeline();
    this.createGeometryPipeline();
    this.createBuffers();
    this.updateMatrices();
  }

  private createFieldPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: fieldVertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: fieldFragmentShader,
    });

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 20, // 3 floats position + 2 floats texCoord
      attributes: [
        {
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3',
        },
        {
          // texCoord
          shaderLocation: 1,
          offset: 12,
          format: 'float32x2',
        },
      ],
    };

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.fieldPipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  private createGeometryPipeline(): void {
    const vertexShaderModule = this.device.createShaderModule({
      code: geometryVertexShader,
    });

    const fragmentShaderModule = this.device.createShaderModule({
      code: geometryFragmentShader,
    });

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 36, // 3 floats position + 2 floats texCoord + 4 floats color
      attributes: [
        {
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x3',
        },
        {
          // texCoord
          shaderLocation: 1,
          offset: 12,
          format: 'float32x2',
        },
        {
          // color
          shaderLocation: 2,
          offset: 20,
          format: 'float32x4',
        },
      ],
    };

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.geometryPipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [
          {
            format: this.format,
            blend: {
              color: {
                srcFactor: 'src-alpha',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one-minus-src-alpha',
                operation: 'add',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  private createBuffers(): void {
    // Field quad vertices (fullscreen)
    const fieldVertices = new Float32Array([
      // position (x, y, z), texCoord (u, v)
      -1.0, -1.0, 0.0, 0.0, 0.0,
      1.0, -1.0, 0.0, 1.0, 0.0,
      1.0, 1.0, 0.0, 1.0, 1.0,
      -1.0, 1.0, 0.0, 0.0, 1.0,
    ]);

    const fieldIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);

    this.fieldVertexBuffer = this.device.createBuffer({
      size: fieldVertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Float32Array(this.fieldVertexBuffer.getMappedRange()).set(fieldVertices);
    this.fieldVertexBuffer.unmap();

    this.fieldIndexBuffer = this.device.createBuffer({
      size: fieldIndices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
    new Uint16Array(this.fieldIndexBuffer.getMappedRange()).set(fieldIndices);
    this.fieldIndexBuffer.unmap();

    // Uniform buffer for field shader
    this.fieldUniformBuffer = this.device.createBuffer({
      size: 32, // Minimal size: 24 bytes data + 8 bytes padding to align to 16-byte boundary
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Storage buffers
    this.chargeStorageBuffer = this.device.createBuffer({
      size: 16 * 16, // max 16 charges, 16 bytes each
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.equipotentialStorageBuffer = this.device.createBuffer({
      size: 16 * 4, // max 16 equipotentials, 4 bytes each
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Create field bind group
    this.fieldBindGroup = this.device.createBindGroup({
      layout: this.fieldPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.fieldUniformBuffer } },
        { binding: 1, resource: { buffer: this.chargeStorageBuffer } },
        { binding: 2, resource: { buffer: this.equipotentialStorageBuffer } },
      ],
    });

    // Geometry buffers (initialized empty, will be updated when needed)
    this.geometryVertexBuffer = this.device.createBuffer({
      size: 2 * 1024 * 1024, // 2MB for complex field line geometry
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.geometryIndexBuffer = this.device.createBuffer({
      size: 256 * 1024, // 256KB for field line indices
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    // Uniform buffer for geometry shader (projection + view matrices)
    this.geometryUniformBuffer = this.device.createBuffer({
      size: 128, // 2 mat4x4 = 128 bytes
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Create geometry bind group
    this.geometryBindGroup = this.device.createBindGroup({
      layout: this.geometryPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.geometryUniformBuffer } }],
    });
  }

  private updateMatrices(): void {
    // Check if device is available before using it
    if (!this.device) {
      console.warn('WebGPU device not available, skipping matrix update');
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Orthographic projection
    mat4.ortho(
      this.projectionMatrix,
      -width / 2, width / 2,
      -height / 2, height / 2,
      0.1, 100.0
    );

    mat4.identity(this.viewMatrix);
    mat4.translate(this.viewMatrix, this.viewMatrix, [0, 0, -10]);

    // Update uniform buffer only if available
    if (this.geometryUniformBuffer) {
      const matrices = new Float32Array(32);
      matrices.set(this.projectionMatrix, 0);
      matrices.set(this.viewMatrix, 16);
      this.device.queue.writeBuffer(this.geometryUniformBuffer, 0, matrices);
    }
  }

  setCharges(charges: Charge[]): void {
    if (!this.device) {
      console.warn('WebGPU device not available, skipping setCharges');
      return;
    }
    this.charges = charges;
  }

  setEquipotentials(equipotentials: number[]): void {
    if (!this.device) {
      console.warn('WebGPU device not available, skipping setEquipotentials');
      return;
    }
    this.equipotentials = equipotentials;
  }

  resize(width: number, height: number): void {
    // Check if device is available before resizing
    if (!this.device) {
      console.warn('WebGPU device not available, skipping resize');
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.updateMatrices();
  }

  render(showCharges: boolean, showLines: boolean): void {
    // Check if device is available before rendering
    if (!this.device || !this.fieldUniformBuffer || !this.chargeStorageBuffer) {
      console.warn('WebGPU not properly initialized, skipping render');
      return;
    }

    // Update field uniforms
    const uniformData = new Float32Array(8); // 32 bytes / 4 = 8 floats (minimal buffer size)
    uniformData[0] = this.canvas.width;     // canvas.x
    uniformData[1] = this.canvas.height;    // canvas.y
    
    // For vec2u we need to be careful with the data types
    const uint32View = new Uint32Array(uniformData.buffer, 8, 2); // offset 8 bytes, 2 uints
    uint32View[0] = this.charges.length;         // counts.x (numCharges)
    uint32View[1] = this.equipotentials.length;  // counts.y (numEquipotentials)
    
    uniformData[4] = this.equipotentialPrecision; // equipotentialPrecision
    // uniformData[5-7] remain as minimal padding
    this.device.queue.writeBuffer(this.fieldUniformBuffer, 0, uniformData);

    // Update charge storage buffer
    if (this.charges.length > 0) {
      const chargeData = new Float32Array(this.charges.length * 4);
      this.charges.forEach((charge, i) => {
        chargeData[i * 4 + 0] = charge.x;
        chargeData[i * 4 + 1] = charge.y;
        chargeData[i * 4 + 2] = charge.q;
        chargeData[i * 4 + 3] = charge.aux;
      });
      this.device.queue.writeBuffer(this.chargeStorageBuffer, 0, chargeData);
    }

    // Update equipotential storage buffer
    if (this.equipotentials.length > 0) {
      const equipotentialData = new Float32Array(this.equipotentials);
      this.device.queue.writeBuffer(this.equipotentialStorageBuffer, 0, equipotentialData);
    }

    // Begin render pass
    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    // Render field
    renderPass.setPipeline(this.fieldPipeline);
    renderPass.setBindGroup(0, this.fieldBindGroup);
    renderPass.setVertexBuffer(0, this.fieldVertexBuffer);
    renderPass.setIndexBuffer(this.fieldIndexBuffer, 'uint16');
    renderPass.drawIndexed(6);

    // Render charges
    if (showCharges && this.charges.length > 0) {
      this.renderCharges(renderPass);
    }

    // Render field lines
    if (showLines && this.charges.length > 0) {
      this.renderFieldLines(renderPass);
    }

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  private renderCharges(renderPass: GPURenderPassEncoder): void {
    const radius = 15;
    const vertices: number[] = [];
    const indices: number[] = [];

    this.charges.forEach((charge, idx) => {
      const baseIdx = idx * 4;
      const color = charge.q > 0 ? [1, 0.2, 0.2, 0.8] : [0.2, 0.2, 1, 0.8];

      // Create quad for each charge
      vertices.push(
        charge.x - radius, charge.y - radius, 1.0, 0.0, 0.0, ...color,
        charge.x + radius, charge.y - radius, 1.0, 1.0, 0.0, ...color,
        charge.x + radius, charge.y + radius, 1.0, 1.0, 1.0, ...color,
        charge.x - radius, charge.y + radius, 1.0, 0.0, 1.0, ...color
      );

      indices.push(
        baseIdx + 0, baseIdx + 1, baseIdx + 2,
        baseIdx + 0, baseIdx + 2, baseIdx + 3
      );
    });

    if (vertices.length > 0) {
      this.device.queue.writeBuffer(
        this.geometryVertexBuffer,
        0,
        new Float32Array(vertices)
      );
      this.device.queue.writeBuffer(
        this.geometryIndexBuffer,
        0,
        new Uint16Array(indices)
      );

      renderPass.setPipeline(this.geometryPipeline);
      renderPass.setBindGroup(0, this.geometryBindGroup);
      renderPass.setVertexBuffer(0, this.geometryVertexBuffer);
      renderPass.setIndexBuffer(this.geometryIndexBuffer, 'uint16');
      renderPass.drawIndexed(indices.length);
    }
  }

  private renderFieldLines(renderPass: GPURenderPassEncoder): void {
    const vertices: number[] = [];
    const indices: number[] = [];
    let vertexCount = 0;

    const step = 5;
    const killZone = 4;
    const maxSteps = 200;
    const color = [1, 1, 1, 0.1];

    this.charges.forEach((charge) => {
      const numLines = Math.round(Math.abs(charge.q) / 20) + 3;
      const sign = charge.q >= 0 ? 1 : -1;

      for (let j = 0; j < numLines; j++) {
        const angle = (j * 2 * Math.PI) / numLines;
        let px = charge.x + Math.cos(angle) * step;
        let py = charge.y + Math.sin(angle) * step;

        for (let k = 0; k < maxSteps; k++) {
          let ex = 0, ey = 0;
          let shouldBreak = false;

          // Calculate field at current point
          for (const otherCharge of this.charges) {
            const dx = px - otherCharge.x;
            const dy = py - otherCharge.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < killZone) {
              shouldBreak = true;
              break;
            }

            const factor = (sign * otherCharge.q) / (dist * dist * dist);
            ex += dx * factor;
            ey += dy * factor;
          }

          if (shouldBreak) break;

          // Normalize and step
          const len = Math.sqrt(ex * ex + ey * ey);
          if (len < 0.001) break;

          ex = (ex / len) * step;
          ey = (ey / len) * step;

          const nextPx = px + ex;
          const nextPy = py + ey;

          // Draw line segment
          this.addLineSegment(vertices, indices, vertexCount,
            px, py, nextPx, nextPy, color, 2);
          vertexCount += 4;

          px = nextPx;
          py = nextPy;
        }
      }
    });

    if (vertices.length > 0) {
      this.device.queue.writeBuffer(
        this.geometryVertexBuffer,
        0,
        new Float32Array(vertices)
      );
      this.device.queue.writeBuffer(
        this.geometryIndexBuffer,
        0,
        new Uint16Array(indices)
      );

      renderPass.setPipeline(this.geometryPipeline);
      renderPass.setBindGroup(0, this.geometryBindGroup);
      renderPass.setVertexBuffer(0, this.geometryVertexBuffer);
      renderPass.setIndexBuffer(this.geometryIndexBuffer, 'uint16');
      renderPass.drawIndexed(indices.length);
    }
  }

  private addLineSegment(
    vertices: number[],
    indices: number[],
    baseIdx: number,
    x0: number, y0: number,
    x1: number, y1: number,
    color: number[],
    halfWidth: number
  ): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len < 0.001) return;

    const nx = (-dy / len) * halfWidth;
    const ny = (dx / len) * halfWidth;

    vertices.push(
      x0 - nx, y0 - ny, 0.5, 0.0, 0.0, ...color,
      x1 - nx, y1 - ny, 0.5, 1.0, 0.0, ...color,
      x1 + nx, y1 + ny, 0.5, 1.0, 1.0, ...color,
      x0 + nx, y0 + ny, 0.5, 0.0, 1.0, ...color
    );

    indices.push(
      baseIdx + 0, baseIdx + 1, baseIdx + 2,
      baseIdx + 0, baseIdx + 2, baseIdx + 3
    );
  }

  destroy(): void {
    this.fieldVertexBuffer?.destroy();
    this.fieldIndexBuffer?.destroy();
    this.fieldUniformBuffer?.destroy();
    this.chargeStorageBuffer?.destroy();
    this.equipotentialStorageBuffer?.destroy();
    this.geometryVertexBuffer?.destroy();
    this.geometryIndexBuffer?.destroy();
    this.geometryUniformBuffer?.destroy();
  }
}
