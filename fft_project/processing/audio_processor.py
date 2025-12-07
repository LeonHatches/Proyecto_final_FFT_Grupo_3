import numpy as np
from scipy import signal
from scipy.io import wavfile
import wave
import struct

# Intenta importar el módulo C++
try:
    from processing.cpp_bridge import process_audio
except ImportError:
    CPP_AVAILABLE = False

class AudioProcessor:
    
    def __init__(self):
        self.sample_rate = None
        self.audio_data  = None
        self.use_cpp     = CPP_AVAILABLE

    def load_wav_file(self, file_path):
        
        try:
            with wave.open(file_path, 'rb') as wav_file:
                n_channels = wav_file.getnchannels()
                sampwidth  = wav_file.getsampwidth()
                framerate  = wav_file.getframerate()
                n_frames   = wav_file.getnframes()
                
                if n_channels != 1:
                    raise ValueError("El audio debe ser mono")
                
                if sampwidth != 2:
                    raise ValueError("El audio debe ser de 16 bits")
                
                raw_data         = wav_file.readframes(n_frames)
                audip_int16      = np.frombuffer(raw_data, dtype=np.int16)
                audio_normalized = self._normalize_audio(audip_int16)

                self.sample_rate = framerate
                self.audio_data = audio_normalized

                return framerate, audio_normalized
        
        except FileNotFoundError:
            raise ValueError("Archivo no encontrado")
        except Exception as e:
            ValueError("Error al leer WAV")


    def _normalize_audio(self, audio_int16):
        return audio_int16.astype(np.float64) / 32768.0