// Archivo: static/js/visualizar-ticket.js

class VisualizarTicketManager {
    constructor() {
        this.imageModal = null;
        this.currentImageIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initImageModal();
        this.collectImages();
        this.enhanceAccessibility();
        this.addAnimations();
        this.addPrintFunctionality();
        console.log('✅ Visualizar Ticket Manager inicializado');
    }

    setupEventListeners() {
        // Navegación por teclado
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Clicks en imágenes
        const imageCards = document.querySelectorAll('.image-card');
        imageCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                const img = card.querySelector('img');
                const nombre = card.querySelector('.image-card-body small').textContent;
                this.verImagenCompleta(img.src, nombre, index);
            });
            
            // Mejorar accesibilidad
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Ver imagen ${card.querySelector('.image-card-body small').textContent}`);
            
            // Soporte para Enter/Space
            card.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });

        // Mejorar botones
        this.enhanceButtons();
        
        // Scroll suave para secciones
        this.addSmoothScrolling();
    }

    initImageModal() {
        const modalElement = document.getElementById('imageModal');
        if (modalElement) {
            this.imageModal = new bootstrap.Modal(modalElement, {
                keyboard: true,
                focus: true
            });

            // Agregar controles adicionales al modal
            this.addModalControls();
        }
    }

    addModalControls() {
        const modalBody = document.querySelector('#imageModal .modal-body');
        if (!modalBody) return;

        // Crear controles de navegación
        const controls = document.createElement('div');
        controls.className = 'image-controls mt-3 d-flex justify-content-between align-items-center';
        controls.innerHTML = `
            <button class="btn btn-outline-primary btn-sm" id="prevImageBtn" title="Imagen anterior (←)">
                <i class="bi bi-chevron-left"></i> Anterior
            </button>
            <div class="image-counter">
                <span id="currentImageNumber">1</span> de <span id="totalImages">1</span>
            </div>
            <button class="btn btn-outline-primary btn-sm" id="nextImageBtn" title="Imagen siguiente (→)">
                Siguiente <i class="bi bi-chevron-right"></i>
            </button>
        `;

        modalBody.appendChild(controls);

        // Event listeners para navegación
        document.getElementById('prevImageBtn').addEventListener('click', () => this.showPreviousImage());
        document.getElementById('nextImageBtn').addEventListener('click', () => this.showNextImage());

        // Agregar botón de descarga y zoom
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons mt-2 d-flex gap-2';
        actionButtons.innerHTML = `
            <button class="btn btn-success btn-sm flex-fill" onclick="visualizarManager.downloadCurrentImage()">
                <i class="bi bi-download me-2"></i>Descargar
            </button>
            <button class="btn btn-info btn-sm flex-fill" onclick="visualizarManager.toggleImageZoom()">
                <i class="bi bi-zoom-in me-2"></i>Zoom
            </button>
        `;
        modalBody.appendChild(actionButtons);
    }

    collectImages() {
        const imageCards = document.querySelectorAll('.image-card');
        this.images = Array.from(imageCards).map(card => {
            const img = card.querySelector('img');
            const nombre = card.querySelector('.image-card-body small').textContent;
            return {
                src: img.src,
                nombre: nombre,
                alt: img.alt || nombre
            };
        });
    }

    verImagenCompleta(url, nombre, index = 0) {
        this.currentImageIndex = index;
        this.updateModalImage(url, nombre);
        this.updateNavigationControls();
        if (this.imageModal) {
            this.imageModal.show();
        }
    }

    updateModalImage(url, nombre) {
        const modalImg = document.getElementById('imageModalImg');
        const modalTitle = document.getElementById('imageModalTitle');
        
        if (modalImg && modalTitle) {
            modalImg.src = url;
            modalImg.alt = nombre;
            modalTitle.textContent = nombre;
            modalImg.style.transform = 'scale(1)'; // Reset zoom
        }
    }

    updateNavigationControls() {
        const currentNumber = document.getElementById('currentImageNumber');
        const totalImages = document.getElementById('totalImages');
        const prevBtn = document.getElementById('prevImageBtn');
        const nextBtn = document.getElementById('nextImageBtn');

        if (currentNumber && totalImages) {
            currentNumber.textContent = this.currentImageIndex + 1;
            totalImages.textContent = this.images.length;
        }

        if (prevBtn && nextBtn) {
            prevBtn.disabled = this.currentImageIndex === 0;
            nextBtn.disabled = this.currentImageIndex === this.images.length - 1;
            
            // Ocultar controles si solo hay una imagen
            const controls = document.querySelector('.image-controls');
            if (controls) {
                controls.style.display = this.images.length <= 1 ? 'none' : 'flex';
            }
        }
    }

    showPreviousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
            const image = this.images[this.currentImageIndex];
            this.updateModalImage(image.src, image.nombre);
            this.updateNavigationControls();
        }
    }

    showNextImage() {
        if (this.currentImageIndex < this.images.length - 1) {
            this.currentImageIndex++;
            const image = this.images[this.currentImageIndex];
            this.updateModalImage(image.src, image.nombre);
            this.updateNavigationControls();
        }
    }

    downloadCurrentImage() {
        if (this.images.length === 0) return;

        const currentImage = this.images[this.currentImageIndex];
        const link = document.createElement('a');
        link.href = currentImage.src;
        link.download = currentImage.nombre || 'imagen.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    toggleImageZoom() {
        const modalImg = document.getElementById('imageModalImg');
        if (!modalImg) return;

        const currentScale = modalImg.style.transform;
        const isZoomed = currentScale.includes('scale(2)');
        
        modalImg.style.transform = isZoomed ? 'scale(1)' : 'scale(2)';
        modalImg.style.cursor = isZoomed ? 'zoom-in' : 'zoom-out';
        
        // Actualizar texto del botón
        const zoomBtn = document.querySelector('.action-buttons .btn-info');
        if (zoomBtn) {
            const icon = zoomBtn.querySelector('i');
            icon.className = isZoomed ? 'bi bi-zoom-in me-2' : 'bi bi-zoom-out me-2';
        }
    }

    handleKeydown(event) {
        // Solo procesar si el modal está abierto
        if (!document.querySelector('#imageModal.show')) {
            // Shortcuts globales
            if (event.key === 'Escape') {
                const backBtn = document.querySelector('.back-btn');
                if (backBtn) backBtn.click();
            }
            if (event.ctrlKey && event.key === 'p') {
                event.preventDefault();
                this.printTicket();
            }
            return;
        }

        // Navegación en modal
        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                this.showPreviousImage();
                break;
            case 'ArrowRight':
                event.preventDefault();
                this.showNextImage();
                break;
            case 'Escape':
                this.imageModal.hide();
                break;
            case 'd':
            case 'D':
                event.preventDefault();
                this.downloadCurrentImage();
                break;
            case 'z':
            case 'Z':
                event.preventDefault();
                this.toggleImageZoom();
                break;
        }
    }

    enhanceButtons() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // Agregar tooltip al botón de volver
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.title = 'Volver al Dashboard (ESC)';
        }
    }

    addSmoothScrolling() {
        // Crear índice de navegación rápida
        this.createQuickNavigation();
        
        // Suavizar scroll entre secciones
        const sections = document.querySelectorAll('.info-section');
        sections.forEach((section, index) => {
            const title = section.querySelector('.section-title');
            if (title) {
                title.style.cursor = 'pointer';
                title.addEventListener('click', () => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }
        });
    }

    createQuickNavigation() {
        const sections = document.querySelectorAll('.info-section');
        if (sections.length <= 2) return; // No crear navegación si hay pocas secciones

        const nav = document.createElement('div');
        nav.className = 'quick-nav';
        nav.style.cssText = `
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            padding: 10px;
            z-index: 1000;
            display: none;
        `;

        sections.forEach((section, index) => {
            const title = section.querySelector('.section-title');
            if (!title) return;

            const navItem = document.createElement('div');
            navItem.className = 'quick-nav-item';
            navItem.style.cssText = `
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #dee2e6;
                margin: 8px 0;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            navItem.title = title.textContent;
            
            navItem.addEventListener('click', () => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            nav.appendChild(navItem);
        });

        document.body.appendChild(nav);

        // Mostrar navegación cuando se hace scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            nav.style.display = 'block';
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                nav.style.display = 'none';
            }, 3000);
        });
    }

    enhanceAccessibility() {
        // Mejorar semántica del ticket
        const ticketContainer = document.querySelector('.ticket-container');
        if (ticketContainer) {
            ticketContainer.setAttribute('role', 'main');
            ticketContainer.setAttribute('aria-label', 'Información detallada del ticket');
        }

        // Mejorar badges con información adicional
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.setAttribute('aria-label', `Estado del ticket: ${statusBadge.textContent}`);
        }

        const urgencyBadge = document.querySelector('.urgency-badge');
        if (urgencyBadge) {
            urgencyBadge.setAttribute('aria-label', `Nivel de urgencia: ${urgencyBadge.textContent}`);
        }

        // Mejorar timeline con roles
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.setAttribute('role', 'listitem');
            item.setAttribute('aria-label', `Evento ${index + 1} del historial`);
        });

        // Agregar landmarks
        const sections = document.querySelectorAll('.info-section');
        sections.forEach(section => {
            section.setAttribute('role', 'region');
            const title = section.querySelector('.section-title');
            if (title) {
                const id = 'section-' + Math.random().toString(36).substr(2, 9);
                title.id = id;
                section.setAttribute('aria-labelledby', id);
            }
        });
    }

    addAnimations() {
        // Animación de entrada para los badges
        const badges = document.querySelectorAll('.status-badge, .urgency-badge, .categoria-badge');
        badges.forEach((badge, index) => {
            badge.style.animationDelay = `${index * 0.1}s`;
        });

        // Animación de entrada para elementos del timeline
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
        });

        // Efecto parallax suave en el header
        const ticketHeader = document.querySelector('.ticket-header');
        if (ticketHeader) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                ticketHeader.style.transform = `translateY(${rate}px)`;
            });
        }
    }

    addPrintFunctionality() {
        // Agregar botón de imprimir
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            const printBtn = document.createElement('button');
            printBtn.className = 'btn btn-outline-primary';
            printBtn.innerHTML = '<i class="bi bi-printer me-2"></i>Imprimir';
            printBtn.title = 'Imprimir ticket (Ctrl+P)';
            printBtn.addEventListener('click', () => this.printTicket());
            
            topBar.appendChild(printBtn);
        }
    }

    printTicket() {
        // Optimizar para impresión
        const originalTitle = document.title;
        const ticketTitle = document.querySelector('.ticket-header')?.textContent || 'Ticket';
        
        document.title = `Ticket - ${ticketTitle}`;
        
        // Ocultar elementos no necesarios temporalmente
        const elementsToHide = document.querySelectorAll('.btn, .modal, .quick-nav');
        elementsToHide.forEach(el => el.style.display = 'none');
        
        // Expandir imágenes para impresión
        const images = document.querySelectorAll('.image-card img');
        const originalHeights = [];
        images.forEach((img, index) => {
            originalHeights[index] = img.style.height;
            img.style.height = 'auto';
            img.style.maxHeight = '300px';
        });
        
        window.print();
        
        // Restaurar elementos y estilos
        elementsToHide.forEach(el => el.style.display = '');
        images.forEach((img, index) => {
            img.style.height = originalHeights[index] || '200px';
            img.style.maxHeight = '';
        });
        document.title = originalTitle;
    }

    // Función para generar un resumen del ticket
    generateTicketSummary() {
        const ticket = {
            titulo: document.querySelector('.ticket-header')?.textContent?.replace('👁', '').trim() || '',
            estatus: document.querySelector('.status-badge')?.textContent || '',
            urgencia: document.querySelector('.urgency-badge')?.textContent || '',
            categoria: document.querySelector('.categoria-badge')?.textContent || '',
            fechaCreacion: '',
            creadoPor: '',
            descripcion: document.querySelector('.description-content')?.textContent || ''
        };

        // Buscar información específica
        const infoRows = document.querySelectorAll('.info-row');
        infoRows.forEach(row => {
            const label = row.querySelector('.info-label')?.textContent || '';
            const value = row.querySelector('.info-value')?.textContent || '';
            
            if (label.includes('Creado por')) {
                ticket.creadoPor = value;
            } else if (label.includes('Fecha de creación')) {
                ticket.fechaCreacion = value;
            }
        });

        return ticket;
    }

    // Función para exportar información del ticket
    exportTicketData() {
        const summary = this.generateTicketSummary();
        const data = {
            ...summary,
            imagenes: this.images.map(img => ({
                nombre: img.nombre,
                url: img.src
            })),
            exportDate: new Date().toISOString(),
            url: window.location.href
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Función para compartir ticket (si el navegador lo soporta)
    async shareTicket() {
        if (navigator.share) {
            const summary = this.generateTicketSummary();
            try {
                await navigator.share({
                    title: `Ticket: ${summary.titulo}`,
                    text: `Estado: ${summary.estatus}\nUrgencia: ${summary.urgencia}\nCreado por: ${summary.creadoPor}`,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Error al compartir:', error);
                this.copyTicketLink();
            }
        } else {
            this.copyTicketLink();
        }
    }

    copyTicketLink() {
        navigator.clipboard.writeText(window.location.href).then(() => {
            this.showNotification('Enlace copiado al portapapeles', 'success');
        }).catch(() => {
            this.showNotification('No se pudo copiar el enlace', 'error');
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'error' ? 'danger' : type} position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;

        document.body.appendChild(notification);

        // Auto-remove después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    // Función para crear atajos de teclado personalizados
    setupKeyboardShortcuts() {
        const shortcuts = {
            'KeyP': { ctrl: true, action: () => this.printTicket(), description: 'Imprimir ticket' },
            'KeyS': { ctrl: true, action: () => this.shareTicket(), description: 'Compartir ticket' },
            'KeyE': { ctrl: true, action: () => this.exportTicketData(), description: 'Exportar datos' },
            'Escape': { action: () => window.history.back(), description: 'Volver atrás' }
        };

        document.addEventListener('keydown', (event) => {
            const shortcut = shortcuts[event.code] || shortcuts[event.key];
            if (shortcut) {
                if (shortcut.ctrl && !event.ctrlKey) return;
                if (!shortcut.ctrl && event.ctrlKey) return;
                
                event.preventDefault();
                shortcut.action();
            }
        });

        // Mostrar ayuda de atajos (opcional)
        this.createShortcutsHelp(shortcuts);
    }

    createShortcutsHelp(shortcuts) {
        const helpBtn = document.createElement('button');
        helpBtn.className = 'btn btn-outline-secondary btn-sm position-fixed';
        helpBtn.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000; border-radius: 50%; width: 40px; height: 40px;';
        helpBtn.innerHTML = '<i class="bi bi-question-lg"></i>';
        helpBtn.title = 'Mostrar atajos de teclado';
        
        helpBtn.addEventListener('click', () => {
            const helpModal = document.createElement('div');
            helpModal.className = 'modal fade';
            helpModal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Atajos de Teclado</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="list-group">
                                <div class="list-group-item"><kbd>Ctrl + P</kbd> - Imprimir ticket</div>
                                <div class="list-group-item"><kbd>Ctrl + S</kbd> - Compartir ticket</div>
                                <div class="list-group-item"><kbd>Ctrl + E</kbd> - Exportar datos</div>
                                <div class="list-group-item"><kbd>ESC</kbd> - Volver atrás</div>
                                <div class="list-group-item"><kbd>← →</kbd> - Navegar imágenes (en modal)</div>
                                <div class="list-group-item"><kbd>Z</kbd> - Zoom imagen (en modal)</div>
                                <div class="list-group-item"><kbd>D</kbd> - Descargar imagen (en modal)</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(helpModal);
            const modal = new bootstrap.Modal(helpModal);
            modal.show();
            
            helpModal.addEventListener('hidden.bs.modal', () => {
                helpModal.remove();
            });
        });
        
        document.body.appendChild(helpBtn);
    }
}

// Función global para compatibilidad con el HTML original
function verImagenCompleta(url, nombre) {
    if (window.visualizarManager) {
        window.visualizarManager.verImagenCompleta(url, nombre);
    }
}

// Agregar estilos para animaciones
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyles);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.visualizarManager = new VisualizarTicketManager();
    visualizarManager.setupKeyboardShortcuts();
    console.log('✅ Visualizar Ticket JavaScript cargado correctamente');
});