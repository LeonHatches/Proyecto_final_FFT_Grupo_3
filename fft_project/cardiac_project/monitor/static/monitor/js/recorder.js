// recorder.js
let mediaRecorder;
let audioChunks = [];
let recordingStoppedCallback = null;

// Función para comenzar a grabar
export function startRecording(stream) {
  audioChunks = []; // Limpiar chunks anteriores
  
  // Configurar opciones según soporte del navegador
  let options = { mimeType: 'audio/webm' };
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    options = { mimeType: 'audio/webm;codecs=opus' };
  } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
    options = { mimeType: 'audio/ogg;codecs=opus' };
  }
  
  mediaRecorder = new MediaRecorder(stream, options);
  
  mediaRecorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) {
      audioChunks.push(event.data);
      console.log("Chunk recibido:", event.data.size, "bytes");
    }
  };

  mediaRecorder.onstop = () => {
    console.log("MediaRecorder detenido. Total chunks:", audioChunks.length);
    console.log("Tamaño total de chunks:", audioChunks.reduce((sum, chunk) => sum + chunk.size, 0), "bytes");
    
    // Llamar al callback si existe
    if (recordingStoppedCallback) {
      recordingStoppedCallback(audioChunks);
      recordingStoppedCallback = null;
    }
  };
  
  mediaRecorder.onerror = (event) => {
    console.error("Error en MediaRecorder:", event.error);
  };

  mediaRecorder.start(100); // Capturar chunks cada 100ms
  console.log("Grabación iniciada con formato:", options.mimeType);
}

// Función para detener la grabación con callback
export function stopRecording(callback) {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    recordingStoppedCallback = callback;
    mediaRecorder.stop();
    console.log("Grabación detenida...");
  } else if (callback) {
    // Si ya está inactivo, llamar el callback inmediatamente
    callback(audioChunks);
  }
}

// Función para obtener los chunks de audio grabados
export function getAudioChunks() {
  return audioChunks;
}

// Función para resetear los chunks de audio
export function resetAudioChunks() {
  audioChunks = [];
}

// Función para obtener el estado de la grabación
export function getRecordingState() {
  return mediaRecorder ? mediaRecorder.state : 'inactive';
}

// Convertir Blob de audio a WAV
export async function convertToWAV(audioBlob) {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();
    
    fileReader.onload = function(e) {
      audioContext.decodeAudioData(e.target.result, (audioBuffer) => {
        const wavBlob = audioBufferToWav(audioBuffer);
        resolve(wavBlob);
      }, (error) => {
        reject(new Error("Error al decodificar audio: " + error));
      });
    };
    
    fileReader.onerror = () => {
      reject(new Error("Error al leer el archivo de audio"));
    };
    
    fileReader.readAsArrayBuffer(audioBlob);
  });
}

// Convertir AudioBuffer a WAV (PCM 16-bit MONO)
function audioBufferToWav(buffer) {
  const numberOfChannels = 1; // MONO
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  
  // Obtener datos del canal 0 (MONO)
  const data = buffer.getChannelData(0);
  const dataLength = data.length * bytesPerSample;
  const bufferLength = 44 + dataLength;
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // Escribir header WAV (44 bytes)
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Tamaño del chunk fmt
  view.setUint16(20, format, true); // Formato de audio (1 = PCM)
  view.setUint16(22, numberOfChannels, true); // Número de canales
  view.setUint32(24, sampleRate, true); // Frecuencia de muestreo
  view.setUint32(28, sampleRate * blockAlign, true); // Bytes por segundo
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitDepth, true); // Bits por muestra
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Escribir datos de audio (convertir float32 a int16)
  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    // Clamping entre -1 y 1
    const sample = Math.max(-1, Math.min(1, data[i]));
    // Convertir a int16 (rango -32768 a 32767)
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Función auxiliar para escribir strings en el DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}