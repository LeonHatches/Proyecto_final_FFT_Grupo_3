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
