let selectedFiles = [];

// Función para ver imagen completa
function verImagenCompleta(url, nombre) {
    document.getElementById('imageModalImg').src = url;
    document.getElementById('imageModalTitle').textContent = nombre;
    new bootstrap.Modal(document.getElementById('imageModal')).show();
}

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

// Validación y manejo del input file
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('imagenes').addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        
        // NO limpiar archivos anteriores, solo agregar los nuevos
        
        for (let file of files) {
            if (!allowedTypes.includes(file.type)) {
                alert(`El archivo "${file.name}" no es una imagen válida. Solo se permiten archivos de imagen.`);
                e.target.value = '';
                showImagePreview();
                return;
            } else {
                // Verificar si el archivo ya existe (mismo nombre y tamaño)
                const fileExists = selectedFiles.some(existingFile => 
                    existingFile.name === file.name && existingFile.size === file.size
                );
                
                if (!fileExists) {
                    selectedFiles.push(file);
                }
            }
        }
        
        updateFileInput();
        showImagePreview();
        
        // Limpiar el input para permitir seleccionar los mismos archivos de nuevo si es necesario
        e.target.value = '';
    });
});