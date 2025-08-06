// Sistema de tabs personalizado
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.custom-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Función para cambiar tabs
    function switchTab(targetTab) {
        // Remover clase active de todos los botones y contenidos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Activar el botón clickeado
        const activeButton = document.querySelector(`[data-tab="${targetTab}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        // Activar el contenido correspondiente
        const activeContent = document.getElementById(targetTab);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Guardar en localStorage
        localStorage.setItem('activeUserTab', targetTab);
    }
    
    // Event listeners para los botones de tab
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // Restaurar tab activo desde localStorage
    const savedTab = localStorage.getItem('activeUserTab');
    if (savedTab && document.getElementById(savedTab)) {
        switchTab(savedTab);
    }
});

// Sistema de filtros para usuarios
class UserFilters {
    constructor() {
        this.currentTab = 'usuarios';
        this.filterTimeout = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCurrentFilters();
        this.updateFilterTags();
        this.detectActiveTab();
    }
    
    detectActiveTab() {
        // Detectar tab activo basándose en parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('page_admitidos')) {
            this.currentTab = 'usuarios';
        } else if (urlParams.has('page_por_admitir')) {
            this.currentTab = 'usuarios-por-admitir';
        } else {
            // Usar el tab activo del DOM
            const activeTab = document.querySelector('.custom-tab.active');
            if (activeTab) {
                this.currentTab = activeTab.getAttribute('data-tab') || 'usuarios';
            }
        }
    }
    
    setupEventListeners() {
        // Búsqueda con debounce
        const searchInput = document.getElementById('search-user');
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
        ['filter-rol', 'filter-categoria'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    clearTimeout(this.filterTimeout);
                    this.filterTimeout = setTimeout(() => this.applyFilters(), 300);
                });
            }
        });
        
        // Botón limpiar
        const clearBtn = document.getElementById('clear-user-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearFilters());
        }
        
        // Escuchar cambios de tab
        document.querySelectorAll('.custom-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.getAttribute('data-tab');
            });
        });
    }
    
    loadCurrentFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const filters = {
            search: urlParams.get('search') || '',
            rol: urlParams.get('rol') || '',
            categoria: urlParams.get('categoria') || ''
        };
        
        // Poblar los campos del formulario
        if (filters.search) {
            const searchField = document.getElementById('search-user');
            if (searchField) {
                searchField.value = filters.search;
                // Restablecer foco y posición del cursor al final
                setTimeout(() => {
                    searchField.focus();
                    searchField.setSelectionRange(searchField.value.length, searchField.value.length);
                }, 100);
            }
        }
        
        if (filters.rol) {
            const rolField = document.getElementById('filter-rol');
            if (rolField) rolField.value = filters.rol;
        }
        
        if (filters.categoria) {
            const categoriaField = document.getElementById('filter-categoria');
            if (categoriaField) categoriaField.value = filters.categoria;
        }
    }
    
    applyFilters() {
        this.showLoading(true);
        
        const filters = this.getFilterValues();
        
        // Construir URL con filtros
        const url = new URL(window.location.href);
        const params = new URLSearchParams();
        
        // Limpiar parámetros de paginación existentes
        url.searchParams.delete('page_admitidos');
        url.searchParams.delete('page_por_admitir');
        
        // Agregar filtros solo si tienen valor
        if (filters.search) params.set('search', filters.search);
        if (filters.rol) params.set('rol', filters.rol);
        if (filters.categoria) params.set('categoria', filters.categoria);
        
        // Navegar a la nueva URL
        const newUrl = url.pathname + (params.toString() ? '?' + params.toString() : '');
        window.location.href = newUrl;
    }
    
    getFilterValues() {
        return {
            search: document.getElementById('search-user')?.value.trim() || '',
            rol: document.getElementById('filter-rol')?.value || '',
            categoria: document.getElementById('filter-categoria')?.value || ''
        };
    }
    
    clearFilters() {
        this.showLoading(true);
        
        // Limpiar campos
        ['search-user', 'filter-rol', 'filter-categoria'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        
        // Navegar a URL limpia
        window.location.href = window.location.pathname;
    }
    
    updateFilterTags() {
        const container = document.getElementById('active-user-filters');
        const tagsContainer = document.getElementById('user-filter-tags');
        
        if (!container || !tagsContainer) return;
        
        const filters = this.getFilterValues();
        tagsContainer.innerHTML = '';
        
        const tags = [];
        
        if (filters.search) {
            tags.push({ 
                label: `Búsqueda: "${filters.search}"`, 
                key: 'search'
            });
        }
        
        if (filters.rol) {
            const rolLabels = { 'admin': 'Administrador', 'sistemas': 'Sistemas', 'usuario': 'Usuario' };
            tags.push({ 
                label: `Rol: ${rolLabels[filters.rol]}`, 
                key: 'rol'
            });
        }
        
        if (filters.categoria) {
            const categoriaLabels = { 
                'soporte_tecnico': 'Soporte Técnico', 
                'infraestructura': 'Infraestructura', 
                'desarrollo': 'Desarrollo' 
            };
            tags.push({ 
                label: `Categoría: ${categoriaLabels[filters.categoria]}`, 
                key: 'categoria'
            });
        }
        
        if (tags.length > 0) {
            tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.className = 'filter-tag';
                tagElement.innerHTML = `
                    ${tag.label}
                    <button class="remove-filter" onclick="userFilters.removeFilter('${tag.key}')">
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
    
    removeFilter(filterKey) {
        const filterMap = {
            'search': 'search-user',
            'rol': 'filter-rol',
            'categoria': 'filter-categoria'
        };
        
        const elementId = filterMap[filterKey];
        const element = document.getElementById(elementId);
        
        if (element) {
            element.value = '';
            this.applyFilters();
        }
    }
    
    showLoading(show = true) {
        let loader = document.getElementById('user-filters-loader');
        
        if (show) {
            if (!loader) {
                const filtersSection = document.querySelector('.filters-section');
                if (filtersSection) {
                    loader = document.createElement('div');
                    loader.id = 'user-filters-loader';
                    loader.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255,255,255,0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        border-radius: 10px;
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
}

// Inicializar filtros de usuarios
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        window.userFilters = new UserFilters();
        console.log('✅ Sistema de filtros de usuarios cargado');
    }, 300);
});