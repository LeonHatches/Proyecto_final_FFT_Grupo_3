import numpy as np
from scipy import signal
from scipy.fft import rfft, rfftfreq, irfft
import wave

# Intenta importar el módulo C++
try:
    from processing.cpp_bridge import process_audio_cpp, CPP_AVAILABLE
except ImportError:
    CPP_AVAILABLE = False

class AudioProcessor:
    
    def __init__(self):
        self.sample_rate = None
        self.audio_data  = None
        self.use_cpp     = CPP_AVAILABLE

    def process_file(self, file_path):

        # Cargar archivo
        sample_rate, audio_data = self.load_wav_file(file_path)
        
        # Procesar
        result = self.process_audio(audio_data, sample_rate)
        
        return result
    
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
    
    def process_audio(self, audio_data, sample_rate):
        
        try:
            if self.use_cpp and CPP_AVAILABLE:
                return process_audio_cpp(audio_data.tolist(), sample_rate)
            else:
                raise Exception("Error de procesamiento eficiente")
            
        except Exception as e:
            return self._process_python(audio_data, sample_rate)
        
    # Implementar lo de C++ en Python 
    def _process_python(self, audio_data, sample_rate):
        
        filtered_audio    = self._filter_frequencies(audio_data, sample_rate)
        peaks             = self._detect_peaks(filtered_audio, sample_rate)
        bpm, rr_intervals = self._calculate_bpm(peaks, sample_rate)
        anomalies         = self._detect_anomalies(bpm, rr_intervals)

        result = {
            'bpm':           float(bpm),
            'num_picos':     len(peaks),
            'bradicardia':   anomalies['bradicardia'],
            'taquicardia':   anomalies['taquicardia'],
            'irregularidad': anomalies['irregularidad'],
            'intervalos_rr': [float(x) for x in rr_intervals],
            'alertas':       anomalies['alertas']
        }

        return result
    
    # FFT y Filtrado con scipy
    def _filter_frequencies(self, audio_data, sample_rate):
        
        # Aplica FFT
        spectrum = rfft(audio_data)

        # Obtiene ejes de frecuencias
        n = len(audio_data)
        frequencies = rfftfreq(n, d=1/sample_rate)

        # Crea el filtro para frecuencias entre 20 y 200
        mask = (frequencies >= 20.0) & (frequencies <= 200.0)

        # Crea filtro de multiplicación en el dominio de la frecuencia y FFT inversa
        filtered_spectrum = spectrum * mask
        filtered_audio = irfft(filtered_spectrum)

        return filtered_audio

    # Detección de picos OPTIMIZADA
    def _detect_peaks(self, audio_data, sample_rate):

        # Calcular envolvente (Esto está excelente, MANTENERLO)
        envelope = self._calculate_envelope(audio_data, sample_rate)

        # Parámetros de detección
        height = np.max(envelope) * 0.4
        distance = int(0.25 * sample_rate) 
        
        # Detectar picos
        peaks, _ = signal.find_peaks(
            envelope,
            height=height,
            distance=distance
        )
        
        return peaks
    
    def _calculate_envelope(self, audio_data, sample_rate):

        # Valor absoluto
        abs_signal = np.abs(audio_data)
        
        # Ventana para suavizado (50ms)
        window_size = int(0.05 * sample_rate)
        if window_size % 2 == 0:
            window_size += 1
        
        # Suavizado con media móvil
        envelope = signal.savgol_filter(abs_signal, window_size, 3)
        
        return envelope
    
    def _calculate_bpm(self, peaks, sample_rate):

        if len(peaks) < 2:
            return 0.0, []
        
        # Calcular intervalos RR (en segundos)
        rr_intervals = []
        for i in range(len(peaks) - 1):
            interval_samples = peaks[i + 1] - peaks[i]
            interval_seconds = interval_samples / sample_rate
            rr_intervals.append(interval_seconds)
        
        # BPM promedio
        if len(rr_intervals) > 0:
            avg_rr = np.mean(rr_intervals)
            bpm = 60.0 / avg_rr if avg_rr > 0 else 0.0
        else:
            bpm = 0.0
        
        return bpm, rr_intervals
    
    def _detect_anomalies(self, bpm, rr_intervals):

        anomalies = {
            'bradicardia': False,
            'taquicardia': False,
            'irregularidad': False,
            'alertas': []
        }
        
        # Si no hay datos suficientes
        if bpm == 0 or len(rr_intervals) < 2:
            anomalies['alertas'].append('Datos Insuficientes')
            return anomalies
        
        # Detectar bradicardia (< 60 BPM)
        if bpm < 60:
            anomalies['bradicardia'] = True
            anomalies['alertas'].append('Bradicardia detectada (BPM < 60)')
        
        # Detectar taquicardia (> 100 BPM)
        if bpm > 100:
            anomalies['taquicardia'] = True
            anomalies['alertas'].append('Taquicardia detectada (BPM > 100)')
        
        # Calcular SDNN (desviación estándar de intervalos RR)
        if len(rr_intervals) > 1:
            sdnn = np.std(rr_intervals)
            
            # Detectar irregularidad
            if sdnn < 0.020:    # < 20ms
                anomalies['irregularidad'] = True
                anomalies['alertas'].append(
                    'Variabilidad muy baja (SDNN < 20ms) - Rigidez cardíaca'
                )
            elif sdnn > 0.200:  # > 200ms
                anomalies['irregularidad'] = True
                anomalies['alertas'].append(
                    'Variabilidad muy alta (SDNN > 200ms) - Posible arritmia'
                )
        
        # Si todo está normal
        if not anomalies['alertas']:
            anomalies['alertas'].append('Ritmo cardíaco dentro de parámetros normales')
        
        return anomalies