/**
 * JEYAPRAKASH J — INTERACTIVE PORTFOLIO ENGINE v2.45
 * Interactive Oscilloscope, Light-Following Robot Physics Sandbox,
 * Web Audio Synthesizer & Embedded CLI Terminal
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initAudioEngine();
  initOscilloscopeAndGenerator();
  initRobotSandbox();
  initProjectFiltering();
  initProjectModals();
  initCliTerminal();
  initCopyActions();
  initContactForm();
  initScrollFeatures();
  initMobileMenu();
  initClock();
});

/* ==========================================================================
   1. Web Audio API Engine (Synthesized Clicks & RF Carrier Monitor)
   ========================================================================== */
let audioCtx = null;
let carrierOsc = null;
let carrierGain = null;
let isAudioMuted = true;
let isScopeAudioActive = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playRelayClick() {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.035);
  } catch (e) {
    // Audio error fallback
  }
}

function initAudioEngine() {
  const masterAudioBtn = document.getElementById('audio-toggle-btn');
  const scopeAudioBtn = document.getElementById('scope-audio-btn');

  function updateMasterButtonUI() {
    if (!masterAudioBtn) return;
    if (isAudioMuted) {
      masterAudioBtn.querySelector('.audio-icon').textContent = '🔇';
      masterAudioBtn.querySelector('.audio-text').textContent = 'LAB AUDIO: OFF';
      masterAudioBtn.style.color = 'var(--text-muted)';
    } else {
      masterAudioBtn.querySelector('.audio-icon').textContent = '🔊';
      masterAudioBtn.querySelector('.audio-text').textContent = 'LAB AUDIO: ON';
      masterAudioBtn.style.color = 'var(--accent-emerald)';
    }
  }

  if (masterAudioBtn) {
    masterAudioBtn.addEventListener('click', () => {
      getAudioContext();
      isAudioMuted = !isAudioMuted;
      updateMasterButtonUI();
      if (!isAudioMuted) {
        playRelayClick();
        showToast('Lab Audio & Synthesizer: ACTIVATED');
      } else {
        stopCarrierTone();
        if (scopeAudioBtn) scopeAudioBtn.classList.remove('active');
        showToast('Lab Audio: MUTED');
      }
    });
  }

  if (scopeAudioBtn) {
    scopeAudioBtn.addEventListener('click', () => {
      getAudioContext();
      if (isAudioMuted) {
        isAudioMuted = false;
        updateMasterButtonUI();
      }

      isScopeAudioActive = !isScopeAudioActive;
      if (isScopeAudioActive) {
        scopeAudioBtn.classList.add('active');
        scopeAudioBtn.innerHTML = '<span>🔊 Monitoring Tone</span>';
        startCarrierTone();
        showToast('RF Audio Monitor Active — Frequency pitch synced');
      } else {
        scopeAudioBtn.classList.remove('active');
        scopeAudioBtn.innerHTML = '<span>🔈 Monitor Tone</span>';
        stopCarrierTone();
      }
    });
  }

  // Attach mechanical click sound to interactive buttons
  document.querySelectorAll('button, .filter-btn, .wave-btn, .nav-link').forEach(el => {
    el.addEventListener('click', () => {
      if (!isAudioMuted) playRelayClick();
    });
  });
}

function startCarrierTone() {
  const ctx = getAudioContext();
  if (!ctx || carrierOsc) return;

  carrierOsc = ctx.createOscillator();
  carrierGain = ctx.createGain();

  carrierOsc.type = 'sine';
  carrierOsc.frequency.setValueAtTime(440, ctx.currentTime);

  carrierGain.gain.setValueAtTime(0.04, ctx.currentTime);

  carrierOsc.connect(carrierGain);
  carrierGain.connect(ctx.destination);

  carrierOsc.start();
}

function updateCarrierPitch(freqGhz, modulation) {
  if (!carrierOsc || !audioCtx) return;
  // Map 1.0 - 5.8 GHz to audible 200 Hz - 900 Hz
  const audioFreq = 220 + ((freqGhz - 1.0) / 4.8) * 600 + (modulation * 8);
  carrierOsc.frequency.setTargetAtTime(Math.max(100, Math.min(1200, audioFreq)), audioCtx.currentTime, 0.05);
}

