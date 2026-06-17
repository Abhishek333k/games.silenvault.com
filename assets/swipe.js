class SwipeController {
  constructor(element, onSwipe) {
    if (!element || typeof onSwipe !== 'function') {
      throw new Error('SwipeController: Invalid element or callback.');
    }

    this.element = element;
    this.onSwipe = onSwipe;
    
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.isDragging = false;
    this.inputQueue = [];
    
    this.DEADZONE = 30; 
    this.MAX_DURATION = 300; 
    this.MAX_QUEUE = 2; 

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    this.init();
  }

  init() {
    this.element.style.touchAction = 'none';
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isDragging = true;
    this.inputQueue = [];
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    if (e.touches.length > 1) return;

    const touch = e.touches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;

    if (Math.abs(dx) < this.DEADZONE && Math.abs(dy) < this.DEADZONE) return;

    let direction = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      direction = dy > 0 ? 'DOWN' : 'UP';
    }

    if (this.inputQueue.length < this.MAX_QUEUE) {
      if (this.inputQueue[this.inputQueue.length - 1] !== direction) {
        this.inputQueue.push(direction);
        // Reset origin so the user can chain another swipe (e.g. L shape)
        this.startX = touch.clientX;
        this.startY = touch.clientY;
      }
    }
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    const duration = Date.now() - this.startTime;
    if (duration > this.MAX_DURATION) {
      this.inputQueue = [];
    }

    while (this.inputQueue.length > 0) {
      const direction = this.inputQueue.shift();
      this.onSwipe(direction);
    }

    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
  }
}
window.SwipeController = SwipeController;
