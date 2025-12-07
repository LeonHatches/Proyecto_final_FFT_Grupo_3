from django.shortcuts import render, redirect
from django.views import View, generic
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from . import forms
import uuid

class IndexView(generic.TemplateView):
    template_name = "monitor/index.html"

class UploadView(generic.FormView):
    template_name = "monitor/upload.html"
    form_class = forms.UploadForm
    success_url = "/process/"
    
    def form_valid(self, form):
        # Guardar el archivo subido
        audio_file = form.cleaned_data['archivo']
        filename = default_storage.save(f"uploads/{audio_file.name}", audio_file)
        
        # Procesar y redirigir a resultados
        result_id = uuid.uuid4().hex[:10]
        return redirect("results", id=result_id)

class RecordView(generic.TemplateView):
    template_name = "monitor/record.html"

@csrf_exempt
def process_view(request):
    if request.method != "POST":
        return render(request, "monitor/record.html")

    # Grabación enviada desde JavaScript (campo "audio")
    if "audio" in request.FILES:
        audio_file = request.FILES["audio"]
        filename = default_storage.save(f"uploads/{audio_file.name}", audio_file)
        
        # Retornar JSON para JavaScript
        return JsonResponse({
            'status': 'success',
            'message': 'Archivo recibido correctamente',
            'file_name': audio_file.name,
            'file_size': audio_file.size
        })

    # Archivo subido desde <input type="file">
    elif "audio_file" in request.FILES:
        file = request.FILES["audio_file"]
        filename = default_storage.save(f"uploads/{file.name}", file)

    # Grabación enviada (método antiguo)
    elif "blob" in request.POST:
        blob_data = request.FILES["blob"]
        filename = default_storage.save(f"uploads/grabacion.wav", blob_data)
    
    else:
        return JsonResponse({
            'status': 'error',
            'message': 'No se envió ningún archivo'
        }, status=400)

    # Seccion para procesar audio (FFT, etc.)
    # TODO: Implementar procesamiento de audio

    # Simulacion de ID
    result_id = uuid.uuid4().hex[:10]

    return redirect("results", id=result_id)

class ResultsView(generic.TemplateView):
    template_name = "monitor/results.html"
    
    def get_context_data(self, **kwargs): 
        context  = super().get_context_data(**kwargs)
        result_id = self.kwargs.get('id')
        context['resultado_id'] = result_id
        return context
        
