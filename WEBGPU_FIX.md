# WebGPU Buffer Size Fix

## Проблема
Ошибка: `Buffer is bound with size 32 where the shader expects 48 in group[0] compact index 0`

## Причина
Несоответствие между размером uniform буфера в коде JavaScript/TypeScript и ожидаемым размером структуры в WGSL шейдере из-за неправильного выравнивания данных.

## Исправления

### 1. Исправлена структура Uniforms в шейдере (src/shaders.ts)
**Было:**
```wgsl
struct Uniforms {
  canvasWidth: f32,
  canvasHeight: f32,
  numCharges: u32,
  numEquipotentials: u32,
  equipotentialPrecision: f32,
  padding: vec3f,
}
```

**Стало:**
```wgsl
struct Uniforms {
  canvas: vec2f,              // canvasWidth, canvasHeight (8 bytes)
  counts: vec2u,              // numCharges, numEquipotentials (8 bytes)  
  equipotentialPrecision: f32, // (4 bytes)
  _padding: vec3f,            // padding to align to 16 bytes (12 bytes)
}
```

### 2. Обновлен код доступа к данным в шейдере
- `uniforms.canvasWidth, uniforms.canvasHeight` → `uniforms.canvas`
- `uniforms.numCharges` → `uniforms.counts.x`
- `uniforms.numEquipotentials` → `uniforms.counts.y`

### 3. Исправлена запись данных в буфер (src/webgpu-renderer.ts)
**Было:**
```typescript
const uniformData = new Float32Array(8);
uniformData[0] = this.canvas.width;
uniformData[1] = this.canvas.height;
uniformData[2] = this.charges.length;        // Неправильный тип данных
uniformData[3] = this.equipotentials.length; // Неправильный тип данных
uniformData[4] = this.equipotentialPrecision;
```

**Стало:**
```typescript
const uniformData = new Float32Array(8);
uniformData[0] = this.canvas.width;     // canvas.x
uniformData[1] = this.canvas.height;    // canvas.y

// Правильная запись uint32 данных
const uint32View = new Uint32Array(uniformData.buffer, 8, 2);
uint32View[0] = this.charges.length;         // counts.x
uint32View[1] = this.equipotentials.length;  // counts.y

uniformData[4] = this.equipotentialPrecision;
```

### 4. Уточнен размер буфера
Размер остался 32 байта, но теперь правильно выровнен:
- vec2f canvas: 8 байт
- vec2u counts: 8 байт  
- f32 equipotentialPrecision: 4 байта
- vec3f _padding: 12 байт
- **Итого: 32 байта**

## Результат
Ошибка WebGPU о несоответствии размера буфера должна быть исправлена. Структура данных теперь правильно выровнена согласно требованиям WGSL и WebGPU.