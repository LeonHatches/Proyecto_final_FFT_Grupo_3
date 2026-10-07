# Transformada Rápida de Fourier para la Detección de Anomalías en Audio de Pulso

Aplicación web académica desarrollada con **Django, Python y C++** para procesar audio de pulso mediante la **Transformada Rápida de Fourier (FFT)**, estimar pulsaciones por minuto (BPM), calcular intervalos RR y detectar variaciones básicas del ritmo.

> Feria de Proyectos de Ingeniería de Sistemas, Universidad Nacional de San Agustín de Arequipa (UNSA), diciembre de 2025.**

## Descripción

El sistema permite cargar un archivo WAV o realizar una grabación desde el navegador. La señal se normaliza, se transforma al dominio de la frecuencia mediante FFT, se filtra y luego se reconstruye con IFFT para facilitar la detección de picos asociados a los latidos.

A partir de estos picos se calculan los intervalos RR y los BPM, generando alertas indicativas ante posibles casos de bradicardia, taquicardia o irregularidad del ritmo.

La arquitectura separa la interfaz web, el backend en Django, el procesamiento de audio, el puente entre Python y C++ y el módulo nativo de alto rendimiento.

## Funcionalidades

- Grabación de audio desde el navegador.
- Carga de archivos WAV mediante selección o arrastrar y soltar.
- Validación de formato WAV.
- Procesamiento mediante FFT e IFFT.
- Filtrado espectral entre **20 y 150 Hz**.
- Cálculo de envolvente y detección de picos.
- Estimación de **BPM**.
- Cálculo de **intervalos RR**.
- Análisis de variabilidad mediante SDNN.
- Detección indicativa de bradicardia, taquicardia e irregularidad.
- Visualización web de resultados.
- Procesamiento principal en **C++17** integrado con Python mediante **pybind11**.
- Implementación alternativa en Python con **NumPy** y **SciPy**.

## Flujo de procesamiento

```text
Audio WAV
   ↓
Validación y normalización
   ↓
FFT
   ↓
Filtrado 20–150 Hz
   ↓
IFFT
   ↓
Envolvente de la señal
   ↓
Detección de picos
   ↓
Intervalos RR
   ↓
BPM + análisis de variabilidad
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
| Persistencia | SQLite y sesiones de Django |
| Audio | WAV, MediaDevices / Web Audio API |

## Arquitectura

```text
Interfaz web
     ↓
Backend Django
     ↓
Procesador de audio
     ↓
Bridge Python ↔ C++
     ↓
Módulo nativo C++
```

La interfaz gestiona la carga o grabación del audio. Django recibe el archivo y coordina el análisis. El procesador valida y normaliza la señal; posteriormente utiliza el módulo nativo en C++ cuando está disponible y, en caso contrario, recurre a la implementación en Python.

## Requisitos del audio

Para archivos cargados, el backend espera:

- formato **WAV**;
- audio **mono**;
- muestras de **16 bits**;
- tamaño máximo de **50 MB**.

Las grabaciones realizadas desde la interfaz se convierten a WAV antes de ser enviadas al servidor.

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

### 5. Ejecutar la aplicación

```bash
python manage.py runserver
```

Abrir en el navegador:

```text
http://127.0.0.1:8000/
```

## Módulo C++

El procesamiento nativo se encuentra en:

```text
fft_project/cpp_module/cardiac_native.cpp
```

La extensión se configura mediante:

```text
fft_project/cpp_module/setup.py
```

Para compilarla:

```bash
cd fft_project/cpp_module
python setup.py build_ext --inplace
```

El módulo compilado debe quedar disponible para:

```text
fft_project/cardiac_project/processing/
```

El repositorio incluye un binario `.pyd` orientado a Windows. Si no es compatible con tu versión de Python o tu sistema operativo, se recomienda recompilarlo localmente.

Si la extensión C++ no puede cargarse, la aplicación utiliza automáticamente la implementación equivalente en Python.

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

El procesamiento implementado sigue estas etapas:

1. Lectura y normalización del audio.
2. Aplicación de FFT.
3. Zero-padding cuando es necesario para trabajar con una longitud potencia de 2.
4. Filtrado de componentes fuera del rango de 20–150 Hz.
5. Reconstrucción mediante IFFT.
6. Cálculo de la envolvente.
7. Detección de picos.
8. Cálculo de intervalos RR.
9. Estimación de BPM.
10. Evaluación de variabilidad y generación de alertas.

Entre los criterios implementados se encuentran:

- **Bradicardia:** BPM < 60.
- **Taquicardia:** BPM > 100.
- **Irregularidad:** análisis de la desviación estándar de los intervalos RR (SDNN).

## Resultados del proyecto académico

Durante la evaluación documentada del proyecto:

- se ejecutaron **8 pruebas unitarias**, todas exitosas;
- en una prueba funcional con una señal sintética equivalente a 75 BPM, el sistema obtuvo aproximadamente **75.05 BPM**;
- se validó el reconocimiento de casos simulados de ritmo normal, bradicardia, taquicardia e irregularidad;
- el tiempo de procesamiento de una señal típica de aproximadamente 10 000 muestras se mantuvo por debajo de unos pocos milisegundos;
- las pruebas de complejidad mostraron un comportamiento consistente con **O(N log N)**.

Estos resultados corresponden al entorno experimental y académico descrito en el trabajo del proyecto, principalmente con señales controladas o sintéticas.

## Limitaciones

El proyecto es un **prototipo académico** y no una herramienta médica certificada.

Las pruebas documentadas señalan que todavía se requiere:

- validación con señales reales en condiciones diversas;
- evaluación con bases de datos cardíacas estándar;
- pruebas con distintos usuarios y entornos;
- refinamiento de parámetros frente a ruido y variaciones de grabación;
- validación clínica y cumplimiento de estándares médicos y regulatorios.

## Aviso

**Este sistema no reemplaza una evaluación médica profesional y no debe utilizarse para realizar diagnósticos clínicos.**

La propia aplicación muestra un aviso de términos y condiciones antes de permitir su uso.

Además, la configuración actual de Django corresponde a un entorno de desarrollo. Antes de cualquier despliegue deben revisarse configuraciones como `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, HTTPS y manejo seguro de archivos.

## Contexto académico

Trabajo titulado **“Transformada Rápida de Fourier para la Detección de Anomalías en Audio de Pulso”**, desarrollado en la Universidad Nacional de San Agustín de Arequipa.

El proyecto obtuvo el **3.er lugar en la Feria de Proyectos de Ingeniería de Sistemas de la UNSA, diciembre de 2025**.

## Integrantes

- Tania L. Ayque
- Cristhian M. Bravo
- Romina G. Camargo
- León Hatches
- Fernando G. Luque
- Jose M. Morocco
- Joaquin A. Quispe

Repositorio mantenido por [LeonHatches](https://github.com/LeonHatches).