function stopCarrierTone() {
  if (carrierOsc) {
    try {
      carrierOsc.stop();
      carrierOsc.disconnect();
    } catch (e) {}
    carrierOsc = null;
  }
}

/* ==========================================================================
   2. Theme Management (Dark / Light)
   ========================================================================== */
function initTheme() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  const storedTheme = localStorage.getItem('jp_portfolio_theme') || 'dark';
  htmlElement.setAttribute('data-theme', storedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('jp_portfolio_theme', newTheme);
      showToast(`Switched to ${newTheme === 'dark' ? 'Dark Workstation' : 'Blueprint Light'} mode`);
    });
  }
}

/* ==========================================================================
   3. Interactive RF Oscilloscope & Signal Generator
   ========================================================================== */
let globalCarrierFreq = 2.45;
let globalWaveType = 'sine';
let globalModDepth = 0.5;

function initOscilloscopeAndGenerator() {
  const canvas = document.getElementById('rfWaveCanvas');
  const freqReadout = document.getElementById('carrier-freq-readout');
  const topBandIndicator = document.getElementById('top-band-indicator');
  const waveTypeLabel = document.getElementById('wave-type-label');
  const freqRange = document.getElementById('freq-range');
  const modRange = document.getElementById('mod-range');
  const freqValLabel = document.getElementById('freq-val-label');
  const modValLabel = document.getElementById('mod-val-label');
  const waveBtns = document.querySelectorAll('.wave-btn');

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let phase = 0;
  let mouseMod = 0;

  // Wave mode buttons
  waveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      waveBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      globalWaveType = btn.getAttribute('data-wave');
      if (waveTypeLabel) {
        waveTypeLabel.textContent = `TYPE: ${globalWaveType.toUpperCase()}`;
      }
      showToast(`Oscilloscope mode: ${globalWaveType.toUpperCase()}`);
    });
  });

  // Slider controls
  if (freqRange) {
    freqRange.addEventListener('input', (e) => {
      globalCarrierFreq = parseFloat(e.target.value);
      if (freqValLabel) freqValLabel.textContent = `${globalCarrierFreq.toFixed(2)} GHz`;
      if (freqReadout) freqReadout.textContent = `fc: ${globalCarrierFreq.toFixed(2)} GHz`;
      if (topBandIndicator) topBandIndicator.textContent = `${globalCarrierFreq.toFixed(2)} GHz [ACTIVE]`;
    });
  }

  if (modRange) {
    modRange.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      globalModDepth = val / 100;
      if (modValLabel) modValLabel.textContent = `${val}%`;
    });
  }

  // Interactive mouse modulation
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const yRatio = (e.clientY - rect.top) / rect.height;
    mouseMod = (yRatio - 0.5) * 14;
  });

  canvas.addEventListener('mouseleave', () => {
    mouseMod = 0;
  });

  function drawWave() {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Oscilloscope Grid Lines
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    for (let x = 0; x < width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();

    // Wave Generation
    ctx.beginPath();
    ctx.lineWidth = 2;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.strokeStyle = isDark ? '#10B981' : '#0284C7';

    phase += 0.055;
    const baseAmp = (height * 0.28) + mouseMod;

    for (let x = 0; x < width; x++) {
      const normX = x / width;
      let yOffset = 0;

      if (globalWaveType === 'sine') {
        // Continuous Carrier with subtle harmonic
        const theta = normX * Math.PI * 4 * (globalCarrierFreq / 1.5) + phase;
        yOffset = Math.sin(theta) * baseAmp + Math.sin(theta * 2) * (baseAmp * 0.15);
      } else if (globalWaveType === 'am') {
        // Amplitude Modulation: [1 + m*cos(fm*t)] * sin(fc*t)
        const carrierTheta = normX * Math.PI * 10 * (globalCarrierFreq / 1.5) + phase;
        const modTheta = normX * Math.PI * 2 + (phase * 0.2);
        const envelope = 1 + (globalModDepth * Math.cos(modTheta));
        yOffset = Math.sin(carrierTheta) * (baseAmp * 0.65) * envelope;
      } else if (globalWaveType === 'fm') {
        // Frequency Modulation: sin(fc*t + beta*sin(fm*t))
        const modTheta = normX * Math.PI * 2 + (phase * 0.3);
        const beta = globalModDepth * 8;
        const carrierTheta = normX * Math.PI * 6 * (globalCarrierFreq / 1.5) + (beta * Math.sin(modTheta)) + phase;
        yOffset = Math.sin(carrierTheta) * baseAmp;
      } else if (globalWaveType === 'pwm') {
        // Digital PWM / Square Wave
        const cycle = (normX * 6 * (globalCarrierFreq / 1.5) + (phase * 0.5)) % 1;
        const duty = 0.2 + (globalModDepth * 0.6);
        yOffset = (cycle < duty ? 1 : -1) * (baseAmp * 0.85);
      }

      const y = centerY + yOffset;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Glow Effect
    if (isDark) {
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }

    if (isScopeAudioActive) {
      updateCarrierPitch(globalCarrierFreq, mouseMod);
    }

    requestAnimationFrame(drawWave);
  }

  drawWave();
}

/* ==========================================================================
   4. Interactive Hardware Sandbox: Light-Following Robot Physics
   ========================================================================== */
function initRobotSandbox() {
  const canvas = document.getElementById('robotSimCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const ldrLeftVal = document.getElementById('hud-ldr-left');
  const ldrRightVal = document.getElementById('hud-ldr-right');
  const pwmLeftVal = document.getElementById('hud-pwm-left');
  const pwmRightVal = document.getElementById('hud-pwm-right');
  const barLdrLeft = document.getElementById('bar-ldr-left');
  const barLdrRight = document.getElementById('bar-ldr-right');
  const barPwmLeft = document.getElementById('bar-pwm-left');
  const barPwmRight = document.getElementById('bar-pwm-right');
  const resetBtn = document.getElementById('reset-sim-btn');

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Robot State
  let robot = {
    x: 180,
    y: 200,
    heading: 0, // Radians
    width: 44,
    height: 32,
    speed: 1.8,
    turnSpeed: 0.045
  };

  // Light Source (Torch) Position
  let torch = {
    x: 480,
    y: 190,
    active: true
  };

  function updateTorchPosition(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    torch.x = clientX - rect.left;
    torch.y = clientY - rect.top;
  }

  canvas.addEventListener('mousemove', (e) => {
    updateTorchPosition(e.clientX, e.clientY);
  });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updateTorchPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      robot.x = canvas.offsetWidth * 0.25;
      robot.y = canvas.offsetHeight * 0.5;
      robot.heading = 0;
      torch.x = canvas.offsetWidth * 0.75;
      torch.y = canvas.offsetHeight * 0.5;
      showToast('Robot simulation repositioned');
    });
  }

  function simulateAndDraw() {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    ctx.clearRect(0, 0, w, h);

    // Grid Floor
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Calculate Sensor Positions (Left and Right LDR at front of chassis)
    const frontDist = 24;
    const lateralDist = 14;

    const sensorLeft = {
      x: robot.x + Math.cos(robot.heading) * frontDist - Math.sin(robot.heading) * lateralDist,
      y: robot.y + Math.sin(robot.heading) * frontDist + Math.cos(robot.heading) * lateralDist
    };

    const sensorRight = {
      x: robot.x + Math.cos(robot.heading) * frontDist + Math.sin(robot.heading) * lateralDist,
      y: robot.y + Math.sin(robot.heading) * frontDist - Math.cos(robot.heading) * lateralDist
    };

    // Calculate Distances from Torch to Sensors
    const dLeft = Math.hypot(torch.x - sensorLeft.x, torch.y - sensorLeft.y);
    const dRight = Math.hypot(torch.x - sensorRight.x, torch.y - sensorRight.y);

    // Inverse Square Law simulation for LDR analog voltage (0V to 5V)
    const k = 1400;
    const vLeft = Math.min(5.0, Math.max(0.2, (k / Math.max(25, dLeft * 1.1))));
    const vRight = Math.min(5.0, Math.max(0.2, (k / Math.max(25, dRight * 1.1))));

    // Steering Differential Algorithm
    const diff = vLeft - vRight;
    const deadband = 0.08;

    let pwmLeft = 140;
    let pwmRight = 140;

    const distToTorch = Math.hypot(torch.x - robot.x, torch.y - robot.y);

    if (distToTorch > 35) {
      if (Math.abs(diff) > deadband) {
        if (diff > 0) {
          // Light is on the left -> steer left
          robot.heading -= robot.turnSpeed * Math.min(2.5, Math.abs(diff) * 2.5);
          pwmLeft = Math.max(40, Math.round(140 - diff * 80));
          pwmRight = Math.min(255, Math.round(140 + diff * 80));
        } else {
          // Light is on the right -> steer right
          robot.heading += robot.turnSpeed * Math.min(2.5, Math.abs(diff) * 2.5);
          pwmLeft = Math.min(255, Math.round(140 - diff * 80));
          pwmRight = Math.max(40, Math.round(140 + diff * 80));
        }
      }

      // Drive forward
      robot.x += Math.cos(robot.heading) * robot.speed;
      robot.y += Math.sin(robot.heading) * robot.speed;
    } else {
      // Arrived at beacon
      pwmLeft = 0;
      pwmRight = 0;
    }

    // Keep within bounds
    robot.x = Math.max(25, Math.min(w - 25, robot.x));
    robot.y = Math.max(25, Math.min(h - 25, robot.y));

    // Update Telemetry HUD
    if (ldrLeftVal) ldrLeftVal.textContent = `${vLeft.toFixed(2)} V`;
    if (ldrRightVal) ldrRightVal.textContent = `${vRight.toFixed(2)} V`;
    if (pwmLeftVal) pwmLeftVal.textContent = `${pwmLeft} / 255`;
    if (pwmRightVal) pwmRightVal.textContent = `${pwmRight} / 255`;

    if (barLdrLeft) barLdrLeft.style.width = `${(vLeft / 5) * 100}%`;
    if (barLdrRight) barLdrRight.style.width = `${(vRight / 5) * 100}%`;
    if (barPwmLeft) barPwmLeft.style.width = `${(pwmLeft / 255) * 100}%`;
    if (barPwmRight) barPwmRight.style.width = `${(pwmRight / 255) * 100}%`;

    // Draw Light Torch Glow & Aura
    const glow = ctx.createRadialGradient(torch.x, torch.y, 5, torch.x, torch.y, 110);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.45)');
    glow.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(torch.x, torch.y, 110, 0, Math.PI * 2);
    ctx.fill();

    // Draw Torch Center
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(torch.x, torch.y, 7, 0, Math.PI * 2);
    ctx.fill();

    // Draw Light Sensing Rays from sensors to torch
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sensorLeft.x, sensorLeft.y);
    ctx.lineTo(torch.x, torch.y);
    ctx.moveTo(sensorRight.x, sensorRight.y);
    ctx.lineTo(torch.x, torch.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Robot Chassis (Translated & Rotated)
    ctx.save();
    ctx.translate(robot.x, robot.y);
    ctx.rotate(robot.heading);

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -20, 14, 6); // Left wheel
    ctx.fillRect(-16, 14, 14, 6);  // Right wheel

    // Main Acrylic / PCB Chassis
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-22, -15, 44, 30, 6);
    ctx.fill();
    ctx.stroke();

    // ATmega328P Chip Simulation on Board
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.strokeRect(-8, -8, 16, 16);

    // Front Sensors (LDRs)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(frontDist - 2, -lateralDist, 3.5, 0, Math.PI * 2);
    ctx.arc(frontDist - 2, lateralDist, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Front Caster Wheel
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(frontDist - 6, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    requestAnimationFrame(simulateAndDraw);
  }

  simulateAndDraw();
}

