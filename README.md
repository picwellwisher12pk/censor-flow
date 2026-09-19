# 🛡️ CensorFlow

**Smart Video & Audio Censorship, Redaction & Auto-Skip Studio**

🌐 **Live Web Studio**: [https://picwellwisher12pk.github.io/censor-flow/](https://picwellwisher12pk.github.io/censor-flow/)

CensorFlow is a versatile, cross-platform studio for creating, managing, and applying dynamic content redactions (blur, pixelate, blackout, mute, bleep, and **auto-scene skipping**) to video and audio files using a standardized portable metadata format (`.censor.json`).

---

## ✨ Features

- **Dual Modes:**
  - 👨‍👩‍👧 **Family Viewer Mode:** Clean playback interface with user-selectable filtering rules (*"Auto-skip graphic scenes"*, *"Bleep profanity"*, *"Blur explicit areas"*).
  - 🎬 **Creator Studio Mode:** Multi-track timeline, interactive canvas bounding box drawing on video frames, frame stepping, and cue management.
- **Dynamic Redaction Actions:**
  - **Video:** Gaussian Blur (custom radius), Pixelate/Mosaic (custom block size), Solid Blackout Mask.
  - **Audio:** 1000 Hz Bleep Tone synthesis, Complete Mute (de-clicked smooth volume ramp), Volume Ducking (-80%).
  - **⚡ Scene Skipping (Jumping):** Automatically and seamlessly seeks past violent/graphic scenes during playback, with upcoming skip warnings and manual *"Skip Now"* buttons.
- **Multi-Track Scrubbable Timeline:**
  - Dedicated **Skip Track**, **Video Mask Track**, **Audio Censor Track with Waveform**, and **Subtitles Track**.
  - Interactive playhead with 60fps frame-synced motion, zoom controls (1x to 4x), cue dragging, and left/right handle trimming.
- **Audio Waveform Visualization:**
  - Real-time hardware-accelerated waveform peaks rendered on the audio channel track to easily align audio dialogue and censorship cues visually.
- **Corner Exact Timecode Overlay:**
  - Sleek, broadcast-style millisecond timecode badge in the bottom-left corner of the video.
- **Subtitle Synchronization & Editing Suite:**
  - Load `.srt` and `.vtt` files, adjust timing with 1-click **"Snap to Playhead"**, nudge by `±100ms/±500ms`, fix framerate drift with **2-Point Progressive Calibration**, and export corrected subtitle files.
  - Bridge to Censorship: One-click profanity detector scans subtitles and auto-generates bleep/mute timeline cues.
- **Interactive Canvas Drawing:**
  - Click and drag directly on the video viewport to draw bounding boxes around faces, sensitive areas, or license plates.
- **Built-in Demo Generator:**
  - One-click synthetic test video generator with moving targets and synthesized audio tones to test all features immediately without loading external files.
- **FFmpeg Hard-Burn Exporter:**
  - Automatically compiles all cues and skip intervals into an executable FFmpeg command (`select`, `aselect`, `boxblur`, `drawbox`, `volume`) to permanently bake redactions into a master MP4.
- **Offline Subtitle / AI Scanner:**
  - Scan SRT subtitle files for inappropriate language and auto-generate frame-accurate bleep/mute markers locally without sending data to third parties.

---

## 🚀 Quick Start

Ensure you have [Bun](https://bun.sh/) installed.

```powershell
# Navigate to the project directory
cd c:\Users\amir\Documents\Projects\Personal\censor-flow

# Install dependencies
bun install

# Start the local development server
bun dev
```

Visit `http://localhost:5173` in your browser.

### Run Tests
```powershell
bun test
```

### Build for Production
```powershell
bun run build
```

---

## 📄 The `.censor.json` Specification

CensorFlow uses a human-readable JSON sidecar format:

```jsonc
{
  "$schema": "https://censorflow.dev/schema/v1.json",
  "version": "1.0",
  "metadata": {
    "title": "Action Movie Trailer (Family Edit)",
    "durationMs": 45000,
    "fps": 30,
    "sourceFile": "sample.mp4"
  },
  "cues": [
    {
      "id": "cue-skip-1",
      "type": "skip",
      "action": "skip",
      "startMs": 8000,
      "endMs": 13000,
      "category": "violence",
      "severity": "high",
      "label": "Graphic combat sequence",
      "reason": "Contains intense physical violence and blood splatter",
      "enabled": true
    },
    {
      "id": "cue-audio-1",
      "type": "audio",
      "action": "bleep",
      "startMs": 16500,
      "endMs": 17800,
      "category": "profanity",
      "severity": "medium",
      "label": "Expletive in dialogue",
      "enabled": true
    },
    {
      "id": "cue-video-1",
      "type": "video",
      "action": "blur",
      "startMs": 22000,
      "endMs": 28000,
      "category": "nudity",
      "severity": "high",
      "enabled": true,
      "box": { "x": 0.35, "y": 0.25, "w": 0.30, "h": 0.45 },
      "params": { "blurRadius": 30 }
    }
  ]
}
```

---

## 🎬 Working with Cues: Add, Change & Remove

CensorFlow provides two operational modes via the toggle in the top navigation bar:
* **Family Mode** (Default viewer mode): Intended for clean playback. It actively enforces censorship rules in real time (automatically jumping over skipped scenes, blurring video masks, and bleeping audio) while locking editing controls to prevent accidental modifications.
* **Studio Editor**: Full non-linear editing workspace. Clicking any cue on the timeline, drawing on the video, or clicking any "Add" button automatically activates Studio Editor and opens editing controls.

### 1. Adding Cues (Skips, Masks, Bleeps)

* **Timeline Toolbar Buttons**: Click **`+ Skip`**, **`+ Mask`**, or **`+ Bleep`** directly on the timeline toolbar (above the tracks) to create a cue at the current playhead position.
* **Direct Video Canvas Drawing**: Click **`+ Blur Box`** (or press `V`), then click and drag across any region of the video player to draw a precise bounding box over faces, text, or sensitive objects.
* **Keyboard Hotkeys**:
  * `S` → Insert a **3s Scene Skip** at the playhead.
  * `V` → Insert a **3s Video Mask (Blur)** at the playhead.
  * `M` → Insert a **1.5s Audio Bleep / Mute** at the playhead.
* **AI / Subtitle Auto-Scanner**: Click **AI Scanner** in the top bar to scan subtitle transcripts (`.srt`) or audio text for profanity and sensitive keywords, automatically generating frame-accurate timeline cues.

### 2. Changing & Adjusting Cues

1. **Select a Cue**: Click any cue block on the timeline. It highlights in white, shows drag handles, and opens the **Cue Inspector** sidebar on the right.
2. **Trim Duration**: Hover over the left or right edge of the cue block until the resize cursor `⟷` appears, then drag to trim start or end times with frame accuracy.
3. **Move / Slide Timing**: Click and drag the center of the cue block along the timeline to reposition it earlier or later.
4. **Millisecond-Exact Timestamps**: Enter explicit `Start Time (ms)` and `End Time (ms)` in the Cue Inspector sidebar.
5. **Adjust Redaction Parameters**:
   * **Video Masks**: Switch effect between *Gaussian Blur*, *Pixelation / Mosaic*, or *Black Box Cutout*, and adjust blur radius or box bounds.
   * **Audio Cues**: Switch action between *Mute* (silence) and *Bleep* (1 kHz tone).
   * **Metadata**: Update Category (*Violence*, *Nudity*, *Profanity*, *Gore*), Severity (*Low*, *Medium*, *High*, *Critical*), and scene notes.

### 3. Removing / Deleting Cues

* **Inline Trash Button**: Click any cue to select it, then click the red **trash can icon** that appears directly on the block.
* **Keyboard**: Select any cue and press `Delete` or `Backspace`.
* **Inspector Sidebar**: Click the `···` options menu or the delete button in the Cue Inspector sidebar.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Left Arrow` / `Right Arrow` | Seek 5 seconds backward / forward |
| `Shift + Left` / `Shift + Right` | Seek 10 seconds backward / forward |
| `,` (Comma) / `.` (Period) | Frame step backward / forward (~33.3ms) |
| `S` | Quick add **Skip Scene** cue at playhead |
| `V` | Quick add **Video Mask** cue at playhead |
| `M` | Quick add **Audio Bleep / Mute** cue at playhead |
| `Delete` / `Backspace` | Delete selected cue |
| `Scroll Wheel` (over timeline) | Smooth timeline pan / horizontal scrub |
| `Zoom Presets` | Fit (1x), 32x, 128x, up to **256x** second/frame level |

---

## 🖥️ Packaging as Desktop App (Tauri)

To distribute CensorFlow as a native Windows `.exe` / macOS `.app`:
```powershell
# Install Tauri CLI & initialize
bun add -d @tauri-apps/cli
bunx tauri init

# Run in desktop development window
bun run tauri dev

# Build production installer / executable
bun run tauri build
```

The compiled binaries and installers are output to:
* **Standalone Executable**: `src-tauri\target\release\censor-flow.exe`
* **NSIS Windows Setup Installer**: `src-tauri\target\release\bundle\nsis\censor-flow_0.1.0_x64-setup.exe`
* **MSI Enterprise Package**: `src-tauri\target\release\bundle\msi\censor-flow_0.1.0_x64_en-US.msi`

