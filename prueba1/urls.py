"""
URL configuration for prueba1 project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from usuarios import views as usuarios_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', usuarios_views.list_usuarios, name='list_usuarios'),
    path('dashboard/', usuarios_views.dashboard, name='dashboard'),
    path('crear-ticket/', usuarios_views.crear_ticket, name='crear_ticket'),
    path('completar-ticket/<int:ticket_id>/', usuarios_views.completar_ticket, name='completar_ticket'),
    path('ver-reporte/<int:ticket_id>/', usuarios_views.ver_reporte, name='ver_reporte'),
    path('editar-ticket/<int:ticket_id>/', usuarios_views.editar_ticket, name='editar_ticket'),
    path('eliminar-ticket/<int:ticket_id>/', usuarios_views.eliminar_ticket, name='eliminar_ticket'),
    path('cambiar-estatus/<int:ticket_id>/', usuarios_views.cambiar_estatus, name='cambiar_estatus'),
    path('admin-usuarios/', usuarios_views.admin_usuarios, name='admin_usuarios'),
    path('rechazar-usuario/<int:usuario_id>/', usuarios_views.rechazar_usuario, name='rechazar_usuario'),
    path('editar-usuario/<int:usuario_id>/', usuarios_views.editar_usuario, name='editar_usuario'),
    path('eliminar-usuario/<int:usuario_id>/', usuarios_views.eliminar_usuario, name='eliminar_usuario'),
    path('aceptar-ticket/<int:ticket_id>/', usuarios_views.aceptar_ticket, name='aceptar_ticket'),
    path('asignar-ticket/<int:ticket_id>/', usuarios_views.asignar_ticket, name='asignar_ticket'),
    path('cambiar-urgencia/<int:ticket_id>/', usuarios_views.cambiar_urgencia, name='cambiar_urgencia'),
    path('reasignar-ticket/<int:ticket_id>/', usuarios_views.reasignar_ticket, name='reasignar_ticket'),
    path('poner-en-espera/<int:ticket_id>/', usuarios_views.poner_en_espera, name='poner_en_espera'),
    path('ver-motivo-espera/<int:ticket_id>/', usuarios_views.poner_en_espera, name='ver_motivo_espera'),
path('visualizar-ticket/<int:ticket_id>/', usuarios_views.visualizar_ticket, name='visualizar_ticket'),
    path('cancelar-ticket/<int:ticket_id>/', usuarios_views.cancelar_ticket, name='cancelar_ticket'),
    path('aceptar-usuario/<int:usuario_id>/', usuarios_views.aceptar_usuario, name='aceptar_usuario'),
    path('subir-foto-perfil/', usuarios_views.subir_foto_perfil, name='subir_foto_perfil'),
path('eliminar-foto-perfil/', usuarios_views.eliminar_foto_perfil, name='eliminar_foto_perfil'),
    path('logout/', usuarios_views.logout_view, name='logout'),
]

# Configuración para servir archivos de media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)