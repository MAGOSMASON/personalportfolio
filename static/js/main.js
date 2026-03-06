(() => {
    const canvas = document.getElementById('oceanCanvas');
    const ctx = canvas.getContext('2d');

    // ── Config ──────────────────────────────────────────────
    const WATERLINE   = 0.46;   // fraction from top where waves sit
    const WAVE_LAYERS = [
        // amp, speed, wavelengthMultiplier, phaseOffset, alpha, r,g,b
        { amp: 38, speed: 0.00045, wl: 1.8,  phase: 0,    alpha: 0.55, r: 180, g: 240, b: 255 },
        { amp: 30, speed: 0.00060, wl: 1.35, phase: 2.1,  alpha: 0.45, r: 100, g: 215, b: 245 },
        { amp: 22, speed: 0.00080, wl: 1.0,  phase: 4.3,  alpha: 0.40, r: 60,  g: 195, b: 235 },
        { amp: 26, speed: 0.00035, wl: 2.2,  phase: 1.1,  alpha: 0.50, r: 140, g: 228, b: 250 },
    ];

    const PARTICLE_COUNT = 130;

    // ── Resize ────────────────────────────────────────────────
    let W, H;
    function resize() {
        W = canvas.width  = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
        initParticles();
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Wave path helpers ─────────────────────────────────────
    function waveY(x, t, layer) {
        const { amp, speed, wl, phase } = layer;
        const base = H * WATERLINE;
        const freq = (2 * Math.PI) / (W * wl);
        return (
            base
            + Math.sin(x * freq       + t * speed * 1000 + phase) * amp
            + Math.sin(x * freq * 1.7 + t * speed * 700  + phase + 1) * amp * 0.45
            + Math.sin(x * freq * 0.6 + t * speed * 500  + phase + 2) * amp * 0.35
        );
    }

    // ── Ocean base (luminous teal gradient) ───────────────────
    function drawOceanBase(t) {
        const waterY = H * WATERLINE - 40; // a bit above the wave crests
        const grad = ctx.createLinearGradient(0, waterY, 0, H);
        grad.addColorStop(0,   'rgba(14, 122, 158, 0.92)');
        grad.addColorStop(0.3, 'rgba(26, 158, 194, 0.96)');
        grad.addColorStop( 0.7,'rgba(40, 195, 220, 1.0)');
        grad.addColorStop(1,   'rgba(56, 215, 230, 1.0)');

        ctx.save();
        ctx.fillStyle = grad;
        ctx.fillRect(0, waterY, W, H - waterY);

        // Aurora blobs — large soft glow pools
        const blobs = [
            { cx: W * 0.25, cy: H * 0.70, rx: W * 0.30, ry: H * 0.18, a: 0.13 },
            { cx: W * 0.75, cy: H * 0.65, rx: W * 0.28, ry: H * 0.16, a: 0.11 },
            { cx: W * 0.50, cy: H * 0.88, rx: W * 0.40, ry: H * 0.14, a: 0.14 },
            { cx: W * 0.10, cy: H * 0.85, rx: W * 0.20, ry: H * 0.12, a: 0.10 },
            { cx: W * 0.88, cy: H * 0.80, rx: W * 0.22, ry: H * 0.13, a: 0.12 },
        ];
        for (const b of blobs) {
            ctx.save();
            // Scale so we can draw an ellipse with a circle + transform
            ctx.translate(b.cx, b.cy);
            ctx.scale(1, b.ry / b.rx);
            const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.rx);
            g.addColorStop(0,   `rgba(0,220,255,${b.a})`);
            g.addColorStop(0.5, `rgba(0,200,240,${b.a * 0.4})`);
            g.addColorStop(1,   'rgba(0,180,230,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, b.rx, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    // ── Draw a single wave ribbon ─────────────────────────────
    function drawWaveRibbon(t, layer, index) {
        const { amp, alpha, r, g, b } = layer;
        const thickness = amp * 1.8 + 14; // generous ribbon height

        ctx.save();

        // Build wave path
        ctx.beginPath();
        ctx.moveTo(0, waveY(0, t, layer));
        for (let x = 1; x <= W; x += 3) {
            ctx.lineTo(x, waveY(x, t, layer));
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();

        // Fill with vertical gradient for each ribbon
        const topY    = H * WATERLINE - amp - 10;
        const fillGrd = ctx.createLinearGradient(0, topY, 0, topY + thickness + 40);
        fillGrd.addColorStop(0,   `rgba(${r},${g},${b},${alpha})`);
        fillGrd.addColorStop(0.5, `rgba(${r},${g},${b},${alpha * 0.7})`);
        fillGrd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = fillGrd;
        ctx.fill();

        // Crest glow line
        ctx.beginPath();
        ctx.moveTo(0, waveY(0, t, layer));
        for (let x = 1; x <= W; x += 3) {
            ctx.lineTo(x, waveY(x, t, layer));
        }
        const glowIntensity = index === 0 ? 32 : index === 3 ? 26 : 18;
        const glowAlpha     = index === 0 ? 0.95 : 0.75;
        ctx.strokeStyle = `rgba(${r + 40 > 255 ? 255 : r + 40},${g},${b},${glowAlpha})`;
        ctx.lineWidth   = index === 0 ? 3 : 2;
        ctx.shadowColor = `rgba(0,230,255,0.95)`;
        ctx.shadowBlur  = glowIntensity;
        ctx.stroke();

        // Extra bright highlight pass on the front (first) wave
        if (index === 0) {
            ctx.beginPath();
            ctx.moveTo(0, waveY(0, t, layer));
            for (let x = 1; x <= W; x += 3) {
                ctx.lineTo(x, waveY(x, t, layer));
            }
            ctx.strokeStyle = 'rgba(220,250,255,0.85)';
            ctx.lineWidth   = 1.5;
            ctx.shadowColor = 'rgba(180,240,255,1)';
            ctx.shadowBlur  = 48;
            ctx.stroke();
        }

        ctx.restore();
    }

    // ── Particles (bokeh / sparkle) ───────────────────────────
    const particles = [];

    function initParticles() {
        particles.length = 0;
        const waterY = H * WATERLINE;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(spawnParticle(waterY, true));
        }
    }

    function spawnParticle(waterY, randomY = false) {
        const size = 1.5 + Math.random() * 5.5;
        return {
            x:     Math.random() * W,
            y:     randomY
                       ? waterY + Math.random() * (H - waterY)
                       : H - Math.random() * 30,
            vy:    -(0.15 + Math.random() * 0.55),
            vx:    (Math.random() - 0.5) * 0.3,
            size,
            alpha: 0.35 + Math.random() * 0.65,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.025 + Math.random() * 0.045,
            hue:   175 + Math.random() * 30,  // cyan-teal hue range
        };
    }

    function updateParticles(waterY) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.y += p.vy;
            p.x += p.vx;
            p.pulse += p.pulseSpeed;

            if (p.y < waterY - 20) {
                particles[i] = spawnParticle(waterY);
            }
        }
    }

    function drawParticles(waterY) {
        for (const p of particles) {
            const glow = 0.6 + 0.4 * Math.sin(p.pulse);
            const a    = p.alpha * glow;
            const r    = p.size * (1 + 0.3 * Math.sin(p.pulse));

            // Bokeh glow
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.5);
            grad.addColorStop(0,   `hsla(${p.hue}, 90%, 80%, ${a})`);
            grad.addColorStop(0.5, `hsla(${p.hue}, 85%, 65%, ${a * 0.5})`);
            grad.addColorStop(1,   `hsla(${p.hue}, 80%, 60%, 0)`);

            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.shadowColor = `hsla(${p.hue}, 100%, 75%, ${a * 0.9})`;
            ctx.shadowBlur  = r * 3;
            ctx.fill();
            ctx.restore();

            // Bright core dot
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 100%, 90%, ${Math.min(1, a * 1.4)})`;
            ctx.shadowColor = 'rgba(200,245,255,0.9)';
            ctx.shadowBlur  = 6;
            ctx.fill();
            ctx.restore();
        }
    }

    // ── Main render loop ──────────────────────────────────────
    let startTime = null;

    function render(ts) {
        if (!startTime) startTime = ts;
        const t = ts - startTime;

        ctx.clearRect(0, 0, W, H);

        const waterY = H * WATERLINE;

        // 1. Luminous teal ocean base
        drawOceanBase(t);

        // 2. Particles (behind waves)
        updateParticles(waterY);
        drawParticles(waterY);

        // 3. Wave ribbons — back to front (highest amplitude first for depth)
        const order = [1, 2, 3, 0]; // draw back layers first, front (0) last
        for (const i of order) {
            drawWaveRibbon(t, WAVE_LAYERS[i], i);
        }

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
})();
