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
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Archivo subido con éxito", data);
      resolve(data);
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
