    // ========== STATE ==========
    let rawData = [];
    let headers = [];
    let dataset = [];
    let results = {};           // id -> 'good'|'bad'
    let currentBatch = [];       // array of indices for the current batch
    let currentBatchIndex = 0;   // position within currentBatch
    let config = {
    idIdx: 0,
    urlIdx: 1,
    extraIdxs: [],
    mediaType: 'auto'
    };
    let autoplay = true;
    let currentVideo = null;
    let autoAdvanceTimer = null;
    let randomMode = false;       // dynamic random mode (can be toggled)
    let sampleSize = 10;          // from config input
    let resultColIdx = -1;        // index of 'result' column if present

    // DOM elements
    const landingPage = document.getElementById('landing-page');
    const configScreen = document.getElementById('config-screen');
    const reviewScreen = document.getElementById('review-screen');
    const fileInput = document.getElementById('fileInput');
    const landingFile = document.getElementById('landing-file');
    const landingDropzone = document.getElementById('landing-dropzone');
    const uploadBtn = document.getElementById('uploadBtn');
    const previewTable = document.getElementById('previewTable');
    const idSelect = document.getElementById('idSelect');
    const urlSelect = document.getElementById('urlSelect');
    const extraFields = document.getElementById('extraFields');
    const randomCheck = document.getElementById('randomCheck');
    const sampleSizeInput = document.getElementById('sampleSize');
    const mainImage = document.getElementById('mainImage');
    const mainVideo = document.getElementById('mainVideo');
    const videoBar = document.getElementById('videoBar');
    const flashBadge = document.getElementById('flashBadge');
    const toastEl = document.getElementById('toast');
    const autoplaySwitch = document.getElementById('autoplaySwitch');
    const metaId = document.getElementById('metaId');
    const metaUrl = document.getElementById('metaUrl');
    const extraMeta = document.getElementById('extraMeta');
    const verdictChip = document.getElementById('verdictChip');
    const viewerChip = document.getElementById('viewerChip');
    const viewerId = document.getElementById('viewerId');
    const idText = document.getElementById('idText');
    const randomIndicator = document.getElementById('randomIndicator');
    const gotoIndex = document.getElementById('gotoIndex');
    const itemCount = document.getElementById('itemCount');
    const statTotal = document.getElementById('statTotal');
    const statReviewed = document.getElementById('statReviewed');
    const statGood = document.getElementById('statGood');
    const statBad = document.getElementById('statBad');
    const progressFill = document.getElementById('progressFill');
    const shortcutsPanel = document.getElementById('shortcutsPanel');
    const newBatchBtn = document.getElementById('newBatchBtn');
    const randomModeToggle = document.getElementById('randomModeToggle');
    const randomModeSwitch = document.getElementById('randomModeSwitch');
    const randomSizeControl = document.getElementById('randomSizeControl');
    const dynamicSampleSize = document.getElementById('dynamicSampleSize');
    const btnGood = document.getElementById('btnGood');
    const btnBad = document.getElementById('btnBad');
    const reviewPanel = document.getElementById('reviewPanel');

    // ========== MOBILE PANEL TOGGLE ==========
    window.toggleMobilePanel = function() {
    reviewPanel.classList.toggle('show-mobile');
    };

    // Close panel when clicking outside (optional)
    document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900) {
        if (!reviewPanel.contains(e.target) && !e.target.closest('.mobile-menu-btn')) {
        reviewPanel.classList.remove('show-mobile');
        }
    }
    });

    // ========== CSV PARSER ==========
    function parseCSV(text) {
    const lines = [];
    let current = [];
    let field = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
        if (inQuote && text[i+1] === '"') { field += '"'; i++; }
        else inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
        current.push(field.trim()); field = '';
        } else if ((ch === '\n' || ch === '\r') && !inQuote) {
        if (field.trim() || current.length) { current.push(field.trim()); field = ''; }
        if (current.length) lines.push(current.slice());
        current = [];
        if (ch === '\r' && text[i+1] === '\n') i++;
        } else { field += ch; }
    }
    if (field.trim() || current.length) { current.push(field.trim()); lines.push(current); }
    return lines.filter(l => l.some(f => f));
    }

    // ========== LOAD FILE ==========
    function loadCSV(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const text = ev.target.result;
        const lines = parseCSV(text);
        if (lines.length < 2) { toast('CSV must have at least a header row and one data row'); return; }
        headers = lines[0].map(h => h.trim());
        rawData = lines.slice(1).map(row => {
        while (row.length < headers.length) row.push('');
        return row;
        });
        if (rawData.length === 0) { toast('No valid data rows'); return; }

        // Detect result column (case-insensitive)
        resultColIdx = headers.findIndex(h => h.toLowerCase() === 'result');
        if (resultColIdx !== -1) {
        toast('ℹ️ Existing "result" column detected – pre-loading reviews');
        }

        fileInput.value = '';
        landingFile.value = '';
        showConfig();
    };
    reader.readAsText(file);
    }

    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadCSV(e.target.files[0]); });
    landingFile.addEventListener('change', (e) => { if (e.target.files[0]) loadCSV(e.target.files[0]); });

    landingDropzone.addEventListener('click', () => landingFile.click());
    landingDropzone.addEventListener('dragover', (e) => { e.preventDefault(); landingDropzone.classList.add('drag-over'); });
    landingDropzone.addEventListener('dragleave', () => landingDropzone.classList.remove('drag-over'));
    landingDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    landingDropzone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) loadCSV(f);
    else toast('Please drop a .csv file');
    });

    randomCheck.addEventListener('change', () => {
    sampleSizeInput.disabled = !randomCheck.checked;
    });

    // ========== CONFIG SCREEN ==========
    function showConfig() {
    landingPage.style.display = 'none';
    configScreen.style.display = 'flex';

    idSelect.innerHTML = headers.map((h,i) => `<option value="${i}">${h}</option>`).join('');
    urlSelect.innerHTML = headers.map((h,i) => `<option value="${i}">${h}</option>`).join('');
    const idIdx = headers.findIndex(h => /^id$|^_id$|^key$|^index$|^name$/i.test(h));
    if (idIdx >= 0) idSelect.value = idIdx;
    const urlIdx = headers.findIndex(h => /url|src|link|image|video|media|path|file/i.test(h));
    if (urlIdx >= 0) urlSelect.value = urlIdx;
    else if (headers.length > 1) urlSelect.value = 1;

    extraFields.innerHTML = '';
    headers.forEach((h,i) => {
        // Don't show result column as extra field (optional)
        if (i === resultColIdx) return; // skip result column from extra fields
        const lbl = document.createElement('label');
        lbl.innerHTML = `<input type="checkbox" value="${i}"> ${h}`;
        extraFields.appendChild(lbl);
    });

    let html = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    rawData.slice(0,8).forEach(row => {
        html += '<tr>' + row.map(cell => `<td title="${cell}">${cell.length>20 ? cell.slice(0,17)+'…' : cell}</td>`).join('') + '</tr>';
    });
    html += '</tbody>';
    previewTable.innerHTML = html;

    randomCheck.checked = false;
    sampleSizeInput.disabled = true;
    sampleSizeInput.value = 10;
    }

    window.hideConfig = () => {
    configScreen.style.display = 'none';
    landingPage.style.display = 'flex';
    };

    // ========== START REVIEW ==========
    window.startReview = function() {
    config.idIdx = parseInt(idSelect.value);
    config.urlIdx = parseInt(urlSelect.value);
    config.extraIdxs = Array.from(extraFields.querySelectorAll('input:checked')).map(cb => parseInt(cb.value));
    config.mediaType = document.querySelector('input[name="mediaType"]:checked').value;

    dataset = rawData.map(row => {
        const obj = { id: row[config.idIdx] || '?', url: row[config.urlIdx] || '', extra: {} };
        config.extraIdxs.forEach(idx => { obj.extra[headers[idx]] = row[idx] || ''; });
        return obj;
    }).filter(item => item.url);

    if (dataset.length === 0) { toast('No valid media URLs found'); return; }

    // Initialize results from existing result column if present
    results = {};
    if (resultColIdx !== -1) {
        rawData.forEach((row, index) => {
        const id = row[config.idIdx];
        if (id) {
            const resultVal = row[resultColIdx] ? row[resultColIdx].trim().toLowerCase() : '';
            if (resultVal === 'good' || resultVal === 'bad') {
            results[id] = resultVal;
            }
        }
        });
        const loadedCount = Object.keys(results).length;
        if (loadedCount > 0) toast(`✅ Loaded ${loadedCount} existing reviews`);
    }

    sampleSize = parseInt(sampleSizeInput.value) || 10;
    randomMode = randomCheck.checked; // initial mode from config

    if (randomMode) {
        newRandomBatch();
        newBatchBtn.style.display = 'block';
        randomSizeControl.style.display = 'flex';
    } else {
        // Sequential mode: only include unreviewed items
        currentBatch = [];
        dataset.forEach((item, idx) => {
        if (!results[item.id]) currentBatch.push(idx);
        });
        currentBatchIndex = 0;
        if (currentBatch.length === 0) {
        toast('🎉 All items already reviewed!');
        // fallback: include all items? or stay empty?
        currentBatch = Array.from({ length: dataset.length }, (_, i) => i);
        }
        newBatchBtn.style.display = 'none';
        randomSizeControl.style.display = 'none';
    }

    // Set toggle UI
    randomModeSwitch.classList.toggle('on', randomMode);

    configScreen.style.display = 'none';
    reviewScreen.style.display = 'grid';
    updateShortcuts();
    render();
    updateStats();
    itemCount.textContent = currentBatch.length;
    gotoIndex.max = currentBatch.length;
    gotoIndex.value = currentBatchIndex + 1;
    };

    // ========== TOGGLE RANDOM MODE ==========
    randomModeToggle.addEventListener('click', () => {
    randomMode = !randomMode;
    randomModeSwitch.classList.toggle('on', randomMode);

    if (randomMode) {
        // Switching to random mode: generate a random batch
        newRandomBatch();
        newBatchBtn.style.display = 'block';
        randomSizeControl.style.display = 'flex';
        toast('✨ Random mode activated');
    } else {
        // Switching to sequential mode: set batch to all unreviewed items
        currentBatch = [];
        dataset.forEach((item, idx) => {
        if (!results[item.id]) currentBatch.push(idx);
        });
        if (currentBatch.length === 0) currentBatch = Array.from({ length: dataset.length }, (_, i) => i);
        currentBatchIndex = Math.min(currentBatchIndex, currentBatch.length - 1);
        newBatchBtn.style.display = 'none';
        randomSizeControl.style.display = 'none';
        toast('📋 Sequential mode activated');
    }
    itemCount.textContent = currentBatch.length;
    gotoIndex.max = currentBatch.length;
    gotoIndex.value = currentBatchIndex + 1;
    render();
    updateStats();
    updateShortcuts();
    });

    // ========== NEW RANDOM BATCH ==========
    window.newRandomBatch = function() {
    if (!dataset.length) return;
    let unreviewed = [];
    for (let i = 0; i < dataset.length; i++) {
        const id = dataset[i].id;
        if (!results[id]) unreviewed.push(i);
    }
    if (unreviewed.length === 0) {
        toast('🎉 All items have been reviewed!');
        return;
    }
    // Use the dynamic batch size input
    let desiredSize = parseInt(dynamicSampleSize.value);
    if (isNaN(desiredSize) || desiredSize < 1) desiredSize = 1;
    const size = Math.min(desiredSize, unreviewed.length);
    let shuffled = [...unreviewed];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    currentBatch = shuffled.slice(0, size);
    currentBatchIndex = 0;
    render();
    updateStats();
    itemCount.textContent = currentBatch.length;
    gotoIndex.max = currentBatch.length;
    gotoIndex.value = currentBatchIndex + 1;
    toast(`✨ New random batch of ${size} items`);
    };

    // ========== GO TO INDEX ==========
    function goToIndex() {
    if (!currentBatch.length) return;
    let idx = parseInt(gotoIndex.value);
    if (isNaN(idx) || idx < 1) idx = 1;
    if (idx > currentBatch.length) idx = currentBatch.length;
    gotoIndex.value = idx; // correct if out of range
    const newIndex = idx - 1;
    if (newIndex !== currentBatchIndex) {
        currentBatchIndex = newIndex;
        render();
    }
    }

    gotoIndex.addEventListener('change', goToIndex);
    gotoIndex.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        goToIndex();
    }
    });

    // ========== RENDER ==========
    function render() {
    if (!dataset.length || currentBatch.length === 0) return;
    const actualIdx = currentBatch[currentBatchIndex];
    const item = dataset[actualIdx];
    const verdict = results[item.id];

    idText.textContent = item.id;
    // Show random indicator if in random mode
    randomIndicator.style.display = randomMode ? 'inline-flex' : 'none';

    viewerChip.className = `verdict-chip chip-${verdict ? (verdict==='good'?'good':'bad') : 'none'}`;
    viewerChip.textContent = verdict ? (verdict==='good'?'✓ Good':'✗ Bad') : 'Unreviewed';

    metaId.textContent = item.id;
    metaUrl.textContent = item.url.length > 40 ? item.url.slice(0,37)+'…' : item.url;
    let extraHtml = '';
    Object.entries(item.extra).forEach(([k,v]) => {
        if (v) extraHtml += `<div class="meta-row"><div class="meta-key">${k}</div><div class="meta-value">${v}</div></div>`;
    });
    extraMeta.innerHTML = extraHtml;

    verdictChip.className = `verdict-chip chip-${verdict ? (verdict==='good'?'good':'bad') : 'none'}`;
    verdictChip.textContent = verdict ? (verdict==='good'?'✓ Good':'✗ Bad') : 'Unreviewed';

    // Update button selected states
    btnGood.classList.toggle('selected', verdict === 'good');
    btnBad.classList.toggle('selected', verdict === 'bad');

    // Update goto input
    gotoIndex.value = currentBatchIndex + 1;

    const isVideo = config.mediaType === 'video' ? true :
                    (config.mediaType === 'image' ? false :
                    /\.(mp4|webm|ogg|mov|m4v|avi)(\?|$)/i.test(item.url));

    if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = '';
        currentVideo.load();
    }
    mainImage.style.display = 'none';
    mainVideo.style.display = 'none';
    videoBar.classList.remove('show');
    currentVideo = null;

    if (isVideo) {
        mainVideo.style.display = 'block';
        mainVideo.src = item.url;
        mainVideo.load();
        videoBar.classList.add('show');
        currentVideo = mainVideo;
        const activeSpeed = document.querySelector('.speed-btn.active');
        if (activeSpeed) mainVideo.playbackRate = parseFloat(activeSpeed.dataset.speed);
        if (autoplay) mainVideo.play().catch(() => {});
    } else {
        mainImage.style.display = 'block';
        mainImage.src = item.url;
    }

    updateShortcuts();
    }

    // ========== NAVIGATION ==========
    window.navigate = function(delta) {
    const newIdx = currentBatchIndex + delta;
    if (newIdx >= 0 && newIdx < currentBatch.length) {
        currentBatchIndex = newIdx;
        render();
    }
    };

    // ========== MARK ==========
    window.mark = function(verdict) {
    if (!dataset.length || currentBatch.length === 0) return;
    clearTimeout(autoAdvanceTimer);
    const actualIdx = currentBatch[currentBatchIndex];
    const id = dataset[actualIdx].id;
    results[id] = verdict;

    flashBadge.textContent = verdict === 'good' ? '✓ Good' : '✗ Bad';
    flashBadge.className = `flash-badge show ${verdict==='bad'?'bad':''}`;
    setTimeout(() => flashBadge.classList.remove('show'), 400);

    if (currentBatchIndex < currentBatch.length - 1) {
        autoAdvanceTimer = setTimeout(() => {
        currentBatchIndex++;
        render();
        }, 320);
    } else {
        // end of batch
        const unreviewedCount = dataset.reduce((acc, item, idx) => acc + (results[item.id] ? 0 : 1), 0);
        if (unreviewedCount === 0) {
        toast('🎉 All items reviewed!');
        } else if (randomMode) {
        toast('✅ Batch complete. Click "New Random QC Batch" for more.');
        } else {
        toast('🎉 All items in dataset reviewed!');
        }
    }

    updateStats();
    render(); // updates button selected states and goto input
    };

    // ========== STATS ==========
    function updateStats() {
    let good = 0, bad = 0;
    currentBatch.forEach(idx => {
        const id = dataset[idx].id;
        if (results[id] === 'good') good++;
        else if (results[id] === 'bad') bad++;
    });
    const reviewed = good + bad;
    statTotal.textContent = currentBatch.length;
    statReviewed.textContent = reviewed;
    statGood.textContent = good;
    statBad.textContent = bad;
    progressFill.style.width = currentBatch.length ? (reviewed / currentBatch.length * 100) + '%' : '0%';
    }

    // ========== SHORTCUTS PANEL ==========
    function updateShortcuts() {
    const isVideo = currentVideo !== null;
    let html = '';
    html += `<div class="shortcut-row"><span>Mark Good</span><kbd>G</kbd></div>`;
    html += `<div class="shortcut-row"><span>Mark Bad</span><kbd>B</kbd></div>`;
    if (randomMode) {
        html += `<div class="shortcut-row"><span>New QC Batch</span><kbd>N</kbd></div>`;
    }
    if (isVideo) {
        html += `<div class="shortcut-row"><span>Seek ±5s</span><span><kbd>←</kbd> <kbd>→</kbd></span></div>`;
        html += `<div class="shortcut-row"><span>Navigate batch</span><span><kbd>Ctrl</kbd>+<kbd>←</kbd>/<kbd>→</kbd></span></div>`;
        html += `<div class="shortcut-row"><span>Play/Pause</span><kbd>Space</kbd></div>`;
    } else {
        html += `<div class="shortcut-row"><span>Previous</span><kbd>←</kbd></div>`;
        html += `<div class="shortcut-row"><span>Next</span><kbd>→</kbd></div>`;
    }
    shortcutsPanel.innerHTML = html;
    }

    // ========== VIDEO CONTROLS ==========
    document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (currentVideo) currentVideo.playbackRate = parseFloat(btn.dataset.speed);
    });
    });

    document.getElementById('autoplayToggle').addEventListener('click', () => {
    autoplay = !autoplay;
    autoplaySwitch.classList.toggle('on', autoplay);
    });

    // ========== KEYBOARD ==========
    document.addEventListener('keydown', (e) => {
    if (configScreen.style.display === 'flex' || landingPage.style.display !== 'none') return;
    if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) {
        if (e.target === gotoIndex) return;
    }
    const isVideo = currentVideo !== null;
    switch (e.key) {
        case 'g': case 'G': e.preventDefault(); mark('good'); break;
        case 'b': case 'B': e.preventDefault(); mark('bad'); break;
        case 'n': case 'N': e.preventDefault(); if (randomMode) newRandomBatch(); break;
        case ' ': e.preventDefault(); if (isVideo) { if (currentVideo.paused) currentVideo.play(); else currentVideo.pause(); } break;
        case 'ArrowRight': e.preventDefault(); if (e.ctrlKey || e.metaKey) navigate(1); else if (isVideo) currentVideo.currentTime += 5; else navigate(1); break;
        case 'ArrowLeft': e.preventDefault(); if (e.ctrlKey || e.metaKey) navigate(-1); else if (isVideo) currentVideo.currentTime -= 5; else navigate(-1); break;
    }
    });

    // ========== EXPORT ==========
    window.exportCSV = function(type) {
    const headerRow = [...headers, 'result'];  // always append result column
    let rows = [headerRow];

    if (type === 'full') {
        rawData.forEach((row, idx) => {
        const id = row[config.idIdx] || '';
        const result = results[id] || '';
        rows.push([...row, result]);
        });
    } else if (type === 'good') {
        rawData.forEach((row, idx) => {
        const id = row[config.idIdx] || '';
        if (results[id] === 'good') {
            rows.push([...row, 'good']);
        }
        });
    } else if (type === 'bad') {
        rawData.forEach((row, idx) => {
        const id = row[config.idIdx] || '';
        if (results[id] === 'bad') {
            rows.push([...row, 'bad']);
        }
        });
    }

    const csv = rows.map(row => row.map(cell => {
        const s = String(cell);
        return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mediaqc_${type}_${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast(`✅ Exported ${type} CSV`);
    };

    // ========== SAFE RESET (export & reload) ==========
    window.safeReset = function() {
    if (Object.keys(results).length > 0) {
        let confirmExport = confirm("You have reviewed items. Export before reset?");
        if (confirmExport) {
        exportCSV('full');   // export full data with results
        }
    }
    location.reload();
    };

    // ========== WARN ON REFRESH/F5 IF UNSAVED ==========
    window.addEventListener('beforeunload', (e) => {
    if (Object.keys(results).length > 0) {
        e.preventDefault();
        e.returnValue = "You have unsaved reviews. Are you sure you want to leave?";
    }
    });

    function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
    }
    window.toast = toast;
