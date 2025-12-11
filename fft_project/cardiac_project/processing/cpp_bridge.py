
import os
import sys
from datetime import datetime

# Forzar uso de Python puro en caso de emergencia
FORCE_PYTHON_ONLY = False

# Agregar el directorio actual al sys.path si no está
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    if not FORCE_PYTHON_ONLY:
        import cardiac_native
        CPP_AVAILABLE = True

    else:
        raise ImportError("Error al leer el archivo C++")
    
except ImportError as e:
    CPP_AVAILABLE = False


def process_audio_cpp(audio_list, sample_rate):
    
    if not CPP_AVAILABLE:
        raise ImportError("Extensión C++ no disponible.")
    
    # Llamar a la función C++
    resultado = cardiac_native.procesar_audio_native(audio_list, sample_rate)
    
    # Convertir el objeto ResultadoAnalisis a diccionario Python
    return {
        'fecha':         datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        'bpm':           float(resultado.bpm),
        'num_picos':     int(resultado.num_picos),
        'bradicardia':   bool(resultado.bradicardia),
        'taquicardia':   bool(resultado.taquicardia),
        'irregularidad': bool(resultado.irregularidad),
        'intervalos_rr': [float(x) for x in resultado.rr_intervals],
        'alertas':       list(resultado.alertas)
    }