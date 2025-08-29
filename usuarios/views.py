from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.core.paginator import Paginator
import os
from django.core.mail import send_mail
from django.db.models import Case, When, Value, IntegerField
import pytz
from django.db.models import Q
from django.conf import settings
from .models import Usuario, Ticket, ImagenTicket, ReporteFinalizacion, ImagenReporte, CancelacionTicket, MotivoEspera

def list_usuarios(request):
    # Manejar registro
    if request.method == 'POST' and 'nombre' in request.POST:
        nombre = request.POST.get('nombre')
        apellido = request.POST.get('apellido')
        email = request.POST.get('email')
        password = request.POST.get('contrasena', '')
        rol = request.POST.get('rol', 'usuario')
        
        # Validación SOLO para admin (no para otros roles)
        if rol == 'admin':
            confirm_admin = request.POST.get('confirm-admin')
            if not confirm_admin or confirm_admin != 'on':
                messages.error(request, 'Debes aceptar los términos para rol de administrador')
                return render(request, 'usuarios/list_usuarios.html')
            
        if nombre and apellido and email and password:
            try:
                # Verificar si es el primer admin del sistema
                es_primer_admin = (rol == 'admin' and not Usuario.objects.filter(rol='admin', admitido=True).exists())
                
                # Crear usuario
                usuario = Usuario.objects.create(
                    nombre=nombre,
                    apellido=apellido,
                    email=email,
                    rol=rol,
                    admitido=es_primer_admin  # Si es primer admin, se admite automáticamente
                )
                usuario.set_password(password)
                usuario.save()
                
                if es_primer_admin:
                    messages.success(request, 'Primer administrador creado exitosamente. Ya puedes iniciar sesión.')
                else:
                    messages.success(request, 'Cuenta creada exitosamente. Por favor espere a que su cuenta sea validada por un administrador.')
                
                return render(request, 'usuarios/list_usuarios.html')
            except Exception as e:
                messages.error(request, f'Error: {str(e)}')
        else:
            messages.error(request, 'Todos los campos son obligatorios')
    
    # Manejar login - ACTUALIZADO PARA EMAIL O NOMBRE
    elif request.method == 'POST' and 'login-email' in request.POST:
        login_input = request.POST.get('login-email')  # Puede ser email o nombre
        password = request.POST.get('contrasena', '')
        
        if login_input and password:
            try:
                # Buscar por email O por nombre (insensible a mayúsculas)
                usuario = Usuario.objects.get(
                    Q(email__iexact=login_input) | Q(nombre__iexact=login_input)
                )
                
                if usuario.check_password(password):
                    if not usuario.admitido:
                        messages.error(request, 'Tu cuenta aún no ha sido admitida por un administrador.')
                        return render(request, 'usuarios/list_usuarios.html')
                    
                    request.session['usuario_id'] = usuario.id
                    request.session['usuario_nombre'] = f"{usuario.nombre} {usuario.apellido}"
                    request.session['usuario_email'] = usuario.email
                    return redirect('dashboard')
                else:
                    messages.error(request, 'Contraseña incorrecta')
            except Usuario.DoesNotExist:
                messages.error(request, 'Usuario no encontrado. Verifica tu email o nombre de usuario.')
            except Usuario.MultipleObjectsReturned:
                messages.error(request, 'Múltiples usuarios encontrados. Usa tu email para mayor precisión.')
        else:
            messages.error(request, 'Email/Usuario y contraseña son obligatorios')
    
    # Mostrar formularios
    return render(request, 'usuarios/list_usuarios.html')

