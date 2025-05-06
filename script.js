document.addEventListener('DOMContentLoaded', () => {
    const previewArea = document.getElementById('preview-area');
    const sampleText = document.getElementById('sample-text');
    const sidebar = document.getElementById('sidebar');
    const sectionHeaders = document.querySelectorAll('.section-header');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const solidColorInput = document.getElementById('bg-color-solid');
    const solidHexValueSpan = document.getElementById('solid-hex-value');
    const gradientControls = document.getElementById('gradient-controls');
    const gradientStopsContainer = document.getElementById('gradient-stops');
    const addStopBtn = document.getElementById('add-stop-btn');
    const gradientTypeRadios = document.querySelectorAll('input[name="gradient-type"]');
    const rotationInput = document.getElementById('gradient-rotation');
    const rotationValueSpan = document.getElementById('rotation-value');
    const customTextInput = document.getElementById('custom-text');
    const fontSelect = document.getElementById('font-select');
    const textColorInput = document.getElementById('text-color');
    const textHexValueSpan = document.getElementById('text-hex-value');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValueSpan = document.getElementById('font-size-value');
    const alignmentButtons = document.querySelectorAll('.align-btn');
    const shadowEnableCheckbox = document.getElementById('shadow-enable');
    const shadowControlsContainer = document.querySelector('.shadow-controls');
    const shadowColorInput = document.getElementById('shadow-color');
    const shadowHexValueSpan = document.getElementById('shadow-hex-value');
    const shadowXInput = document.getElementById('shadow-x');
    const shadowXValueSpan = document.getElementById('shadow-x-value');
    const shadowYInput = document.getElementById('shadow-y');
    const shadowYValueSpan = document.getElementById('shadow-y-value');
    const shadowBlurInput = document.getElementById('shadow-blur');
    const shadowBlurValueSpan = document.getElementById('shadow-blur-value');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearSavedBtn = document.getElementById('clear-saved-btn');
    const savedCountSpan = document.getElementById('saved-count');
    const savedCombosSelect = document.getElementById('saved-combos-select');
    const deleteSavedBtn = document.getElementById('delete-saved-btn');
    const copyCssBtn = document.getElementById('copy-css-btn');

    let currentBgType = 'solid';
    let currentGradientType = 'linear';
    let gradientStops = [];
    let savedCombinations = [];
    const LOCAL_STORAGE_KEY = 'enhancedStyleLabCombinations_v3';
    let isDragging = false;
    let initialX, initialY;
    let currentTextPosition = { x: '50%', y: '50%' };
    let currentTextAlign = 'center';
    let isTextShadowEnabled = false;

    const DEFAULTS = {
        bgColorSolid: '#f0f0f0',
        gradientType: 'linear',
        gradientStops: ['#ffafbd', '#ffc3a0'],
        gradientRotation: 90,
        text: 'Customize Me!',
        textFont: "'Poppins', sans-serif",
        textColor: '#333333',
        textSize: 32,
        textAlign: 'center',
        textPosition: { x: '50%', y: '50%' },
        shadowEnabled: false,
        shadowColor: '#cccccc',
        shadowX: 1,
        shadowY: 1,
        shadowBlur: 2,
        bgType: 'solid',
    };

    function initialize() {
        loadFromLocalStorage();
        applyDefaults(false);
        setupInitialGradientStops();
        addEventListeners();
        renderSavedCombinationsList();
        updatePreview();
        updateSavedCount();
        updateRemoveButtonStates();
        updateHexDisplays();
        setActiveTab(currentBgType);
        toggleSection(sectionHeaders[0], true);
    }

    function applyDefaults(resetUIFields = true) {
        currentBgType = DEFAULTS.bgType;
        currentGradientType = DEFAULTS.gradientType;
        currentTextAlign = DEFAULTS.textAlign;
        isTextShadowEnabled = DEFAULTS.shadowEnabled;

        if (resetUIFields) {
            solidColorInput.value = DEFAULTS.bgColorSolid;
            rotationInput.value = DEFAULTS.gradientRotation;
            customTextInput.value = DEFAULTS.text;
            fontSelect.value = DEFAULTS.textFont;
            textColorInput.value = DEFAULTS.textColor;
            fontSizeInput.value = DEFAULTS.textSize;
            shadowEnableCheckbox.checked = DEFAULTS.shadowEnabled;
            shadowColorInput.value = DEFAULTS.shadowColor;
            shadowXInput.value = DEFAULTS.shadowX;
            shadowYInput.value = DEFAULTS.shadowY;
            shadowBlurInput.value = DEFAULTS.shadowBlur;
            document.querySelector(`input[name="gradient-type"][value="${DEFAULTS.gradientType}"]`).checked = true;
            updateAlignmentButtons(DEFAULTS.textAlign);
            gradientStops = [...DEFAULTS.gradientStops];
            setupInitialGradientStops();
            savedCombosSelect.value = "";
            deleteSavedBtn.disabled = true;
        }

        sampleText.style.left = DEFAULTS.textPosition.x;
        sampleText.style.top = DEFAULTS.textPosition.y;
        if (DEFAULTS.textPosition.x.includes('%') || DEFAULTS.textPosition.y.includes('%')) {
             sampleText.style.transform = `translate(-${DEFAULTS.textPosition.x === '50%' ? '50%' : '0%'}, -${DEFAULTS.textPosition.y === '50%' ? '50%' : '0%'})`;
        } else {
            sampleText.style.transform = 'none';
        }
        currentTextPosition = { ...DEFAULTS.textPosition };

        rotationValueSpan.textContent = `${DEFAULTS.gradientRotation}°`;
        fontSizeValueSpan.textContent = `${DEFAULTS.textSize}px`;
        shadowXValueSpan.textContent = `${DEFAULTS.shadowX}px`;
        shadowYValueSpan.textContent = `${DEFAULTS.shadowY}px`;
        shadowBlurValueSpan.textContent = `${DEFAULTS.shadowBlur}px`;

        setActiveTab(currentBgType);
        updateHexDisplays();
        updatePreview();
    }

    function setupInitialGradientStops() {
        if (gradientStops.length < 2) {
            gradientStops = [...DEFAULTS.gradientStops];
        }
        gradientStopsContainer.innerHTML = '';
        gradientStops.forEach(color => addGradientStopElement(color));
        updateRemoveButtonStates();
    }

    function addGradientStopElement(colorValue) {
        const stopDiv = document.createElement('div');
        stopDiv.classList.add('gradient-stop');

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = colorValue;

        const hexSpan = document.createElement('span');
        hexSpan.classList.add('hex-value');
        hexSpan.textContent = colorValue;

        colorInput.addEventListener('input', (e) => {
             handleGradientColorChange();
             hexSpan.textContent = e.target.value;
        });


        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-stop-btn');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', removeGradientStop);

        stopDiv.appendChild(colorInput);
        stopDiv.appendChild(hexSpan);
        stopDiv.appendChild(removeBtn);
        gradientStopsContainer.appendChild(stopDiv);
    }

    function addEventListeners() {
        sectionHeaders.forEach(header => header.addEventListener('click', () => toggleSection(header)));
        tabButtons.forEach(button => button.addEventListener('click', () => {
            setActiveTab(button.dataset.tab);
            updatePreview();
        }));

        solidColorInput.addEventListener('input', () => { updatePreview(); updateHexDisplays(); });
        addStopBtn.addEventListener('click', handleAddGradientStop);
        gradientTypeRadios.forEach(radio => radio.addEventListener('change', handleGradientTypeChange));
        rotationInput.addEventListener('input', () => {
            rotationValueSpan.textContent = `${rotationInput.value}°`;
            updatePreview();
        });

        customTextInput.addEventListener('input', updatePreview);
        fontSelect.addEventListener('change', updatePreview);
        textColorInput.addEventListener('input', () => { updatePreview(); updateHexDisplays(); });
        fontSizeInput.addEventListener('input', () => {
            fontSizeValueSpan.textContent = `${fontSizeInput.value}px`;
            updatePreview();
        });

        alignmentButtons.forEach(button => button.addEventListener('click', () => handleAlignmentChange(button.dataset.align)));

        shadowEnableCheckbox.addEventListener('change', handleShadowEnableChange);
        shadowColorInput.addEventListener('input', () => { updatePreview(); updateHexDisplays(); });
        shadowXInput.addEventListener('input', () => { shadowXValueSpan.textContent = `${shadowXInput.value}px`; updatePreview(); });
        shadowYInput.addEventListener('input', () => { shadowYValueSpan.textContent = `${shadowYInput.value}px`; updatePreview(); });
        shadowBlurInput.addEventListener('input', () => { shadowBlurValueSpan.textContent = `${shadowBlurInput.value}px`; updatePreview(); });

        saveBtn.addEventListener('click', saveCurrentCombination);
        resetBtn.addEventListener('click', handleReset);
        downloadBtn.addEventListener('click', downloadCombinations);
        clearSavedBtn.addEventListener('click', clearSavedCombinations);
        savedCombosSelect.addEventListener('change', handleLoadSavedCombination);
        deleteSavedBtn.addEventListener('click', handleDeleteSelectedCombination);
        copyCssBtn.addEventListener('click', copyCurrentCSS);

        sampleText.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        sampleText.addEventListener('dragstart', (e) => e.preventDefault());
    }

     function handleAddGradientStop() {
        const lastColor = gradientStopsContainer.lastChild?.querySelector('input[type="color"]')?.value || '#ffffff';
        addGradientStopElement(lastColor);
        updateGradientStopsArray();
        updatePreview();
        updateRemoveButtonStates();
    }

    function handleGradientTypeChange(event) {
        currentGradientType = event.target.value;
        rotationInput.disabled = currentGradientType === 'radial';
        updatePreview();
    }

     function handleAlignmentChange(align) {
        currentTextAlign = align;
        updateAlignmentButtons(align);
        updatePreview();
    }

    function handleShadowEnableChange(event) {
        isTextShadowEnabled = event.target.checked;
        shadowControlsContainer.style.opacity = isTextShadowEnabled ? '1' : '0.5';
        updatePreview();
    }

     function handleReset() {
        if(confirm("Reset current view to default settings? This won't affect saved styles.")) {
            applyDefaults(true);
        }
    }

     function handleLoadSavedCombination(event) {
        const selectedId = event.target.value;
        if (selectedId) {
            const comboToLoad = savedCombinations.find(c => c.id.toString() === selectedId);
            if (comboToLoad) {
                applyCombinationToUI(comboToLoad);
                deleteSavedBtn.disabled = false;
            }
        } else {
            deleteSavedBtn.disabled = true;
        }
    }

     function handleDeleteSelectedCombination() {
        const selectedId = savedCombosSelect.value;
        if (selectedId) {
            const comboToDelete = savedCombinations.find(c => c.id.toString() === selectedId);
            if (comboToDelete && confirm(`Are you sure you want to delete the style "${comboToDelete.name}"?`)) {
                deleteSavedCombination(comboToDelete.id);
            }
        }
    }


    function toggleSection(clickedHeader, forceOpen = false) {
        const section = clickedHeader.closest('.control-section');
        const content = section.querySelector('.section-content');
        const isActive = clickedHeader.classList.contains('active');

        sectionHeaders.forEach(header => {
            if (header !== clickedHeader) {
                header.classList.remove('active');
                header.closest('.control-section').querySelector('.section-content').classList.remove('active');
            }
        });

        if (!isActive || forceOpen) {
            clickedHeader.classList.add('active');
            content.classList.add('active');
        } else if (!forceOpen) {
            clickedHeader.classList.remove('active');
            content.classList.remove('active');
        }
    }

    function setActiveTab(tabName) {
        currentBgType = tabName;
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabName}-controls`));
        rotationInput.disabled = currentBgType !== 'gradient' || currentGradientType !== 'linear';
    }

    function updateGradientStopsArray() {
        gradientStops = Array.from(gradientStopsContainer.querySelectorAll('.gradient-stop input[type="color"]'))
                             .map(input => input.value);
    }

    function handleGradientColorChange() {
        updateGradientStopsArray();
        updatePreview();
    }

    function removeGradientStop(event) {
        if (gradientStopsContainer.children.length > 2) {
            const stopDiv = event.target.closest('.gradient-stop');
            if (stopDiv) {
                stopDiv.remove();
                updateGradientStopsArray();
                updatePreview();
                updateRemoveButtonStates();
            }
        } else {
            alert("Gradient requires at least two color stops.");
        }
    }

    function updateRemoveButtonStates() {
        const removeButtons = gradientStopsContainer.querySelectorAll('.remove-stop-btn');
        const disableRemove = removeButtons.length <= 2;
        removeButtons.forEach(btn => btn.disabled = disableRemove);
    }

     function updateAlignmentButtons(activeAlign) {
        alignmentButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.align === activeAlign);
        });
    }

     function updateHexDisplays() {
        solidHexValueSpan.textContent = solidColorInput.value;
        textHexValueSpan.textContent = textColorInput.value;
        shadowHexValueSpan.textContent = shadowColorInput.value;
         gradientStopsContainer.querySelectorAll('.gradient-stop').forEach(stopDiv => {
            const input = stopDiv.querySelector('input[type="color"]');
            const span = stopDiv.querySelector('.hex-value');
            if (input && span) {
                span.textContent = input.value;
            }
        });
    }

    function getBackgroundStyle() {
        if (currentBgType === 'solid') {
            return solidColorInput.value;
        } else {
            updateGradientStopsArray();
            if (gradientStops.length === 0) return DEFAULTS.bgColorSolid;
            if (gradientStops.length === 1) return gradientStops[0];

            const colors = gradientStops.join(', ');
            if (currentGradientType === 'radial') {
                return `radial-gradient(circle, ${colors})`;
            } else {
                const rotation = rotationInput.value;
                return `linear-gradient(${rotation}deg, ${colors})`;
            }
        }
    }

    function getTextShadowStyle() {
        if (!isTextShadowEnabled) return 'none';
        const x = shadowXInput.value;
        const y = shadowYInput.value;
        const blur = shadowBlurInput.value;
        const color = shadowColorInput.value;
        return `${x}px ${y}px ${blur}px ${color}`;
    }

    function updatePreview() {
        previewArea.style.background = getBackgroundStyle();
        sampleText.textContent = customTextInput.value;
        sampleText.style.fontFamily = fontSelect.value;
        sampleText.style.color = textColorInput.value;
        sampleText.style.fontSize = `${fontSizeInput.value}px`;
        sampleText.style.textAlign = currentTextAlign;
        sampleText.style.textShadow = getTextShadowStyle();
    }

    function dragStart(e) {
        if (e.target === sampleText) {
            isDragging = true;
            sampleText.classList.add('dragging');
            const rect = sampleText.getBoundingClientRect();
            const parentRect = previewArea.getBoundingClientRect();
            initialX = e.clientX - rect.left + parentRect.left;
            initialY = e.clientY - rect.top + parentRect.top;
            sampleText.style.transform = 'none';
            e.preventDefault();
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            const previewRect = previewArea.getBoundingClientRect();
            let currentX = e.clientX - initialX;
            let currentY = e.clientY - initialY;

            const textRect = sampleText.getBoundingClientRect();
            currentX = Math.max(0, Math.min(currentX, previewRect.width - textRect.width));
            currentY = Math.max(0, Math.min(currentY, previewRect.height - textRect.height));

            setTranslate(currentX, currentY);
        }
    }

    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            sampleText.classList.remove('dragging');
            currentTextPosition = { x: `${sampleText.offsetLeft}px`, y: `${sampleText.offsetTop}px` };
        }
    }

    function setTranslate(xPos, yPos) {
        sampleText.style.left = `${xPos}px`;
        sampleText.style.top = `${yPos}px`;
    }

    function saveCurrentCombination() {
        let comboName = prompt("Enter a name for this style combination:", "My Style");
        if (!comboName) return;
        comboName = comboName.trim();
        if (!comboName) {
            alert("Please enter a valid name.");
            return;
        }

        if (currentBgType === 'gradient') updateGradientStopsArray();

        const currentCombination = {
            id: Date.now(),
            name: comboName,
            backgroundType: currentBgType,
            backgroundValue: getBackgroundStyle(),
            settings: {
                gradientType: currentBgType === 'gradient' ? currentGradientType : null,
                gradientStops: currentBgType === 'gradient' ? [...gradientStops] : null,
                gradientRotation: currentBgType === 'gradient' && currentGradientType === 'linear' ? rotationInput.value : null,
                solidColor: currentBgType === 'solid' ? solidColorInput.value : null,
                textColor: textColorInput.value,
                fontFamily: fontSelect.value,
                fontSize: fontSizeInput.value,
                textAlign: currentTextAlign,
                customText: customTextInput.value,
                textPosition: { ...currentTextPosition },
                shadowEnabled: isTextShadowEnabled,
                shadowColor: shadowColorInput.value,
                shadowX: shadowXInput.value,
                shadowY: shadowYInput.value,
                shadowBlur: shadowBlurInput.value
            }
        };

        savedCombinations.push(currentCombination);
        saveToLocalStorage();
        renderSavedCombinationsList();
        updateSavedCount();

        savedCombosSelect.value = currentCombination.id.toString();
        deleteSavedBtn.disabled = false;

        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Current Style'; }, 1500);
    }

    function loadFromLocalStorage() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                savedCombinations = JSON.parse(storedData);
            } catch (e) {
                console.error("Error parsing saved combinations from localStorage:", e);
                savedCombinations = [];
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        } else {
            savedCombinations = [];
        }
    }

     function renderSavedCombinationsList() {
         savedCombosSelect.innerHTML = '<option value="">-- Select a style --</option>';
         savedCombinations.sort((a, b) => a.name.localeCompare(b.name));
         savedCombinations.forEach(combo => {
             const option = document.createElement('option');
             option.value = combo.id;
             option.textContent = combo.name;
             savedCombosSelect.appendChild(option);
         });
         deleteSavedBtn.disabled = savedCombosSelect.value === "";
    }

    function applyCombinationToUI(combo) {
        if (!combo || !combo.settings) return;
        const settings = combo.settings;

        setActiveTab(combo.backgroundType);
        currentGradientType = settings.gradientType || DEFAULTS.gradientType;
        document.querySelector(`input[name="gradient-type"][value="${currentGradientType}"]`).checked = true;

        if (combo.backgroundType === 'solid' && settings.solidColor) {
            solidColorInput.value = settings.solidColor;
        } else if (combo.backgroundType === 'gradient' && settings.gradientStops) {
            gradientStops = [...settings.gradientStops];
            rotationInput.value = settings.gradientRotation !== null ? settings.gradientRotation : DEFAULTS.gradientRotation;
            rotationValueSpan.textContent = `${rotationInput.value}°`;
            setupInitialGradientStops();
        }
        rotationInput.disabled = combo.backgroundType !== 'gradient' || currentGradientType !== 'linear';

        customTextInput.value = settings.customText || DEFAULTS.text;
        fontSelect.value = settings.fontFamily || DEFAULTS.textFont;
        textColorInput.value = settings.textColor || DEFAULTS.textColor;
        fontSizeInput.value = settings.fontSize || DEFAULTS.textSize;
        fontSizeValueSpan.textContent = `${fontSizeInput.value}px`;

        currentTextAlign = settings.textAlign || DEFAULTS.textAlign;
        updateAlignmentButtons(currentTextAlign);

        isTextShadowEnabled = settings.shadowEnabled || false;
        shadowEnableCheckbox.checked = isTextShadowEnabled;
        shadowColorInput.value = settings.shadowColor || DEFAULTS.shadowColor;
        shadowXInput.value = settings.shadowX !== undefined ? settings.shadowX : DEFAULTS.shadowX;
        shadowYInput.value = settings.shadowY !== undefined ? settings.shadowY : DEFAULTS.shadowY;
        shadowBlurInput.value = settings.shadowBlur !== undefined ? settings.shadowBlur : DEFAULTS.shadowBlur;
        shadowXValueSpan.textContent = `${shadowXInput.value}px`;
        shadowYValueSpan.textContent = `${shadowYInput.value}px`;
        shadowBlurValueSpan.textContent = `${shadowBlurInput.value}px`;
        shadowControlsContainer.style.opacity = isTextShadowEnabled ? '1' : '0.5';

        if (settings.textPosition && settings.textPosition.x !== null && settings.textPosition.y !== null) {
            sampleText.style.left = settings.textPosition.x;
            sampleText.style.top = settings.textPosition.y;
            if (settings.textPosition.x.includes('%') || settings.textPosition.y.includes('%')) {
                sampleText.style.transform = `translate(-${settings.textPosition.x === '50%' ? '50%' : '0%'}, -${settings.textPosition.y === '50%' ? '50%' : '0%'})`;
            } else {
                sampleText.style.transform = 'none';
            }
            currentTextPosition = { ...settings.textPosition };
        } else {
            sampleText.style.left = DEFAULTS.textPosition.x;
            sampleText.style.top = DEFAULTS.textPosition.y;
            sampleText.style.transform = `translate(-50%, -50%)`;
            currentTextPosition = { ...DEFAULTS.textPosition };
        }

        updateHexDisplays();
        updatePreview();
    }


    function saveToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedCombinations));
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            alert("Could not save combinations. LocalStorage might be full or disabled.");
        }
    }

    function updateSavedCount() {
        const count = savedCombinations.length;
        savedCountSpan.textContent = count;
        downloadBtn.disabled = count === 0;
        clearSavedBtn.disabled = count === 0;
    }

     function deleteSavedCombination(idToDelete) {
        savedCombinations = savedCombinations.filter(combo => combo.id !== idToDelete);
        saveToLocalStorage();
        renderSavedCombinationsList();
        updateSavedCount();
        savedCombosSelect.value = "";
        deleteSavedBtn.disabled = true;
        alert('Style deleted.');
    }

    function clearSavedCombinations() {
        if (savedCombinations.length > 0 && confirm(`Are you sure you want to clear all ${savedCombinations.length} saved styles? This cannot be undone.`)) {
            savedCombinations = [];
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            renderSavedCombinationsList();
            updateSavedCount();
             savedCombosSelect.value = "";
            deleteSavedBtn.disabled = true;
            alert('All saved styles cleared.');
        }
    }


    function formatCombinationsForDownload() {
        let output = `Saved StyleLab Combinations (${new Date().toLocaleString()})\n`;
        output += "==================================================\n\n";

        savedCombinations.forEach((combo, index) => {
            output += `--- Style ${index + 1}: ${combo.name} (ID: ${combo.id}) ---\n`;
            output += `Background Type: ${combo.backgroundType}\n`;
             if (combo.backgroundType === 'gradient') {
                 output += `Gradient Type: ${combo.settings.gradientType}\n`;
             }
            output += `Background CSS: ${combo.backgroundValue}\n`;
            if(combo.settings) {
                 if (combo.backgroundType === 'gradient' && combo.settings.gradientStops) {
                    output += `  Stops: ${combo.settings.gradientStops.join(', ')}\n`;
                     if(combo.settings.gradientType === 'linear') {
                        output += `  Rotation: ${combo.settings.gradientRotation}°\n`;
                     }
                }
                output += `Text Color: ${combo.settings.textColor}\n`;
                output += `Font Family CSS: ${combo.settings.fontFamily}\n`;
                output += `Font Size: ${combo.settings.fontSize}px\n`;
                output += `Text Align: ${combo.settings.textAlign}\n`;
                output += `Text Shadow: ${combo.settings.shadowEnabled ? `${combo.settings.shadowX}px ${combo.settings.shadowY}px ${combo.settings.shadowBlur}px ${combo.settings.shadowColor}` : 'none'}\n`;
                output += `Text Position: Left=${combo.settings.textPosition?.x ?? 'N/A'}, Top=${combo.settings.textPosition?.y ?? 'N/A'}\n`;
                output += `Preview Text: "${combo.settings.customText}"\n`;
            } else {
                 output += "(Settings details missing)\n"
            }
            output += "\n";
        });
        output += "==================================================";
        return output;
    }

    function downloadCombinations() {
        if (savedCombinations.length === 0) return;
        const textContent = formatCombinationsForDownload();
        const filename = `stylelab_combinations_${Date.now()}.txt`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

     function copyCurrentCSS() {
        let cssOutput = `/* Generated by StyleLab */\n\n`;
        cssOutput += `/* Background */\n`;
        cssOutput += `.your-element-selector {\n`;
        cssOutput += `  background: ${getBackgroundStyle()};\n`;
        cssOutput += `}\n\n`;

        cssOutput += `/* Text */\n`;
        cssOutput += `.your-text-selector {\n`;
        cssOutput += `  color: ${textColorInput.value};\n`;
        cssOutput += `  font-family: ${fontSelect.value};\n`;
        cssOutput += `  font-size: ${fontSizeInput.value}px;\n`;
        cssOutput += `  text-align: ${currentTextAlign};\n`;
        cssOutput += `  text-shadow: ${getTextShadowStyle()};\n`;
         if(currentTextPosition && currentTextPosition.x !== null && currentTextPosition.y !== null && (currentTextPosition.x !== '50%' || currentTextPosition.y !== '50%')) {
             cssOutput += `  /* Position (absolute/relative needed on element) */\n`;
             cssOutput += `  position: absolute; /* Or relative, depending on context */\n`;
             cssOutput += `  left: ${currentTextPosition.x};\n`;
             cssOutput += `  top: ${currentTextPosition.y};\n`;
             if (!currentTextPosition.x.includes('%') && !currentTextPosition.y.includes('%')) {
                 cssOutput += `  transform: none;\n`;
             } else if (currentTextPosition.x === '50%' && currentTextPosition.y === '50%') {
                 cssOutput += `  transform: translate(-50%, -50%);\n`;
             } else {
                 cssOutput += `  transform: translate(-${currentTextPosition.x === '50%' ? '50%' : '0%'}, -${currentTextPosition.y === '50%' ? '50%' : '0%'});\n`;
             }
         }
        cssOutput += `}`;

        navigator.clipboard.writeText(cssOutput).then(() => {
            copyCssBtn.innerHTML = '<i class="fas fa-check"></i> CSS Copied!';
            setTimeout(() => { copyCssBtn.innerHTML = '<i class="fas fa-copy"></i> Copy CSS'; }, 2000);
        }).catch(err => {
            console.error('Failed to copy CSS: ', err);
            alert('Failed to copy CSS. Check browser permissions or console.');
        });
    }

    initialize();
});