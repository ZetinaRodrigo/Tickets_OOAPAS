# 🎫 Sistema de Gestión de Tickets - OOAPAS

Sistema web para la gestión eficiente de tickets de soporte técnico desarrollado en Django.

## 🚀 Características

- ✅ **Gestión de usuarios** con roles (Admin, Sistemas, Usuario)
- ✅ **Sistema de tickets** con categorías y prioridades
- ✅ **Panel administrativo** para gestión de usuarios
- ✅ **Interfaz responsive** con Bootstrap 5
- ✅ **Autenticación** y manejo de sesiones
- ✅ **Filtros avanzados** y paginación
- ✅ **Dashboard** con estadísticas

## 📦 Requisitos del Sistema

- **Python 3.8 o superior** - [Descargar aquí](https://www.python.org/downloads/)
- **pip** (viene incluido con Python)
- **Git** (opcional) - [Descargar aquí](https://git-scm.com/)
- **PostgreSQL**  - [Descargar aquí](https://www.postgresql.org/download/)

### Dependencias Python 
```
asgiref==3.8.1         
Django==5.2.2            
pillow==11.2.1          
psycopg2==2.9.10        
pytz==2025.2            
sqlparse==0.5.3        
tzdata==2025.2          
```
*Se instalan automáticamente con: `pip install -r requirements.txt`*

## 📦 Instalación y Ejecución

### Opción 1: Clonar desde GitHub

```bash
# 1. Clonar el repositorio
git clone https://github.com/ZetinaRodrigo/Tickets_OOAPAS.git

# 2. Entrar al directorio del proyecto
cd Tickets_OOAPAS
```

### Opción 2: Descargar ZIP

1. Ve a https://github.com/ZetinaRodrigo/Tickets_OOAPAS
2. Haz clic en el botón verde **"Code"**
3. Selecciona **"Download ZIP"**
4. Descomprime el archivo en tu carpeta deseada

## 📋 Lista de Verificación Pre-Instalación

Antes de instalar, asegúrate de tener decidido:

- [ ] **Base de datos**:PostgreSQL 
- [ ] **Email**: ¿Qué cuenta Gmail usarán para notificaciones?
- [ ] **Contraseña de aplicación**: ¿Ya generaste la contraseña de 16 dígitos?
- [ ] **Credenciales**: ¿Tienes usuario/contraseña de PostgreSQL (si la usas)?

### 🔧 Configuración del Entorno

### 🚨 Configuraciones Obligatorias

Antes de ejecutar el servidor, **DEBES configurar** estas variables en `prueba1/settings.py`:

#### 1. Base de Datos (Elige una opción)

**Opción A: SQLite (Más fácil, para pruebas)**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

**Opción B: PostgreSQL (Como en desarrollo original)**
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tu_nombre_bd',           # Cambiar por tu BD
        'USER': 'tu_usuario_postgres',    # Cambiar por tu usuario
        'PASSWORD': 'tu_contraseña',      # Cambiar por tu contraseña
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 2. Configuración de Email (Para notificaciones)
```python
# En settings.py - CAMBIAR ESTAS CREDENCIALES
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'CAMBIAR-POR-TU-EMAIL@gmail.com'
EMAIL_HOST_PASSWORD = 'CAMBIAR-POR-CONTRASEÑA-DE-APLICACION'
DEFAULT_FROM_EMAIL = 'CAMBIAR-POR-TU-EMAIL@gmail.com'
```

#### 3. Clave Secreta (Para producción)
```python
# Cambiar en settings.py para producción
SECRET_KEY = 'tu-nueva-clave-secreta-aqui'
```

```bash
# 3. Crear entorno virtual
python -m venv venv

# 4. Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Mac/Linux:
source venv/bin/activate

# 5. Instalar dependencias
pip install -r requirements.txt
```

### 🗄️ Configuración de la Base de Datos

```bash
# 6. Crear las tablas de la base de datos
python manage.py makemigrations
python manage.py migrate
```

### 👤 Crear Usuario Administrador (Opcional)

```bash
# 7. Crear superusuario para acceso admin
python manage.py createsuperuser
```

### ▶️ Ejecutar el Servidor

```bash
# 8. Iniciar el servidor de desarrollo
python manage.py runserver
```

**🌐 El servidor estará disponible en:** http://127.0.0.1:8000/

## 🔑 Acceso al Sistema

### Usuarios del Sistema
- **URL Principal**: http://127.0.0.1:8000/
- **Panel Admin Django**: http://127.0.0.1:8000/admin/ (si creaste superusuario)

### Roles de Usuario
- **Admin**: Gestión completa de usuarios y tickets
- **Sistemas**: Gestión de tickets asignados
- **Usuario**: Creación y seguimiento de tickets

## 📁 Estructura del Proyecto

```
Tickets_OOAPAS/
├── manage.py                     # Archivo principal de Django
├── requirements.txt              # Dependencias del proyecto
├── README.md                     # Este archivo
├── prueba1/                      # Configuración principal
│   ├── settings.py              # Configuración de Django
│   ├── urls.py                  # URLs principales
│   └── wsgi.py                  # Configuración para producción
├── usuarios/                     # Aplicación principal
│   ├── models.py                # Modelos de datos
│   ├── views.py                 # Lógica de negocio
│   ├── urls.py                  # URLs de la aplicación
│   ├── templates/               # Plantillas HTML
│   └── static/                  # Archivos CSS, JS, imágenes
├── media/                       # Archivos subidos por usuarios
└── db.sqlite3                   # Base de datos (se crea automáticamente)
```

## 🚨 Solución de Problemas Comunes

### Error: "python no se reconoce como comando"
- Asegúrate de tener Python instalado
- En Windows, verifica que Python esté en el PATH

### Error: "No module named django"
- Verifica que el entorno virtual esté activado: `venv\Scripts\activate`
- Instala las dependencias: `pip install -r requirements.txt`

### Error de permisos
- En Windows, ejecuta la terminal como administrador
- En Mac/Linux, verifica los permisos de la carpeta

### El servidor no inicia
```bash
# Verificar que el puerto 8000 no esté ocupado
python manage.py runserver 8080  # Usar puerto alternativo
```

### Error al instalar psycopg2
```bash
# Si psycopg2 da problemas en Windows, usar:
pip install psycopg2-binary

# O si solo quieres usar SQLite, comenta psycopg2 en requirements.txt
```

### Instalar dependencias una por una (si hay problemas)
```bash
pip install Django==5.2.2
pip install pillow==11.2.1
pip install psycopg2-binary  # En lugar de psycopg2==2.9.10
pip install pytz==2025.2
```

### Error en envío de correos
- Verificar que tengas **contraseña de aplicación** de Gmail (no tu contraseña normal)
- Verificar que la **verificación en 2 pasos** esté activada
- Comprobar credenciales en `settings.py`

### Cambiar a SQLite si PostgreSQL falla
```python
# En settings.py, cambiar DATABASES por:
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

## 🔧 Configuración Adicional

### Cambiar Puerto del Servidor
```bash
# Ejecutar en puerto diferente
python manage.py runserver 8080
# O especificar IP y puerto
python manage.py runserver 0.0.0.0:8000
```

### Configuración de Envío de Correos

El sistema incluye **notificaciones automáticas por email** cuando se completan tickets. Para activar esta función:

#### 1. Configurar Gmail para Aplicaciones
- Ve a tu **Cuenta de Google** → Seguridad
- Activa **Verificación en 2 pasos**
- Genera una **Contraseña de aplicación**:
  - Ve a "Contraseñas de aplicaciones"
  - Selecciona "Correo" y "Otros"
  - Escribe "Django Tickets"
  - **Guarda la contraseña generada** (16 caracteres)

#### 2. Configurar en settings.py
Modifica estas variables en `prueba1/settings.py`:

```python
# Configuración de Email
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tu-email@gmail.com'           # Tu Gmail
EMAIL_HOST_PASSWORD = 'contraseña-de-aplicacion'  # Los 16 caracteres generados
DEFAULT_FROM_EMAIL = 'tu-email@gmail.com'
```

#### 3. Configuración Alternativa (Variables de Entorno)
**Opción más segura** - Crear archivo `.env`:
```
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=contraseña-de-aplicacion
```

Y en `settings.py`:
```python
import os
from decouple import config  # pip install python-decouple

EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
```

**⚠️ IMPORTANTE**: 
- **Nunca subas las credenciales reales** a GitHub
- Usa **contraseña de aplicación**, NO tu contraseña normal de Gmail
- **Cambia el email** por el de tu organización

### Configuración de Base de Datos

#### Opción 1: SQLite (Recomendado para pruebas)
No requiere configuración adicional, se usa por defecto.

#### Opción 2: PostgreSQL (Configuración actual)
Si quieres usar PostgreSQL como en el desarrollo original:

1. **Instalar PostgreSQL** en tu sistema
2. **Crear una base de datos** llamada `tickets_ooapas` (o el nombre que prefieras)
3. **Modificar el archivo `prueba1/settings.py`**:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'tickets_ooapas',        # Nombre de tu base de datos
        'USER': 'tu_usuario_postgres',   # Tu usuario de PostgreSQL
        'PASSWORD': 'tu_contraseña',     # Tu contraseña de PostgreSQL
        'HOST': 'localhost',             # Servidor (localhost por defecto)
        'PORT': '5432',                  # Puerto (5432 por defecto)
    }
}
```

**⚠️ IMPORTANTE**: Cambiar las credenciales por las tuyas antes de usar PostgreSQL.

## 💻 Comandos Útiles

```bash
# Ver versión de Python
python --version

# Ver paquetes instalados
pip list

# Actualizar pip
python -m pip install --upgrade pip

# Desactivar entorno virtual
deactivate

# Ver logs del servidor (Ctrl+C para detener)
python manage.py runserver --verbosity=2
```

## 📱 Funcionalidades del Sistema

### Dashboard Principal
- Vista general de tickets
- Estadísticas por categoría
- Filtros avanzados

### Gestión de Tickets
- Crear nuevos tickets
- Asignar tickets a técnicos
- Actualizar estado de tickets
- Agregar reportes de finalización

### Administración de Usuarios
- Registrar nuevos usuarios
- Aprobar/rechazar usuarios
- Gestionar roles y permisos

## 📞 Soporte y Contacto

- **Desarrollador**: Rodrigo Zetina
- **GitHub**: https://github.com/ZetinaRodrigo/Tickets_OOAPAS
- **Empresa**: OOAPAS

## 📝 Notas Importantes

- ⚠️ **Mantener el entorno virtual activado** mientras trabajas con el proyecto
- 🔄 **El servidor debe estar ejecutándose** para acceder al sistema
- 💾 **La base de datos SQLite se crea automáticamente** en el primer inicio
- 🔐 **Cambiar la SECRET_KEY** en producción (settings.py)

---

## 🚀 Inicio Rápido (Resumen)

```bash
# 1. Descargar proyecto y entrar a la carpeta
cd Tickets_OOAPAS

# 2. Crear y activar entorno virtual  
python -m venv venv
venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar base de datos
python manage.py migrate

# 5. Ejecutar servidor
python manage.py runserver
```

**🌐 Abrir navegador en:** http://127.0.0.1:8000/

---

⚡ **Desarrollado con Django y ❤️ para OOAPAS** ⚡
