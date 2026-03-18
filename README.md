MediaQC – Intelligent Media Review Tool
MediaQC is a browser‑based application for rapid manual review of image and video datasets. It provides a clean, keyboard‑first interface to help you efficiently score media items (good/bad) after importing a CSV file. Perfect for quality assurance, data cleaning, or annotation projects.

📂 CSV Import – Drag & drop or click to upload any CSV file.

🧠 Smart Column Mapping – Automatically suggests ID and media URL columns.

🖼️ Image & Video Support – Displays images inline; videos with playback controls, speed adjustment, and autoplay.

🎲 Random Batch Sampling – Review a random subset of your data; generate new batches on the fly.

⌨️ Keyboard‑First Workflow – Navigate and score without touching the mouse.

📊 Live Statistics – Track progress, good/bad counts per batch.

📤 Export Filtered CSVs – Export full dataset, only good, or only bad items with results appended.

🌙 Dark Theme – Easy on the eyes for long review sessions.

Getting Started
1. Download the Files
Place the three files in the same folder:

mediaqc.html

mediaqc.css

mediaqc.js

2. Open the Application
Double‑click mediaqc.html to open it in any modern browser (Chrome, Firefox, Edge, Safari). No server or installation required – everything runs locally in your browser.

3. Import Your CSV
Click the Import CSV button or drag a CSV file onto the landing page.

The CSV must contain at least a header row and one data row.

The tool works with any column structure – you will map the important columns in the next step.

4. Configure the Dataset
After loading, the configuration screen appears:

ID Column – Select the column that uniquely identifies each media item.

Media URL Column – Select the column containing image/video URLs (local paths or web URLs).

Media Type – Choose auto‑detect (based on file extension), or force image/video only.

Extra Columns – Check any additional columns you want to display during review.

Random QC Batch – Enable random sampling and set the batch size.

Click Start Review to begin.

Review Interface
The screen is split into two main areas:

Left Panel – Shows batch progress, statistics, current item metadata, keyboard shortcuts, and export buttons.

Right Viewer – Displays the media, current item ID, and scoring buttons.

Scoring
Click Good or Bad (or press G / B on your keyboard).

After scoring, the app automatically advances to the next item (configurable auto‑advance delay).

A coloured flash confirms your choice.

Navigation
Use the ← and → buttons, or the left/right arrow keys.

For videos, holding Ctrl while pressing arrow keys navigates between items (default behaviour is seeking ±5 seconds).

Use the Go to item input to jump to a specific index within the current batch (press Enter or click away).

Random Mode
Toggle Random Mode on/off at any time using the switch in the left panel.

When enabled, you can set a batch size and click New Random QC Batch to pull a fresh random sample of unreviewed items.

The “✨ Random” badge appears next to the item ID when in random mode.

Video Controls
Playback speed – 0.5×, 1×, 1.5×, 2×.

Autoplay toggle – when on, videos start playing automatically.

Seek – Left/right arrow keys seek ±5 seconds.

Space – Play/pause.

Keyboard Shortcuts
Key(s)	Action
G	Mark current item as Good
B	Mark current item as Bad
N	Generate new random batch (random mode only)
← / →	Previous/next item (for images)
Ctrl + ← / Ctrl + →	Previous/next item (for videos)
← / → (video)	Seek backward/forward 5 seconds
Space (video)	Play / pause
ℹ️ When an input field (e.g., the “Go to item” box) has focus, keyboard shortcuts are disabled so you can type numbers. Click elsewhere to re‑enable shortcuts.

Exporting Results
After scoring, you can export CSV files with an extra result column appended:

Full CSV – All rows, with results where available.

Good CSV – Only rows marked as good.

Bad CSV – Only rows marked as bad.

Exported files are named like mediaqc_full_2025-03-18T14-30-15.csv and include the original headers plus the result column.

File Structure
text
/mediaqc
├── mediaqc.html      # Main HTML structure
├── mediaqc.css       # All styles (dark theme, layout)
└── mediaqc.js        # Application logic
No build step, no dependencies – just static files.

Browser Compatibility
Chrome / Edge (latest)

Firefox (latest)

Safari (latest)

Works on desktop and tablet; responsive layout collapses left panel on narrow screens.

Tips
For local files, use file:// URLs or host your media on a local server.

Large batches (thousands of items) work fine; the UI stays responsive.

Use the random mode to spot‑check a dataset without reviewing everything.

Acknowledgements
Built with vanilla JavaScript, CSS, and HTML.

Fonts: Inter, Bebas Neue, JetBrains Mono.

Icons via inline SVG.

Happy reviewing! 🎞️✅

