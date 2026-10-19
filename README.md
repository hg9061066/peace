# Peace &middot; Soft Romantic Indie Vinyl

A dreamy retro turntable web application designed for romantic Pakistani and Indian indie music lovers. Built with pure HTML, CSS, and modern JavaScript with no backend and no API key required.

![Ambiance](assets/scene_bg.jpg)

## Features

- **Soft Visual Scene**: Atmospheric twilight ambiance with subtle camera breathe animations and real-time floating warm bokeh particles on HTML5 canvas.
- **Peace Indie Playlist**: Default 24-track curated collection from playlist [PLexDPGLDp4lQ](https://youtube.com/playlist?list=PLexDPGLDp4lQ) featuring:
  - *Maanu x Annural Khalid* (Jhol, Jhol Acoustic)
  - *Faheem Abdullah & Rauhan Malik* (ISHQ, Ishq Lyrical, Ehsaas, Ehsaas Acoustic)
  - *Aashir Wajahat, Nayel & Nehaal Naseem* (Sadqay)
  - *Abdul Hannan & Rovalio* (Iraaday, Bikhra)
  - *Sheheryar Rehan x Zoha Waseem* (Majboor)
  - *The PropheC* (Kina Chir), *Dikshant* (Aankhon Se Batana), *Arjun Kanungo* (Aaya Na Tu, Ek Dafaa), *AUR* (Chal Diye Tum Kahan), *Manan Bhardwaj* (Chitta), and more.
- **Realistic Turntable Physics**:
  - Vinyl record spins when playing with iridescent concentric microgrooves and watercolor center label.
  - Realistic metallic tonearm moves into place when music starts and lifts away when paused.
  - Real-time animated audio visualizer waves.
- **Mood Ambiance & Rain**:
  - **3 Visual Themes**: *Twilight Cafe*, *Rose Sunset*, and *Midnight Sukoon*.
  - **Rain Ambiance**: Toggle soft gentle rain white-noise sounds to accompany the music.
- **Interactive Controls & Search**:
  - Quick category filtering: *All Songs*, *Pakistani Indie*, *Indian Indie*, *Coke Studio*.
  - Instant search by title, artist, or romantic mood.
  - Custom YouTube playlist loader with 1-click restore to default Peace playlist.
  - Keyboard shortcuts (`Space`: Play/Pause, `Arrow Left/Right`: Prev/Next).
  - Native lockscreen and system media key support via MediaSession API.

## Running Locally

Run with the local development server (with built-in anti-caching headers):
```bash
python serve.py
```
Or standard Python HTTP server:
```bash
python -m http.server 8000
```
Open [http://localhost:8000](http://localhost:8000) in your browser.
