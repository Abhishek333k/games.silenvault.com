(function() {
    // Create container
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);

    window.showToast = function(message, color = '#00ffff', icon = '✧', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'silenvault-toast';
        toast.style.setProperty('--toast-color', color);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        `;
        
        container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400); // Wait for CSS transition
        }, duration);
    };
})();
