// uploader.js
export function uploadAudio(audioBlob, fileName = "audio.wav") {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, fileName);

    fetch("/process/", {
      method: "POST",
      body: formData,
    })
    .then(response => {
      return response.json().then(data => {  // ← Parsear primero
        if (!response.ok) {
          throw new Error(data.message || `Error HTTP: ${response.status}`);
        }
        return data;
      });
    })
    .then(data => {
      if (data.status === 'success' && data.redirect_url) {
        window.location.href = data.redirect_url;
        resolve(data);
      } else {
        throw new Error(data.message || "No se recibió URL");
      }
    })
    .catch(error => {
      console.error("Error al subir el archivo", error);
      reject(error);
    });
  });
}

export function updateVolumeIndicator(analyserNode) {
  if (!analyserNode) {
    return;
  }
  
  const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
  analyserNode.getByteFrequencyData(dataArray);
  
  let sum = 0;
  dataArray.forEach(value => sum += value);
  let averageVolume = sum / dataArray.length;

  const volumeIndicator = document.getElementById("volumeIndicator");
  if (!volumeIndicator) {
    return;
  }
  
  if (averageVolume < 50) {
    volumeIndicator.style.backgroundColor = "green";
    volumeIndicator.setAttribute('data-level', 'low');
  } else if (averageVolume < 100) {
    volumeIndicator.style.backgroundColor = "yellow";
    volumeIndicator.setAttribute('data-level', 'medium');
  } else {
    volumeIndicator.style.backgroundColor = "red";
    volumeIndicator.setAttribute('data-level', 'high');
  }
}
