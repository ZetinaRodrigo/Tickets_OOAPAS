// 🚀 DASHBOARD JAVASCRIPT - Versión Optimizada
// Archivo: static/js/dashboard.js

class DashboardManager {
    constructor() {
        this.ticketAEliminar = null;
        this.filterTimeout = null;
        this.currentTab = 'mis-tickets';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initTabs();
        this.initFilters();
        this.detectActiveTab();
        console.log('✅ Dashboard Manager inicializado');
    }

    // =================== UTILIDADES ===================
    getCSRFToken() {
        const tokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
        return tokenElement ? tokenElement.value : '';
    }

    showLoading(show = true) {
        let loader = document.getElementById('global-loader');
        
        if (show) {
            if (!loader) {
                const loaderHTML = `
                    <div id="global-loader" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                         background: rgba(0,0,0,0.3); z-index: 9998; display: flex; align-items: center; justify-content: center;">
                        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', loaderHTML);
            }
        } else {
            if (loader) {
                loader.remove();
            }
        }
    }

    showFilterLoading(show = true) {
        let loader = document.getElementById('filters-loader');
        
        if (show) {
            if (!loader) {
                const filtersSection = document.querySelector('.filters-section');
                if (filtersSection) {
                    loader = document.createElement('div');
                    loader.id = 'filters-loader';
                    loader.style.cssText = `
                        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(255,255,255,0.8); display: flex; align-items: center; 
                        justify-content: center; z-index: 1000; border-radius: 15px;
                    `;
                    loader.innerHTML = `
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Aplicando filtros...</span>
                        </div>
                    `;
                    
                    filtersSection.style.position = 'relative';
                    filtersSection.appendChild(loader);
                }
            }
        } else {
            if (loader) {
                loader.remove();
            }
        }
    }

    // =================== OPERACIONES DE TICKETS ===================
    async cambiarUrgencia(ticketId, selectElement) {
        const nuevaUrgencia = selectElement.value;
        const valorOriginal = selectElement.getAttribute('data-original') || selectElement.value;
        
        if (!selectElement.hasAttribute('data-original')) {
            selectElement.setAttribute('data-original', valorOriginal);
        }
        
        try {
            const response = await fetch(`/cambiar-urgencia/${ticketId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: `urgencia=${nuevaUrgencia}`
            });

            const data = await response.json();
            
            if (data.success) {
                this.updateUrgencyBadges(ticketId, nuevaUrgencia);
                console.log(`Urgencia actualizada a ${nuevaUrgencia} para ticket ${ticketId}`);
            } else {
                throw new Error(data.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al cambiar urgencia:', error);
            alert('Error al cambiar urgencia: ' + error.message);
            selectElement.value = valorOriginal;
        }
    }

    updateUrgencyBadges(ticketId, nuevaUrgencia) {
        // Actualizar badges de urgencia
        const badges = document.querySelectorAll(`[data-ticket-id="${ticketId}"] .urgency-badge`);
        badges.forEach(badge => {
            badge.className = `urgency-badge urgency-${nuevaUrgencia}`;
            badge.textContent = nuevaUrgencia;
        });
        
        // Actualizar selects de urgencia
        const selects = document.querySelectorAll(`[data-ticket-id="${ticketId}"] select`);
        selects.forEach(select => {
            if (select.onchange && select.onchange.toString().includes('cambiarUrgencia')) {
                select.value = nuevaUrgencia;
                select.setAttribute('data-original', nuevaUrgencia);
            }
        });
    }

    async aceptarTicket(ticketId, titulo) {
        this.showLoading(true);
        
        try {
            const response = await fetch(`/aceptar-ticket/${ticketId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('activeTab', 'disponibles');
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(data.error || 'Error al aceptar ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al aceptar ticket');
        } finally {
            this.showLoading(false);
        }
    }

    async asignarTicket(ticketId, usuarioSistemasId, categoria) {
        if (!usuarioSistemasId) return;
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`/asignar-ticket/${ticketId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: `usuario_sistemas_id=${usuarioSistemasId}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('activeTab', 'disponibles');
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(data.error || 'Error al asignar ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al asignar ticket');
        } finally {
            this.showLoading(false);
        }
    }

    async reasignarTicket(ticketId, nuevoUsuarioSistemasId, categoria) {
        if (!nuevoUsuarioSistemasId) return;
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`/reasignar-ticket/${ticketId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: `nuevo_usuario_sistemas_id=${nuevoUsuarioSistemasId}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                localStorage.setItem('activeTab', 'asignados');
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(data.error || 'Error al reasignar ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al reasignar ticket');
        } finally {
            this.showLoading(false);
        }
    }

    async cambiarEstatusConValidacion(ticketId, nuevoEstatus) {
        if (!nuevoEstatus) return;
        
        // Redirecciones especiales
        if (nuevoEstatus === 'cancelado') {
            window.location.href = `/cancelar-ticket/${ticketId}/`;
            return;
        }
        
        if (nuevoEstatus === 'espera_redirect') {
            window.location.href = `/poner-en-espera/${ticketId}/`;
            return;
        }
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`/cambiar-estatus/${ticketId}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: `estatus=${nuevoEstatus}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(data.error || 'Error al cambiar estatus');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cambiar estatus');
        } finally {
            this.showLoading(false);
        }
    }

    eliminarTicket(ticketId, titulo) {
        this.ticketAEliminar = ticketId;
        document.getElementById('ticketTitulo').textContent = titulo;
        new bootstrap.Modal(document.getElementById('confirmDeleteModal')).show();
    }

    async confirmarEliminar() {
        if (!this.ticketAEliminar) return;
        
        this.showLoading(true);
        
        try {
            const response = await fetch(`/eliminar-ticket/${this.ticketAEliminar}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('confirmDeleteModal')).hide();
                setTimeout(() => location.reload(), 500);
            } else {
                throw new Error(data.error || 'Error al eliminar ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar ticket');
        } finally {
            this.showLoading(false);
        }
    }

    // =================== SISTEMA DE TABS ===================
    initTabs() {
        const tabButtons = document.querySelectorAll('.custom-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Event listeners para los botones de tab
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
        
        // Restaurar tab activo
        this.restoreActiveTab();
    }

    switchTab(targetTab) {
        const tabButtons = document.querySelectorAll('.custom-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Remover clase active
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activar el tab seleccionado
        const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
        const activeContent = document.getElementById(targetTab);
        
        if (activeButton) activeButton.classList.add('active');
        if (activeContent) activeContent.classList.add('active');
        
        // Actualizar tab actual y manejar filtros
        this.currentTab = targetTab;
        this.handleStatusFilterVisibility();
        
        // Guardar en localStorage
        localStorage.setItem('activeTab', targetTab);
    }

    restoreActiveTab() {
        let activeTab = localStorage.getItem('activeTab');
        
        // Si no hay tab guardado, detectar desde URL
        if (!activeTab) {
            activeTab = this.detectTabFromUrl();
        }
        
        // Verificar que el tab existe
        const tabExists = document.getElementById(activeTab);
        const buttonExists = document.querySelector(`[data-tab="${activeTab}"]`);
        
        if (tabExists && buttonExists) {
            this.switchTab(activeTab);
        } else {
            // Fallback al primer tab disponible
            const firstButton = document.querySelector('.custom-tab');
            if (firstButton) {
                const firstTab = firstButton.getAttribute('data-tab');
                this.switchTab(firstTab);
            }
        }
    }

    detectTabFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('page_creados')) return 'mis-tickets';
        if (urlParams.has('page_disponibles')) return 'disponibles';
        if (urlParams.has('page_asignados')) return 'asignados';
        if (urlParams.has('page_todos')) return 'todos';
        
        return 'mis-tickets'; // default
    }

    detectActiveTab() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('page_creados')) {
            this.currentTab = 'mis-tickets';
        } else if (urlParams.has('page_disponibles')) {
            this.currentTab = 'disponibles';
        } else if (urlParams.has('page_asignados')) {
            this.currentTab = 'asignados';
        } else if (urlParams.has('page_todos')) {
            this.currentTab = 'todos';
        } else {
            const activeTab = document.querySelector('.custom-tab.active');
            if (activeTab) {
                this.currentTab = activeTab.getAttribute('data-tab') || 'mis-tickets';
            }
        }
        
        this.handleStatusFilterVisibility();
    }

    // =================== SISTEMA DE FILTROS ===================
    initFilters() {
        this.setupFilterEventListeners();
        this.loadCurrentFilters();
        this.updateFilterTags();
    }

    setupFilterEventListeners() {
        // Búsqueda con debounce
        const searchInput = document.getElementById('search-text');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this.filterTimeout);
                this.filterTimeout = setTimeout(() => this.applyFilters(), 800);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(this.filterTimeout);
                    this.applyFilters();
                }
            });
        }
        
        // Filtros automáticos
        const filterIds = ['filter-urgency', 'filter-status', 'filter-date-from', 'filter-date-to'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    clearTimeout(this.filterTimeout);
                    this.filterTimeout = setTimeout(() => this.applyFilters(), 300);
                });
            }
        });
        
        // Botón limpiar
        const clearBtn = document.getElementById('clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
    }

    loadCurrentFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const filters = {
            search: urlParams.get('search') || '',
            urgency: urlParams.get('urgency') || '',
            status: urlParams.get('status') || '',
            date_from: urlParams.get('date_from') || '',
            date_to: urlParams.get('date_to') || ''
        };
        
        // Poblar campos del formulario
        Object.entries({
            search: 'search-text',
            urgency: 'filter-urgency',
            status: 'filter-status',
            date_from: 'filter-date-from',
            date_to: 'filter-date-to'
        }).forEach(([key, elementId]) => {
            if (filters[key]) {
                const element = document.getElementById(elementId);
                if (element) {
                    element.value = filters[key];
                    
                    // Restablecer foco en búsqueda
                    if (key === 'search') {
                        setTimeout(() => {
                            element.focus();
                            element.setSelectionRange(element.value.length, element.value.length);
                        }, 100);
                    }
                }
            }
        });
    }

    getFilterValues() {
        return {
            search: document.getElementById('search-text')?.value.trim() || '',
            urgency: document.getElementById('filter-urgency')?.value || '',
            status: document.getElementById('filter-status')?.value || '',
            date_from: document.getElementById('filter-date-from')?.value || '',
            date_to: document.getElementById('filter-date-to')?.value || ''
        };
    }

    applyFilters() {
        this.showFilterLoading(true);
        
        const filters = this.getFilterValues();
        const url = new URL(window.location.href);
        const params = new URLSearchParams();
        
        // Limpiar parámetros de paginación
        ['page_creados', 'page_asignados', 'page_disponibles', 'page_todos'].forEach(param => {
            url.searchParams.delete(param);
        });
        
        // Agregar filtros activos
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });
        
        // Navegar a nueva URL
        const newUrl = url.pathname + (params.toString() ? '?' + params.toString() : '');
        window.location.href = newUrl;
    }

    clearFilters() {
        this.showFilterLoading(true);
        
        // Limpiar campos
        const filterIds = ['search-text', 'filter-urgency', 'filter-status', 'filter-date-from', 'filter-date-to'];
        filterIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
        
        // Navegar a URL limpia
        window.location.href = window.location.pathname;
    }

    removeFilter(filterKey) {
        const filterMap = {
            'search': 'search-text',
            'urgency': 'filter-urgency',
            'status': 'filter-status',
            'date_from': 'filter-date-from',
            'date_to': 'filter-date-to'
        };
        
        const elementId = filterMap[filterKey];
        const element = document.getElementById(elementId);
        
        if (element) {
            element.value = '';
            this.applyFilters();
        }
    }

    handleStatusFilterVisibility() {
        const statusFilterContainer = document.getElementById('filter-status')?.closest('.col-md-2');
        
        if (statusFilterContainer) {
            if (this.currentTab === 'disponibles') {
                statusFilterContainer.style.display = 'none';
                const statusSelect = document.getElementById('filter-status');
                if (statusSelect && statusSelect.value) {
                    statusSelect.value = '';
                }
            } else {
                statusFilterContainer.style.display = 'block';
            }
        }
    }

    updateFilterTags() {
        const container = document.getElementById('active-filters');
        const tagsContainer = document.getElementById('filter-tags');
        
        if (!container || !tagsContainer) return;
        
        const filters = this.getFilterValues();
        const tags = [];
        
        // Generar tags
        if (filters.search) {
            tags.push({ label: `Búsqueda: "${filters.search}"`, key: 'search' });
        }
        
        if (filters.urgency) {
            const urgencyLabels = { '1': 'Baja', '2': 'Media', '3': 'Alta', '4': 'Crítica' };
            tags.push({ label: `Urgencia: ${urgencyLabels[filters.urgency]}`, key: 'urgency' });
        }
        
        if (filters.status) {
            const statusLabels = {
                'generado': 'Generado',
                'en_proceso': 'En Proceso',
                'en_espera': 'En Espera',
                'cancelado': 'Cancelado',
                'finalizado': 'Finalizado'
            };
            tags.push({ label: `Estatus: ${statusLabels[filters.status]}`, key: 'status' });
        }
        
        if (filters.date_from) {
            tags.push({ label: `Desde: ${filters.date_from}`, key: 'date_from' });
        }
        
        if (filters.date_to) {
            tags.push({ label: `Hasta: ${filters.date_to}`, key: 'date_to' });
        }
        
        // Mostrar/ocultar container y crear tags
        if (tags.length > 0) {
            tagsContainer.innerHTML = '';
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'filter-tag';
                tagElement.innerHTML = `
                    ${tag.label}
                    <button class="remove-filter" onclick="dashboard.removeFilter('${tag.key}')">
                        <i class="bi bi-x"></i>
                    </button>
                `;
                tagsContainer.appendChild(tagElement);
            });
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // =================== EVENT LISTENERS GENERALES ===================
    setupEventListeners() {
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('.dropdown-menu.show');
            
            dropdowns.forEach(dropdown => {
                const parent = dropdown.closest('.dropdown');
                if (parent && !parent.contains(e.target)) {
                    const toggleButton = parent.querySelector('[data-bs-toggle="dropdown"]');
                    if (toggleButton) {
                        bootstrap.Dropdown.getInstance(toggleButton)?.hide();
                    }
                }
            });
        });
    }
}

