from django.db import models
from django.contrib.auth.hashers import make_password, check_password
# Create your models here.


class Usuario(models.Model):
    ROLES = (
        ('admin', 'Administrador'),
        ('usuario', 'Usuario'),
        ('sistemas', 'Sistemas'),
    )
    
    CATEGORIAS_SISTEMAS = (
        ('soporte_tecnico', 'Soporte Técnico'),
        ('infraestructura', 'Infraestructura'),
        ('desarrollo', 'Desarrollo'),
    )
    
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128, default='')  # Nuevo campo
    rol = models.CharField(max_length=20, choices=ROLES, default='usuario')
    categoria_sistemas = models.CharField(max_length=20, choices=CATEGORIAS_SISTEMAS, blank=True, null=True)
    admitido = models.BooleanField(default=False) 
    foto_perfil = models.ImageField(upload_to='fotos_perfil/', blank=True, null=True)
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def __str__(self):
        return f"{self.nombre} {self.apellido}"

class Ticket(models.Model):
    CATEGORIAS = (
        ('soporte_tecnico', 'Soporte Técnico'),
        ('infraestructura', 'Infraestructura'),
        ('desarrollo', 'Desarrollo'),
    )
    
    # 🔧 CAMBIADO: Ahora urgencias son números
    NIVELES_URGENCIA = (
        (1, 'Baja'),
        (2, 'Media'),
        (3, 'Alta'),
        (4, 'Crítica'),  # Agregué crítica también
    )
    
    ESTATUS = (
        ('generado', 'Generado'),
        ('en_proceso', 'En Proceso'),
        ('cancelado', 'Cancelado'),
        ('en_espera', 'En espera'),
        ('finalizado', 'Finalizado'),
    )
    
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    observaciones = models.TextField(blank=True, null=True)
    categoria = models.CharField(max_length=20, choices=CATEGORIAS)
    
    # 🔧 CAMBIADO: De CharField a IntegerField
    nivel_urgencia = models.IntegerField(choices=NIVELES_URGENCIA, default=2)
    
    estatus = models.CharField(max_length=20, choices=ESTATUS, default='generado')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_edicion = models.DateTimeField(auto_now=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='tickets_creados')
    asignado_a = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets_asignados')
    asignado_por_admin = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        """Mantener consistencia automática de estatus"""
        # Si tiene asignado_a pero está en 'generado', cambiarlo a 'en_proceso'
        if self.asignado_a and self.estatus == 'generado':
            self.estatus = 'en_proceso'
        
        # Si no tiene asignado_a y está 'en_proceso', regresarlo a 'generado'
        elif not self.asignado_a and self.estatus == 'en_proceso':
            self.estatus = 'generado'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.titulo
    
    def esta_finalizado(self):
        return self.estatus in ['cancelado', 'finalizado']
    
    # 🆕 NUEVOS MÉTODOS ÚTILES
    def get_urgencia_display_with_number(self):
        """Devuelve 'N - Descripción' como '2 - Media'"""
        return f"{self.nivel_urgencia} - {self.get_nivel_urgencia_display()}"
    
    def get_urgencia_color_class(self):
        """Devuelve la clase CSS para el color"""
        return f"urgency-{self.nivel_urgencia}"
class ImagenTicket(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='tickets/%Y/%m/')  # Organiza por año/mes
    nombre_archivo = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Imagen de {self.ticket.titulo}"

class ReporteFinalizacion(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='reporte_finalizacion')
    titulo = models.CharField(max_length=200)
    reporte = models.TextField()
    descripcion = models.TextField()
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    visto_por_usuario = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Reporte de {self.ticket.titulo}"

class ImagenReporte(models.Model):
    reporte = models.ForeignKey(ReporteFinalizacion, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField(upload_to='reportes/%Y/%m/')  # Organiza por año/mes
    nombre_archivo = models.CharField(max_length=255)
    
    def __str__(self):
        return f"Imagen de reporte {self.reporte.titulo}"
    
class MotivoEspera(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='motivo_espera')
    motivo = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Motivo de espera para {self.ticket.titulo}"

# NUEVO MODELO PARA CANCELACIONES
class CancelacionTicket(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE, related_name='cancelacion')
    motivo = models.TextField()
    fecha_cancelacion = models.DateTimeField(auto_now_add=True)
    cancelado_por = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    
    def __str__(self):
        return f"Cancelación de {self.ticket.titulo}"