#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include <vector>
#include <cmath>
#include <complex>
#include <algorithm>

namespace py = pybind11;

// Estructura para devolver resultados al lado de Python
struct ResultadoAnalisis {
    double bpm;
    bool bradicardia;
    bool taquicardia;
    bool irregularidad;
    int num_picos;
    std::vector<double> rr_intervals;
    std::vector<std::string> alertas;
};

// FFT sencilla 
void fft(std::vector<std::complex<double>>& x) {
    const size_t N = x.size();
    if (N <= 1) return;

    std::vector<std::complex<double>> even(N / 2);
    std::vector<std::complex<double>> odd(N / 2);

    for (size_t i = 0; i < N / 2; i++) {
        even[i] = x[i * 2];
        odd[i]  = x[i * 2 + 1];
    }

    fft(even);
    fft(odd);

    for (size_t k = 0; k < N / 2; k++) {
        std::complex<double> t = 
            std::polar(1.0, -2 * M_PI * k / N) * odd[k];
        x[k]       = even[k] + t;
        x[k+N/2]   = even[k] - t;
    }
}

// FFT inversa
void ifft(std::vector<std::complex<double>>& X) {
    for (auto &c : X) c = std::conj(c);
    fft(X);
    for (auto &c : X) c = std::conj(c) / (double)X.size();
}



// PYBIND11: Exponer a Python
PYBIND11_MODULE(cardiac_native, m) {

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
