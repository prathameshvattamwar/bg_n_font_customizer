document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const previewArea = document.getElementById('preview-area');
    const sampleText = document.getElementById('sample-text');
    const sidebar = document.getElementById('sidebar');

    // Accordion Elements
    const sectionHeaders = document.querySelectorAll('.section-header');

    // Background Controls
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const solidColorInput = document.getElementById('bg-color-solid');
    const gradientControls = document.getElementById('gradient-controls');
    const gradientStopsContainer = document.getElementById('gradient-stops');
    const addStopBtn = document.getElementById('add-stop-btn');
    const rotationInput = document.getElementById('gradient-rotation');
    const rotationValueSpan = document.getElementById('rotation-value');

    // Text Controls
    const customTextInput = document.getElementById('custom-text');
    const fontSelect = document.getElementById('font-select');
    const textColorInput = document.getElementById('text-color');
    const fontSizeInput = document.getElementById('font-size');
    const fontSizeValueSpan = document.getElementById('font-size-value');

    // Action Controls
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearSavedBtn = document.getElementById('clear-saved-btn');
    const savedCountSpan = document.getElementById('saved-count');

    // --- State Variables ---
    let currentBgType = 'solid'; // 'solid' or 'gradient'
    let gradientStops = []; // Holds color values
    let savedCombinations = [];
    const LOCAL_STORAGE_KEY = 'enhancedColorFontCombinations_v2'; // Use new key

    // Draggable Text State
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let currentTextPosition = { x: null, y: null }; // Store percentage or pixel position

    // Default values for reset
    const DEFAULTS = {
        bgColorSolid: '#f0f0f0',
        gradientStops: ['#ff8a00', '#e52e71'],
        gradientRotation: 90,
        text: 'Welcome',
        textFont: "'Poppins', sans-serif",
        textColor: '#333333',
        textSize: 32,
        textPosition: { x: '50%', y: '50%' }, // Center default
        bgType: 'solid',
    };

    // --- Initialization ---
    function initialize() {
        loadFromLocalStorage();
        applyDefaults(false); // Apply defaults without resetting UI fields initially if local storage empty
        setupInitialGradientStops();
        addEventListeners();
        updatePreview();
        updateSavedCount();
        updateRemoveButtonStates();
        // Set initial active tab based on default or first loaded combo
        setActiveTab(currentBgType);
        // Set initial accordion state (first section open)
        // toggleSection(sectionHeaders[0], true); // Keep first section open initially
    }

    function applyDefaults(resetUIFields = true) {
        // Only apply if no saved data or explicit reset
        if (savedCombinations.length === 0 || resetUIFields) {
            currentBgType = DEFAULTS.bgType;
            if(resetUIFields) {
                 solidColorInput.value = DEFAULTS.bgColorSolid;
                 rotationInput.value = DEFAULTS.gradientRotation;
                 customTextInput.value = DEFAULTS.text;
                 fontSelect.value = DEFAULTS.textFont;
                 textColorInput.value = DEFAULTS.textColor;
                 fontSizeInput.value = DEFAULTS.textSize;
            }
            // Don't reset gradientStops array here directly, handle in setupInitialGradientStops
            // Set initial position - needs careful handling based on % or px
            sampleText.style.left = DEFAULTS.textPosition.x;
            sampleText.style.top = DEFAULTS.textPosition.y;
            // Apply transform only if using percentages
            if (DEFAULTS.textPosition.x.includes('%') || DEFAULTS.textPosition.y.includes('%')) {
                 sampleText.style.transform = `translate(-${DEFAULTS.textPosition.x === '50%' ? '50%' : '0%'}, -${DEFAULTS.textPosition.y === '50%' ? '50%' : '0%'})`;
            } else {
                sampleText.style.transform = 'none';
            }
            currentTextPosition = { ...DEFAULTS.textPosition };

             // Update displayed values
            rotationValueSpan.textContent = `${DEFAULTS.gradientRotation}°`;
            fontSizeValueSpan.textContent = `${DEFAULTS.textSize}px`;
        }
         // Always ensure gradient stops are handled
         if (resetUIFields) {
            gradientStops = [...DEFAULTS.gradientStops];
            setupInitialGradientStops(); // Rebuild DOM for gradient stops
         }
         setActiveTab(currentBgType); // Ensure correct tab is shown
         updatePreview(); // Apply changes
    }


    function setupInitialGradientStops() {
        // Use default if current array is too short or needs reset
        if (gradientStops.length < 2) {
            gradientStops = [...DEFAULTS.gradientStops];
        }
        gradientStopsContainer.innerHTML = ''; // Clear existing
        gradientStops.forEach(color => addGradientStopElement(color));
        updateRemoveButtonStates();
    }

    function addGradientStopElement(colorValue) {
        const stopDiv = document.createElement('div');
        stopDiv.classList.add('gradient-stop');

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = colorValue;
        colorInput.addEventListener('input', handleGradientColorChange);

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-stop-btn');
        removeBtn.innerHTML = '<i class="fas fa-times"></i>'; // Use icon
        removeBtn.addEventListener('click', removeGradientStop);

        stopDiv.appendChild(colorInput);
        stopDiv.appendChild(removeBtn);
        gradientStopsContainer.appendChild(stopDiv);
    }

    // --- Event Listeners Setup ---
    function addEventListeners() {
        // Accordion
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => toggleSection(header));
        });

        // Tab switching
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveTab(button.dataset.tab);
                updatePreview();
            });
        });

        // Background controls
        solidColorInput.addEventListener('input', updatePreview);
        addStopBtn.addEventListener('click', () => {
            const lastColor = gradientStopsContainer.lastChild?.querySelector('input[type="color"]')?.value || '#ffffff';
            addGradientStopElement(lastColor);
            updateGradientStopsArray();
            updatePreview();
            updateRemoveButtonStates(); // Update after adding
        });
        rotationInput.addEventListener('input', () => {
            rotationValueSpan.textContent = `${rotationInput.value}°`;
            updatePreview();
        });

        // Text controls
        customTextInput.addEventListener('input', updatePreview);
        fontSelect.addEventListener('change', updatePreview);
        textColorInput.addEventListener('input', updatePreview);
        fontSizeInput.addEventListener('input', () => {
            fontSizeValueSpan.textContent = `${fontSizeInput.value}px`;
            updatePreview();
        });

        // Action controls
        saveBtn.addEventListener('click', saveCurrentCombination);
        resetBtn.addEventListener('click', () => {
            if(confirm("Reset current view to default settings? This won't affect saved combinations.")) {
                applyDefaults(true); // Reset UI fields and apply
            }
        });
        downloadBtn.addEventListener('click', downloadCombinations);
        clearSavedBtn.addEventListener('click', clearSavedCombinations);

        // Draggable Text Events
        sampleText.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag); // Listen on document
        document.addEventListener('mouseup', dragEnd);   // Listen on document
        // Prevent default drag behavior for the element
        sampleText.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // --- Accordion Logic ---
    function toggleSection(clickedHeader, forceOpen = false) {
        const section = clickedHeader.closest('.control-section');
        const content = section.querySelector('.section-content');
        const wasActive = clickedHeader.classList.contains('active');

        // Optional: Close all others first (true accordion)
        sectionHeaders.forEach(header => {
            if (header !== clickedHeader) {
                header.classList.remove('active');
                header.nextElementSibling.classList.remove('active'); // Assuming content is sibling
                 header.closest('.control-section').querySelector('.section-content').classList.remove('active');
            }
        });

        if (!wasActive || forceOpen) {
            clickedHeader.classList.add('active');
            content.classList.add('active');
        } else {
            // If clicking the already active one, close it (unless forceOpen)
             if (!forceOpen) {
                clickedHeader.classList.remove('active');
                content.classList.remove('active');
             }
        }
    }


    // --- Core Logic (Updates from previous version) ---

    function setActiveTab(tabName) {
        currentBgType = tabName;
        tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
        tabContents.forEach(content => content.classList.toggle('active', content.id === `${tabName}-controls`));
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
                updateRemoveButtonStates(); // Update after removing
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

    function getBackgroundStyle() {
        if (currentBgType === 'solid') {
            return solidColorInput.value;
        } else {
            updateGradientStopsArray();
            if (gradientStops.length === 0) return DEFAULTS.bgColorSolid; // Fallback
            if (gradientStops.length === 1) return gradientStops[0];

            const rotation = rotationInput.value;
            const colors = gradientStops.join(', ');
            return `linear-gradient(${rotation}deg, ${colors})`;
        }
    }

    function updatePreview() {
        // Apply Background
        previewArea.style.background = getBackgroundStyle();

        // Apply Text Styles
        sampleText.textContent = customTextInput.value;
        sampleText.style.fontFamily = fontSelect.value;
        sampleText.style.color = textColorInput.value;
        sampleText.style.fontSize = `${fontSizeInput.value}px`;

        // Position is handled by drag events / initial load
    }

    // --- Draggable Text Logic ---
    function dragStart(e) {
        if (e.target === sampleText) { // Ensure drag starts on the text element itself
            isDragging = true;
            sampleText.classList.add('dragging');

            // Use pageX/pageY for coordinates relative to the whole page
            initialX = e.pageX - sampleText.offsetLeft;
            initialY = e.pageY - sampleText.offsetTop;

            // Prevent text selection start
            e.preventDefault();
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            currentX = e.pageX - initialX;
            currentY = e.pageY - initialY;

            // Optional: Boundary checks (keep within previewArea)
            const previewRect = previewArea.getBoundingClientRect();
            const textRect = sampleText.getBoundingClientRect(); // Get current size

            currentX = Math.max(0, Math.min(currentX, previewRect.width - textRect.width));
            currentY = Math.max(0, Math.min(currentY, previewRect.height - textRect.height));


            // Set position using pixels
            setTranslate(currentX, currentY);
        }
    }

    function dragEnd(e) {
        if (isDragging) {
            initialX = currentX; // Not strictly needed for pixels, but good practice
            initialY = currentY;

            isDragging = false;
            sampleText.classList.remove('dragging');

            // Store the final position (using pixels for simplicity now)
            currentTextPosition = { x: `${sampleText.offsetLeft}px`, y: `${sampleText.offsetTop}px` };
            // Remove transform used for centering if it exists from defaults
             sampleText.style.transform = 'none';
        }
    }

    function setTranslate(xPos, yPos) {
        sampleText.style.left = `${xPos}px`;
        sampleText.style.top = `${yPos}px`;
        sampleText.style.transform = 'none'; // Ensure no centering transform interferes
    }


    // --- Persistence (LocalStorage) ---

    function saveCurrentCombination() {
        // Ensure gradient stops array is current
        if (currentBgType === 'gradient') {
            updateGradientStopsArray();
        }

        const currentCombination = {
            id: Date.now(), // Unique ID for potential future management
            backgroundType: currentBgType,
            backgroundValue: getBackgroundStyle(), // Store the generated CSS
            // Store individual settings for potential reloading/editing
            settings: {
                gradientStops: currentBgType === 'gradient' ? [...gradientStops] : null,
                gradientRotation: currentBgType === 'gradient' ? rotationInput.value : null,
                solidColor: currentBgType === 'solid' ? solidColorInput.value : null,
                textColor: textColorInput.value,
                fontFamily: fontSelect.value,
                fontSize: fontSizeInput.value,
                customText: customTextInput.value,
                textPosition: { ...currentTextPosition } // Save current position
            }
        };

        savedCombinations.push(currentCombination);
        saveToLocalStorage();
        updateSavedCount();
        // Simple feedback
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        setTimeout(() => {
             saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Combination';
        }, 1500);
    }

    function loadFromLocalStorage() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                savedCombinations = JSON.parse(storedData);
                 // Load the FIRST saved combination's settings into the controls on startup?
                 // Or just load the defaults? Let's stick to defaults on startup for now.
                 // If you wanted to load the last one:
                 // if (savedCombinations.length > 0) {
                 //    applyCombinationToUI(savedCombinations[savedCombinations.length - 1]);
                 // }
            } catch (e) {
                console.error("Error parsing saved combinations from localStorage:", e);
                savedCombinations = [];
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
            }
        } else {
            savedCombinations = [];
        }
        updateSavedCount();
    }

     // --- Add function to apply a saved combo (useful if you add load buttons later) ---
    // function applyCombinationToUI(combo) {
    //     if (!combo || !combo.settings) return;
    //     const settings = combo.settings;

    //     setActiveTab(combo.backgroundType);

    //     if (combo.backgroundType === 'solid' && settings.solidColor) {
    //         solidColorInput.value = settings.solidColor;
    //     } else if (combo.backgroundType === 'gradient' && settings.gradientStops) {
    //         gradientStops = [...settings.gradientStops];
    //         rotationInput.value = settings.gradientRotation || DEFAULTS.gradientRotation;
    //         setupInitialGradientStops(); // Rebuild DOM
    //         rotationValueSpan.textContent = `${rotationInput.value}°`;
    //     }

    //     customTextInput.value = settings.customText || DEFAULTS.text;
    //     fontSelect.value = settings.fontFamily || DEFAULTS.textFont;
    //     textColorInput.value = settings.textColor || DEFAULTS.textColor;
    //     fontSizeInput.value = settings.fontSize || DEFAULTS.textSize;
    //     fontSizeValueSpan.textContent = `${fontSizeInput.value}px`;

    //     // Apply position
    //     if (settings.textPosition && settings.textPosition.x !== null && settings.textPosition.y !== null) {
    //         sampleText.style.left = settings.textPosition.x;
    //         sampleText.style.top = settings.textPosition.y;
    //         // Handle centering transform if needed (based on how position was saved)
    //         if (settings.textPosition.x.includes('%') || settings.textPosition.y.includes('%')) {
    //             sampleText.style.transform = `translate(-${settings.textPosition.x === '50%' ? '50%' : '0%'}, -${settings.textPosition.y === '50%' ? '50%' : '0%'})`;
    //         } else {
    //             sampleText.style.transform = 'none';
    //         }
    //         currentTextPosition = { ...settings.textPosition };
    //     } else {
    //         // Fallback to default position if saved one is invalid
    //         sampleText.style.left = DEFAULTS.textPosition.x;
    //         sampleText.style.top = DEFAULTS.textPosition.y;
    //         sampleText.style.transform = `translate(-50%, -50%)`;
    //         currentTextPosition = { ...DEFAULTS.textPosition };
    //     }


    //     updatePreview(); // Apply all changes visually
    // }


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

    function clearSavedCombinations() {
        if (savedCombinations.length > 0 && confirm(`Are you sure you want to clear all ${savedCombinations.length} saved combinations? This cannot be undone.`)) {
            savedCombinations = [];
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            updateSavedCount();
            alert('Saved combinations cleared.');
        }
    }

    // --- Download Functionality ---

    function formatCombinationsForDownload() {
        let output = `Enhanced Color & Font Combinations (${new Date().toLocaleString()})\n`;
        output += "==================================================\n\n";

        savedCombinations.forEach((combo, index) => {
            output += `--- Combination ${index + 1} (ID: ${combo.id}) ---\n`;
            output += `Background Type: ${combo.backgroundType}\n`;
            output += `Background CSS: ${combo.backgroundValue}\n`;
            if(combo.settings) {
                 if (combo.backgroundType === 'gradient' && combo.settings.gradientStops) {
                    output += `  Gradient Stops: ${combo.settings.gradientStops.join(', ')}\n`;
                    output += `  Gradient Rotation: ${combo.settings.gradientRotation}°\n`;
                }
                output += `Text Color: ${combo.settings.textColor}\n`;
                output += `Font Family CSS: ${combo.settings.fontFamily}\n`;
                output += `Font Size: ${combo.settings.fontSize}px\n`;
                output += `Text Position: Left=${combo.settings.textPosition?.x ?? 'N/A'}, Top=${combo.settings.textPosition?.y ?? 'N/A'}\n`;
                output += `Preview Text:\n"${combo.settings.customText}"\n`;
            } else {
                 output += "(Settings details missing for this combination)\n"
            }

            output += "\n"; // Add space between entries
        });

        output += "==================================================";
        return output;
    }

    function downloadCombinations() {
        if (savedCombinations.length === 0) {
            alert("No combinations saved to download.");
            return;
        }

        const textContent = formatCombinationsForDownload();
        const filename = `custom_styles_${Date.now()}.txt`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // --- Start the application ---
    initialize();
});