/* ==========================================================================
   5. Interactive CLI Terminal ("JP-Shell // RF-OS")
   ========================================================================== */
function initCliTerminal() {
  const terminalOverlay = document.getElementById('terminalOverlay');
  const termCloseBtn = document.getElementById('term-close-btn');
  const termInput = document.getElementById('term-input');
  const termHistory = document.getElementById('term-history');
  const triggers = document.querySelectorAll('.terminal-btn-trigger');

  if (!terminalOverlay || !termInput) return;

  const commandHistory = [];
  let historyIndex = -1;

  function openTerminal() {
    terminalOverlay.classList.add('open');
    terminalOverlay.setAttribute('aria-hidden', 'false');
    termInput.focus();
    playRelayClick();
  }

  function closeTerminal() {
    terminalOverlay.classList.remove('open');
    terminalOverlay.setAttribute('aria-hidden', 'true');
    playRelayClick();
  }

  triggers.forEach(btn => {
    btn.addEventListener('click', openTerminal);
  });

  if (termCloseBtn) {
    termCloseBtn.addEventListener('click', closeTerminal);
  }

  terminalOverlay.addEventListener('click', (e) => {
    if (e.target === terminalOverlay) closeTerminal();
  });

  // Shortcut: Press ~ (tilde / backquote) to toggle terminal
  document.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && document.activeElement !== termInput) {
        return;
      }
      e.preventDefault();
      if (terminalOverlay.classList.contains('open')) {
        closeTerminal();
      } else {
        openTerminal();
      }
    } else if (e.key === 'Escape' && terminalOverlay.classList.contains('open')) {
      closeTerminal();
    }
  });

  // Terminal Commands Registry
  const commands = {
    help: () => `
<span class="text-cyan font-semibold">AVAILABLE SYSTEM COMMANDS:</span>
  <span class="text-emerald">about</span>       - Print Jeyaprakash's profile &amp; RF career objective
  <span class="text-emerald">skills</span>      - List core engineering toolsets &amp; hardware specs
  <span class="text-emerald">projects</span>    - Display hardware &amp; software projects
  <span class="text-emerald">rf-tune</span>    - Adjust carrier frequency [e.g. rf-tune 5.8]
  <span class="text-emerald">whoami</span>     - Display current visitor session info
  <span class="text-emerald">contact</span>    - Show direct transmission lines (Email, Phone, LinkedIn)
  <span class="text-emerald">hire</span>       - Recruit Jeyaprakash [Launches interview inquiry]
  <span class="text-emerald">clear</span>      - Flush terminal buffer
`,
    about: () => `
<span class="text-cyan font-bold">JEYAPRAKASH J</span>
&bull; Discipline: B.E Electronics &amp; Communication Engineering (V.S.B. College of Engg, Coimbatore)
&bull; Academic Score: 74.9% (till 6th semester)
&bull; Focus: RF Network Design, Electromagnetic Waves, Antenna Propagation, Embedded Microcontrollers &amp; AI
`,
    skills: () => `
<span class="text-cyan font-bold">CORE CAPABILITIES MATRIX:</span>
[RF &amp; Hardware]: KiCad, Proteus, Arduino, ATmega328P, Wireless RF 433MHz/2.4GHz, Analog ADC
[Languages]: Python (ML &amp; Data Science), Java, C / Embedded C, JavaScript ES6
[Frontend]: Tailwind CSS, Bootstrap, HTML5 Canvas, REST APIs
[Cloud &amp; BI]: Google Cloud Fundamentals, Power BI Dashboards
`,
    projects: () => `
<span class="text-cyan font-bold">COMPLETED PROTOTYPES:</span>
1. <span class="text-emerald">Voice-Controlled Wheelchair</span> - Embedded MCU, wireless RF module, L298N driver
2. <span class="text-emerald">Autonomous Light-Following Robot</span> - Dual LDR analog signal processing, Arduino
3. <span class="text-emerald">Cloud File Storage Prototype</span> - Google Cloud Platform, Python REST APIs
4. <span class="text-emerald">LearnX AI Platform</span> - Interactive education portal built with AI tools
`,
    whoami: () => `
Session: Authenticated Recruiter / Engineering Evaluator
Status: HIGH INTEREST
Recommendation: Move to technical interview stage!
`,
    contact: () => `
<span class="text-cyan font-bold">TRANSMISSION CHANNELS:</span>
&bull; Email: <a href="mailto:jjeyaprakash13@gmail.com" class="text-emerald">jjeyaprakash13@gmail.com</a>
&bull; Phone: <a href="tel:+918270880162" class="text-emerald">+91 8270880162</a>
&bull; GitHub: <a href="https://github.com/JeyaPrakashJP2" target="_blank" class="text-cyan">github.com/JeyaPrakashJP2</a>
&bull; LinkedIn: <a href="https://www.linkedin.com/in/jeya-prakash-496699404" target="_blank" class="text-cyan">linkedin.com/in/jeya-prakash-496699404</a>
`,
    hire: () => {
      setTimeout(() => {
        window.location.href = "mailto:jjeyaprakash13@gmail.com?subject=Engineering%20Opportunity%20-%20Interview%20Invitation";
      }, 800);
      return `<span class="text-emerald font-bold">ACCESS GRANTED!</span> Opening your email client to schedule an interview with Jeyaprakash...`;
    },
    clear: () => {
      termHistory.innerHTML = '';
      return '';
    }
  };

  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const inputVal = termInput.value.trim();
      termInput.value = '';

      if (!inputVal) return;

      commandHistory.push(inputVal);
      historyIndex = commandHistory.length;

      // Print prompt line
      const cmdLog = document.createElement('div');
      cmdLog.innerHTML = `<span class="term-user text-emerald">guest@jp-rf</span>:<span class="term-dir text-cyan">~</span>$ ${inputVal}`;
      termHistory.appendChild(cmdLog);

      // Parse Command
      const parts = inputVal.split(' ');
      const mainCmd = parts[0].toLowerCase();
      const arg = parts[1];

      let output = '';

      if (mainCmd === 'rf-tune') {
        const newFreq = parseFloat(arg);
        if (newFreq && newFreq >= 0.5 && newFreq <= 10.0) {
          globalCarrierFreq = newFreq;
          const topBand = document.getElementById('top-band-indicator');
          const readout = document.getElementById('carrier-freq-readout');
          if (topBand) topBand.textContent = `${newFreq.toFixed(2)} GHz [TUNED]`;
          if (readout) readout.textContent = `fc: ${newFreq.toFixed(2)} GHz`;
          output = `<span class="text-emerald">Carrier frequency successfully tuned to ${newFreq.toFixed(2)} GHz!</span> Check the oscilloscope widget.`;
        } else {
          output = `<span class="text-muted">Usage: rf-tune [frequency in GHz, e.g. 5.8]</span>`;
        }
      } else if (mainCmd === 'sudo' && parts[1] === 'hire') {
        output = commands.hire();
      } else if (commands[mainCmd]) {
        output = commands[mainCmd]();
      } else {
        output = `<span style="color: #ef4444;">Command not found: '${mainCmd}'.</span> Type <span class="text-emerald">help</span> for command reference.`;
      }

      if (output) {
        const outLog = document.createElement('div');
        outLog.style.marginBottom = '0.75rem';
        outLog.innerHTML = output;
        termHistory.appendChild(outLog);
      }

      // Auto scroll
      const termBody = document.getElementById('terminalBody');
      if (termBody) termBody.scrollTop = termBody.scrollHeight;
    } else if (e.key === 'ArrowUp') {
      if (historyIndex > 0) {
        historyIndex--;
        termInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        termInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        termInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const inputVal = termInput.value.trim();
      const match = Object.keys(commands).find(c => c.startsWith(inputVal));
      if (match) termInput.value = match;
    }
  });
}

