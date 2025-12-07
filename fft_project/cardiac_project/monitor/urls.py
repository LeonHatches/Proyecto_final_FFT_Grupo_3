from django.urls import path
from . import views

urlpatterns = [
    path("", views.IndexView.as_view(), name="index"),
    path("upload/", views.UploadView.as_view(), name="upload"),
    path("record/", views.RecordView.as_view(), name="record"),
    path("process/", views.process_view, name="process"),
    path("results/<str:id>/", views.ResultsView.as_view(), name="results"),
]
