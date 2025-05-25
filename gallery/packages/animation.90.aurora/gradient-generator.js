class GradientGenerator {
    constructor() {
        this.canvas = document.getElementById('gradientCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.time = 0;
        
        // Animation settings
        this.speed = 0.5;
        this.blurIntensity = 40;
        this.colorIntensity = 0.7;
        
        // Performance optimization
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // UI state
        this.controlsVisible = false;
        
        // Generate random gradient streaks on each load
        this.gradientStreaks = this.generateRandomStreaks();
        
        // Pre-calculate static values for performance
        this.preCalculateStaticValues();
        
        this.init();
        this.setupEventListeners();
        this.setupControlToggle();
        this.initializeUIState();
        this.animate();
    }
    
    generateRandomStreaks() {
        const baseColors = [
            [138, 43, 226],  // Purple
            [75, 0, 130],    // Indigo
            [0, 191, 255],   // Deep Sky Blue
            [72, 61, 139],   // Dark Slate Blue
            [123, 104, 238], // Medium Slate Blue
            [0, 206, 209],   // Dark Turquoise
            [147, 0, 211],   // Dark Violet
            [30, 144, 255],  // Dodger Blue
            [106, 90, 205],  // Slate Blue
            [0, 255, 255],   // Cyan
        ];
        
        const streaks = [];
        const numStreaks = 6 + Math.floor(Math.random() * 3); // 6-8 streaks
        
        for (let i = 0; i < numStreaks; i++) {
            streaks.push({
                x: Math.random(), // Random X position (0-1)
                y: Math.random(), // Random Y position (0-1)
                angle: Math.random() * 360, // Random initial angle
                length: 2.0 + Math.random() * 2.0, // Random length (2.0-4.0)
                width: 0.8 + Math.random() * 1.5, // Random width (0.8-2.3)
                color: baseColors[Math.floor(Math.random() * baseColors.length)], // Random color from palette
                speed: 0.5 + Math.random() * 1.0, // Random speed (0.5-1.5)
                angleSpeed: 0.2 + Math.random() * 0.4, // Random rotation speed (0.2-0.6)
                // Pre-calculated values for performance
                speedFactor: 0,
                angleSpeedFactor: 0,
                colorCache: null
            });
        }
        
        return streaks;
    }
    
    preCalculateStaticValues() {
        // Pre-calculate speed factors to avoid repeated multiplication
        this.gradientStreaks.forEach(streak => {
            streak.speedFactor = streak.speed * 0.001;
            streak.angleSpeedFactor = streak.angleSpeed * 0.001;
            
            // Pre-calculate color values
            const [r, g, b] = streak.color;
            const intensity = this.colorIntensity;
            streak.colorCache = {
                r: Math.floor(r * intensity),
                g: Math.floor(g * intensity),
                b: Math.floor(b * intensity),
                r07: Math.floor(r * intensity * 0.7),
                g07: Math.floor(g * intensity * 0.7),
                b07: Math.floor(b * intensity * 0.7),
                r01: Math.floor(r * intensity * 0.1),
                g01: Math.floor(g * intensity * 0.1),
                b01: Math.floor(b * intensity * 0.1)
            };
        });
    }
    
    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Optimize canvas context
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.preCalculateStaticValues(); // Recalculate on resize
    }
    
    setupEventListeners() {
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
        });
        
        document.getElementById('blurControl').addEventListener('input', (e) => {
            this.blurIntensity = parseInt(e.target.value);
        });
        
        document.getElementById('intensityControl').addEventListener('input', (e) => {
            this.colorIntensity = parseFloat(e.target.value);
            this.preCalculateStaticValues(); // Recalculate colors when intensity changes
        });
    }
    
    setupControlToggle() {
        const toggleButton = document.getElementById('toggleButton');
        const uiContainer = document.getElementById('uiContainer');
        
        // Click event for toggle button
        toggleButton.addEventListener('click', () => {
            this.toggleControls();
        });
        
        // Keyboard event for 'H' key
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.toggleControls();
            }
        });
    }
    
    toggleControls() {
        const uiContainer = document.getElementById('uiContainer');
        
        this.controlsVisible = !this.controlsVisible;
        
        if (this.controlsVisible) {
            // Show all UI elements
            uiContainer.classList.remove('hidden');
        } else {
            // Hide all UI elements for pure gradient mode
            uiContainer.classList.add('hidden');
        }
    }
    
    render(currentTime) {
        const { width, height } = this.canvas;
        
        // Clear canvas efficiently
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, width, height);
        
        // Set blend mode and filter once
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.filter = `blur(${this.blurIntensity}px)`;
        
        // Pre-calculate common values
        const minDimension = Math.min(width, height);
        const timeSpeed = this.time * this.speed;
        
        // Draw each gradient streak with optimized calculations
        for (let i = 0; i < this.gradientStreaks.length; i++) {
            this.drawOptimizedStreak(this.gradientStreaks[i], width, height, minDimension, timeSpeed);
        }
        
        // Reset context state once
        this.ctx.filter = 'none';
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    drawOptimizedStreak(streak, width, height, minDimension, timeSpeed) {
        // Use pre-calculated values and avoid repeated calculations
        const baseX = streak.x * width;
        const baseY = streak.y * height;
        
        // Optimized trigonometric calculations
        const offsetX = Math.sin(timeSpeed * streak.speedFactor) * width * 0.2;
        const offsetY = Math.cos(timeSpeed * streak.speedFactor * 0.8) * height * 0.2;
        
        const centerX = baseX + offsetX;
        const centerY = baseY + offsetY;
        
        // Optimized angle calculation
        const currentAngle = streak.angle + Math.sin(timeSpeed * streak.angleSpeedFactor) * 45;
        const angleRad = currentAngle * 0.017453292519943295; // Pre-calculated Math.PI / 180
        
        // Pre-calculated dimensions
        const length = streak.length * minDimension * 0.8;
        const streakWidth = streak.width * minDimension * 0.3;
        
        // Optimized trigonometric calculations for endpoints
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);
        const halfLength = length * 0.5;
        
        const startX = centerX - cosAngle * halfLength;
        const startY = centerY - sinAngle * halfLength;
        const endX = centerX + cosAngle * halfLength;
        const endY = centerY + sinAngle * halfLength;
        
        // Create gradient with cached colors
        const gradient = this.ctx.createLinearGradient(startX, startY, endX, endY);
        const colors = streak.colorCache;
        
        gradient.addColorStop(0, `rgba(${colors.r01}, ${colors.g01}, ${colors.b01}, 0)`);
        gradient.addColorStop(0.3, `rgba(${colors.r07}, ${colors.g07}, ${colors.b07}, 0.4)`);
        gradient.addColorStop(0.5, `rgba(${colors.r}, ${colors.g}, ${colors.b}, 0.9)`);
        gradient.addColorStop(0.7, `rgba(${colors.r07}, ${colors.g07}, ${colors.b07}, 0.4)`);
        gradient.addColorStop(1, `rgba(${colors.r01}, ${colors.g01}, ${colors.b01}, 0)`);
        
        // Optimized drawing
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(angleRad);
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, length * 0.6, streakWidth, 0, 0, 6.283185307179586); // Pre-calculated Math.PI * 2
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    animate(currentTime = 0) {
        // Frame rate limiting for consistent performance
        if (currentTime - this.lastFrameTime >= this.frameInterval) {
            this.time += this.speed * 16;
            this.render(currentTime);
            this.lastFrameTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }
    
    randomizeColors() {
        // Generate completely new random streaks
        this.gradientStreaks = this.generateRandomStreaks();
        this.preCalculateStaticValues();
    }
    
    saveImage() {
        const link = document.createElement('a');
        link.download = `gradient-background-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    initializeUIState() {
        const uiContainer = document.getElementById('uiContainer');
        
        if (!this.controlsVisible) {
            uiContainer.classList.add('hidden');
        }
    }
}

// Global functions for button controls
function randomizeColors() {
    if (window.gradientGenerator) {
        window.gradientGenerator.randomizeColors();
    }
}

function saveImage() {
    if (window.gradientGenerator) {
        window.gradientGenerator.saveImage();
    }
}

// Initialize the gradient generator when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.gradientGenerator = new GradientGenerator();
    
    // Ensure UI state is properly initialized after DOM is ready
    if (!window.gradientGenerator.controlsVisible) {
        const uiContainer = document.getElementById('uiContainer');
        if (uiContainer) {
            uiContainer.classList.add('hidden');
        }
    }
}); 