/* ==========================================================================
   6. Project Category Filter System
   ========================================================================== */
function initProjectFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 20);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(10px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   7. Deep-Dive Project Modal System
   ========================================================================== */
const projectData = {
  wheelchair: {
    badge: "EMBEDDED SYSTEMS / WIRELESS ASSISTIVE MOBILITY",
    title: "Voice-Controlled Wheelchair System",
    overview: "An assistive engineering solution designed to empower mobility-impaired individuals with hands-free, vocal control over a mechanized wheelchair chassis. Combines analog motor driving with low-latency wireless communication.",
    specs: [
      { name: "Main Microcontroller", role: "Atmel ATmega328P / Embedded Processing" },
      { name: "Voice Recognition Module", role: "Offline trained speech-command recognition (Forward, Reverse, Left, Right, Stop)" },
      { name: "Wireless Transceiver", role: "RF 433MHz / Bluetooth 2.4GHz for wireless command transmission" },
      { name: "Motor Driver & Actuators", role: "L298N Dual H-Bridge Driver & High-Torque 12V DC Gear Motors" },
      { name: "Power Management", role: "Step-down voltage regulators (LM7805) & rechargeable Li-Ion pack" }
    ],
    challenges: [
      "Mitigated acoustic ambient noise interference by tuning speaker sensitivity thresholds and command latency.",
      "Implemented hardware fail-safe routines: instantaneous motor shutdown on signal loss or ambiguous voice command.",
      "Engineered H-bridge PWM motor ramps to ensure smooth, shock-free acceleration and braking for user safety."
    ],
    keyOutcomes: "Successfully achieved <250ms voice actuation latency with obstacle safety buffers, validating embedded wireless communication for assistive robotics."
  },
  "light-robot": {
    badge: "ROBOTICS / SENSOR SIGNAL CONDITIONING / ANALOG-TO-DIGITAL",
    title: "Autonomous Light-Following Robot",
    overview: "An autonomous wheeled robot that senses ambient illumination gradients and dynamically calculates trajectory vectors toward the brightest light source in real-time.",
    specs: [
      { name: "Sensors", role: "Dual Light Dependent Resistors (LDRs) in differential voltage divider circuits" },
      { name: "ADC Unit", role: "Embedded 10-bit Analog-to-Digital Converter on Arduino" },
      { name: "Driver Circuit", role: "L293D Quadruple Half-H Driver with bidirectional PWM speed control" },
      { name: "Chassis & Mechanicals", role: "Differential twin-drive wheels with front caster ball for 360° pivot" }
    ],
    challenges: [
      "Calibrated analog voltage dividers to balance ambient room light saturation versus concentrated flashlight beacons.",
      "Implemented a deadband threshold algorithm in C to eliminate continuous motor jitter/hunting around equilibrium.",
      "Applied analog low-pass RC filtering on sensor leads to suppress inductive motor brush electrical noise."
    ],
    keyOutcomes: "Delivered responsive real-time analog signal processing with smooth differential steering and 98% tracking accuracy under varying illumination levels."
  },
  "cloud-storage": {
    badge: "CLOUD ARCHITECTURE / SECURE REST INTEGRATION",
    title: "Cloud-Based File Storage Prototype",
    overview: "A lightweight cloud-connected storage prototype engineered to test secure distributed file upload, tokenized authorization, and organized cloud bucket retrieval.",
    specs: [
      { name: "Cloud Provider", role: "Google Cloud Platform (GCP) Fundamentals Architecture" },
      { name: "Storage Service", role: "GCP Cloud Storage Buckets (Object Storage)" },
      { name: "Backend Logic", role: "Python RESTful API endpoints for multipart stream uploads" },
      { name: "Access Control", role: "IAM role configuration & token-based access enforcement" }
    ],
    challenges: [
      "Optimized file payload streaming to avoid RAM exhaustion on large binary uploads.",
      "Configured fine-grained access policies to prevent unauthorized read/write access to storage buckets.",
      "Created structured indexing metadata allowing rapid search and retrieval of stored documents."
    ],
    keyOutcomes: "Achieved seamless file persistence with automated cloud bucket indexing and validated fundamental cloud security principles."
  },
  "learnx-ai": {
    badge: "APPLIED AI / WEB PLATFORM / BE10X CAPSTONE",
    title: "LearnX AI — Interactive Learning Platform",
    overview: "An educational platform designed during Be10X certification, utilizing modern Generative AI tooling and prompt engineering to deliver structured, interactive technical modules.",
    specs: [
      { name: "Frontend Architecture", role: "Semantic HTML5, Tailwind CSS, Modern JavaScript (ES6)" },
      { name: "AI Core", role: "Automated prompt sequences & generative knowledge synthesis" },
      { name: "Interactive Features", role: "Dynamic quiz generation, concept summaries, and visual roadmaps" }
    ],
    challenges: [
      "Designed prompt architectures that minimize hallucinations and provide step-by-step engineering tutorials.",
      "Built a snappy, responsive UI with zero dependency bloat for maximum accessibility on mobile devices."
    ],
    keyOutcomes: "Successfully delivered capstone project for Be10X Elite certification, demonstrating rapid prototyping of AI-assisted web applications."
  }
};

function initProjectModals() {
  const modal = document.getElementById('projectModal');
  const modalContent = document.getElementById('modalContent');
  const closeBtn = document.getElementById('modalCloseBtn');
  const openBtns = document.querySelectorAll('.open-modal-btn');

  if (!modal || !modalContent) return;

  function openModal(projectId) {
    const data = projectData[projectId];
    if (!data) return;

    let specsHtml = data.specs.map(s => `
      <div class="modal-component-item">
        <span class="comp-name">${s.name}</span>
        <span class="comp-role">${s.role}</span>
      </div>
    `).join('');

    let challengesHtml = data.challenges.map(c => `<li>${c}</li>`).join('');

    modalContent.innerHTML = `
      <div class="modal-header-badge font-mono">${data.badge}</div>
      <h2 class="modal-title">${data.title}</h2>
      <p class="modal-overview">${data.overview}</p>

      <h3 class="modal-section-title font-mono text-cyan">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        HARDWARE & SYSTEM SPECIFICATIONS
      </h3>
      <div class="modal-component-list">
        ${specsHtml}
      </div>

      <h3 class="modal-section-title font-mono text-emerald">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        ENGINEERING HURDLES &amp; SOLUTIONS
      </h3>
      <ul class="modal-bullets">
        ${challengesHtml}
      </ul>

      <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-surface-elevated); border-radius: 8px; border-left: 3px solid var(--accent-cyan);">
        <span class="font-mono text-xs text-muted" style="display:block; margin-bottom: 0.25rem;">MEASURABLE OUTCOME:</span>
        <span style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">${data.keyOutcomes}</span>
      </div>
    `;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const projId = btn.getAttribute('data-project');
      openModal(projId);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   8. Copy Email & Quick Actions
   ========================================================================== */
function initCopyActions() {
  const heroCopyBtn = document.getElementById('hero-copy-email-btn');
  const cardCopyBtn = document.getElementById('copy-email-card-btn');

  function copyEmail(email) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(() => {
        showToast(`Copied email to clipboard: ${email}`);
      }).catch(() => {
        fallbackCopy(email);
      });
    } else {
      fallbackCopy(email);
    }
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`Copied to clipboard: ${text}`);
    } catch (err) {
      showToast(`Email: ${text}`);
    }
    document.body.removeChild(textArea);
  }

  if (heroCopyBtn) {
    heroCopyBtn.addEventListener('click', () => copyEmail(heroCopyBtn.getAttribute('data-email')));
  }
  if (cardCopyBtn) {
    cardCopyBtn.addEventListener('click', () => copyEmail(cardCopyBtn.getAttribute('data-email')));
  }
}

