// main.js - Controlador principal de la aplicación
import { requestMicrophonePermission } from './permission.js';
import { startRecording, stopRecording, getAudioChunks, resetAudioChunks, convertToWAV } from './recorder.js';
import { visualizeAudio, stopVisualization, getAnalyserNode } from './visualizer.js';
import { uploadAudio, updateVolumeIndicator } from './uploader.js';

// Variables globales
let stream = null;
let isRecording = false;
let recordingTimer = null;
let recordingSeconds = 0;
let analyserNode = null;
let currentAudioBlob = null; // Para guardar la grabación actual

// Referencias a elementos del DOM
const startButton = document.getElementById("startRecordingButton");
const stopButton = document.getElementById("stopRecordingButton");
const timerDisplay = document.getElementById("recordingTimer");
const volumeIndicator = document.getElementById("volumeIndicator");
const canvas = document.getElementById("audioCanvas");
const loadingSpinner = document.getElementById("loadingSpinner");
const errorMessage = document.getElementById("errorMessage");
const audioPlayerSection = document.getElementById("audioPlayerSection");
const audioPlayer = document.getElementById("audioPlayer");
const uploadButton = document.getElementById("uploadButton");
const discardButton = document.getElementById("discardButton");

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  // Verificar soporte del navegador
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError("Tu navegador no soporta grabación de audio. Usa Chrome, Firefox o Edge.");
    startButton.disabled = true;
    return;
  }

  // Configurar event listeners
  setupEventListeners();
  
  // Inicializar estado de botones
  updateButtonStates();
  
  console.log("Aplicación inicializada correctamente");
}

function setupEventListeners() {
  // Botones de grabación
  startButton.addEventListener("click", handleStartRecording);
  stopButton.addEventListener("click", handleStopRecording);

  // Botones de reproductor de audio
  if (uploadButton) {
    uploadButton.addEventListener("click", handleUploadConfirm);
  }
  if (discardButton) {
    discardButton.addEventListener("click", handleDiscard);
  }
}

// ========== GRABACIÓN DE AUDIO ==========

