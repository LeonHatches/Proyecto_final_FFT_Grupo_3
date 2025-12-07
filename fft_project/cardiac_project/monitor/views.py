from django.shortcuts import render, redirect
from django.views import View, generic
from django.core.files.storage import default_storage
from . import forms
import uuid

class IndexView(generic.TemplateView):
    template_name = "monitor/index.html"

class UploadView(generic.FormView):
    template_name = "monitor/upload.html"
    form_class = forms.UploadForm

class RecordView(generic.TemplateView):
    template_name = "monitor/record.html"

def process_view(request):
    if request.method != "POST":
        return render(request, "monitor/record.html")

    # Archivo subido desde <input type="file">
    if "audio_file" in request.FILES:
        file = request.FILES["audio_file"]
        filename = default_storage.save(f"uploads/{file.name}", file)

    # Grabación enviada
    elif "blob" in request.POST:
        blob_data = request.FILES["blob"]
        filename = default_storage.save(f"uploads/grabacion.wav", blob_data)
    
    else:
        return render(request, "monitor/record.html", {"error": "No se envio archivo."})

    # Seccion para procesar video




    # Simulacion de ID
    result_id = uuid.uuid4().hex[:10]

    return redirect("results", id=result_id)

class ResultsView(generic.TemplateView):
    template = "monitor/results.html"
    
    # Dar contexto
    # def get_context_data(self, **kwargs): 
