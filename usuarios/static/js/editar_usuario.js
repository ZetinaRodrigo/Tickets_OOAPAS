// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Control para mostrar categoría de sistemas
    document.getElementById('rol').addEventListener('change', function() {
        const categoriaDiv = document.getElementById('categoria-sistemas');
        const categoriaSelect = document.getElementById('categoria_sistemas');
        
        if (this.value === 'sistemas') {
            categoriaDiv.style.display = 'block';
            categoriaSelect.required = true;
        } else {
            categoriaDiv.style.display = 'none';
            categoriaSelect.required = false;
            categoriaSelect.value = '';
        }
    });

    // Validación antes de enviar
    document.querySelector('form').addEventListener('submit', function(e) {
        const rol = document.getElementById('rol').value;
        
        if (rol === 'sistemas' && !document.getElementById('categoria_sistemas').value) {
            e.preventDefault();
            alert('Debes seleccionar una categoría para usuario de sistemas');
            document.getElementById('categoria-sistemas').scrollIntoView();
        }
    });
});