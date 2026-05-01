# Fuse

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live Site](https://img.shields.io/badge/live-dr.eamer.dev-brightgreen)](https://dr.eamer.dev/datavis/poems/fuse/)

NASA GISTEMP global temperature anomaly data from 1880 to 2025, rendered as a particle system. It starts measured and cold. It does not stay that way.

## What it does

Each monthly temperature reading spawns particles whose color and physics are driven by the anomaly value for that month. Cool anomalies produce slow, blue-tinted particles that drift downward. Warm anomalies produce fast, orange-to-red particles that surge upward. The current year and temperature reading are displayed large in the center.

The animation plays forward through 140+ years of data. You can control the speed, pause to examine a specific period, or reset to 1880 and watch it unfold again. The shift from the pre-1950 baseline to the 2000s–2020s is obvious, and it gets more obvious as the particle behavior changes.

## Color encoding

| Anomaly | Color |
|---------|-------|
| Below 0°C | Ice blue |
| 0°C – 0.5°C | Warm white/yellow |
| Above 0.5°C | Deep red to orange |

## Controls

| Control | Function |
|---------|----------|
| Speed slider | 0.1x to 2.0x playback |
| Play/Pause | Hold on a specific year |
| Reset | Restart from 1880 |
| ? button | About modal with data links |

## Stack

- Vanilla JavaScript, Canvas API
- Particle system with temperature-driven physics (velocity, color, glow)
- NASA GISTEMP CSV loaded and cached locally (no CORS proxy)
- Helvetica Neue for clean, neutral UI text
- Font Awesome for playback icons

## Files

```
fuse/
├── index.html      # HTML shell and styles
├── script.js       # Particle system, data loading, controls
├── nasa-data.csv   # Local copy of NASA GISTEMP GLB.Ts+dSST.csv
└── social-card.png # 1200x630 Open Graph image
```

## Updating the data

NASA publishes updated monthly figures. To pull the latest:

```bash
curl -s "https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv" > nasa-data.csv
```

## Data source

[NASA GISS Surface Temperature Analysis (GISTEMP v4)](https://data.giss.nasa.gov/gistemp/)
Dataset: `GLB.Ts+dSST.csv`, global mean surface temperature anomalies, monthly, 1880–present.

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly may hit CORS restrictions on the CSV. Use the server.

## Author

Luke Steuber · [lukesteuber.com](https://lukesteuber.com) · [@lukesteuber.com](https://bsky.app/profile/lukesteuber.com) on Bluesky

Part of the [data poems collection](https://dr.eamer.dev/datavis/poems/) at dr.eamer.dev.

## License

MIT
