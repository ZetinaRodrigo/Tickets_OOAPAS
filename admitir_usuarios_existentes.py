import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'prueba1.settings')
django.setup()

from usuarios.models import Usuario

# Cambiar todos los usuarios existentes a admitidos
usuarios_no_admitidos = Usuario.objects.filter(admitido=False)
count = 0

for usuario in usuarios_no_admitidos:
    usuario.admitido = True
    usuario.save()
    count += 1
    print(f"Usuario admitido: {usuario.nombre} {usuario.apellido}")

print(f"\n✅ Se admitieron {count} usuarios existentes")