def dashboard(request):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Obtener el usuario actual
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # 🆕 OBTENER PARÁMETROS DE FILTRO
    filtros = {
        'search': request.GET.get('search', '').strip(),
        'urgency': request.GET.get('urgency', ''),
        'status': request.GET.get('status', ''),
        'date_from': request.GET.get('date_from', ''),
        'date_to': request.GET.get('date_to', ''),
    }
    
    # 🆕 FUNCIÓN HELPER PARA APLICAR FILTROS
    def aplicar_filtros(queryset, tab_context='general'):
        # Filtro por búsqueda (título)
        if filtros['search']:
            queryset = queryset.filter(titulo__icontains=filtros['search'])
        
        # Filtro por urgencia
        if filtros['urgency']:
            queryset = queryset.filter(nivel_urgencia=int(filtros['urgency']))
        
        # 🔧 Filtro por estatus - NO aplicar en tickets disponibles
        if filtros['status'] and tab_context != 'disponibles':
            queryset = queryset.filter(estatus=filtros['status'])
        
        # Filtro por rango de fechas
        if filtros['date_from']:
            from datetime import datetime
            fecha_desde = datetime.strptime(filtros['date_from'], '%Y-%m-%d').date()
            queryset = queryset.filter(fecha_creacion__date__gte=fecha_desde)
        
        if filtros['date_to']:
            from datetime import datetime
            fecha_hasta = datetime.strptime(filtros['date_to'], '%Y-%m-%d').date()
            queryset = queryset.filter(fecha_creacion__date__lte=fecha_hasta)
        
        return queryset
    
    # Obtener reportes pendientes para el usuario actual
    reportes_pendientes = []
    tickets_anteriores = []
    if usuario_actual.rol != 'sistemas':
        # Reportes no vistos
        reportes_pendientes = ReporteFinalizacion.objects.filter(
            ticket__usuario=usuario_actual,
            ticket__estatus='finalizado',
            visto_por_usuario=False
        )
        # Tickets anteriores (reportes ya vistos)
        tickets_anteriores = ReporteFinalizacion.objects.filter(
            ticket__usuario=usuario_actual,
            ticket__estatus='finalizado',
            visto_por_usuario=True
        )
    
    # 🔧 MODIFICADO: Mis tickets creados con filtros
    mis_tickets_creados_query = Ticket.objects.filter(
        usuario=usuario_actual
    ).exclude(estatus='finalizado').order_by(
        Case(
            When(estatus='generado', then=Value(1)),
            When(estatus='en_espera', then=Value(2)),
            When(estatus='en_proceso', then=Value(3)),
            When(estatus='finalizado', then=Value(4)),
            When(estatus='cancelado', then=Value(5)),
            output_field=IntegerField(),
        ),
        '-fecha_creacion'
    )
    
    # Aplicar filtros
    mis_tickets_creados_query = aplicar_filtros(mis_tickets_creados_query)

    # Paginación para mis tickets creados
    paginator_creados = Paginator(mis_tickets_creados_query, 10)
    page_creados = request.GET.get('page_creados', 1)
    mis_tickets_creados = paginator_creados.get_page(page_creados)
    
    # Para sistemas y admin: tickets asignados y disponibles
    tickets_asignados = []
    tickets_disponibles = []
    usuarios_sistemas = []
    todos_los_tickets_query = Ticket.objects.none()
    
    if usuario_actual.rol in ['sistemas', 'admin']:
        # 🔧 MODIFICADO: Tickets asignados con filtros
        tickets_asignados_query = Ticket.objects.filter(asignado_a=usuario_actual).order_by(
            Case(
                When(estatus='generado', then=Value(1)),
                When(estatus='en_espera', then=Value(2)),
                When(estatus='en_proceso', then=Value(3)),
                When(estatus='finalizado', then=Value(4)),
                When(estatus='cancelado', then=Value(5)),
                output_field=IntegerField(),
            ),
            '-fecha_creacion'
        )
        
        # Aplicar filtros
        tickets_asignados_query = aplicar_filtros(tickets_asignados_query)
        
        # Paginación para tickets asignados
        paginator_asignados = Paginator(tickets_asignados_query, 10)
        page_asignados = request.GET.get('page_asignados', 1)
        tickets_asignados = paginator_asignados.get_page(page_asignados)
        
        # 🔧 MODIFICADO: Tickets disponibles con filtros
        if usuario_actual.rol == 'sistemas':
            # Tickets disponibles para la categoría del usuario de sistemas
            tickets_disponibles_query = Ticket.objects.filter(
                categoria=usuario_actual.categoria_sistemas,
                asignado_a__isnull=True,
                estatus='generado'
            ).order_by(
                Case(
                    When(estatus='generado', then=Value(1)),
                    When(estatus='en_espera', then=Value(2)),
                    When(estatus='en_proceso', then=Value(3)),
                    When(estatus='finalizado', then=Value(4)),
                    When(estatus='cancelado', then=Value(5)),
                    output_field=IntegerField(),
                ),
                '-fecha_creacion'
            )
        elif usuario_actual.rol == 'admin':
            # Admin puede ver todos los tickets disponibles
            tickets_disponibles_query = Ticket.objects.filter(
                asignado_a__isnull=True,
                estatus='generado'
            ).order_by(
                Case(
                    When(estatus='generado', then=Value(1)),
                    When(estatus='en_espera', then=Value(2)),
                    When(estatus='en_proceso', then=Value(3)),
                    When(estatus='finalizado', then=Value(4)),
                    When(estatus='cancelado', then=Value(5)),
                    output_field=IntegerField(),
                ),
                '-fecha_creacion'
            )
        
        # Aplicar filtros a tickets disponibles (SIN filtro de estatus)
        tickets_disponibles_query = aplicar_filtros(tickets_disponibles_query, 'disponibles')
        
        # Paginación para tickets disponibles
        paginator_disponibles = Paginator(tickets_disponibles_query, 10)
        page_disponibles = request.GET.get('page_disponibles', 1)
        tickets_disponibles = paginator_disponibles.get_page(page_disponibles)
        
        # Para admin: obtener todos los usuarios de sistemas
        if usuario_actual.rol == 'admin':
            usuarios_sistemas = Usuario.objects.filter(rol__in=['sistemas', 'admin'])
            
            # Sincronizar estatus de tickets asignados que aún están como 'generado'
            tickets_desincronizados = Ticket.objects.filter(
                asignado_a__isnull=False,
                estatus='generado'
            )
            if tickets_desincronizados.exists():
                tickets_desincronizados.update(estatus='en_proceso')
            
            # 🔧 MODIFICADO: Todos los tickets con filtros
            todos_los_tickets_query = Ticket.objects.filter(
                Q(asignado_a__isnull=False) |
                Q(estatus__in=['en_proceso', 'en_espera'])
            ).exclude(
                estatus__in=['finalizado', 'cancelado']
            ).order_by(
                Case(
                    When(estatus='en_espera', then=Value(1)),
                    When(estatus='en_proceso', then=Value(2)),
                    When(estatus='generado', then=Value(3)),
                    output_field=IntegerField(),
                ),
                '-fecha_creacion'
            )
            
            # Aplicar filtros
            todos_los_tickets_query = aplicar_filtros(todos_los_tickets_query)
    
    # Paginación para todos los tickets
    paginator_todos = Paginator(todos_los_tickets_query, 10)
    page_todos = request.GET.get('page_todos', 1)
    todos_los_tickets = paginator_todos.get_page(page_todos)
    
    # Pasar todos los datos de sesión al template
    categoria_display = None
    if usuario_actual.rol == 'sistemas' and usuario_actual.categoria_sistemas:
        categoria_display = usuario_actual.get_categoria_sistemas_display()
    
    # 🆕 AGREGAR FILTROS AL CONTEXTO
    context = {
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'categoria_display': categoria_display,
        'mis_tickets_creados': mis_tickets_creados,
        'tickets_asignados': tickets_asignados,
        'tickets_disponibles': tickets_disponibles,
        'usuarios_sistemas': usuarios_sistemas,
        'todos_los_tickets': todos_los_tickets,
        'reportes_pendientes': reportes_pendientes,
        'tickets_anteriores': tickets_anteriores,
        'opciones_estatus': Ticket.ESTATUS,
        'opciones_urgencia': Ticket.NIVELES_URGENCIA,
        'motivos_espera': MotivoEspera.objects.all(),
        'usuario_actual': usuario_actual,
        # 🆕 CONTEXTO DE FILTROS
        'filtros_activos': filtros,
        'tiene_filtros': any(filtros.values()),
    }
    return render(request, 'usuarios/dashboard.html', context)
