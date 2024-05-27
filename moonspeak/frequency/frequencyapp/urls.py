from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('submit', views.submit, name='submit'),
    path('result/<str:task_id>', views.result, name='result'),
]
