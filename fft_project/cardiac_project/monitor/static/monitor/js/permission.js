// permission.js
export async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Micrófono habilitado");
    return stream; // Devuelve el stream de audio
  } catch (err) {
    console.error("Permiso de micrófono denegado", err);
  }
}
