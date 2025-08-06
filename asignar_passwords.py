import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prueba1.settings')
django.setup()

from usuarios.models import Usuario

# Asignar contraseña "12345" a usuarios sin contraseña
usuarios_sin_password = Usuario.objects.filter(password='')
count = 0

for usuario in usuarios_sin_password:
    usuario.set_password('12345')
    usuario.save()
    count += 1
    print(f"Contraseña asignada a: {usuario.nombre} {usuario.apellido}")

print(f"\n✅ Se asignó la contraseña '12345' a {count} usuarios existentes")