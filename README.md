# FUSE

Interactive visualization of NASA GISTEMP global temperature anomaly data from 1880-2025.

## What It Does

Shows 140+ years of climate data as a particle system. Starts in the ice age and progresses through warming phases, with particle colors and behaviors changing based on temperature anomalies.

## Changes from Ice to Flames

1. **Title**: "ICE TO FLAMES" → "FUSE"
2. **Color Effect**: Moved dynamic color/glow from year display to temperature indicator
   - Year display stays neutral (white, 0.25 opacity, no glow)
   - Temperature gets full color treatment (ice blue → warm yellow → fire red with dynamic shadows)

## Features

- **NASA GISTEMP data**: Served locally from nasa-data.csv (updated monthly from NASA)
- **Local caching**: Stores data in localStorage for faster loads
- **Fallback data**: Embedded annual averages if fetch fails
- **Speed control**: Playback speed from 0.1x to 2.0x
- **Particle physics**: Temperature-based behavior (rising heat, falling cold)
- **Color coding**:
  - Ice blue (< 0°C anomaly)
  - Warm yellow (0°C - 0.5°C)
  - Fire red/white (> 0.5°C)

## Technical Stack

- **Vanilla JavaScript**: No frameworks
- **Canvas API**: Hardware-accelerated particle rendering
- **NASA GISTEMP**: GLB.Ts+dSST.csv dataset (local copy)

## Files

- `index.html` - Complete single-file application (HTML + embedded CSS + script reference)
- `script.js` - Visualization logic, data fetching, particle system
- `nasa-data.csv` - Local copy of NASA GISTEMP data (148 years, monthly)
- `README.md` - This file

## Updating NASA Data

To update with the latest temperature data:

```bash
curl -s "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv" > nasa-data.csv
```

## Local Development

Simply serve the directory with any HTTP server:

```bash
python3 -m http.server 8000
# Visit http://localhost:8000
```

Or open `index.html` directly in a browser (may have CORS restrictions).

## Data Source

NASA Goddard Institute for Space Studies (GISS)
https://data.giss.nasa.gov/gistemp/

## Author

Luke Steuber
https://lukesteuber.com