// =================== FUNCIONES GLOBALES (para compatibilidad con HTML) ===================
let dashboard;

// Funciones que se llaman desde el HTML
function cambiarUrgencia(ticketId, selectElement) {
    dashboard.cambiarUrgencia(ticketId, selectElement);
}

function aceptarTicket(ticketId, titulo) {
    dashboard.aceptarTicket(ticketId, titulo);
}

function asignarTicket(ticketId, usuarioSistemasId, categoria) {
    dashboard.asignarTicket(ticketId, usuarioSistemasId, categoria);
}

function reasignarTicket(ticketId, nuevoUsuarioSistemasId, categoria) {
    dashboard.reasignarTicket(ticketId, nuevoUsuarioSistemasId, categoria);
}

function cambiarEstatusConValidacion(ticketId, nuevoEstatus) {
    dashboard.cambiarEstatusConValidacion(ticketId, nuevoEstatus);
}

function cambiarEstatus(ticketId, nuevoEstatus) {
    dashboard.cambiarEstatusConValidacion(ticketId, nuevoEstatus);
}

function eliminarTicket(ticketId, titulo) {
    dashboard.eliminarTicket(ticketId, titulo);
}

function confirmarEliminar() {
    dashboard.confirmarEliminar();
}

// =================== INICIALIZACIÓN ===================
document.addEventListener('DOMContentLoaded', function() {
    // Pequeño delay para asegurar que Bootstrap esté listo
    setTimeout(() => {
        dashboard = new DashboardManager();
        
        // Hacer disponible globalmente para los filtros
        window.serverFilters = {
            removeFilter: (key) => dashboard.removeFilter(key)
        };
        
        console.log('✅ Dashboard JavaScript cargado correctamente');
    }, 300);
});