async function handleStartRecording() {
  try {
    showError(""); // Limpiar mensajes previos
    hideLoading();
    
    // Solicitar permiso de micrófono
    stream = await requestMicrophonePermission();
    
    if (!stream) {
      showError("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
      return;
    }

    // Resetear chunks de audio previos
    resetAudioChunks();
    
    // Iniciar grabación
    startRecording(stream);
    isRecording = true;
    
    // Iniciar visualización
    visualizeAudio(stream);
    analyserNode = getAnalyserNode();
    
    // Iniciar timer
    startTimer();
    
    // Iniciar indicador de volumen
    startVolumeIndicator();
    
    // Actualizar UI
    updateButtonStates();
    
    console.log("Grabación iniciada exitosamente");
    
  } catch (error) {
    console.error("Error al iniciar grabación:", error);
    showError("Error al iniciar la grabación: " + error.message);
    resetRecordingState();
  }
}

function handleStopRecording() {
  try {
    // Detener grabación con callback
    stopRecording(async (audioChunks) => {
      isRecording = false;
      
      // Detener visualización
      stopVisualization();
      
      // Detener timer
      stopTimer();
      
      // Detener stream de audio
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      
      // Procesar audio grabado
      console.log("Chunks recibidos:", audioChunks.length);
      
      if (audioChunks.length > 0) {
        // Usar el tipo MIME correcto según lo que se grabó
        const mimeType = audioChunks[0].type || 'audio/webm';
        const audioBlob = new Blob(audioChunks, { type: mimeType });
        
        console.log("Blob creado - Tipo:", audioBlob.type, "Tamaño:", audioBlob.size, "bytes");
        const wavBlob = await convertToWAV(audioBlob);

        // Validar tamaño
        if (wavBlob.size < 1000) {
          showError("La grabación es demasiado corta. Intenta grabar por más tiempo.");
          resetRecordingState();
          return;
        }
        
        // Guardar el blob y mostrar reproductor
        currentAudioBlob = wavBlob;
        showAudioPlayer(wavBlob);
        
        console.log("Grabación completada exitosamente");
      } else {
        showError("No se grabó ningún audio. Intenta de nuevo.");
      }
      
      // Actualizar UI
      updateButtonStates();
      
      console.log("Grabación detenida");
    });
    
  } catch (error) {
    console.error("Error al detener grabación:", error);
    showError("Error al detener la grabación: " + error.message);
    resetRecordingState();
  }
}

function showAudioPlayer(audioBlob) {
  // Crear URL del audio
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Configurar reproductor
  audioPlayer.src = audioUrl;
  audioPlayerSection.style.display = 'block';
  
  // Scroll hacia el reproductor
  audioPlayerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleUploadConfirm() {
  if (!currentAudioBlob) {
    showError("No hay audio para subir.");
    return;
  }
  
  showLoading("Subiendo audio...");
  
  uploadAudio(currentAudioBlob)
    .then(() => {
      hideLoading();
      showSuccess("¡Audio subido correctamente!");
      
      // Limpiar
      handleDiscard();
    })
    .catch(error => {
      hideLoading();
      showError("Error al subir el audio: " + error.message);
    });
}

function handleDiscard() {
  // Limpiar reproductor
  if (audioPlayer.src) {
    URL.revokeObjectURL(audioPlayer.src);
    audioPlayer.src = '';
  }
  
  // Ocultar sección
  audioPlayerSection.style.display = 'none';
  
  // Limpiar blob
  currentAudioBlob = null;
  
  // Resetear timer
  recordingSeconds = 0;
  updateTimerDisplay();
  
  console.log("Audio descartado");
}

function resetRecordingState() {
  isRecording = false;
  stopTimer();
  stopVisualization();
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  updateButtonStates();
}

// ========== TIMER DE GRABACIÓN ==========

function startTimer() {
  recordingSeconds = 0;
  updateTimerDisplay();
  
  recordingTimer = setInterval(() => {
    recordingSeconds++;
    updateTimerDisplay();
    
    // Límite de 5 minutos (300 segundos)
    if (recordingSeconds >= 300) {
      handleStopRecording();
      showError("Se alcanzó el límite de 5 minutos de grabación.");
    }
  }, 1000);
}

function stopTimer() {
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }
}

function updateTimerDisplay() {
  if (timerDisplay) {
    const minutes = Math.floor(recordingSeconds / 60);
    const seconds = recordingSeconds % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

// ========== INDICADOR DE VOLUMEN ==========

function startVolumeIndicator() {
  function updateVolume() {
    if (isRecording && analyserNode) {
      updateVolumeIndicator(analyserNode);
      requestAnimationFrame(updateVolume);
    }
  }
  updateVolume();
}

// ========== DRAG & DROP ==========

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function handleFileSelect(e) {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
}

function processFile(file) {
  // Validar SOLO archivos WAV
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.wav')) {
    showError("Solo se aceptan archivos .WAV. Tu archivo: " + file.name);
    return;
  }
  
  // Validar tamaño (máximo 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    showError("El archivo es demasiado grande. Tamaño máximo: 50MB");
    return;
  }
  
  // Validar que sea un archivo de audio WAV
  if (!file.type.includes('audio') && !file.type.includes('wav')) {
    showError("El archivo no es un audio válido. Asegúrate de subir un archivo .WAV");
    return;
  }
  
  // Procesar archivo
  console.log("Procesando archivo:", file.name);
  showLoading("Subiendo y procesando archivo...");
  showError("");
  
  // Convertir a Blob si es necesario
  const audioBlob = file instanceof Blob ? file : new Blob([file], { type: file.type });
  
  // Subir archivo
  uploadAudio(audioBlob, file.name)
    .then(() => {
      hideLoading();
      console.log("Archivo procesado exitosamente");
    })
    .catch(error => {
      hideLoading();
      showError("Error al procesar el archivo: " + error.message);
    });
}

// ========== UI HELPERS ==========

function updateButtonStates() {
  if (isRecording) {
    startButton.disabled = true;
    stopButton.disabled = false;
    startButton.classList.add('disabled');
    stopButton.classList.remove('disabled');
  } else {
    startButton.disabled = false;
    stopButton.disabled = true;
    startButton.classList.remove('disabled');
    stopButton.classList.add('disabled');
  }
}

function showLoading(message = "Procesando...") {
  if (loadingSpinner) {
    loadingSpinner.style.display = 'flex';
    const loadingText = loadingSpinner.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
  }
}

function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.style.display = 'none';
  }
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = message ? 'block' : 'none';
    
    if (message) {
      errorMessage.classList.add('show');
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        errorMessage.classList.remove('show');
        setTimeout(() => {
          errorMessage.style.display = 'none';
        }, 300);
      }, 5000);
    }
  }
}

function showSuccess(message) {
  const successMessage = document.getElementById('successMessage');
  if (successMessage) {
    successMessage.textContent = message;
    successMessage.style.display = message ? 'block' : 'none';
    
    if (message) {
      successMessage.classList.add('show');
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        successMessage.classList.remove('show');
        setTimeout(() => {
          successMessage.style.display = 'none';
        }, 300);
      }, 5000);
    }
  }
}

// Exportar funciones para uso externo si es necesario
export {
  handleStartRecording,
  handleStopRecording,
  processFile,
  showError,
  showSuccess,
  showLoading,
  hideLoading
};
