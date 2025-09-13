/**
 * Color Grid Popup Module
 * 
 * Modern, accessible color picker modal with advanced features:
 * - Intelligent color categorization
 * - Real-time search and filtering  
 * - Keyboard navigation
 * - Performance optimizations
 * - Accessibility features
 * 
 * @version 2.0.0
 * @author Improved implementation
 */

(function(window, document) {
  'use strict';

  // ============================================================================
  // Configuration and Constants
  // ============================================================================

  const CONFIG = {
    MODAL_ID: 'colorGridModal',
    BUTTON_CLASS: 'color-grid-popup-btn',
    SEARCH_DEBOUNCE: 300,
    VIRTUAL_SCROLL_THRESHOLD: 100,
    ANIMATIONS_ENABLED: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    CATEGORIES: [
      'Black & Gray',
      'Red & Pink', 
      'Orange',
      'Yellow & Gold',
      'Green',
      'Blue & Teal',
      'Brown & Tan',
      'Purple'
    ]
  };

  const SELECTORS = {
    modal: `#${CONFIG.MODAL_ID}`,
    content: '.color-grid-content',
    close: '.color-grid-close',
    search: '.color-grid-search',
    categories: '.color-grid-categories',
    categoryTemplate: '.color-category',
    swatchTemplate: '.color-swatch-item'
  };

  // ============================================================================
  // Color Categorization Engine
  // ============================================================================

  class ColorCategorizer {
    constructor() {
      this.colorKeywords = {
        'Black & Gray': [
          'black', 'grey', 'gray', 'charcoal', 'steel', 'platinum', 
          'titanium', 'silver', 'white', 'catalyst', 'eclipse'
        ],
        'Red & Pink': [
          'red', 'pink', 'magenta', 'rhodamine', 'pepper', 'spartan', 
          'lava', 'chile', 'honda', 'trixx'
        ],
        'Orange': [
          'orange', 'blaze', 'phoenix', 'crush', 'ktm', 'burst'
        ],
        'Yellow & Gold': [
          'yellow', 'gold', 'sunburst', 'millennium', 'vintage', 'ski-doo',
          'lime', 'nuclear', 'dayglow', 'neo'
        ],
        'Green': [
          'green', 'mint', 'manta', 'quetzal', 'racing', 'arctic cat',
          'army'
        ],
        'Blue & Teal': [
          'blue', 'teal', 'cyan', 'turquoise', 'azure', 'navy', 'oxford',
          'belize', 'iceberg', 'reef', 'vapor', 'dazzling', 'dusty',
          'labrador', 'panama', 'gulfstream', 'caribbean', 'octane',
          'scandi'
        ],
        'Brown & Tan': [
          'brown', 'tan', 'bronze', 'desert', 'arctic tan', 'liquid',
          'polaris glow'
        ],
        'Purple': [
          'purple', 'violet', 'midnight'
        ]
      };
    }

    /**
     * Categorize colors using advanced heuristics
     * @param {Array} colorsArray - Array of color objects with name and hex
     * @returns {Object} Categorized colors
     */
    categorize(colorsArray) {
      const categories = {};
      
      // Initialize categories
      CONFIG.CATEGORIES.forEach(category => {
        categories[category] = [];
      });

      colorsArray.forEach((color, index) => {
        const category = this.determineCategory(color);
        const enrichedColor = {
          ...color,
          swatchIndex: index + 1,
          searchText: this.createSearchText(color),
          category: category
        };
        
        categories[category].push(enrichedColor);
      });

      // Sort colors within each category by name
      Object.keys(categories).forEach(category => {
        categories[category].sort((a, b) => a.name.localeCompare(b.name));
      });

      return categories;
    }

    /**
     * Determine the best category for a color
     * @param {Object} color - Color object with name and hex
     * @returns {string} Category name
     */
    determineCategory(color) {
      const name = color.name.toLowerCase();
      const hex = color.hex.toLowerCase();

      // First, try keyword matching
      for (const [category, keywords] of Object.entries(this.colorKeywords)) {
        if (keywords.some(keyword => name.includes(keyword))) {
          return category;
        }
      }

      // Fall back to hex analysis
      return this.categorizeByHex(hex);
    }

    /**
     * Categorize color based on hex analysis
     * @param {string} hex - Hex color value
     * @returns {string} Category name
     */
    categorizeByHex(hex) {
      const rgb = this.hexToRgb(hex);
      if (!rgb) return 'Black & Gray';

      const [r, g, b] = rgb;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const brightness = max / 255;

      // Low saturation = grayscale
      if (saturation < 0.15) {
        return 'Black & Gray';
      }

      // Analyze dominant color channel
      if (r > g && r > b) {
        if (g > 150 && r > 200) return 'Yellow & Gold';
        if (g > 100 && b < 100) return 'Orange';
        return 'Red & Pink';
      }
      
      if (g > r && g > b) {
        if (r > 180 && g > 180) return 'Yellow & Gold';
        return 'Green';
      }
      
      if (b > r && b > g) {
        if (g > 100) return 'Blue & Teal';
        if (r > 100) return 'Purple';
        return 'Blue & Teal';
      }

      return 'Black & Gray';
    }

    /**
     * Convert hex to RGB
     * @param {string} hex - Hex color value
     * @returns {Array|null} RGB array or null if invalid
     */
    hexToRgb(hex) {
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length !== 6) return null;
      
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      
      return [r, g, b];
    }

    /**
     * Create searchable text for a color
     * @param {Object} color - Color object
     * @returns {string} Searchable text
     */
    createSearchText(color) {
      return `${color.name} ${color.hex}`.toLowerCase();
    }
  }

  // ============================================================================
  // Performance Utilities
  // ============================================================================

  class PerformanceUtils {
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, delay) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    }

    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func.apply(this, args);
        }
      };
    }

    /**
     * Request animation frame with fallback
     * @param {Function} callback - Callback function
     */
    static requestFrame(callback) {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(callback);
      } else {
        setTimeout(callback, 16);
      }
    }
  }

  // ============================================================================
  // Accessibility Manager
  // ============================================================================

  class AccessibilityManager {
    constructor(modal) {
      this.modal = modal;
      this.focusableElements = [];
      this.lastFocusedElement = null;
    }

    /**
     * Setup accessibility features
     */
    setup() {
      this.setupARIA();
      this.setupKeyboardNavigation();
      this.setupFocusManagement();
    }

    /**
     * Setup ARIA attributes
     */
    setupARIA() {
      const modal = this.modal;
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'color-grid-title');
      
      const content = modal.querySelector(SELECTORS.content);
      if (content) {
        content.setAttribute('role', 'document');
      }
    }

    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
      if (!this.modal.classList.contains('active')) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          ColorGridPopup.close();
          break;
        case 'Tab':
          this.handleTabNavigation(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event);
          break;
      }
    }

    /**
     * Handle tab navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleTabNavigation(event) {
      const focusableElements = this.getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    /**
     * Handle arrow key navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleArrowNavigation(event) {
      const swatches = Array.from(this.modal.querySelectorAll('.color-swatch-item:not([style*="display: none"])'));
      const currentIndex = swatches.indexOf(document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex;
      const gridWidth = this.calculateGridWidth();

      switch (event.key) {
        case 'ArrowUp':
          nextIndex = currentIndex - gridWidth;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex + gridWidth;
          break;
        case 'ArrowLeft':
          nextIndex = currentIndex - 1;
          break;
        case 'ArrowRight':
          nextIndex = currentIndex + 1;
          break;
      }

      if (nextIndex >= 0 && nextIndex < swatches.length) {
        event.preventDefault();
        swatches[nextIndex].focus();
      }
    }

    /**
     * Calculate grid width for arrow navigation
     * @returns {number} Number of columns in grid
     */
    calculateGridWidth() {
      const grid = this.modal.querySelector('.color-swatches-grid');
      if (!grid) return 1;
      
      const gridStyles = window.getComputedStyle(grid);
      const columns = gridStyles.gridTemplateColumns.split(' ').length;
      return columns || 1;
    }

    /**
     * Get all focusable elements in modal
     * @returns {Array} Array of focusable elements
     */
    getFocusableElements() {
      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        'a[href]'
      ].join(', ');
      
      return Array.from(this.modal.querySelectorAll(selectors));
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
      // Store last focused element when modal opens
      document.addEventListener('focus', (event) => {
        if (!this.modal.contains(event.target) && this.modal.classList.contains('active')) {
          this.lastFocusedElement = event.target;
        }
      }, true);
    }

    /**
     * Focus first element in modal
     */
    focusFirst() {
      const searchInput = this.modal.querySelector(SELECTORS.search);
      if (searchInput) {
        searchInput.focus();
      } else {
        const firstFocusable = this.getFocusableElements()[0];
        if (firstFocusable) firstFocusable.focus();
      }
    }

    /**
     * Restore focus to previously focused element
     */
    restoreFocus() {
      if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
        this.lastFocusedElement.focus();
      }
    }
  }

  // ============================================================================
  // Main Color Grid Popup Class
  // ============================================================================

  class ColorGridPopup {
    constructor() {
      this.modal = null;
      this.categorizer = new ColorCategorizer();
      this.accessibilityManager = null;
      this.currentSlider = null;
      this.categorizedColors = null;
      this.isInitialized = false;
      
      // Bind methods
      this.handleSearch = PerformanceUtils.debounce(this.handleSearch.bind(this), CONFIG.SEARCH_DEBOUNCE);
      this.handleSwatchClick = this.handleSwatchClick.bind(this);
      this.handleModalClick = this.handleModalClick.bind(this);
      this.handleCloseClick = this.handleCloseClick.bind(this);
    }

    /**
     * Initialize the color grid popup
     */
    async init() {
      if (this.isInitialized) return;

      try {
        await this.createModal();
        await this.prepareColors();
        this.setupEventListeners();
        this.setupAccessibility();
        this.isInitialized = true;
        console.log('Color Grid Popup initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Color Grid Popup:', error);
      }
    }

    /**
     * Create the modal DOM structure
     */
    async createModal() {
      // Remove existing modal if present
      const existingModal = document.getElementById(CONFIG.MODAL_ID);
      if (existingModal) {
        existingModal.remove();
      }

      const modalHTML = `
        <div id="${CONFIG.MODAL_ID}" class="color-grid-modal" aria-hidden="true">
          <div class="color-grid-content">
            <div class="color-grid-header">
              <h3 id="color-grid-title">Select Color</h3>
              <button class="color-grid-close" aria-label="Close color picker">&times;</button>
            </div>
            <div class="color-grid-search-container">
              <input 
                type="text" 
                class="color-grid-search" 
                placeholder="Search colors..." 
                aria-label="Search colors"
              />
            </div>
            <div class="color-grid-categories">
              <div class="color-grid-loading">
                <div class="color-grid-loading-text">Loading amazing colors...</div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHTML);
      this.modal = document.getElementById(CONFIG.MODAL_ID);
    }

    /**
     * Prepare and categorize colors
     */
    async prepareColors() {
      // Get colors from global color data
      if (typeof window.structuredColors === 'undefined') {
        console.warn('Color data not available yet. Waiting for data...');
        
        // Wait for color data to be available (up to 5 seconds)
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds at 100ms intervals
        
        while (typeof window.structuredColors === 'undefined' && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (typeof window.structuredColors === 'undefined') {
          throw new Error('Color data not available. Make sure structuredColors is defined.');
        }
        
        console.log('Color data now available after waiting');
      }

      return new Promise((resolve) => {
        // Use requestAnimationFrame to avoid blocking the UI
        PerformanceUtils.requestFrame(() => {
          this.categorizedColors = this.categorizer.categorize(window.structuredColors);
          console.log('Colors categorized:', Object.keys(this.categorizedColors).length, 'categories');
          resolve();
        });
      });
    }

    /**
     * Render color categories and swatches
     */
    async renderColors() {
      const categoriesContainer = this.modal.querySelector('.color-grid-categories');
      
      // Clear loading state
      categoriesContainer.innerHTML = '';

      // Check if we have colors
      if (!this.categorizedColors || Object.keys(this.categorizedColors).length === 0) {
        categoriesContainer.innerHTML = `
          <div class="color-grid-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <p>No colors available</p>
          </div>
        `;
        return;
      }

      // Render categories
      for (const [categoryName, colors] of Object.entries(this.categorizedColors)) {
        if (colors.length === 0) continue;

        const categoryElement = this.createCategoryElement(categoryName, colors);
        categoriesContainer.appendChild(categoryElement);
      }
    }

    /**
     * Create a category element with color swatches
     * @param {string} categoryName - Category name
     * @param {Array} colors - Array of colors in this category
     * @returns {HTMLElement} Category element
     */
    createCategoryElement(categoryName, colors) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'color-category';
      categoryDiv.setAttribute('data-category', categoryName.toLowerCase().replace(/\s+/g, '-'));

      const titleDiv = document.createElement('div');
      titleDiv.className = 'color-category-title';
      titleDiv.textContent = categoryName;

      const gridDiv = document.createElement('div');
      gridDiv.className = 'color-swatches-grid';

      // Create swatches
      colors.forEach(color => {
        const swatchElement = this.createSwatchElement(color);
        gridDiv.appendChild(swatchElement);
      });

      categoryDiv.appendChild(titleDiv);
      categoryDiv.appendChild(gridDiv);

      return categoryDiv;
    }

    /**
     * Create a color swatch element
     * @param {Object} color - Color object
     * @returns {HTMLElement} Swatch element
     */
    createSwatchElement(color) {
      const swatchDiv = document.createElement('div');
      swatchDiv.className = 'color-swatch-item';
      swatchDiv.setAttribute('data-color-index', color.swatchIndex);
      swatchDiv.setAttribute('data-search-text', color.searchText);
      swatchDiv.setAttribute('tabindex', '0');
      swatchDiv.setAttribute('role', 'button');
      swatchDiv.setAttribute('aria-label', `Select ${color.name}`);

      const colorBox = document.createElement('div');
      colorBox.className = 'color-swatch-box';
      colorBox.style.backgroundColor = color.hex;

      const nameDiv = document.createElement('div');
      nameDiv.className = 'color-swatch-name';
      // Improve name display logic - keep full name if under 18 chars, otherwise truncate smartly
      const displayName = color.name.length > 18 ? 
        color.name.substring(0, 16).trim() + '...' : 
        color.name;
      nameDiv.textContent = displayName;
      nameDiv.setAttribute('title', color.name); // Add title attribute for native tooltip

      const tooltip = document.createElement('div');
      tooltip.className = 'color-swatch-tooltip';
      tooltip.textContent = `${color.name} (${color.hex.toUpperCase()})`;

      swatchDiv.appendChild(colorBox);
      swatchDiv.appendChild(nameDiv);
      swatchDiv.appendChild(tooltip);

      // Add click handler
      swatchDiv.addEventListener('click', this.handleSwatchClick);
      swatchDiv.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.handleSwatchClick(event);
        }
      });

      // Enhanced mobile touch feedback
      swatchDiv.addEventListener('touchstart', (e) => {
        swatchDiv.style.transform = 'translateY(-2px) scale(0.98)';
        swatchDiv.style.transition = 'transform 0.1s ease';
      });
      
      swatchDiv.addEventListener('touchend', (e) => {
        setTimeout(() => {
          swatchDiv.style.transform = '';
          swatchDiv.style.transition = 'var(--color-grid-transition)';
        }, 100);
      });

      return swatchDiv;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Search input
      const searchInput = this.modal.querySelector(SELECTORS.search);
      if (searchInput) {
        searchInput.addEventListener('input', this.handleSearch);
        
        // Prevent zoom on iOS when focusing input
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          searchInput.style.fontSize = '16px';
        }
      }

      // Modal close events
      const closeButton = this.modal.querySelector(SELECTORS.close);
      if (closeButton) {
        closeButton.addEventListener('click', this.handleCloseClick);
        // Add touch feedback for mobile
        closeButton.addEventListener('touchstart', (e) => {
          closeButton.style.transform = 'scale(0.95)';
        });
        closeButton.addEventListener('touchend', (e) => {
          closeButton.style.transform = '';
        });
      }

      this.modal.addEventListener('click', this.handleModalClick);

      // Enhanced mobile touch handling
      this.modal.addEventListener('touchstart', (e) => {
        // Prevent body scroll when modal is open
        if (e.target === this.modal) {
          e.preventDefault();
        }
      }, { passive: false });

      // Global escape key handler
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.modal.classList.contains('active')) {
          this.close();
        }
      });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
      this.accessibilityManager = new AccessibilityManager(this.modal);
      this.accessibilityManager.setup();
    }

    /**
     * Handle search input
     * @param {Event} event - Input event
     */
    handleSearch(event) {
      const searchTerm = event.target.value.toLowerCase().trim();
      const categories = this.modal.querySelectorAll('.color-category');

      categories.forEach(category => {
        const swatches = category.querySelectorAll('.color-swatch-item');
        let hasVisibleSwatches = false;

        swatches.forEach(swatch => {
          const searchText = swatch.getAttribute('data-search-text');
          const isVisible = !searchTerm || searchText.includes(searchTerm);
          
          swatch.style.display = isVisible ? 'flex' : 'none';
          if (isVisible) hasVisibleSwatches = true;
        });

        category.style.display = hasVisibleSwatches ? 'block' : 'none';
      });

      // Show empty state if no results
      const hasAnyVisible = Array.from(categories).some(cat => 
        cat.style.display !== 'none'
      );

      if (!hasAnyVisible && searchTerm) {
        this.showEmptyState('No colors found matching your search.');
      } else {
        this.hideEmptyState();
      }
    }

    /**
     * Handle swatch click
     * @param {Event} event - Click event
     */
    handleSwatchClick(event) {
      const swatchElement = event.currentTarget;
      const swatchIndex = swatchElement.getAttribute('data-color-index');
      
      if (swatchIndex && this.currentSlider) {
        // Add visual feedback
        swatchElement.style.transform = 'translateY(-4px) scale(1.1)';
        swatchElement.style.boxShadow = '0 12px 30px rgba(0, 123, 255, 0.3)';
        
        setTimeout(() => {
          this.selectColor(parseInt(swatchIndex, 10));
          this.close();
        }, 150);
      }
    }

    /**
     * Handle modal overlay click
     * @param {Event} event - Click event
     */
    handleModalClick(event) {
      if (event.target === this.modal) {
        this.close();
      }
    }

    /**
     * Handle close button click
     * @param {Event} event - Click event
     */
    handleCloseClick(event) {
      event.preventDefault();
      this.close();
    }

    /**
     * Select a color and update the slider
     * @param {number} swatchIndex - Swatch index
     */
    selectColor(swatchIndex) {
      if (!this.currentSlider) return;

      const slider = document.getElementById(this.currentSlider);
      if (!slider) return;

      // Set slider value
      slider.value = swatchIndex;

      // Trigger change event
      const changeEvent = new Event('input', { bubbles: true });
      slider.dispatchEvent(changeEvent);

      // Clear active preset if it exists
      if (typeof window.state !== 'undefined' && window.state.activePreset !== null) {
        window.state.activePreset = null;
        if (typeof window.updatePresetButtons === 'function') {
          window.updatePresetButtons();
        }
      }

      // Show success feedback
      this.showSuccessFeedback(swatchIndex);

      console.log(`Color selected: swatch index ${swatchIndex} for slider ${this.currentSlider}`);
    }

    /**
     * Show success feedback when color is selected
     * @param {number} swatchIndex - Selected swatch index
     */
    showSuccessFeedback(swatchIndex) {
      // Find the color name for better feedback
      let colorName = 'Color';
      if (this.categorizedColors && window.structuredColors) {
        const color = window.structuredColors.find(c => (c.swatchIndex || (window.structuredColors.indexOf(c) + 1)) === swatchIndex);
        if (color) {
          colorName = color.name;
        }
      }
      
      // Create a temporary success message
      const successEl = document.createElement('div');
      successEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
      `;
      successEl.textContent = `${colorName} selected!`;
      
      document.body.appendChild(successEl);
      
      // Animate in
      setTimeout(() => {
        successEl.style.transform = 'translateX(0)';
      }, 10);
      
      // Animate out and remove
      setTimeout(() => {
        successEl.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (successEl.parentNode) {
            successEl.parentNode.removeChild(successEl);
          }
        }, 300);
      }, 2000);
    }

    /**
     * Show empty state
     * @param {string} message - Message to display
     */
    showEmptyState(message) {
      const categoriesContainer = this.modal.querySelector('.color-grid-categories');
      let emptyState = categoriesContainer.querySelector('.color-grid-empty');
      
      if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'color-grid-empty';
        emptyState.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <p>${message}</p>
        `;
        categoriesContainer.appendChild(emptyState);
      } else {
        emptyState.querySelector('p').textContent = message;
        emptyState.style.display = 'flex';
      }
    }

    /**
     * Hide empty state
     */
    hideEmptyState() {
      const emptyState = this.modal.querySelector('.color-grid-empty');
      if (emptyState) {
        emptyState.style.display = 'none';
      }
    }

    /**
     * Open the modal for a specific slider
     * @param {string} sliderId - ID of the slider
     */
    async open(sliderId) {
      console.log(`Opening color grid for slider: ${sliderId}`);
      
      if (!this.isInitialized) {
        console.log('Color grid not initialized, initializing now...');
        try {
          await this.init();
          console.log('Color grid initialized successfully');
        } catch (error) {
          console.error('Failed to initialize color grid:', error);
          return;
        }
      }

      this.currentSlider = sliderId;

      // Show modal first with loading state
      this.modal.classList.add('active');
      this.modal.setAttribute('aria-hidden', 'false');
      
      // Enhanced mobile body scroll prevention
      document.body.style.overflow = 'hidden';
      
      // For iOS Safari - prevent bounce scrolling
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${window.scrollY}px`;
      }

      // Render colors if not already rendered
      if (!this.modal.querySelector('.color-category')) {
        console.log('Rendering colors...');
        await this.renderColors();
        console.log('Colors rendered successfully');
      }

      // Clear search
      const searchInput = this.modal.querySelector(SELECTORS.search);
      if (searchInput) {
        searchInput.value = '';
        this.handleSearch({ target: searchInput });
      }

      // Focus management
      if (this.accessibilityManager) {
        this.accessibilityManager.focusFirst();
      }

      console.log(`Color grid opened for slider: ${sliderId}`);
    }

    /**
     * Close the modal
     */
    close() {
      if (!this.modal) return;

      this.modal.classList.remove('active');
      this.modal.setAttribute('aria-hidden', 'true');
      
      // Enhanced mobile body scroll restoration
      document.body.style.overflow = '';
      
      // For iOS Safari - restore scroll position
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
      }

      // Restore focus
      if (this.accessibilityManager) {
        this.accessibilityManager.restoreFocus();
      }

      this.currentSlider = null;
      console.log('Color grid closed');
    }

    /**
     * Destroy the color grid popup
     */
    destroy() {
      if (this.modal) {
        this.modal.remove();
      }
      this.isInitialized = false;
      this.currentSlider = null;
      this.categorizedColors = null;
      console.log('Color grid destroyed');
    }
  }

  // ============================================================================
  // Global API
  // ============================================================================

  // Create global instance
  const colorGridPopup = new ColorGridPopup();

  // Expose global API
  window.ColorGridPopup = {
    open: (sliderId) => colorGridPopup.open(sliderId),
    close: () => colorGridPopup.close(),
    init: () => colorGridPopup.init(),
    destroy: () => colorGridPopup.destroy()
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Try to initialize when color data becomes available
      setTimeout(() => {
        if (typeof window.structuredColors !== 'undefined') {
          console.log('Auto-initializing Color Grid Popup with available color data');
          colorGridPopup.init().catch(error => {
            console.error('Failed to auto-initialize Color Grid Popup:', error);
          });
        } else {
          console.log('Color data not yet available, initialization will happen on first open');
        }
      }, 500); // Give some time for other scripts to load
    });
  } else {
    // DOM already loaded, try immediate initialization
    setTimeout(() => {
      if (typeof window.structuredColors !== 'undefined') {
        console.log('Auto-initializing Color Grid Popup with available color data');
        colorGridPopup.init().catch(error => {
          console.error('Failed to auto-initialize Color Grid Popup:', error);
        });
      }
    }, 500);
  }

  console.log('Color Grid Popup module loaded and ready');

})(window, document);
