from django.urls import path
from . import views


urlpatterns = [
    path('', views.index, name='index'),
    path('api/submit', views.submit, name='submit'),
    path('api/result/<str:task_id>', views.result, name='result'),
    path('api/<path:badpath>', views.api_404_catchall, name='catchall'),
]
