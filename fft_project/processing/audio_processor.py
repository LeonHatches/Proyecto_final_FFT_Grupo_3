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