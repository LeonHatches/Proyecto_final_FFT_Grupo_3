# Detector de anomalías en el pulso mediante FFT

Aplicación web desarrollada con **Django, Python y C++** para analizar audio cardíaco en formato WAV, estimar las pulsaciones por minuto (BPM), calcular intervalos RR y señalar posibles anomalías a partir del procesamiento de la señal.

> 🏆 **3.er lugar — Feria de Proyectos de Ingeniería de Sistemas, Universidad Nacional de San Agustín de Arequipa (UNSA), diciembre de 2025.**

## Descripción

El sistema permite trabajar con una grabación realizada desde el navegador o con un archivo WAV cargado por el usuario. La señal se procesa mediante técnicas de análisis en el dominio de la frecuencia y detección de picos para obtener métricas asociadas al pulso.

El procesamiento principal cuenta con una implementación nativa en **C++17**, integrada con Python mediante **pybind11**. Si la extensión nativa no está disponible, el sistema utiliza una implementación alternativa en Python con **NumPy** y **SciPy**.

## Funcionalidades

- Grabación de audio desde el navegador mediante el micrófono.
- Carga de archivos WAV por selección o arrastrar y soltar.
- Validación de archivos WAV.
- Límite de carga de hasta 50 MB.
- Procesamiento mediante FFT/IFFT.
- Filtrado de frecuencias de interés entre **20 y 150 Hz**.
- Cálculo de la envolvente de la señal.
- Detección de picos.
- Estimación de **BPM**.
- Cálculo de **intervalos RR**.
- Detección indicativa de:
  - bradicardia;
  - taquicardia;
  - irregularidad a partir de la variabilidad de intervalos RR.
- Visualización web de resultados.
- Generación de un identificador por análisis y almacenamiento temporal de resultados en sesión.

## Flujo de procesamiento

```text
Audio WAV
   ↓
Normalización
   ↓
FFT
   ↓
Filtrado 20–150 Hz
   ↓
IFFT
   ↓
Cálculo de envolvente
   ↓
Detección de picos
   ↓
Intervalos RR
   ↓
BPM y análisis de variabilidad
   ↓
Resultados
```

## Tecnologías

| Área | Tecnologías |
| --- | --- |
| Backend | Python, Django |
| Procesamiento | NumPy, SciPy |
| Módulo nativo | C++17, pybind11 |
| Frontend | HTML, CSS, JavaScript, Bootstrap |
| Persistencia local | SQLite / sesiones de Django |
| Audio | WAV, Web Audio API / MediaDevices |

## Requisitos del audio

Para el procesamiento desde archivo, el backend espera:

- formato **WAV**;
- audio **mono**;
- muestras de **16 bits**;
- tamaño máximo de **50 MB**.

Las grabaciones realizadas desde la interfaz web se convierten a WAV antes de enviarse al servidor.

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/LeonHatches/Proyecto_final_FFT_Grupo_3.git
cd Proyecto_final_FFT_Grupo_3
```

### 2. Crear un entorno virtual

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

Linux/macOS:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Preparar Django

```bash
cd fft_project/cardiac_project
python manage.py migrate
```

### 5. Ejecutar el servidor

```bash
python manage.py runserver
```

Luego abre:

```text
http://127.0.0.1:8000/
```

## Módulo C++ opcional

El proyecto incluye una extensión nativa que implementa el procesamiento en C++ y se comunica con Python mediante pybind11.

Código fuente:

```text
fft_project/cpp_module/cardiac_native.cpp
```

Configuración de compilación:

```text
fft_project/cpp_module/setup.py
```

Para compilar localmente:

```bash
cd fft_project/cpp_module
python setup.py build_ext --inplace
```

El binario generado debe quedar disponible para el módulo:

```text
fft_project/cardiac_project/processing/
```

El repositorio contiene un binario `.pyd` y bibliotecas de ejecución para Windows. Si dicho binario no es compatible con tu versión de Python o tu sistema operativo, recompila la extensión localmente. Si la extensión C++ no puede cargarse, la aplicación utiliza automáticamente el procesamiento equivalente en Python.

> El `setup.py` actual utiliza opciones de compilación compatibles con toolchains tipo GCC/MinGW y C++17.

## Estructura principal

```text
Proyecto_final_FFT_Grupo_3/
├── requirements.txt
└── fft_project/
    ├── cpp_module/
    │   ├── cardiac_native.cpp
    │   └── setup.py
    └── cardiac_project/
        ├── manage.py
        ├── cardiac_project/
        │   ├── settings.py
        │   └── urls.py
        ├── monitor/
        │   ├── forms.py
        │   ├── views.py
        │   ├── templates/
        │   └── static/
        └── processing/
            ├── audio_processor.py
            ├── cpp_bridge.py
            └── cardiac_native.pyd
```

## Algoritmo

La implementación procesa la señal siguiendo estas etapas:

1. Lectura y normalización del audio.
2. Transformada rápida de Fourier (**FFT**).
3. Eliminación de componentes fuera del rango de 20–150 Hz.
4. Transformada inversa (**IFFT**).
5. Obtención de una envolvente suavizada.
6. Detección de máximos separados por una distancia mínima.
7. Cálculo de intervalos RR entre picos consecutivos.
8. Estimación de BPM a partir del intervalo RR promedio.
9. Evaluación de umbrales para generar alertas indicativas.

Actualmente el sistema utiliza, entre otros criterios:

- **Bradicardia:** BPM < 60.
- **Taquicardia:** BPM > 100.
- **Variabilidad RR:** análisis mediante desviación estándar de los intervalos (SDNN).

## Consideraciones de seguridad

Este proyecto fue desarrollado con fines **académicos y demostrativos**.

**No es un dispositivo médico, no ha sido presentado como herramienta clínicamente validada y no debe utilizarse para diagnosticar enfermedades ni sustituir la evaluación de un profesional de salud.**

La propia aplicación muestra un aviso legal antes de permitir el uso del sistema.

Además, la configuración actual de Django está preparada para desarrollo local (`DEBUG = True`). Antes de un despliegue real deben revisarse, como mínimo, la gestión de `SECRET_KEY`, `ALLOWED_HOSTS`, HTTPS, archivos subidos y demás configuraciones de seguridad.

## Contexto académico

Proyecto desarrollado como trabajo grupal de Ingeniería de Sistemas en la **Universidad Nacional de San Agustín de Arequipa (UNSA)**.

El proyecto obtuvo el **3.er lugar en la Feria de Proyectos de Ingeniería de Sistemas de la UNSA, diciembre de 2025**.

## Autoría

Proyecto académico grupal. Repositorio mantenido por [LeonHatches](https://github.com/LeonHatches).
