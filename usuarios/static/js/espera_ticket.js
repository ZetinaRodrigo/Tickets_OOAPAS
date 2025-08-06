// Archivo: static/js/espera-ticket.js

class EsperaTicketManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.validateForm();
        console.log('✅ Espera Ticket Manager inicializado');
    }

    setupEventListeners() {
        // Auto-resize del textarea
        const textarea = document.getElementById('motivo');
        if (textarea) {
            textarea.addEventListener('input', this.autoResizeTextarea.bind(this));
            // Ajustar altura inicial
            this.autoResizeTextarea({ target: textarea });
        }

        // Validación en tiempo real
        const form = document.querySelector('form');
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
            
            // Validar campos en tiempo real
            const requiredFields = form.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                field.addEventListener('blur', this.validateField.bind(this));
                field.addEventListener('input', this.clearFieldError.bind(this));
            });
        }

        // Mejorar UX de los botones
        this.enhanceButtons();
    }

    autoResizeTextarea(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
    }

    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Remover validaciones anteriores
        this.clearFieldError(event);
        
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'Este campo es obligatorio');
            return false;
        }
        
        // Validación específica para el motivo
        if (field.id === 'motivo') {
            if (value.length < 10) {
                this.showFieldError(field, 'El motivo debe tener al menos 10 caracteres');
                return false;
            }
            if (value.length > 1000) {
                this.showFieldError(field, 'El motivo no puede exceder 1000 caracteres');
                return false;
            }
        }
        
        this.showFieldSuccess(field);
        return true;
    }

    showFieldError(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        // Remover mensaje de error anterior
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
        
        // Agregar nuevo mensaje de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    showFieldSuccess(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Remover mensaje de error
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }

    clearFieldError(event) {
        const field = event.target;
        field.classList.remove('is-invalid');
        
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }

    validateForm() {
        const form = document.querySelector('form');
        if (!form) return true;
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            const fieldValid = this.validateField({ target: field });
            if (!fieldValid) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        // Validar formulario
        if (!this.validateForm()) {
            this.showAlert('Por favor corrige los errores antes de continuar', 'danger');
            return;
        }
        
        // Mostrar confirmación
        const motivo = document.getElementById('motivo').value.trim();
        if (!this.confirmSubmission(motivo)) {
            return;
        }
        
        // Mostrar loading y enviar
        this.showLoading(true);
        event.target.submit();
    }

    confirmSubmission(motivo) {
        const preview = motivo.length > 100 ? motivo.substring(0, 100) + '...' : motivo;
        
        return confirm(
            `¿Estás seguro de que quieres poner este ticket en espera?\n\n` +
            `Motivo: "${preview}"\n\n` +
            `Esta acción cambiará el estado del ticket y notificará al usuario.`
        );
    }

    showLoading(show = true) {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        if (show) {
            submitBtn.disabled = true;
            const originalText = submitBtn.innerHTML;
            submitBtn.setAttribute('data-original-text', originalText);
            submitBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Procesando...
            `;
        } else {
            submitBtn.disabled = false;
            const originalText = submitBtn.getAttribute('data-original-text');
            if (originalText) {
                submitBtn.innerHTML = originalText;
            }
        }
    }

    showAlert(message, type = 'info') {
        // Crear alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Insertar al inicio del content-area
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertBefore(alertDiv, contentArea.firstChild);
            
            // Auto-remove después de 5 segundos
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }
    }

    enhanceButtons() {
        // Mejorar botón de volver
        const backBtn = document.querySelector('.back-btn, .btn-secondary');
        if (backBtn) {
            backBtn.addEventListener('click', (event) => {
                // Si hay cambios en el formulario, confirmar salida
                const form = document.querySelector('form');
                const motivo = document.getElementById('motivo');
                
                if (form && motivo && motivo.value.trim() && !motivo.hasAttribute('readonly')) {
                    if (!confirm('¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.')) {
                        event.preventDefault();
                        return false;
                    }
                }
            });
        }

        // Agregar efectos hover a botones
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    // Método para contar caracteres
    updateCharacterCount() {
        const textarea = document.getElementById('motivo');
        if (!textarea) return;
        
        const maxLength = 1000;
        const currentLength = textarea.value.length;
        
        // Crear o actualizar contador
        let counter = document.getElementById('character-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'character-counter';
            counter.className = 'form-text text-end';
            textarea.parentNode.appendChild(counter);
        }
        
        counter.textContent = `${currentLength}/${maxLength} caracteres`;
        
        // Cambiar color según proximidad al límite
        if (currentLength > maxLength * 0.9) {
            counter.style.color = '#dc3545';
        } else if (currentLength > maxLength * 0.75) {
            counter.style.color = '#ffc107';
        } else {
            counter.style.color = '#6c757d';
        }
    }

    // Mejorar accesibilidad
    enhanceAccessibility() {
        // Agregar atributos ARIA
        const form = document.querySelector('form');
        if (form) {
            form.setAttribute('novalidate', 'true'); // Usar validación personalizada
        }
        
        const requiredFields = document.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.setAttribute('aria-required', 'true');
        });
        
        // Mejorar navegación por teclado
        document.addEventListener('keydown', (event) => {
            // ESC para cancelar
            if (event.key === 'Escape') {
                const backBtn = document.querySelector('.btn-secondary');
                if (backBtn) {
                    backBtn.click();
                }
            }
            
            // Ctrl+Enter para enviar formulario
            if (event.ctrlKey && event.key === 'Enter') {
                const submitBtn = document.querySelector('button[type="submit"]');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const esperaManager = new EsperaTicketManager();
    
    // Configurar contador de caracteres si existe el textarea
    const textarea = document.getElementById('motivo');
    if (textarea) {
        textarea.addEventListener('input', () => {
            esperaManager.updateCharacterCount();
        });
        esperaManager.updateCharacterCount(); // Inicializar contador
    }
    
    // Mejorar accesibilidad
    esperaManager.enhanceAccessibility();
    
    console.log('✅ Espera Ticket JavaScript cargado correctamente');
});