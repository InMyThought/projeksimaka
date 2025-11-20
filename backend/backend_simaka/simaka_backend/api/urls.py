# simaka_backend/api/urls.py
from django.urls import path
from api import views

urlpatterns = [
    path('students/', views.get_students),
    path('students/<int:pk>/', views.delete_student), # Endpoint delete spesifik
    path('attendance/', views.update_attendance),
    path('settings/', views.get_settings),
    path('reports/', views.get_reports),
    path('reports/export/', views.export_reports), # Endpoint export baru
    path('teachers/', views.teachers_view),
    path('teachers/<int:pk>/', views.teacher_detail),
]