def crear_ticket(request):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Obtener el usuario actual
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    if request.method == 'POST':
        titulo = request.POST.get('titulo')
        descripcion = request.POST.get('descripcion')
        observaciones = request.POST.get('observaciones', '')
        categoria = request.POST.get('categoria')
        nivel_urgencia = int(request.POST.get('nivel_urgencia', 2))
        
        
        if titulo and descripcion and categoria:
            try:
                usuario = Usuario.objects.get(id=request.session['usuario_id'])
                
                # Crear ticket sin asignación automática
                ticket = Ticket.objects.create(
                    titulo=titulo,
                    descripcion=descripcion,
                    observaciones=observaciones,
                    categoria=categoria,
                    nivel_urgencia=nivel_urgencia,
                    usuario=usuario,
                    asignado_a=None  # Sin asignación automática
                )
                
                # Procesar imágenes
                imagenes = request.FILES.getlist('imagenes')
                
                for i, imagen in enumerate(imagenes, 1):
                    
                    # Validar que sea una imagen
                    if not imagen.content_type.startswith('image/'):
                        messages.error(request, f'El archivo "{imagen.name}" no es una imagen válida. Solo se permiten archivos de imagen.')
                        # Preparar contexto para mostrar error
                        context = {
                            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                            'email': request.session.get('usuario_email', ''),
                            'rol': usuario_actual.rol,
                            'es_admin': usuario_actual.rol == 'admin',
                            'es_sistemas': usuario_actual.rol == 'sistemas',
                            'usuario_actual': usuario_actual,
                        }
                        return render(request, 'usuarios/crear_ticket.html', context)
                    
                    # Validar extensión
                    extensiones_validas = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
                    nombre_archivo = imagen.name.lower()
                    if not any(nombre_archivo.endswith(ext) for ext in extensiones_validas):
                        messages.error(request, f'El archivo "{imagen.name}" no tiene una extensión válida. Solo se permiten: JPG, JPEG, PNG, GIF, BMP, WEBP.')
                        # Preparar contexto para mostrar error
                        context = {
                            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                            'email': request.session.get('usuario_email', ''),
                            'rol': usuario_actual.rol,
                            'es_admin': usuario_actual.rol == 'admin',
                            'es_sistemas': usuario_actual.rol == 'sistemas',
                            'usuario_actual': usuario_actual,
                        }
                        return render(request, 'usuarios/crear_ticket.html', context)
                    
                    # Crear la imagen
                    imagen_ticket = ImagenTicket.objects.create(
                        ticket=ticket,
                        imagen=imagen,
                        nombre_archivo=imagen.name
                    )
                
                messages.success(request, 'Ticket creado exitosamente. Ahora aparecerá en la lista de tickets disponibles para el equipo de sistemas correspondiente.')
                
                return redirect('dashboard')
            except Exception as e:
                messages.error(request, f'Error al crear ticket: {str(e)}')
        else:
            messages.error(request, 'Todos los campos son obligatorios')
    
    # Preparar contexto con datos del usuario
    context = {
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/crear_ticket.html', context)

def aceptar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar que sea usuario de sistemas o admin
    if usuario_actual.rol not in ['sistemas', 'admin']:
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Verificar que el ticket no esté ya asignado
        if ticket.asignado_a is not None:
            return JsonResponse({'success': False, 'error': 'El ticket ya está asignado'})
        
        # Verificar que el usuario de sistemas tenga la categoría correcta (no aplica para admin)
        if usuario_actual.rol == 'sistemas' and ticket.categoria != usuario_actual.categoria_sistemas:
            return JsonResponse({'success': False, 'error': 'No tienes permisos para este tipo de ticket'})
        
        # Verificar que no sea su propio ticket (opcional - comenta estas líneas si quieres permitirlo)
        # if ticket.usuario == usuario_actual:
        #     return JsonResponse({'success': False, 'error': 'No puedes aceptar tu propio ticket'})
        
        # Asignar el ticket al usuario actual
        ticket.asignado_a = usuario_actual
        ticket.estatus = 'en_proceso'
        ticket.asignado_por_admin = False # Indica que fue aceptado por el usuario, no por un admin
        ticket.save()
        
        return JsonResponse({'success': True, 'message': f'Ticket "{ticket.titulo}" aceptado exitosamente'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def completar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar que el ticket esté asignado al usuario actual
    if ticket.asignado_a != usuario_actual:
        messages.error(request, 'No tienes permisos para completar este ticket')
        return redirect('dashboard')
    
    if request.method == 'POST':
        # CAMBIADO: El título del reporte será igual al título del ticket
        titulo = ticket.titulo  # Usar el título del ticket original
        reporte = request.POST.get('reporte')
        descripcion = request.POST.get('descripcion')
        observaciones = request.POST.get('observaciones', '')
        
        # CAMBIADO: Solo validar reporte y descripción (título ya no es del form)
        if reporte and descripcion:
            try:
                # Crear el reporte de finalización
                reporte_finalizacion = ReporteFinalizacion.objects.create(
                    ticket=ticket,
                    titulo=titulo,  # Usar título del ticket
                    reporte=reporte,
                    descripcion=descripcion,
                    observaciones=observaciones,
                    creado_por=usuario_actual
                )
                
                # Procesar imágenes del reporte
                imagenes = request.FILES.getlist('imagenes')
                for imagen in imagenes:
                    # Validar que sea una imagen
                    if not imagen.content_type.startswith('image/'):
                        messages.error(request, f'El archivo "{imagen.name}" no es una imagen válida. Solo se permiten archivos de imagen.')
                        # Preparar contexto para mostrar error
                        context = {
                            'ticket': ticket,
                            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                            'email': request.session.get('usuario_email', ''),
                            'rol': usuario_actual.rol,
                            'es_admin': usuario_actual.rol == 'admin',
                            'es_sistemas': usuario_actual.rol == 'sistemas',
                            'usuario_actual': usuario_actual,
                        }
                        return render(request, 'usuarios/completar_ticket.html', context)
                    
                    # Validar extensión
                    extensiones_validas = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
                    nombre_archivo = imagen.name.lower()
                    if not any(nombre_archivo.endswith(ext) for ext in extensiones_validas):
                        messages.error(request, f'El archivo "{imagen.name}" no tiene una extensión válida. Solo se permiten: JPG, JPEG, PNG, GIF, BMP, WEBP.')
                        # Preparar contexto para mostrar error
                        context = {
                            'ticket': ticket,
                            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                            'email': request.session.get('usuario_email', ''),
                            'rol': usuario_actual.rol,
                            'es_admin': usuario_actual.rol == 'admin',
                            'es_sistemas': usuario_actual.rol == 'sistemas',
                            'usuario_actual': usuario_actual,
                        }
                        return render(request, 'usuarios/completar_ticket.html', context)
                    
                    ImagenReporte.objects.create(
                        reporte=reporte_finalizacion,
                        imagen=imagen,
                        nombre_archivo=imagen.name
                    )
                
                # Cambiar el estatus del ticket a finalizado
                ticket.estatus = 'finalizado'
                ticket.save()
                # Enviar correo al usuario que creó el ticket
                enviar_correo_ticket_completado(ticket)
                
                messages.success(request, 'Ticket completado exitosamente')
                return redirect('dashboard')
            except Exception as e:
                messages.error(request, f'Error al completar ticket: {str(e)}')
        else:
            # CAMBIADO: Mensaje de error actualizado
            messages.error(request, 'Los campos reporte y descripción son obligatorios')
    
    # Preparar contexto con datos del usuario
    context = {
        'ticket': ticket,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/completar_ticket.html', context)

def editar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    
    # Verificar que el usuario actual sea el creador del ticket
    if ticket.usuario != usuario_actual:
        messages.error(request, 'No tienes permisos para editar este ticket')
        return redirect('dashboard')
    
    # Verificar que el ticket esté en estatus "generado"
    if ticket.estatus != 'generado':
        messages.error(request, 'Solo se pueden editar tickets en estatus "Generado"')
        return redirect('dashboard')
    
    if request.method == 'POST':
        # Actualizar todos los campos
        ticket.titulo = request.POST.get('titulo')
        ticket.descripcion = request.POST.get('descripcion')
        ticket.observaciones = request.POST.get('observaciones', '')
        ticket.categoria = request.POST.get('categoria')
        ticket.nivel_urgencia = int(request.POST.get('nivel_urgencia'))
        
        try:
            ticket.save()
            
            # Manejar eliminación de imágenes existentes
            imagenes_eliminar = request.POST.get('imagenes_eliminar', '')
            
            if imagenes_eliminar:
                ids_eliminar = [int(id_img) for id_img in imagenes_eliminar.split(',') if id_img.strip()]
                
                imagenes_a_eliminar = ImagenTicket.objects.filter(id__in=ids_eliminar, ticket=ticket)
                
                for img_eliminar in imagenes_a_eliminar:
                    # Eliminar archivo físico
                    if img_eliminar.imagen and os.path.exists(img_eliminar.imagen.path):
                        os.remove(img_eliminar.imagen.path)
                imagenes_a_eliminar.delete()
            
            # Procesar nuevas imágenes
            imagenes = request.FILES.getlist('imagenes')
            
            for i, imagen in enumerate(imagenes, 1):
                
                # Validar que sea una imagen
                if not imagen.content_type.startswith('image/'):
                    messages.error(request, f'El archivo "{imagen.name}" no es una imagen válida. Solo se permiten archivos de imagen.')
                    # Preparar contexto para mostrar error
                    context = {
                        'ticket': ticket,
                        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                        'email': request.session.get('usuario_email', ''),
                        'rol': usuario_actual.rol,
                        'es_admin': usuario_actual.rol == 'admin',
                        'es_sistemas': usuario_actual.rol == 'sistemas',
                        'usuario_actual': usuario_actual,
                    }
                    return render(request, 'usuarios/editar_ticket.html', context)
                
                # Validar extensión
                extensiones_validas = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
                nombre_archivo = imagen.name.lower()
                if not any(nombre_archivo.endswith(ext) for ext in extensiones_validas):
                    messages.error(request, f'El archivo "{imagen.name}" no tiene una extensión válida. Solo se permiten: JPG, JPEG, PNG, GIF, BMP, WEBP.')
                    # Preparar contexto para mostrar error
                    context = {
                        'ticket': ticket,
                        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
                        'email': request.session.get('usuario_email', ''),
                        'rol': usuario_actual.rol,
                        'es_admin': usuario_actual.rol == 'admin',
                        'es_sistemas': usuario_actual.rol == 'sistemas',
                        'usuario_actual': usuario_actual,
                    }
                    return render(request, 'usuarios/editar_ticket.html', context)
                
                nueva_imagen = ImagenTicket.objects.create(
                    ticket=ticket,
                    imagen=imagen,
                    nombre_archivo=imagen.name
                )
            
            messages.success(request, 'Ticket actualizado exitosamente')
            return redirect('dashboard')
        except Exception as e:
            messages.error(request, f'Error al actualizar ticket: {str(e)}')
    
    # Preparar contexto con datos del usuario
    context = {
        'ticket': ticket,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/editar_ticket.html', context)

def cambiar_estatus(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        nuevo_estatus = request.POST.get('estatus')
        
        # No permitir cambiar a finalizado si no hay reporte
        if nuevo_estatus == 'finalizado':
            if not hasattr(ticket, 'reporte_finalizacion'):
                return JsonResponse({'success': False, 'error': 'No se puede marcar como finalizado sin reporte del encargado'})
        
        if nuevo_estatus in dict(Ticket.ESTATUS).keys():
            ticket.estatus = nuevo_estatus
            ticket.save()
            return JsonResponse({'success': True})
    
    return JsonResponse({'success': False, 'error': 'Datos inválidos'})

def cambiar_urgencia(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        nueva_urgencia = request.POST.get('urgencia')
        
        if int(nueva_urgencia) in dict(Ticket.NIVELES_URGENCIA).keys():
            urgencia_anterior = ticket.get_nivel_urgencia_display()
            ticket.nivel_urgencia = int(nueva_urgencia) 
            ticket.save()
            
            urgencia_nueva = ticket.get_nivel_urgencia_display()
            
            return JsonResponse({
                'success': True, 
                'message': f'Urgencia cambiada de "{urgencia_anterior}" a "{urgencia_nueva}"'
            })
    
    return JsonResponse({'success': False, 'error': 'Datos inválidos'})

def eliminar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        titulo_eliminado = ticket.titulo
        ticket.delete()
        return JsonResponse({'success': True, 'message': f'Ticket "{titulo_eliminado}" eliminado exitosamente'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def admin_usuarios(request):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para acceder a esta página')
        return redirect('dashboard')
    
    # 🆕 OBTENER PARÁMETROS DE FILTRO
    filtros = {
        'search': request.GET.get('search', '').strip(),
        'rol': request.GET.get('rol', ''),
        'categoria': request.GET.get('categoria', ''),
    }
    
    # 🆕 FUNCIÓN HELPER PARA APLICAR FILTROS
    def aplicar_filtros_usuarios(queryset):
        # Filtro por búsqueda (nombre o apellido)
        if filtros['search']:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(nombre__icontains=filtros['search']) | 
                Q(apellido__icontains=filtros['search']) |
                Q(email__icontains=filtros['search'])
            )
        
        # Filtro por rol
        if filtros['rol']:
            queryset = queryset.filter(rol=filtros['rol'])
        
        # Filtro por categoría
        if filtros['categoria']:
            queryset = queryset.filter(categoria_sistemas=filtros['categoria'])
        
        return queryset
    
    # 🔧 MODIFICADO: Usuarios admitidos con filtros
    usuarios_admitidos_query = Usuario.objects.filter(admitido=True).order_by('nombre', 'apellido')
    usuarios_admitidos_query = aplicar_filtros_usuarios(usuarios_admitidos_query)
    
    # 🆕 PAGINACIÓN para usuarios admitidos
    from django.core.paginator import Paginator
    paginator_admitidos = Paginator(usuarios_admitidos_query, 10)
    page_admitidos = request.GET.get('page_admitidos', 1)
    usuarios_admitidos = paginator_admitidos.get_page(page_admitidos)
    
    # 🔧 MODIFICADO: Usuarios por admitir con filtros
    usuarios_por_admitir_query = Usuario.objects.filter(admitido=False).order_by('nombre', 'apellido')
    usuarios_por_admitir_query = aplicar_filtros_usuarios(usuarios_por_admitir_query)
    
    # 🆕 PAGINACIÓN para usuarios por admitir
    paginator_por_admitir = Paginator(usuarios_por_admitir_query, 10)
    page_por_admitir = request.GET.get('page_por_admitir', 1)
    usuarios_por_admitir = paginator_por_admitir.get_page(page_por_admitir)
    
    # 🆕 OBTENER OPCIONES PARA LOS FILTROS
    roles_disponibles = Usuario.objects.values_list('rol', flat=True).distinct()
    categorias_disponibles = Usuario.objects.exclude(categoria_sistemas__isnull=True).exclude(categoria_sistemas='').values_list('categoria_sistemas', flat=True).distinct()
    
    # Preparar contexto con datos del usuario
    context = {
        'usuarios': usuarios_admitidos,  # Para la pestaña "Usuarios"
        'usuarios_por_admitir': usuarios_por_admitir,  # Para la pestaña "Usuarios Por Admitir"
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
        # 🆕 CONTEXTO DE FILTROS
        'filtros_activos': filtros,
        'tiene_filtros': any(filtros.values()),
        'roles_disponibles': roles_disponibles,
        'categorias_disponibles': categorias_disponibles,
        # 🆕 OPCIONES DE CATEGORÍAS (para el select)
        'opciones_categorias': [
            ('soporte_tecnico', 'Soporte Técnico'),
            ('infraestructura', 'Infraestructura'),
            ('desarrollo', 'Desarrollo'),
        ],
        # 🆕 OPCIONES DE ROLES (para el select)
        'opciones_roles': [
            ('admin', 'Administrador'),
            ('sistemas', 'Sistemas'),
            ('usuario', 'Usuario'),
        ],
    }
    
    return render(request, 'usuarios/admin_usuarios.html', context)
def rechazar_usuario(request, usuario_id):
    """
    Vista para rechazar (eliminar) un usuario que no ha sido admitido aún
    """
    # Verificar que el usuario esté logueado
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para realizar esta acción')
        return redirect('dashboard')
    
    try:
        # Buscar el usuario a rechazar
        usuario_a_rechazar = Usuario.objects.get(id=usuario_id, admitido=False)
        
        # Guardar información para el mensaje
        nombre_usuario = f"{usuario_a_rechazar.nombre} {usuario_a_rechazar.apellido}"
        email_usuario = usuario_a_rechazar.email
        
        # Eliminar el usuario
        usuario_a_rechazar.delete()
        
        # Mensaje de éxito
        messages.success(
            request, 
            f'El usuario {nombre_usuario} ({email_usuario}) ha sido rechazado y eliminado exitosamente.'
        )
        
    except Usuario.DoesNotExist:
        messages.error(request, 'El usuario no existe o ya ha sido procesado.')
    except Exception as e:
        messages.error(request, f'Error al rechazar el usuario: {str(e)}')
    
    # Redirigir de vuelta a la página de administración de usuarios
    return redirect('admin_usuarios')

def editar_usuario(request, usuario_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para realizar esta acción')
        return redirect('dashboard')
    
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    if request.method == 'POST':
        usuario.nombre = request.POST.get('nombre')
        usuario.apellido = request.POST.get('apellido')
        usuario.email = request.POST.get('email')
        usuario.rol = request.POST.get('rol')
        categoria_sistemas = request.POST.get('categoria_sistemas')
        usuario.categoria_sistemas = categoria_sistemas if usuario.rol == 'sistemas' else None
        
        try:
            usuario.save()
            messages.success(request, 'Usuario actualizado exitosamente')
            return redirect('admin_usuarios')
        except Exception as e:
            messages.error(request, f'Error al actualizar usuario: {str(e)}')
    
    # Preparar contexto con datos del usuario
    context = {
        'usuario': usuario,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/editar_usuario.html', context)

def eliminar_usuario(request, usuario_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para realizar esta acción')
        return redirect('dashboard')
    
    usuario = get_object_or_404(Usuario, id=usuario_id)
    
    # No permitir que se elimine a sí mismo
    if usuario.id == request.session['usuario_id']:
        messages.error(request, 'No puedes eliminarte a ti mismo')
        return redirect('admin_usuarios')
    
    if request.method == 'POST':
        nombre_eliminado = f"{usuario.nombre} {usuario.apellido}"
        usuario.delete()
        messages.success(request, f'Usuario {nombre_eliminado} eliminado exitosamente')
        return redirect('admin_usuarios')
    
    # Preparar contexto con datos del usuario
    context = {
        'usuario': usuario,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/eliminar_usuario.html', context)

def ver_reporte(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar que el usuario actual sea el creador del ticket
    if ticket.usuario != usuario_actual:
        messages.error(request, 'No tienes permisos para ver este reporte')
        return redirect('dashboard')
    
    # Verificar que el ticket tenga reporte
    if not hasattr(ticket, 'reporte_finalizacion'):
        messages.error(request, 'Este ticket no tiene reporte de finalización')
        return redirect('dashboard')
    
    # Marcar el reporte como visto
    reporte = ticket.reporte_finalizacion
    if not reporte.visto_por_usuario:
        reporte.visto_por_usuario = True
        reporte.save()
    
    # Preparar contexto con datos del usuario
    context = {
        'ticket': ticket,
        'reporte': reporte,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/ver_reporte.html', context)
def asignar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar que sea admin
    if usuario_actual.rol != 'admin':
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        usuario_sistemas_id = request.POST.get('usuario_sistemas_id')
        
        # Verificar que el ticket no esté ya asignado
        if ticket.asignado_a is not None:
            return JsonResponse({'success': False, 'error': 'El ticket ya está asignado'})
        
        # Obtener el usuario de sistemas
        try:
            usuario_sistemas = Usuario.objects.get(id=usuario_sistemas_id, rol='sistemas')
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuario de sistemas no encontrado'})
        
        # Verificar que el usuario de sistemas tenga la categoría correcta
        if ticket.categoria != usuario_sistemas.categoria_sistemas:
            return JsonResponse({'success': False, 'error': 'El usuario no pertenece al departamento correcto'})
        
        # Asignar el ticket
        ticket.asignado_a = usuario_sistemas
        ticket.estatus = 'en_proceso'
        ticket.asignado_por_admin = True  # Indica que fue asignado por un admin
        ticket.save()
        
        return JsonResponse({'success': True, 'message': f'Ticket asignado a {usuario_sistemas.nombre} {usuario_sistemas.apellido}'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})
def cancelar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Si el ticket ya está cancelado, mostrar información de cancelación
    if ticket.estatus == 'cancelado':
        # Verificar que el usuario tenga permisos para ver la cancelación
        if ticket.usuario != usuario_actual and usuario_actual.rol not in ['admin', 'sistemas']:
            messages.error(request, 'No tienes permisos para ver esta información')
            return redirect('dashboard')
        
        # Verificar que el ticket tenga cancelación
        if not hasattr(ticket, 'cancelacion'):
            messages.error(request, 'Este ticket no tiene información de cancelación')
            return redirect('dashboard')
        
        # Preparar contexto para vista de información de cancelación
        context = {
            'ticket': ticket,
            'cancelacion': ticket.cancelacion,
            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
            'email': request.session.get('usuario_email', ''),
            'rol': usuario_actual.rol,
            'es_admin': usuario_actual.rol == 'admin',
            'es_sistemas': usuario_actual.rol == 'sistemas',
            'usuario_actual': usuario_actual,
        }
        return render(request, 'usuarios/cancelar_ticket.html', context)
    
    # Si no está cancelado, proceder con la lógica de cancelación
    # Verificar permisos: el creador del ticket o admin pueden cancelar
    if ticket.usuario != usuario_actual and usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para cancelar este ticket')
        return redirect('dashboard')
    
    # Verificar que el ticket no esté ya finalizado
    if ticket.estatus == 'finalizado':
        messages.error(request, 'No se puede cancelar un ticket finalizado')
        return redirect('dashboard')
    
    if request.method == 'POST':
        motivo = request.POST.get('motivo')
        
        if motivo:
            try:
                # Crear la cancelación
                CancelacionTicket.objects.create(
                    ticket=ticket,
                    motivo=motivo,
                    cancelado_por=usuario_actual
                )
                
                # Cambiar el estatus del ticket a cancelado
                ticket.estatus = 'cancelado'
                ticket.save()
                
                messages.success(request, 'Ticket cancelado exitosamente')
                return redirect('dashboard')
            except Exception as e:
                messages.error(request, f'Error al cancelar ticket: {str(e)}')
        else:
            messages.error(request, 'El motivo de cancelación es obligatorio')
    
    # Preparar contexto para formulario de cancelación
    context = {
        'ticket': ticket,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/cancelar_ticket.html', context)
def reasignar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        return JsonResponse({'success': False, 'error': 'No autorizado'})
    
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar que sea admin
    if usuario_actual.rol != 'admin':
        return JsonResponse({'success': False, 'error': 'Sin permisos'})
    
    if request.method == 'POST':
        ticket = get_object_or_404(Ticket, id=ticket_id)
        nuevo_usuario_sistemas_id = request.POST.get('nuevo_usuario_sistemas_id')
        
        # Verificar que el ticket no esté finalizado o cancelado
        if ticket.estatus in ['finalizado', 'cancelado']:
            return JsonResponse({'success': False, 'error': 'No se puede reasignar un ticket finalizado o cancelado'})
        
        # Si se selecciona "sin asignar"
        if nuevo_usuario_sistemas_id == '':
            ticket.asignado_a = None
            ticket.estatus = 'generado'
            ticket.save()
            return JsonResponse({'success': True, 'message': f'Ticket "{ticket.titulo}" desasignado exitosamente'})
        
        # Obtener el nuevo usuario de sistemas
        try:
            nuevo_usuario_sistemas = Usuario.objects.get(id=nuevo_usuario_sistemas_id, rol__in=['sistemas', 'admin'])
        except Usuario.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Usuario de sistemas no encontrado'})
        
        # Verificar que el usuario de sistemas tenga la categoría correcta
       # Los admin pueden asignarse cualquier ticket, los de sistemas deben coincidir la categoría
        if nuevo_usuario_sistemas.rol == 'sistemas' and ticket.categoria != nuevo_usuario_sistemas.categoria_sistemas:
            return JsonResponse({'success': False, 'error': 'El usuario no pertenece al departamento correcto'})
        
        # Reasignar el ticket
        ticket.asignado_a = nuevo_usuario_sistemas
        if ticket.estatus == 'generado':
            ticket.estatus = 'en_proceso'
        ticket.save()
        
        return JsonResponse({'success': True, 'message': f'Ticket reasignado a {nuevo_usuario_sistemas.nombre} {nuevo_usuario_sistemas.apellido}'})
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})

def poner_en_espera(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Si el ticket ya está en espera y tiene motivo, mostrar el motivo (solo lectura)
    if ticket.estatus == 'en_espera' and hasattr(ticket, 'motivo_espera'):
        # Verificar permisos para ver el motivo
        if ticket.usuario != usuario_actual and usuario_actual.rol not in ['admin', 'sistemas']:
            messages.error(request, 'No tienes permisos para ver esta información')
            return redirect('dashboard')
        
        # Preparar contexto para vista de motivo
        context = {
            'ticket': ticket,
            'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
            'email': request.session.get('usuario_email', ''),
            'rol': usuario_actual.rol,
            'es_admin': usuario_actual.rol == 'admin',
            'es_sistemas': usuario_actual.rol == 'sistemas',
            'usuario_actual': usuario_actual,
        }
        return render(request, 'usuarios/espera_ticket.html', context)
    
    # Verificar que sea admin para poner en espera
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para realizar esta acción')
        return redirect('dashboard')
    
    # Verificar que el ticket no esté finalizado o cancelado
    if ticket.estatus in ['finalizado', 'cancelado']:
        messages.error(request, 'No se puede poner en espera un ticket finalizado o cancelado')
        return redirect('dashboard')
    
    if request.method == 'POST':
        motivo = request.POST.get('motivo')
        
        if motivo and motivo.strip():
            try:
                # Crear o actualizar el motivo de espera
                motivo_espera, created = MotivoEspera.objects.get_or_create(
                    ticket=ticket,
                    defaults={
                        'motivo': motivo.strip(),
                        'creado_por': usuario_actual
                    }
                )
                if not created:
                    motivo_espera.motivo = motivo.strip()
                    motivo_espera.creado_por = usuario_actual
                    motivo_espera.save()
                
                # Cambiar el estatus del ticket a en espera
                ticket.estatus = 'en_espera'
                ticket.save()
                
                messages.success(request, f'Ticket "{ticket.titulo}" puesto en espera exitosamente')
                return redirect('dashboard')
            except Exception as e:
                messages.error(request, f'Error al poner ticket en espera: {str(e)}')
        else:
            messages.error(request, 'El motivo es obligatorio')
    
    # Preparar contexto para formulario
    context = {
        'ticket': ticket,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/espera_ticket.html', context)

def enviar_correo_ticket_completado(ticket):
    """Envía correo cuando un ticket es completado"""
    try:
        # Convertir fecha a zona horaria de México
        zona_mexico = pytz.timezone('America/Mexico_City')
        fecha_mexico = ticket.fecha_edicion.astimezone(zona_mexico)
        
        asunto = f'Ticket Completado: {ticket.titulo}'
        mensaje = f'''
            Hola {ticket.usuario.nombre},

            Tu ticket ha sido completado:

            Título: {ticket.titulo}
            Descripción: {ticket.descripcion}
            Fecha de completado: {fecha_mexico.strftime('%d/%m/%Y %H:%M')}

            Puedes revisar el reporte de completado ingresando al sistema.

            Saludos,
            Sistema de Tickets
        '''
        
        send_mail(
            asunto,
            mensaje,
            settings.DEFAULT_FROM_EMAIL,
            [ticket.usuario.email],
            fail_silently=True,
        )
    except Exception as e:
         pass

def visualizar_ticket(request, ticket_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    ticket = get_object_or_404(Ticket, id=ticket_id)
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    
    # Verificar permisos para visualizar el ticket
    # El creador, el asignado, y los admin/sistemas pueden ver cualquier ticket
    puede_ver = (
        ticket.usuario == usuario_actual or  # Es el creador
        ticket.asignado_a == usuario_actual or  # Está asignado a él
        usuario_actual.rol in ['admin', 'sistemas']  # Es admin o sistemas
    )
    
    if not puede_ver:
        messages.error(request, 'No tienes permisos para visualizar este ticket')
        return redirect('dashboard')
    
    # Preparar contexto
    context = {
        'ticket': ticket,
        'nombre_completo': request.session.get('usuario_nombre', 'Usuario'),
        'email': request.session.get('usuario_email', ''),
        'rol': usuario_actual.rol,
        'es_admin': usuario_actual.rol == 'admin',
        'es_sistemas': usuario_actual.rol == 'sistemas',
        'usuario_actual': usuario_actual,
    }
    
    return render(request, 'usuarios/visualizar_ticket.html', context)

def aceptar_usuario(request, usuario_id):
    if 'usuario_id' not in request.session:
        messages.warning(request, 'Debes iniciar sesión primero')
        return redirect('list_usuarios')
    
    # Verificar que sea admin
    usuario_actual = Usuario.objects.get(id=request.session['usuario_id'])
    if usuario_actual.rol != 'admin':
        messages.error(request, 'No tienes permisos para realizar esta acción')
        return redirect('dashboard')
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
        usuario.admitido = True
        usuario.save()
        messages.success(request, f'Usuario {usuario.nombre} {usuario.apellido} ha sido admitido exitosamente')
    except Usuario.DoesNotExist:
        messages.error(request, 'Usuario no encontrado')
    
    return redirect('admin_usuarios')
def subir_foto_perfil(request):
    if 'usuario_id' not in request.session:
        return redirect('list_usuarios')
    
    if request.method == 'POST' and request.FILES.get('foto_perfil'):
        try:
            usuario = Usuario.objects.get(id=request.session['usuario_id'])
            
            if usuario.foto_perfil:
                usuario.foto_perfil.delete()
            
            usuario.foto_perfil = request.FILES['foto_perfil']
            usuario.save()
            
            # Limpiar caché
            from django.core.cache import cache
            cache.clear()
            
            messages.success(request, 'Foto de perfil actualizada correctamente')
        except Exception as e:
            messages.error(request, f'Error al subir la foto: {str(e)}')
    
    return redirect(request.META.get('HTTP_REFERER', 'dashboard'))

def eliminar_foto_perfil(request):
    if 'usuario_id' not in request.session:
        return redirect('list_usuarios')
    
    try:
        usuario = Usuario.objects.get(id=request.session['usuario_id'])
        if usuario.foto_perfil:
            usuario.foto_perfil.delete()
            usuario.save()
            
            # Limpiar caché
            from django.core.cache import cache
            cache.clear()
            
            messages.success(request, 'Foto de perfil eliminada correctamente')
        else:
            messages.info(request, 'No tienes foto de perfil para eliminar')
    except Exception as e:
        messages.error(request, f'Error al eliminar la foto: {str(e)}')
    
    return redirect(request.META.get('HTTP_REFERER', 'dashboard'))

def logout_view(request):
    usuario_nombre = request.session.get('usuario_nombre', 'Usuario')
    request.session.flush()
    messages.info(request, f'Hasta pronto, {usuario_nombre.split()[0]}')
    return redirect('list_usuarios')