/* ==========================================================================
   9. Contact Form Processing
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('portfolio-contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('sender-name').value.trim();
    const email = document.getElementById('sender-email').value.trim();
    const subject = document.getElementById('message-subject').value.trim();
    const message = document.getElementById('message-body').value.trim();

    const fullSubject = encodeURIComponent(`[Portfolio Inquiry] ${subject} - from ${name}`);
    const fullBody = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);

    const mailtoUrl = `mailto:jjeyaprakash13@gmail.com?subject=${fullSubject}&body=${fullBody}`;
    window.location.href = mailtoUrl;

    showToast("Launching your mail client with prefilled message...");
  });
}

/* ==========================================================================
   10. Scroll Features & Active Nav Highlight
   ========================================================================== */
function initScrollFeatures() {
  const backToTopBtn = document.getElementById('back-to-top');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    const scrollPos = window.scrollY + 140;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });
}

/* ==========================================================================
   11. Mobile Navigation Drawer
   ========================================================================== */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const drawer = document.getElementById('mobile-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !drawer) return;

  menuBtn.addEventListener('click', () => {
    drawer.classList.toggle('open');
    const isOpen = drawer.classList.contains('open');
    drawer.setAttribute('aria-hidden', !isOpen);
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    });
  });
}

/* ==========================================================================
   12. Live Telemetry Clock
   ========================================================================== */
function initClock() {
  const clockEl = document.getElementById('live-system-time');
  if (!clockEl) return;

  function update() {
    const now = new Date();
    clockEl.textContent = now.toTimeString().split(' ')[0] + ' IST';
  }
  update();
  setInterval(update, 1000);
}

/* ==========================================================================
   Toast Notification Helper
   ========================================================================== */
function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast-msg font-mono';
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}
