document.addEventListener('DOMContentLoaded', () => {
    // ---- Login Logic ----
    const loginOverlay = document.getElementById('loginOverlay');
    const loginBtn = document.getElementById('loginBtn');
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');

    // Prevent scrolling initially
    document.body.style.overflow = 'hidden';

    function checkPassword() {
        const password = passwordInput.value.trim();
        if (password === 'جالكسي') {
            loginOverlay.classList.add('hidden');
            document.body.style.overflow = 'auto'; // allow scrolling
            // Because the user clicked, we can safely init audio if it exists
            if (typeof audioCtx !== 'undefined') {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
            } else if (typeof initAudio === 'function') {
                initAudio();
            }
        } else {
            loginError.textContent = 'كلمة السر خاطئة، حاولي مرة أخرى يا قلبي 💔';
            passwordInput.value = '';
            const card = document.querySelector('.login-card');
            card.style.animation = 'shake 0.5s';
            setTimeout(() => card.style.animation = '', 500);
        }
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', checkPassword);
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkPassword();
        });
    }

    // ---- Petal Animation (Canvas) ----
    const canvas = document.getElementById('petalsCanvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let petals = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Petal {
        constructor() {
            this.x = Math.random() * width;
            this.y = (Math.random() * height) - height;
            this.w = 12 + Math.random() * 15;
            this.h = 12 + Math.random() * 15;
            this.opacity = 0.4 + Math.random() * 0.5;
            this.speedX = -1.5 + Math.random() * 3;
            this.speedY = 1 + Math.random() * 2;
            this.angle = Math.random() * 360;
            this.spin = -2 + Math.random() * 4;
            // Rose petal colors
            const colors = ['#ffb6c1', '#ffc0cb', '#fce4ec', '#fff0f5', '#ff9eaa'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.angle += this.spin;

            // Wobble effect
            this.x += Math.sin(this.y * 0.02) * 0.5;

            if (this.y > height) {
                this.y = -20;
                this.x = Math.random() * width;
            }
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle * Math.PI / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();

            // Draw a curved petal shape
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(this.w / 2, -this.h / 2, this.w, -this.h / 4, this.w, 0);
            ctx.bezierCurveTo(this.w, this.h / 4, this.w / 2, this.h / 2, 0, 0);

            ctx.fill();
            ctx.restore();
        }
    }

    // Create more petals for a rich effect
    for (let i = 0; i < 50; i++) {
        petals.push(new Petal());
    }

    function animatePetals() {
        ctx.clearRect(0, 0, width, height);
        petals.forEach(petal => {
            petal.update();
            petal.draw();
        });
        requestAnimationFrame(animatePetals);
    }
    animatePetals();

    // ---- Audio Toggle (Web Audio API Synthesizer) ----
    const soundToggle = document.getElementById('soundToggle');
    let isPlaying = false;
    let audioCtx;
    let masterGain;
    let chordOscillators = [];

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioCtx.createGain();
            masterGain.connect(audioCtx.destination);
            masterGain.gain.value = 0; // Start at 0 for fade in
        }
    }

    function playSoftAmbient() {
        initAudio();
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        // Fade in
        masterGain.gain.setTargetAtTime(0.04, audioCtx.currentTime, 2);

        // A beautiful ethereal D major 7 chord (D, F#, A, C#) with multiple octaves
        const freqs = [146.83, 220.00, 277.18, 369.99, 440.00];

        freqs.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            osc.type = index % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.value = freq;

            // Slow LFO for volume pulsing
            const lfo = audioCtx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.05 + Math.random() * 0.1;

            const lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 0.6; // Depth of modulation

            const baseGain = audioCtx.createGain();
            baseGain.gain.value = 0.4;

            lfo.connect(lfoGain.gain);
            osc.connect(baseGain);
            baseGain.connect(masterGain);

            // Apply LFO to baseGain
            lfoGain.connect(baseGain.gain);

            osc.start();
            lfo.start();
            chordOscillators.push({ osc, lfo, baseGain, lfoGain });
        });
    }

    function stopSoftAmbient() {
        if (audioCtx && masterGain) {
            // Fade out
            masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 1);

            setTimeout(() => {
                chordOscillators.forEach(nodes => {
                    nodes.osc.stop();
                    nodes.lfo.stop();
                    nodes.osc.disconnect();
                    nodes.lfo.disconnect();
                });
                chordOscillators = [];
            }, 1500);
        }
    }

    soundToggle.addEventListener('click', () => {
        const icon = soundToggle.querySelector('i');
        if (isPlaying) {
            stopSoftAmbient();
            icon.classList.remove('fa-music');
            icon.classList.add('fa-volume-mute');
        } else {
            playSoftAmbient();
            icon.classList.remove('fa-volume-mute');
            icon.classList.add('fa-music');
        }
        isPlaying = !isPlaying;
    });

    // Magical chime for flower click
    function playChime() {
        if (!isPlaying || !audioCtx) return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        // Bell-like sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    }

    // ---- Game Logic ----
    const messages = [
        "ضحكتك بتنوّر يومي 💖",
        "أجمل صدفة في حياتي 🌸",
        "أميرتي ورفيقة دربي 👑",
        "معاكِ بحس إن الدنيا بخير ✨",
        "أنتِ النبض الذي يحيي قلبي 💓"
    ];

    const garden = document.getElementById('garden');
    const counterEl = document.getElementById('roseCounter');
    const toast = document.getElementById('toast');
    const bouquetContainer = document.getElementById('grandBouquetContainer');
    let collected = 0;
    const totalRoses = 5;

    // Shuffle messages
    messages.sort(() => Math.random() - 0.5);

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    function triggerConfetti(x, y) {
        confetti({
            particleCount: 60,
            spread: 70,
            origin: { x: x / window.innerWidth, y: y / window.innerHeight },
            colors: ['#ffb6c1', '#ffc0cb', '#fce4ec', '#ffffff', '#ff758c']
        });
    }

    function triggerGrandConfetti() {
        const duration = 4000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 8,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffb6c1', '#ffc0cb', '#ff758c', '#d4af37']
            });
            confetti({
                particleCount: 8,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffb6c1', '#ffc0cb', '#ff758c', '#d4af37']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    for (let i = 0; i < totalRoses; i++) {
        const roseDiv = document.createElement('div');
        roseDiv.className = 'rose-container';

        const roseEmoji = document.createElement('div');
        roseEmoji.className = 'rose bud';
        roseEmoji.textContent = '🌹';

        roseDiv.appendChild(roseEmoji);
        garden.appendChild(roseDiv);

        roseDiv.addEventListener('click', function (e) {
            if (!this.classList.contains('opened')) {
                // Initialize audio context on first user interaction if needed
                if (!audioCtx && !isPlaying) {
                    initAudio();
                }

                this.classList.add('opened');
                roseEmoji.classList.remove('bud');
                roseEmoji.classList.add('bloomed');

                playChime();

                const rect = this.getBoundingClientRect();
                triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

                showToast(messages[i]);

                collected++;
                counterEl.textContent = collected;

                if (collected === totalRoses) {
                    setTimeout(() => {
                        bouquetContainer.classList.add('visible');
                        triggerGrandConfetti();
                        bouquetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 1200);
                }
            }
        });
    }

    // ---- Counter ----
    const daysCounter = document.getElementById('daysCounter');

    // Set a meaningful start date (e.g., 500 days ago)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 298); // Adjust as needed

    function updateCounter() {
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Counter animation
        let currentCount = 0;
        const duration = 2000;
        const stepTime = Math.abs(Math.floor(duration / diffDays));

        const timer = setInterval(() => {
            currentCount += Math.ceil(diffDays / 50);
            if (currentCount >= diffDays) {
                currentCount = diffDays;
                clearInterval(timer);
            }
            daysCounter.innerHTML = `${currentCount} <span>يوم</span>`;
        }, 30);
    }

    // Use Intersection Observer to start counter animation when visible
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            updateCounter();
            observer.disconnect();
        }
    });
    observer.observe(document.querySelector('.milestone-section'));

    // ---- Modal & Letter ----
    const unlockLetterBtn = document.getElementById('unlockLetterBtn');
    const letterModal = document.getElementById('letterModal');
    const envelopeWrapper = document.getElementById('envelopeWrapper');
    const letterContentEl = document.getElementById('letterContent');
    const closeModal = document.getElementById('closeModal');
    const loveLetterText = document.getElementById('loveLetterText');

    const letterContent = `سارة، يا أجمل ما رأت عيني وأحن قلب عرفته. 
    
منذ أن دخلتي حياتي، تبدل كل شيء. أصبحت الألوان أزهى، والأيام أسعد، والضحكات تنبع من أعماق القلب. كل يوم معكِ هو هدية ثمينة، وكل لحظة بقربكِ هي عيد أحتفل به. 

أنتِ لستِ فقط حبيبتي، بل أنتِ السكينة لروحي، ورفيقة الدرب التي أستند عليها. أعدكِ أن أبقى السند والحب والأمان لكِ طوال العمر، وأن أحرس ابتسامتكِ كما أحرس روحي.

أحبكِ اليوم، وغداً، وإلى الأبد يا أميرتي.`;

    let typeInterval;

    unlockLetterBtn.addEventListener('click', () => {
        letterModal.classList.add('active');
        envelopeWrapper.classList.remove('open', 'hidden');
        letterContentEl.classList.remove('show');
        loveLetterText.textContent = '';
        document.getElementById('letterActions').style.opacity = '0';
        document.getElementById('letterActions').style.pointerEvents = 'none';
        clearInterval(typeInterval);
        triggerGrandConfetti();
    });

    envelopeWrapper.addEventListener('click', () => {
        if (envelopeWrapper.classList.contains('open')) return;

        envelopeWrapper.classList.add('open');
        playChime();

        setTimeout(() => {
            envelopeWrapper.classList.add('hidden');
            letterContentEl.classList.add('show');

            let i = 0;
            clearInterval(typeInterval);

            setTimeout(() => {
                typeInterval = setInterval(() => {
                    if (i < letterContent.length) {
                        if (letterContent.charAt(i) === '\n') {
                            loveLetterText.appendChild(document.createElement('br'));
                        } else {
                            loveLetterText.appendChild(document.createTextNode(letterContent.charAt(i)));
                        }
                        i++;
                    } else {
                        clearInterval(typeInterval);
                        const actions = document.getElementById('letterActions');
                        actions.style.opacity = '1';
                        actions.style.pointerEvents = 'auto';
                    }
                }, 60);
            }, 600); // Wait for modal to scale up

        }, 1200); // Wait for envelope open animation
    });

    closeModal.addEventListener('click', () => {
        letterModal.classList.remove('active');
        clearInterval(typeInterval);
        revealRestOfPage();
    });

    letterModal.addEventListener('click', (e) => {
        if (e.target === letterModal) {
            letterModal.classList.remove('active');
            clearInterval(typeInterval);
            revealRestOfPage();
        }
    });

    // ---- Story Flow Progression ----
    const startBtn = document.getElementById('startBtn');
    const gameSection = document.getElementById('gameSection');
    const milestoneSection = document.getElementById('milestoneSection');
    const gallerySection = document.getElementById('gallerySection');
    const memoriesBtn = document.getElementById('memoriesBtn');

    if (memoriesBtn) {
        memoriesBtn.addEventListener('click', () => {
            letterModal.classList.remove('active');
            clearInterval(typeInterval);
            revealRestOfPage();
            // Override auto-scroll to go specifically to gallery
            setTimeout(() => {
                gallerySection.scrollIntoView({ behavior: 'smooth' });
            }, 400);
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            gameSection.classList.remove('hidden-section');
            gameSection.classList.add('fade-in-section');
            setTimeout(() => {
                gameSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    }

    let hasRevealedRest = false;
    function revealRestOfPage() {
        if (hasRevealedRest) return;
        hasRevealedRest = true;

        milestoneSection.classList.remove('hidden-section');
        gallerySection.classList.remove('hidden-section');

        milestoneSection.classList.add('fade-in-section');
        gallerySection.classList.add('fade-in-section');

        setTimeout(() => {
            milestoneSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
    }

    // ---- Floating Hearts Generator ----
    const heartBtn = document.getElementById('heartBtn');

    heartBtn.addEventListener('click', (e) => {
        createFloatingHeart(e.clientX, e.clientY);
        // Play a very subtle pop sound if audio is enabled
        if (isPlaying && audioCtx) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    });

    function createFloatingHeart(x, y) {
        // Create 3-5 hearts per click
        const count = Math.floor(Math.random() * 3) + 3;

        for (let i = 0; i < count; i++) {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            heart.innerHTML = '<i class="fas fa-heart"></i>';

            // Randomize position slightly around the click
            const startX = x - 20 + Math.random() * 40;
            const startY = y - 20 + Math.random() * 40;

            heart.style.left = startX + 'px';
            heart.style.top = startY + 'px';

            // Randomize trajectory
            const tx = (Math.random() - 0.5) * 150 + 'px';
            const rot = (Math.random() - 0.5) * 60 + 'deg';

            heart.style.setProperty('--tx', tx);
            heart.style.setProperty('--rot', rot);

            // Randomize color slightly
            const colors = ['#ff758c', '#ff7eb3', '#ff9eaa', '#ffb6c1'];
            heart.style.color = colors[Math.floor(Math.random() * colors.length)];

            // Random size
            heart.style.fontSize = (1.5 + Math.random() * 1.5) + 'rem';

            document.body.appendChild(heart);

            // Remove after animation
            setTimeout(() => {
                heart.remove();
            }, 2000);
        }
    }

    // ---- Polaroid 3D Tilt Interaction ----
    const polaroids = document.querySelectorAll('.polaroid');

    // Only apply on non-touch devices for better performance and usability
    if (window.matchMedia("(pointer: fine)").matches) {
        polaroids.forEach(p => {
            p.addEventListener('mousemove', (e) => {
                const rect = p.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                // Calculate rotation based on cursor position relative to center
                const rotateX = ((y - centerY) / centerY) * -12;
                const rotateY = ((x - centerX) / centerX) * 12;

                p.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
                p.style.boxShadow = `${-rotateY}px ${rotateX}px 30px rgba(0,0,0,0.2)`;
                p.style.zIndex = 10;
            });

            p.addEventListener('mouseleave', () => {
                p.style.transform = ''; // fallback to css rule
                p.style.boxShadow = '';
                p.style.zIndex = '';
            });
        });
    }

    // ---- Lightbox ----
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeLightbox = document.getElementById('closeLightbox');

    document.querySelectorAll('.polaroid').forEach(p => {
        p.addEventListener('click', () => {
            const imgSrc = p.querySelector('img').src;
            lightboxImg.src = imgSrc;
            lightbox.classList.add('active');
        });
    });

    closeLightbox.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
});
