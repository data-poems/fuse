// --- CONFIGURATION ---
const NASA_URL = "nasa-data.csv"; // Local copy, no CORS proxy needed
const STORAGE_KEY = "nasa_temp_data_v2";

let tempData = [];
let dataLoaded = false;
let time = 0;
let speed = 0.75; // Doubled from 0.375
let paused = false;
let particles = [];
let lastSpawnedIndex = -1;
let gradient;

// SAFETY WRAPPER - Run immediately or wait for DOM
function initVisualization() {
  console.log("initVisualization() called");
  // 1. Get Elements
  const cv = document.getElementById("c");
  if (!cv) {
    console.error("Canvas element not found!");
    return;
  }
  console.log("Canvas found:", cv);

  const ctx = cv.getContext("2d");
  const yearEl = document.getElementById("year");
  const monthEl = document.getElementById("month");
  const mainDisplay = document.getElementById("mainDisplay");
  const tempEl = document.getElementById("temp");
  // Phase Element Removed
  const liveText = document.getElementById("liveText");
  const liveDot = document.getElementById("liveDot");
  
  // Modal & Control Elements
  const modal = document.getElementById("modal");
  const infoBtn = document.getElementById("infoBtn");
  const closeBtn = document.getElementById("closeBtn");
  const speedRange = document.getElementById("speedRange");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // --- MODAL & CONTROLS LOGIC ---
  if(infoBtn && modal && closeBtn) {
    infoBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
    // Close on clicking outside box
    modal.addEventListener("click", (e) => {
      if(e.target === modal) modal.classList.add("hidden");
    });
  }

  if(speedRange) {
    speedRange.addEventListener("input", (e) => {
      speed = parseFloat(e.target.value);
    });
  }

  // Play/Pause Toggle
  if(playPauseBtn) {
    playPauseBtn.addEventListener("click", () => {
      paused = !paused;
      playPauseBtn.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    });
  }

  // Reset Button
  if(resetBtn) {
    resetBtn.addEventListener("click", () => {
      time = 0;
      lastSpawnedIndex = -1;
      particles = [];
      paused = false;
      if(playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
  }

  function resize() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;

    // Create Gradient ONCE
    const centerY = cv.height / 2;
    const scaleY = 225; // Increased by 50% (was 150)
    gradient = ctx.createLinearGradient(0, centerY - scaleY, 0, centerY + scaleY);
    gradient.addColorStop(0, "rgba(255, 50, 0, 0.4)");    // Top (Hot)
    gradient.addColorStop(0.45, "rgba(255, 50, 0, 0.05)"); // Fade
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");  // Axis
    gradient.addColorStop(0.55, "rgba(0, 200, 255, 0.05)"); // Fade
    gradient.addColorStop(1, "rgba(0, 200, 255, 0.4)");    // Bottom (Cold)
  }
  resize();
  window.addEventListener("resize", resize);

  // --- DATA LOADING ---
  function processCSV(csvText) {
    console.log("processCSV() called, data length:", csvText.length);
    const lines = csvText.trim().split("\n");
    tempData = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("Land") || line.startsWith("Year") || line.startsWith("Global")) continue;

      const parts = line.split(",");
      const year = parseInt(parts[0]);
      if (isNaN(year)) continue;

      if (parts.length >= 13) {
        for (let month = 1; month <= 12; month++) {
          const val = parts[month];
          if (val && val !== "***") {
            const anomaly = parseFloat(val);
            if (!isNaN(anomaly)) {
              tempData.push({ year, month, anomaly });
            }
          }
        }
      }
    }
    console.log("Processed data points:", tempData.length);
    if (liveText) liveText.textContent = `BUFFER: ${tempData.length} POINTS`;
    dataLoaded = true;
    console.log("dataLoaded set to true");
  }

  function loadFallbackData() {
    const annualData = [
      { year: 1880, anomaly: -0.16 }, { year: 1900, anomaly: -0.08 },
      { year: 1920, anomaly: -0.27 }, { year: 1940, anomaly: 0.13 },
      { year: 1960, anomaly: -0.03 }, { year: 1980, anomaly: 0.26 },
      { year: 2000, anomaly: 0.39 }, { year: 2024, anomaly: 1.31 }
    ];
    tempData = [];
    let prev = annualData[0];
    for (let y = 1880; y <= 2025; y++) {
      const match = annualData.find((d) => d.year === y);
      const val = match ? match.anomaly : prev.anomaly;
      if (match) prev = match;
      for (let m = 1; m <= 12; m++) tempData.push({ year: y, month: m, anomaly: val });
    }
    dataLoaded = true;
  }

  const cachedData = localStorage.getItem(STORAGE_KEY);
  console.log("Cached data exists:", !!cachedData);
  if (cachedData) {
    console.log("Using cached data");
    processCSV(cachedData);
  } else {
    console.log("Fetching fresh data from NASA...");
    if (liveText) liveText.textContent = "FETCHING...";
    fetch(NASA_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Network");
        return res.text();
      })
      .then((text) => {
        localStorage.setItem(STORAGE_KEY, text);
        processCSV(text);
      })
      .catch((e) => {
        console.error("Fetch failed:", e);
        console.log("Loading fallback data");
        loadFallbackData();
      });
  }

  // --- VISUALIZATION ---
  class PillarParticle {
    constructor(x, axisY, dataY, temp) {
      this.x = x;
      this.axisY = axisY;
      this.dataY = dataY;
      this.temp = temp;
      this.size = Math.random() * 1.5 + 0.5;

      // Fill Volume
      this.y = axisY + Math.random() * (dataY - axisY);

      // Color Logic
      const t = Math.max(-1, Math.min(2, temp));
      if (t < -0.2) {
        this.r = 0; this.g = 200; this.b = 255; this.type = "ice";
      } else if (t < 0) {
        this.r = 150; this.g = 220; this.b = 255; this.type = "ice";
      } else if (t < 0.5) {
        this.r = 255; this.g = 200; this.b = 100; this.type = "fire";
      } else if (t < 1.0) {
        this.r = 255; this.g = 100; this.b = 50; this.type = "fire";
      } else {
        this.r = 255; this.g = 50; this.b = 0; this.type = "fire";
      }

      // Physics
      const absT = Math.abs(t);
      this.speed = 0.5 + Math.random() * (1 + absT);
      this.vy = this.temp > 0 ? -this.speed : this.speed;
    }

    update() {
      this.y += this.vy;
      if (this.temp > 0) { 
         if (this.y < this.dataY) {
            this.y = this.axisY; 
            this.x += (Math.random() - 0.5) * 2;
         }
      } else { 
         if (this.y > this.dataY) {
            this.y = this.axisY;
            this.x += (Math.random() - 0.5) * 2;
         }
      }
    }

    draw() {
      const totalDist = Math.abs(this.dataY - this.axisY);
      const currentDist = Math.abs(this.y - this.axisY);
      let alpha = 1 - (currentDist / (totalDist + 0.1));
      alpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${alpha})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function updateUI(data) {
    if (!yearEl || !monthEl) return;
    yearEl.textContent = data.year;
    monthEl.textContent = monthNames[data.month - 1];

    let color, shadowColor, shadowSize;

    if (data.anomaly < 0) { // ICE
      color = "rgba(200, 240, 255, 1)";
      shadowColor = "rgba(0, 200, 255, 0.8)";
      shadowSize = 20 + Math.abs(data.anomaly) * 30;
      if (liveDot) { liveDot.style.backgroundColor = "#0cf"; liveDot.style.boxShadow = "0 0 10px #0cf"; }
    } else if (data.anomaly < 0.5) { // WARM
      color = "rgba(255, 240, 200, 1)";
      shadowColor = "rgba(255, 180, 50, 0.6)";
      shadowSize = 10;
      if (liveDot) { liveDot.style.backgroundColor = "#fa0"; liveDot.style.boxShadow = "none"; }
    } else { // FIRE
      color = "rgba(255, 255, 255, 1)";
      shadowColor = "rgba(255, 50, 0, 0.9)";
      shadowSize = 30 + data.anomaly * 40;
      if (liveDot) { liveDot.style.backgroundColor = "#f00"; liveDot.style.boxShadow = "0 0 15px #f00"; }
    }

    // Keep year display neutral (no color effect)
    if (mainDisplay) {
      mainDisplay.style.color = "rgba(255, 255, 255, 0.25)";
      mainDisplay.style.textShadow = "none";
    }

    // APPLY FULL COLOR EFFECT TO TEMP DISPLAY
    if (tempEl) {
      tempEl.textContent = `${data.anomaly > 0 ? "+" : ""}${data.anomaly.toFixed(2)}°C`;
      tempEl.style.color = color;
      tempEl.style.textShadow = `0 0 ${shadowSize}px ${shadowColor}, 0 0 10px ${shadowColor}`;
    }
    
    if (liveText) liveText.innerHTML = `SCAN: ${data.year}.${String(data.month).padStart(2, "0")} [${data.anomaly.toFixed(3)}]`;
  }

  function animate() {
    if (!dataLoaded || tempData.length === 0) {
      requestAnimationFrame(animate);
      return;
    }
    // console.log("Animating frame, time:", time);

    // Only increment time if not paused
    if (!paused) {
      time += speed;
    } 
    
    if (time >= tempData.length) {
      time = 0;
      lastSpawnedIndex = -1;
      particles = [];
    }

    ctx.clearRect(0, 0, cv.width, cv.height);

    const paddingX = 0; // Edge to edge
    const graphWidth = cv.width - paddingX * 2;
    const scaleY = 225; // Increased by 50% (was 150)
    const centerY = cv.height / 2;
    const currentIndex = Math.floor(time);

    // 1. Draw Trend Line
    ctx.beginPath();
    ctx.moveTo(paddingX, centerY);

    let finalX = paddingX;
    for (let i = 0; i <= currentIndex; i++) {
      const d = tempData[i];
      const lx = paddingX + (i / tempData.length) * graphWidth;
      const ly = centerY - d.anomaly * scaleY;
      ctx.lineTo(lx, ly);
      finalX = lx;
    }

    ctx.lineTo(finalX, centerY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 2. Spawn History (only when not paused)
    if (!paused && currentIndex > lastSpawnedIndex) {
      for (let i = lastSpawnedIndex + 1; i <= currentIndex; i++) {
        const data = tempData[i];
        if (!data) continue;

        const px = paddingX + (i / tempData.length) * graphWidth;
        const py = centerY - data.anomaly * scaleY;

        const intensity = Math.max(2, Math.abs(data.anomaly) * 5);
        const count = 2 + Math.floor(Math.random() * intensity);

        for (let p = 0; p < count; p++) {
          particles.push(new PillarParticle(px, centerY, py, data.anomaly));
        }
      }
      lastSpawnedIndex = currentIndex;
    }

    // 3. Update Particles (always animate existing particles)
    for (let i = 0; i < particles.length; i++) {
      if (!paused) {
        particles[i].update();
      }
      particles[i].draw();
    }

    // 4. Draw Head Dot
    const data = tempData[currentIndex];
    if (data) {
      const hx = paddingX + (currentIndex / tempData.length) * graphWidth;
      const hy = centerY - data.anomaly * scaleY;

      ctx.fillStyle = "#fff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#fff";
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      updateUI(data);
    }

    requestAnimationFrame(animate);
  }

  console.log("Starting animation loop...");
  animate();
}

// Run immediately if DOM is ready, otherwise wait
console.log("Script loaded, readyState:", document.readyState);
if (document.readyState === 'loading') {
  console.log("DOM still loading, adding event listener");
  document.addEventListener('DOMContentLoaded', initVisualization);
} else {
  console.log("DOM already loaded, running immediately");
  initVisualization();
}