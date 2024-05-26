from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('submit', views.submit, name='submit'),
    path('result/<int:task_id>', views.result, name='result'),
]
