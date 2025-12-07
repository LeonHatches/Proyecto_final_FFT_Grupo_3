from django.shortcuts import render, redirect
from django.views import View, generic
from django.core.files.storage import default_storage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from processing.audio_processor import AudioProcessor
from . import forms
import uuid
import traceback

class IndexView(generic.TemplateView):
    template_name = "monitor/index.html"

class UploadView(generic.FormView):
    template_name = "monitor/upload.html"
    form_class = forms.UploadForm
    
    def form_valid(self, form):
        # Guardar el archivo subido
        audio_file = form.cleaned_data['archivo']
        filename = default_storage.save(f"uploads/{audio_file.name}", audio_file)
        
        # Procesar y redirigir a resultados
        result_id, error_message = run_analysis(filename, self.request)
        
        if not result_id:
            return render(self.request, "monitor/upload.html", {
                "form": form,
                "error": f"Error al procesar: {error_message}"
            })

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
    # Seccion para procesar audio
    if filename:
        result_id, error_message = run_analysis(filename, request)
        
        if result_id:
            return JsonResponse({
                'status': 'success',
                'redirect_url': f'/results/{result_id}/',
                'result_id': result_id
            })
        else:
            return JsonResponse({
                'status': 'error', 
                'message': f'Fallo en análisis: {error_message}'
            }, status=500)
            
    return JsonResponse({'status': 'error', 'message': 'Error al abrir el archivo'}, status=500)

class ResultsView(generic.TemplateView):
    template_name = "monitor/results.html"
    
    def get_context_data(self, **kwargs): 
        context  = super().get_context_data(**kwargs)
        result_id = self.kwargs.get('id')
        datos_analisis = self.request.session.get(f'analysis_{result_id}')
        context['resultado_id'] = result_id
        context['data'] = datos_analisis
        return context
        
def run_analysis(filename, request):

    try:
        file_path = default_storage.path(filename)
        processor = AudioProcessor()
        results   = processor.process_file(file_path)
        result_id = uuid.uuid4().hex[:10]
        request.session[f'analysis_{result_id}'] = results

        return result_id, None
    except Exception as e:
            # Imprime el error completo en la consola negra para que lo veas
            print("\n" + "!"*30)
            print("ERROR EN AUDIO_PROCESSOR:")
            print(e)
            traceback.print_exc() 
            print("!"*30 + "\n")
            return None, str(e)