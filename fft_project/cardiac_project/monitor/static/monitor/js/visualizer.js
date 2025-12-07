// visualizer.js
let analyserNode;
let animationId;
let isVisualizing = false;
let canvas = null;
let canvasCtx = null;

export function visualizeAudio(stream) {
  // Inicializar canvas si no está inicializado
  if (!canvas) {
    canvas = document.getElementById("audioCanvas");
    if (!canvas) {
      console.error("Canvas no encontrado");
      return;
    }
    canvasCtx = canvas.getContext("2d");
  }
  
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyserNode = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyserNode);

  analyserNode.fftSize = 2048;
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  isVisualizing = true;

  function draw() {
    if (!isVisualizing) {
      return; // Detener animación si se desactivó
    }
    
    animationId = requestAnimationFrame(draw);

    analyserNode.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();

    let sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0; // Normalizar valor entre 0 y 1
      const y = v * canvas.height / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  draw();
}

// Función para detener la visualización
export function stopVisualization() {
  isVisualizing = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  
  // Limpiar el canvas
  if (canvas && canvasCtx) {
    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// Función para obtener el analyser node
export function getAnalyserNode() {
  return analyserNode;
}
