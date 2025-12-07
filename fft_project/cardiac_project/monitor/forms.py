from django import forms
from django.core.exceptions import ValidationError
import wave, os

class UploadForm(forms.Form):
    archivo = forms.FileField(label="Archivo de Audio (WAV)")

    def clean_archivo(self):
        audio_file = self.cleaned_data.get("archivo")

        if not audio_file:
            return audio_file

        extension = os.path.splitext(audio_file.name)[1].lower()
        if extension != '.wav':
            raise ValidationError("Debe ser un archivo .wav")

        try:
            audio_file.seek(0)

            with wave.open(audio_file, 'rb') as wave_object:
                if wave_object.getnframes() == 0:
                    raise ValidationError("El archivo WAV está vacío")

            audio_file.seek(0)

        except wave.Error:
            raise ValidationError("El archivo está corrupto o no es formato WAV válido")
        except Exception as e:
            raise ValidationError(f"Error al leer el archivo: {str(e)}")

        return audio_file
