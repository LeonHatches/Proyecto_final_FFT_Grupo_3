#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <cmath>
#include <complex>
#include <algorithm>

namespace py = pybind11;

// Estructura para devolver resultados al lado de Python
struct ResultadoAnalisis
{
    double bpm;
    bool bradicardia;
    bool taquicardia;
    bool irregularidad;
    int num_picos;
    std::vector<double> rr_intervals;
    std::vector<std::string> alertas;
};

// FFT sencilla
void fft(std::vector<std::complex<double>> &x)
{
    const size_t N = x.size();
    if (N <= 1)
        return;

    std::vector<std::complex<double>> even(N / 2);
    std::vector<std::complex<double>> odd(N / 2);

    for (size_t i = 0; i < N / 2; i++)
    {
        even[i] = x[i * 2];
        odd[i] = x[i * 2 + 1];
    }

    fft(even);
    fft(odd);

    for (size_t k = 0; k < N / 2; k++)
    {
        std::complex<double> t =
            std::polar(1.0, -2 * M_PI * k / N) * odd[k];
        x[k] = even[k] + t;
        x[k + N / 2] = even[k] - t;
    }
}

// FFT inversa
void ifft(std::vector<std::complex<double>> &X)
{
    for (auto &c : X)
        c = std::conj(c);
    fft(X);
    for (auto &c : X)
        c = std::conj(c) / (double)X.size();
}

// Filtro de frecuencias 20–200 Hz (máscara en frecuencia)
std::vector<double> filtrar_frecuencias(
    const std::vector<double> &audio,
    double sample_rate)
{
    size_t N = audio.size();
    std::vector<std::complex<double>> spectrum(N);

    // Copiar señal real → complejo
    for (size_t i = 0; i < N; i++)
        spectrum[i] = std::complex<double>(audio[i], 0.0);

    // FFT
    fft(spectrum);

    // Crear máscara
    for (size_t i = 0; i < N; i++)
    {
        double freq = (sample_rate * i) / N;

        if (freq < 20.0 || freq > 200.0)
            spectrum[i] = 0.0; // filtrar fuera del rango
    }

    // FFT inversa
    ifft(spectrum);

    // Volver a señal real
    std::vector<double> filtered(N);
    for (size_t i = 0; i < N; i++)
        filtered[i] = spectrum[i].real();

    return filtered;
}

// Calcular envolvente (abs + suavizado)
std::vector<double> calcular_envolvente(
    const std::vector<double> &audio,
    double sample_rate)
{
    size_t N = audio.size();
    std::vector<double> abs_signal(N);

    // Valor absoluto
    for (size_t i = 0; i < N; i++)
        abs_signal[i] = std::abs(audio[i]);

    // Tamaño de ventana de 50 ms
    int window_size = std::max(3, (int)(0.05 * sample_rate));
    if (window_size % 2 == 0)
        window_size++;

    std::vector<double> envelope(N);
    int half = window_size / 2;

    // Media móvil simple
    for (size_t i = 0; i < N; i++)
    {
        double sum = 0.0;
        int count = 0;

        for (int j = -half; j <= half; j++)
        {
            int idx = i + j;
            if (idx >= 0 && idx < N)
            {
                sum += abs_signal[idx];
                count++;
            }
        }
        envelope[i] = sum / count;
    }

    return envelope;
}

// Detectar picos sobre la envolvente
std::vector<int> detectar_picos(
    const std::vector<double> &env,
    double sample_rate)
{
    std::vector<int> peaks;

    double max_env = *std::max_element(env.begin(), env.end());
    double height = max_env * 0.40;
    int min_distance = (int)(0.25 * sample_rate);

    int last_peak = -min_distance;

    for (int i = 1; i < (int)env.size() - 1; i++)
    {
        if (env[i] > height &&
            env[i] > env[i - 1] &&
            env[i] > env[i + 1] &&
            (i - last_peak) >= min_distance)
        {
            peaks.push_back(i);
            last_peak = i;
        }
    }

    return peaks;
}

// Calcular BPM y RR
std::pair<double, std::vector<double>> calcular_bpm_rr(
    const std::vector<int> &peaks,
    double sample_rate)
{
    std::vector<double> rr;

    if (peaks.size() < 2)
        return {0.0, rr};

    for (size_t i = 0; i < peaks.size() - 1; i++)
    {
        double interval =
            (double)(peaks[i + 1] - peaks[i]) / sample_rate;
        rr.push_back(interval);
    }

    if (rr.empty())
        return {0.0, rr};

    double mean_rr = 0.0;
    for (double r : rr)
        mean_rr += r;
    mean_rr /= rr.size();

    double bpm = 60.0 / mean_rr;

    return {bpm, rr};
}

// Detectar anomalías (bradicardia, taquicardia, SDNN)
void detectar_anomalias(
    ResultadoAnalisis &R)
{
    if (R.bpm < 60)
    {
        R.bradicardia = true;
        R.alertas.push_back("Bradicardia detectada (BPM < 60)");
    }
    if (R.bpm > 100)
    {
        R.taquicardia = true;
        R.alertas.push_back("Taquicardia detectada (BPM > 100)");
    }

    if (R.rr_intervals.size() > 1)
    {
        double mean = 0;
        for (double r : R.rr_intervals)
            mean += r;
        mean /= R.rr_intervals.size();

        double sdnn = 0;
        for (double r : R.rr_intervals)
            sdnn += (r - mean) * (r - mean);

        sdnn = std::sqrt(sdnn / R.rr_intervals.size());

        // Umbrales correctos
        if (sdnn < 0.020)
        {
            R.irregularidad = true;
            R.alertas.push_back("Variabilidad muy baja (SDNN < 20 ms)");
        }
        else if (sdnn > 0.200)
        {
            R.irregularidad = true;
            R.alertas.push_back("Variabilidad muy alta (SDNN > 200 ms)");
        }
    }
}

// Punto principal llamado desde Python
ResultadoAnalisis procesar_audio_native(
    const std::vector<double> &audio,
    double sample_rate)
{
    ResultadoAnalisis R{};
    R.bpm = 0;
    R.bradicardia = false;
    R.taquicardia = false;
    R.irregularidad = false;

    // 1. Filtro 20–200 Hz
    auto filtrado = filtrar_frecuencias(audio, sample_rate);

    // 2. Envolvente
    auto env = calcular_envolvente(filtrado, sample_rate);

    // 3. Picos
    auto peaks = detectar_picos(env, sample_rate);
    R.num_picos = peaks.size();

    // 4. BPM y RR
    auto res = calcular_bpm_rr(peaks, sample_rate);
    R.bpm = res.first;
    R.rr_intervals = res.second;

    // 5. Anomalías
    detectar_anomalias(R);

    return R;
}

// PYBIND11: Exponer a Python
PYBIND11_MODULE(cardiac_native, m)
{

    py::class_<ResultadoAnalisis>(m, "ResultadoAnalisis")
        .def_readonly("bpm", &ResultadoAnalisis::bpm)
        .def_readonly("bradicardia", &ResultadoAnalisis::bradicardia)
        .def_readonly("taquicardia", &ResultadoAnalisis::taquicardia)
        .def_readonly("irregularidad", &ResultadoAnalisis::irregularidad)
        .def_readonly("num_picos", &ResultadoAnalisis::num_picos)
        .def_readonly("rr_intervals", &ResultadoAnalisis::rr_intervals)
        .def_readonly("alertas", &ResultadoAnalisis::alertas);

    m.def("procesar_audio_native", &procesar_audio_native,
          "Procesa el audio usando la extensión en C++");
}
