// Archivo: static/js/ver-reporte.js

class ReporteTicketManager {
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
        this.addPrintFunctionality();
        console.log('✅ Reporte Ticket Manager inicializado');
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
    }

    initImageModal() {
        this.imageModal = new bootstrap.Modal(document.getElementById('imageModal'), {
            keyboard: true,
            focus: true
        });

        // Agregar controles adicionales al modal
        this.addModalControls();
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

        // Agregar botón de descarga
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-success btn-sm mt-2 w-100';
        downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i>Descargar Imagen';
        downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
        modalBody.appendChild(downloadBtn);
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
        this.imageModal.show();
    }

    updateModalImage(url, nombre) {
        const modalImg = document.getElementById('imageModalImg');
        const modalTitle = document.getElementById('imageModalTitle');
        
        if (modalImg && modalTitle) {
            modalImg.src = url;
            modalImg.alt = nombre;
            modalTitle.textContent = nombre;
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
                this.printReport();
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

    enhanceAccessibility() {
        // Mejorar semántica del reporte
        const reportContainer = document.querySelector('.report-container');
        if (reportContainer) {
            reportContainer.setAttribute('role', 'main');
            reportContainer.setAttribute('aria-label', 'Reporte de finalización del ticket');
        }

        // Mejorar cards de información
        const infoCards = document.querySelectorAll('.info-card');
        infoCards.forEach(card => {
            card.setAttribute('role', 'region');
            const title = card.querySelector('h5');
            if (title) {
                const id = 'card-' + Math.random().toString(36).substr(2, 9);
                title.id = id;
                card.setAttribute('aria-labelledby', id);
            }
        });

        // Mejorar detalle cards
        const detailCards = document.querySelectorAll('.detail-card');
        detailCards.forEach(card => {
            card.setAttribute('role', 'region');
            const title = card.querySelector('h6');
            if (title) {
                const id = 'detail-' + Math.random().toString(36).substr(2, 9);
                title.id = id;
                card.setAttribute('aria-labelledby', id);
            }
        });
    }

    addPrintFunctionality() {
        // Agregar botón de imprimir
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            const printBtn = document.createElement('button');
            printBtn.className = 'btn btn-outline-primary';
            printBtn.innerHTML = '<i class="bi bi-printer me-2"></i>Imprimir';
            printBtn.title = 'Imprimir reporte (Ctrl+P)';
            printBtn.addEventListener('click', () => this.printReport());
            
            const pageTitle = topBar.querySelector('.page-title');
            if (pageTitle) {
                topBar.appendChild(printBtn);
            }
        }
    }

    printReport() {
        // Optimizar para impresión
        const originalTitle = document.title;
        const reportTitle = document.querySelector('.report-header')?.textContent || 'Reporte';
        
        document.title = reportTitle;
        
        // Ocultar elementos no necesarios temporalmente
        const elementsToHide = document.querySelectorAll('.btn, .modal');
        elementsToHide.forEach(el => el.style.display = 'none');
        
        window.print();
        
        // Restaurar elementos
        elementsToHide.forEach(el => el.style.display = '');
        document.title = originalTitle;
    }

    // Función para generar un resumen rápido
    generateSummary() {
        const ticket = {
            titulo: document.querySelector('.info-card .info-value')?.textContent || '',
            categoria: document.querySelector('.categoria-badge')?.textContent || '',
            urgencia: document.querySelector('.urgency-badge')?.textContent || '',
            fechaCreacion: ''
        };

        const reporte = {
            titulo: '',
            completadoPor: '',
            fechaFinalizacion: ''
        };

        // Buscar información específica
        const infoRows = document.querySelectorAll('.info-row');
        infoRows.forEach(row => {
            const label = row.querySelector('.info-label')?.textContent || '';
            const value = row.querySelector('.info-value')?.textContent || '';
            
            if (label.includes('Fecha de creación')) {
                ticket.fechaCreacion = value;
            } else if (label.includes('Título del reporte')) {
                reporte.titulo = value;
            } else if (label.includes('Completado por')) {
                reporte.completadoPor = value;
            } else if (label.includes('Fecha de finalización')) {
                reporte.fechaFinalizacion = value;
            }
        });

        return { ticket, reporte };
    }

    // Exportar datos como JSON (para integraciones futuras)
    exportData() {
        const summary = this.generateSummary();
        const data = {
            ...summary,
            imagenes: this.images.map(img => ({
                nombre: img.nombre,
                url: img.src
            })),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Función global para compatibilidad con el HTML original
function verImagenCompleta(url, nombre) {
    if (window.reporteManager) {
        window.reporteManager.verImagenCompleta(url, nombre);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.reporteManager = new ReporteTicketManager();
    console.log('✅ Reporte Ticket JavaScript cargado correctamente');
});