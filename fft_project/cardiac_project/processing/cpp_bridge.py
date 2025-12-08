try:
    import cardiac_native
    CPP_AVAILABLE = True
except ImportError:
    CPP_AVAILABLE = False


def process_audio_cpp(audio_list, sample_rate):
    """
    Llama a la función nativa en C++

    audio_list: lista de floats con la señal normalizada
    sample_rate: frecuencia de muestreo
    """

    if not CPP_AVAILABLE:
        raise ImportError("Extensión C++ no disponible")

    resultado = cardiac_native.procesar_audio_native(audio_list, sample_rate)

    # Convertir a diccionario para audio_processor.py
    return {
        'bpm':           float(resultado.bpm),
        'num_picos':     int(resultado.num_picos),
        'bradicardia':   bool(resultado.bradicardia),
        'taquicardia':   bool(resultado.taquicardia),
        'irregularidad': bool(resultado.irregularidad),
        'intervalos_rr': [float(x) for x in resultado.rr_intervals],
        'alertas':        list(resultado.alertas)
    }
