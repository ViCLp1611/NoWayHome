// Controlador de Navegación - Maneja la lógica de navegación entre páginas

export class NavigationController {
  constructor() {
    this.currentPage = 'home';
    this.navigationHistory = ['home'];
    this.listeners = [];
  }

  // Método para navegar a una página
  navigateTo(page) {
    const validPages = ['home', 'login', 'register', 'profile'];
    
    if (!validPages.includes(page)) {
      console.warn(`Página inválida: ${page}`);
      return {
        success: false,
        message: 'Página no encontrada'
      };
    }

    this.currentPage = page;
    this.navigationHistory.push(page);

    // Notificar a los listeners
    this.notifyListeners(page);

    return {
      success: true,
      page: page
    };
  }

  // Método para obtener la página actual
  getCurrentPage() {
    return this.currentPage;
  }

  // Método para volver a la página anterior
  goBack() {
    if (this.navigationHistory.length > 1) {
      this.navigationHistory.pop();
      const previousPage = this.navigationHistory[this.navigationHistory.length - 1];
      this.currentPage = previousPage;
      this.notifyListeners(previousPage);
      
      return {
        success: true,
        page: previousPage
      };
    }

    return {
      success: false,
      message: 'No hay página anterior'
    };
  }

  // Método para obtener el historial de navegación
  getHistory() {
    return [...this.navigationHistory];
  }

  // Método para limpiar el historial
  clearHistory() {
    this.navigationHistory = [this.currentPage];
  }

  // Método para agregar un listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Método para remover un listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Método privado para notificar a los listeners
  notifyListeners(page) {
    this.listeners.forEach(listener => {
      if (typeof listener === 'function') {
        listener(page);
      }
    });
  }

  // Método para resetear el controlador
  reset() {
    this.currentPage = 'home';
    this.navigationHistory = ['home'];
    this.notifyListeners('home');
  }
}

// Instancia singleton del controlador de navegación
export const navigationController = new NavigationController();
