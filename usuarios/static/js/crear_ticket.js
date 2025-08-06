let selectedFiles = [];

// Función para mostrar preview de las imágenes
function showImagePreview() {
    const previewContainer = document.getElementById('image-preview');
    previewContainer.innerHTML = '';

    if (selectedFiles.length === 0) {
        return;
    }

    previewContainer.innerHTML = '<h6 class="mb-3">Imágenes seleccionadas:</h6>';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-preview-card d-flex align-items-center';
            
            imageDiv.innerHTML = `
                <img src="${e.target.result}" style="width: 80px; height: 60px; object-fit: cover; margin-right: 15px;">
                <div class="flex-grow-1">
                    <small class="text-muted d-block">${file.name}</small>
                    <button type="button" class="btn btn-danger btn-sm mt-1" onclick="removeImage(${index})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            `;
            
            previewContainer.appendChild(imageDiv);
        };
        reader.readAsDataURL(file);
    });
}

// Función para eliminar una imagen
function removeImage(index) {
    selectedFiles.splice(index, 1);
    updateFileInput();
    showImagePreview();
}

// Función para actualizar el input file
function updateFileInput() {
    const fileInput = document.getElementById('imagenes');
    const dataTransfer = new DataTransfer();
    
    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });
    
    fileInput.files = dataTransfer.files;
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Validación y manejo del input file
    document.getElementById('imagenes').addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        
        console.log('Archivos seleccionados:', files.length); // Debug
        
        // Limpiar array y empezar de nuevo con los archivos seleccionados
        selectedFiles = [];
        
        for (let file of files) {
            console.log('Procesando archivo:', file.name, file.type); // Debug
            
            if (!allowedTypes.includes(file.type)) {
                alert(`El archivo "${file.name}" no es una imagen válida. Solo se permiten archivos de imagen.`);
                e.target.value = '';
                selectedFiles = [];
                showImagePreview();
                return;
            }
            
            selectedFiles.push(file);
        }
        
        console.log('Total archivos válidos:', selectedFiles.length); // Debug
        
        // NO llamar updateFileInput() aquí para evitar problemas
        // Los archivos ya están en el input original
        showImagePreview();
    });

    // Debug del formulario antes de enviar
    document.querySelector('form').addEventListener('submit', function(e) {
        const fileInput = document.getElementById('imagenes');
        console.log('=== DEBUG FORMULARIO ===');
        console.log('Archivos en input:', fileInput.files.length);
        console.log('Archivos en selectedFiles:', selectedFiles.length);
        
        for (let i = 0; i < fileInput.files.length; i++) {
            console.log(`Archivo ${i + 1}:`, fileInput.files[i].name);
        }
    });
});