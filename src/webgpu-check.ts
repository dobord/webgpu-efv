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
      <div style="background: #2a2a2a; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
        <h3 style="color: #4ecdc4; margin-bottom: 15px;">🔧 Как включить WebGPU:</h3>
        <div style="margin: 15px 0;">
          <strong style="color: #ffa500;">Chrome/Edge:</strong>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Перейдите в <code style="background: #333; padding: 2px 6px; border-radius: 4px;">chrome://flags</code></li>
            <li>Найдите "Unsafe WebGPU Support"</li>
            <li>Установите "Enabled"</li>
            <li>Перезапустите браузер</li>
          </ol>
          <p style="color: #ff6b6b; font-size: 0.9em; margin: 10px 0;">
            <strong>Проблема с blocklist?</strong> Обновите драйверы видеокарты и попробуйте снова.
          </p>
        </div>
        <div style="margin: 15px 0;">
          <strong style="color: #ffa500;">Firefox:</strong>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Перейдите в <code style="background: #333; padding: 2px 6px; border-radius: 4px;">about:config</code></li>
            <li>Найдите <code style="background: #333; padding: 2px 6px; border-radius: 4px;">dom.webgpu.enabled</code></li>
            <li>Установите <code style="background: #333; padding: 2px 6px; border-radius: 4px;">true</code></li>
            <li>Перезапустите браузер</li>
          </ol>
        </div>
      </div>
      <div style="background: #2a2a2a; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: left;">
        <h3 style="color: #4ecdc4; margin-bottom: 10px;">💻 Рекомендуемые браузеры:</h3>
        <ul style="padding-left: 20px; margin: 10px 0;">
          <li>Chrome 113+ или Chromium</li>
          <li>Microsoft Edge 113+</li>
          <li>Firefox 110+ (экспериментально)</li>
        </ul>
      </div>
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
}