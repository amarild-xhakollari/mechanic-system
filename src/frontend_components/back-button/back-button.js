/**
 * Creates a reusable back button component
 * @param {HTMLElement} container - The container element
 * @param {Object} options - Configuration options
 * @param {string} options.text - Button text (default: 'Kthehu te lista')
 * @param {Function} options.onClick - Click callback function
 * @param {string} options.size - Size variant: 'small', 'medium', 'large' (default: 'medium')
 * @param {string} options.variant - Color variant: 'default', 'primary', 'dark' (default: 'default')
 * @param {boolean} options.disabled - Disabled state (default: false)
 * @param {string} options.ariaLabel - Accessibility label
 */
function createBackButton(container, options = {}) {
    const {
        text = 'Kthehu te lista',
        onClick = () => window.history.back(),
        size = 'medium',
        variant = 'default',
        disabled = false,
        ariaLabel = 'Go back'
    } = options;

    // Build class names
    let buttonClass = 'back-button-component';
    if (size === 'small') buttonClass += ' back-button-component--small';
    if (size === 'large') buttonClass += ' back-button-component--large';
    if (variant === 'primary') buttonClass += ' back-button-component--primary';
    if (variant === 'dark') buttonClass += ' back-button-component--dark';

    const html = `
        <button class="${buttonClass}" 
                type="button" 
                aria-label="${ariaLabel}"
                ${disabled ? 'disabled' : ''}>
            <span class="back-button__icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
            </span>
            <span class="back-button__text">${text}</span>
        </button>
    `;

    container.innerHTML = html;

    // Add click event listener
    const button = container.querySelector('.back-button-component');
    if (button && !disabled) {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (onClick && typeof onClick === 'function') {
                onClick(e);
            }
        });

        // Keyboard accessibility (Enter and Space)
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onClick && typeof onClick === 'function') {
                    onClick(e);
                }
            }
        });
    }

    return button;
}

/**
 * Update back button text
 * @param {HTMLElement} container - The back button container
 * @param {string} newText - New button text
 */
function updateBackButtonText(container, newText) {
    const textEl = container.querySelector('.back-button__text');
    if (textEl) {
        textEl.textContent = newText;
    }
}

/**
 * Enable or disable the back button
 * @param {HTMLElement} container - The back button container
 * @param {boolean} disabled - Disabled state
 */
function setBackButtonDisabled(container, disabled) {
    const button = container.querySelector('.back-button-component');
    if (button) {
        if (disabled) {
            button.setAttribute('disabled', 'disabled');
        } else {
            button.removeAttribute('disabled');
        }
    }
}

/**
 * Change back button variant
 * @param {HTMLElement} container - The back button container
 * @param {string} variant - Variant: 'default', 'primary', 'dark'
 */
function setBackButtonVariant(container, variant) {
    const button = container.querySelector('.back-button-component');
    if (button) {
        button.classList.remove('back-button-component--primary', 'back-button-component--dark');
        if (variant === 'primary') {
            button.classList.add('back-button-component--primary');
        } else if (variant === 'dark') {
            button.classList.add('back-button-component--dark');
        }
    }
}

/**
 * Change back button size
 * @param {HTMLElement} container - The back button container
 * @param {string} size - Size: 'small', 'medium', 'large'
 */
function setBackButtonSize(container, size) {
    const button = container.querySelector('.back-button-component');
    if (button) {
        button.classList.remove('back-button-component--small', 'back-button-component--large');
        if (size === 'small') {
            button.classList.add('back-button-component--small');
        } else if (size === 'large') {
            button.classList.add('back-button-component--large');
        }
    }
}

// Export for use in modules (optional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        createBackButton,
        updateBackButtonText,
        setBackButtonDisabled,
        setBackButtonVariant,
        setBackButtonSize
    };
}