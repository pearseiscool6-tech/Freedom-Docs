const editor = document.getElementById('editor');
const container = document.getElementById('editor-container');
//file button functionality
const fileBtn = document.getElementById('file-menu-btn');
const fileDropdown = document.getElementById('file-dropdown');
//view button functionality
const viewBtn = document.getElementById('view-menu-btn');
const viewDropdown = document.getElementById('view-dropdown');
//mode button functionality
const modeBtn = document.getElementById('mode-btn');
const modeDropdown = document.getElementById('mode-dropdown');
//note taking element
const notesSidebar = document.getElementById('notes-sidebar');
//open ctrl+o
const fileInput = document.getElementById('hidden-file-input');
const docNameInput = document.getElementById('doc-name');
const sizeInput = document.getElementById('size-val');
//help button functionality
const helpBtn = document.getElementById('help-menu-btn');
const helpDropdown = document.getElementById('help-dropdown');
//insert button functionality
const insertBtn = document.getElementById('insert-menu-btn');
const insertDropdown = document.getElementById('insert-dropdown');
//format button functionality
const formatBtn = document.getElementById('format-menu-btn');
const formatDropdown = document.getElementById('format-dropdown');
// tools button functionality
const toolsBtn = document.getElementById('tools-menu-btn');
const toolsDropdown = document.getElementById('tools-dropdown');

// --- Global Workspace Control Variables ---
let fontSize = 11;
let isPrintLayout = true;
let isAutoSaveEnabled = true; // ON by default

// --- Tab System Storage States ---
let tabs = [];
let currentTabId = 1;
let nextTabId = 2;

// --- File System Access API Handles ---
let localFileHandle = null; 

// --- Initialize Workspace Application Sequence ---
function initWorkspace() {
    // Attempt to pull workspace data back out of Browser Local Memory
    const savedData = localStorage.getItem('freedom_docs_workspace');
    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            tabs = parsed.tabs;
            currentTabId = parsed.currentTabId;
            nextTabId = parsed.nextTabId;
            
            // Restore toggle preference if it was explicitly saved previously
            if (parsed.hasOwnProperty('isAutoSaveEnabled')) {
                isAutoSaveEnabled = parsed.isAutoSaveEnabled;
            }
        } catch (e) {
            alert("Local recovery corrupted. Clearing frame registry.");
            console.error("Local recovery corrupted. Clearing frame registry.");
            loadDefaultTabState();
        }
    } else {
        console.log("No saved date found")
        loadDefaultTabState();
    }

    // Render workspace target nodes
    const activeTab = tabs.find(t => t.id === currentTabId);
    console.log(`${activeTab}`)
    if (activeTab) {
        editor.innerHTML = activeTab.content;
        docNameInput.value = activeTab.name;
        document.getElementById('note-pad').value = activeTab.notePad || '';
        document.title = `${activeTab.name} - Freedom Docs`;
        console.log(`Workspace Title: ${activeTab.name}`)
    }
    
    // Sync Visual State of the Switch UI matching Preference Rules
    updateSwitchUI();
    renderTabs();
}

// --- Toggle Controller Operation Function ---
function toggleAutoSaveState(event) {
    // Prevent menu backdrop triggers from breaking execution paths
    event.stopPropagation();
    
    isAutoSaveEnabled = !isAutoSaveEnabled;
    updateSwitchUI();

    if (isAutoSaveEnabled) {
        // Instantly force flush changes to memory if turning on
        triggerMemoryAutoSave();
    } else {
        // If turned off, clean out browser memory but retain internal tab matrices array
        localStorage.removeItem('freedom_docs_workspace');
    }
}

// --- Visual Style Syncer Module for Switch Component ---
function updateSwitchUI() {
    const bg = document.getElementById('autosave-switch-bg');
    const knob = document.getElementById('autosave-switch-knob');
    
    if (!bg || !knob) return;

    if (isAutoSaveEnabled) {
        bg.style.backgroundColor = 'var(--blue-primary)';
        knob.style.right = '2px';
        knob.style.left = 'auto';
    } else {
        bg.style.backgroundColor = '#b4b4b4'; // Neutral Muted Grey State
        knob.style.left = '2px';
        knob.style.right = 'auto';
    }
}

// --- Trigger Background System Sync Memory Persistence Loops ---
function triggerMemoryAutoSave() {
    if (!isAutoSaveEnabled) return; // Block memory footprint sync operations if disabled

    // Force active workspace changes into the primary tab structural matrix state array
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) {
        currentTab.content = editor.innerHTML;
        currentTab.notePad = document.getElementById('note-pad').value;
    }

    const payload = {
        tabs: tabs,
        currentTabId: currentTabId,
        nextTabId: nextTabId,
        isAutoSaveEnabled: isAutoSaveEnabled // Persist configuration flag state parameter
    };
    localStorage.setItem('freedom_docs_workspace', JSON.stringify(payload));
}

function loadDefaultTabState() {
    //sets precedent for new documents
    tabs = [{ id: 1, name: 'Untitled Document', content: 'Type here...', notePad: '', isStarred: false }];
    currentTabId = 1;
    nextTabId = 2;
    document.title = "Untitled Document - Freedom Docs";
}

// --- Direct Local File System Auto-Save Trigger Sync ---
async function triggerFileAutoSave() {
    if (!localFileHandle) return; // Silent return if file link hasn't been established
    
    try {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(editor.innerHTML);
        
        // Request a write stream to the established user OS storage file location
        const writable = await localFileHandle.createWritable();
        await writable.write(markdown);
        await writable.close();
        console.log("Auto-saved mutations cleanly committed directly to host file platform.");
    } catch (err) {
        console.error("Local file system stream access error context:", err);
    }
}

// Global hook to catch workspace state mutations across text typing workflows
function handleWorkspaceMutation() {
    updateUI();
    triggerMemoryAutoSave();
    triggerFileAutoSave();
}

// --- Link Active Document Workspace directly to a true local file handle ---
async function linkWorkspaceToFileSystem() {
    if (!window.showSaveFilePicker) {
        alert("Your current web browser environment does not support persistent directory write access loops.");
        return;
    }
    try {
        const options = {
            suggestedName: `${docNameInput.value}.md`,
            types: [{
                description: 'Markdown Text File',
                accept: { 'text/markdown': ['.md'], 'text/plain': ['.txt'] }
            }]
        };
        // User opens OS file dialog picker once
        localFileHandle = await window.showSaveFilePicker(options);
        alert(`Linked successfully! Changes on this specific tab will now automatically stream down directly to your machine.`);
        triggerFileAutoSave();
    } catch (err) {
        console.log("File handle handshake connection sequence aborted: ", err);
    }
}

// --- Keyboard Shortcuts Button Modal Toggle ---
function toggleShortcutsModal(show) {
    const modal = document.getElementById('shortcuts-modal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
    }
}

// --- Bug Report Overlay Modal Controls ---
function toggleBugModal(show) {
    const modal = document.getElementById('bug-modal');
    if (modal) {
        modal.style.display = show ? 'flex' : 'none';
        if(show) document.getElementById('bug-form').reset();
    }
}

function submitBugReport(e) {
    e.preventDefault();
    const userEmail = document.getElementById('bug-user-email').value;
    const bugDescription = document.getElementById('bug-desc').value;
    const activeTab = tabs.find(t => t.id === currentTabId);
    const tabName = activeTab ? activeTab.name : "Unknown Tab";
    
    const developerEmail = "bug.reports@outlook.com"; 
    const subject = encodeURIComponent(`Bug Report - Freedom Docs: ${tabName}`);
    
    const bodyText = encodeURIComponent(
        `User Contact Email: ${userEmail}\n\n` +
        `Description of Bug:\n${bugDescription}\n\n` +
        `-------------------------------------\n` +
        `DEBUG TELEMETRY SYSTEM LOGS:\n` +
        `-------------------------------------\n` +
        `Active Tab Workspace: ${tabName}\n` +
        `Browser App Version: ${navigator.userAgent}\n` +
        `Platform: ${navigator.platform}\n` +
        `Workspace Font Size: ${fontSize}pt\n` +
        `Print Layout Active: ${isPrintLayout}\n`
    );
    
    window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${bodyText}`;
    toggleBugModal(false);
}

// --- Functional Tab Rendering Matrix Engine ---
function renderTabs() {
    const tabsContainer = document.getElementById('tabs-container');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === currentTabId ? 'active' : ''}`;
        
        // Wrap switch in an arrow function so the element registers properly
        tabEl.onclick = () => switchTab(tab.id);
        
        // 1. Generate Star Icon Configuration
        const starSpan = document.createElement('span');
        starSpan.className = 'material-symbols-outlined star-tab-btn';
        starSpan.innerText = tab.isStarred ? 'star' : 'star_border';
        if (tab.isStarred) starSpan.classList.add('starred');
        
        // 2. Click Handler Matrix
        starSpan.onclick = (e) => {
            e.stopPropagation(); // Block the click from firing switchTab()
            tab.isStarred = !tab.isStarred;
            
            // Instantly update visual local DOM state
            starSpan.innerText = tab.isStarred ? 'star' : 'star_border';
            starSpan.classList.toggle('starred', tab.isStarred);
            
            // Persist mutation array to localStorage
            triggerMemoryAutoSave();
        };
        
        // 3. Tab Title Configuration
        const nameSpan = document.createElement('span');
        nameSpan.id = `tab-title-node-${tab.id}`;
        nameSpan.innerText = tab.name;
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.style.maxWidth = "180px";
        nameSpan.title = "Double-click to rename tab";
        
        nameSpan.ondblclick = (e) => {
            e.stopPropagation();
            const newName = prompt("Rename tab title:", tab.name);
            if (newName && newName.trim() !== "") {
                tab.name = newName.trim();
                nameSpan.innerText = tab.name;
                
                if (tab.id === currentTabId) {
                    if (docNameInput) docNameInput.value = tab.name;
                    document.title = `${tab.name} - Freedom Docs`;
                }
                triggerMemoryAutoSave();
            }
        };
        
        // 4. Close Configuration
        const closeSpan = document.createElement('span');
        closeSpan.className = 'material-symbols-outlined close-tab-btn';
        closeSpan.innerText = 'close';
        closeSpan.onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };
        
        // Append all elements left-to-right structurally
        tabEl.appendChild(starSpan);
        tabEl.appendChild(nameSpan);
        tabEl.appendChild(closeSpan);
        tabsContainer.appendChild(tabEl);
    });
}

function switchTab(id) {
    if (id === currentTabId) return;
    
    // Sever active connection handle to ensure we don't overwrite alternative tab files
    localFileHandle = null; 

    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) {
        currentTab.content = editor.innerHTML;
        currentTab.notePad = document.getElementById('note-pad').value;
    }

    currentTabId = id;
    const targetTab = tabs.find(t => t.id === currentTabId);
    if (targetTab) {
        editor.innerHTML = targetTab.content;
        docNameInput.value = targetTab.name;
        document.getElementById('note-pad').value = targetTab.notePad || '';
        document.title = `${targetTab.name} - Freedom Docs`;
    }
    renderTabs();
    updateUI();
    triggerMemoryAutoSave();
}

function createNewTab() {
    localFileHandle = null;

    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) {
        currentTab.content = editor.innerHTML;
        currentTab.notePad = document.getElementById('note-pad').value;
    }

    // Inside createNewTab() ...
    const newId = nextTabId++;
    const newName = `Untitled Document (${tabs.length + 1})`;
    const newTab = { 
        id: newId, 
        name: newName, 
        content: 'Type here...', 
        notePad: '',
        isStarred: false // New baseline parameter
    };
    
    tabs.push(newTab);
    currentTabId = newId;
    
    editor.innerHTML = newTab.content;
    docNameInput.value = newTab.name;
    document.getElementById('note-pad').value = '';
    document.title = `${newName} - Freedom Docs`;
    
    renderTabs();
    updateUI();
    triggerMemoryAutoSave();
}

function closeTab(id) {
    if (tabs.length === 1) {
        alert("Workspace must preserve at least one active tab record frame.");
        return;
    }
    
    const index = tabs.findIndex(t => t.id === id);
    if (index === -1) return;
    
    tabs.splice(index, 1);

    if (currentTabId === id) {
        localFileHandle = null;
        const structuralFallbackTab = tabs[index] || tabs[index - 1];
        currentTabId = structuralFallbackTab.id;
        editor.innerHTML = structuralFallbackTab.content;
        docNameInput.value = structuralFallbackTab.name;
        document.getElementById('note-pad').value = structuralFallbackTab.notePad || '';
        document.title = `${structuralFallbackTab.name} - Freedom Docs`;
    }
    renderTabs();
    updateUI();
    triggerMemoryAutoSave();
}

docNameInput.addEventListener('input', () => {
    const currentTab = tabs.find(t => t.id === currentTabId);
    if (currentTab) {
        currentTab.name = docNameInput.value || 'Untitled Document';
        const liveTabLabel = document.getElementById(`tab-title-node-${currentTabId}`);
        if (liveTabLabel) liveTabLabel.innerText = currentTab.name;
        document.title = `${currentTab.name} - Freedom Docs`;
        triggerMemoryAutoSave();
    }
});

// --- Dropdown Management Tools ---
function closeMenus() {
    if(formatDropdown) formatDropdown.classList.remove('show'); if(formatBtn) formatBtn.classList.remove('active');
    if(fileDropdown) fileDropdown.classList.remove('show'); if(fileBtn) fileBtn.classList.remove('active');
    if(viewDropdown) viewDropdown.classList.remove('show'); if(viewBtn) viewBtn.classList.remove('active');
    if(modeDropdown) modeDropdown.classList.remove('show'); if(modeBtn) modeBtn.classList.remove('active');
    if(helpDropdown) helpDropdown.classList.remove('show'); if(helpBtn) helpBtn.classList.remove('active');
    if(toolsDropdown) toolsDropdown.classList.remove('show'); if(toolsBtn) toolsBtn.classList.remove('active');
    if(formatBtn) formatBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); formatDropdown.classList.add('show'); formatBtn.classList.add('active'); });
    // Add the Insert menu to the close loop
    if(insertDropdown) insertDropdown.classList.remove('show'); if(insertBtn) insertBtn.classList.remove('active'); 
}


if(toolsBtn) toolsBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); toolsDropdown.classList.add('show'); toolsBtn.classList.add('active'); });
if(insertBtn) insertBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); insertDropdown.classList.add('show'); insertBtn.classList.add('active'); });
if(fileBtn) fileBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); fileDropdown.classList.add('show'); fileBtn.classList.add('active'); });
if(viewBtn) viewBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); viewDropdown.classList.add('show'); viewBtn.classList.add('active'); });
if(modeBtn) modeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeMenus(); modeDropdown.classList.add('show'); modeBtn.classList.add('active'); });
window.addEventListener('click', closeMenus);

window.addEventListener('click', (e) => {
    const sModal = document.getElementById('shortcuts-modal');
    if (e.target === sModal) toggleShortcutsModal(false);
    
    const bModal = document.getElementById('bug-modal');
    if (e.target === bModal) toggleBugModal(false);
});

// --- Operational View Modes Configuration Shifts ---
function setMode(mode) {
    const modeIcon = document.getElementById('mode-icon');
    const modeText = document.getElementById('mode-text');

    if (mode === 'editable') {
        modeIcon.innerText = 'edit'; modeIcon.style.color = 'var(--blue-primary)';
        modeText.innerText = 'Editing';
        editor.contentEditable = "true";
        notesSidebar.classList.remove('active');
    } else if (mode === 'note') {
        modeIcon.innerText = 'edit_note'; modeIcon.style.color = '#e37400';
        modeText.innerText = 'Note-taking';
        editor.contentEditable = "false"; 
        notesSidebar.classList.add('active'); 
        document.getElementById('note-pad').focus();
    } else if (mode === 'readonly') {
        modeIcon.innerText = 'visibility'; modeIcon.style.color = '#c2185b';
        modeText.innerText = 'Read-only';
        editor.contentEditable = "false";
        notesSidebar.classList.remove('active');
    }
    closeMenus();
}

// --- Reversible Highlighter Engine ---
function highlightSelection() {
    const currentMode = document.getElementById('mode-text').innerText;
    if (currentMode === 'Read-only') return; 

    const originalState = editor.contentEditable;
    editor.contentEditable = "true"; 

    const selectedColor = document.queryCommandValue('hiliteColor');
    const isAlreadyHighlighted = selectedColor && (
        selectedColor === 'rgb(255, 235, 59)' || 
        selectedColor === '#ffeb3b' || 
        selectedColor.toString().includes('255, 235') ||
        selectedColor.toString().toLowerCase() === 'yellow'
    );

    if (isAlreadyHighlighted) {
        document.execCommand('hiliteColor', false, 'transparent');
    } else {
        document.execCommand('hiliteColor', false, '#ffeb3b');
    }

    editor.contentEditable = originalState; 
    if (originalState === "true") { editor.focus(); }
    handleWorkspaceMutation();
}

// --- Native Document Execution Engine Tools ---
function exec(cmd, val = null) {
    if (editor.contentEditable === "false") return;
    document.execCommand(cmd, false, val);
    handleWorkspaceMutation();
}

function changeSize(dir) {
    if (editor.contentEditable === "false") return;
    fontSize += dir;
    sizeInput.value = fontSize;
    document.execCommand('fontSize', false, "1");
    const fontTags = editor.getElementsByTagName('font');
    for (let f of fontTags) { f.style.fontSize = fontSize + "pt"; f.removeAttribute('size'); }
    handleWorkspaceMutation();
}

// --- File Options Action Intercept Triggers ---
function makeCopy() {
    sessionStorage.setItem('copyTitle', docNameInput.value + ' - Copy');
    sessionStorage.setItem('copyContent', editor.innerHTML);
    window.open(window.location.href, '_blank');
}

function shareEmail() {
    const subject = encodeURIComponent(docNameInput.value);
    const bodyText = encodeURIComponent(editor.innerText);
    window.location.href = `mailto:?subject=${subject}&body=${bodyText}`;
}

function renameDoc() { docNameInput.focus(); docNameInput.select(); }

function moveToBin() {
    if(confirm("Are you sure you want to completely clear the workspace layout parameters on this specific tab?")) {
        editor.innerHTML = 'Type here...';
        handleWorkspaceMutation();
    }
}

function triggerOpenFile() { fileInput.click(); }

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const lastDotIndex = file.name.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
    
    docNameInput.value = name;
    
    const reader = new FileReader();
    reader.onload = (event) => { 
        editor.innerHTML = event.target.result.replace(/\n/g, '<br>'); 
        
        const activeTab = tabs.find(t => t.id === currentTabId);
        if (activeTab) {
            activeTab.name = name;
            activeTab.content = editor.innerHTML;
            document.title = `${name} - Freedom Docs`;
            renderTabs();
        }
        handleWorkspaceMutation();
    };
    reader.readAsText(file); fileInput.value = '';
});

function downloadMD() {
    const title = docNameInput.value || 'document';
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(editor.innerHTML);
    const blob = new Blob([markdown], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `${title}.md`; link.click();
}

// Intercept typing inside side note elements
document.getElementById('note-pad').addEventListener('input', triggerMemoryAutoSave);

function toggleSidebarView() { document.getElementById('doc-sidebar').classList.toggle('collapsed'); }

function togglePrintLayout() {
    isPrintLayout = !isPrintLayout;
    document.getElementById('check-print-layout').innerText = isPrintLayout ? "✓" : "";
    if (isPrintLayout) container.classList.remove('compact-view');
    else container.classList.add('compact-view');
}

// --- Global Keydown Event Listeners for System Shortcuts ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 's' || e.key === 'S') { 
            e.preventDefault(); 
            downloadMD(); 
        }
        if (e.key === 'o' || e.key === 'O') { 
            e.preventDefault(); 
            triggerOpenFile(); 
        }
        if (e.altKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            toggleSidebarView();
        }
    }
    if (e.key === 'Escape') {
        toggleShortcutsModal(false);
        toggleBugModal(false);
    }
});

function updateUI() {
    document.getElementById('t-btn-b').classList.toggle('active', document.queryCommandState('bold'));
    document.getElementById('t-btn-i').classList.toggle('active', document.queryCommandState('italic'));
}

editor.onkeyup = handleWorkspaceMutation; 
editor.onmouseup = updateUI;

// Execute initialization runtime load sequence
initWorkspace();

function sendBugReportEmail() {
    const developerEmail = "bug.reports@outlook.com"; // support email
    const activeTab = tabs.find(t => t.id === currentTabId);
    const tabName = activeTab ? activeTab.name : "Unknown Tab";
    
    const subject = encodeURIComponent(`Bug Report - Freedom Docs: ${tabName}`);
    
    // Constructing an informative body to help you debug quicker
    const bodyText = encodeURIComponent(
        `[Please describe the bug and steps to reproduce below]\n\n` +
        `\n\n` +
        `-------------------------------------\n` +
        `DEBUG TELEMETRY SYSTEM LOGS:\n` +
        `-------------------------------------\n` +
        `Active Tab: ${tabName}\n` +
        `Browser App Version: ${navigator.userAgent}\n` +
        `Platform: ${navigator.platform}\n` +
        `Workspace Font Size: ${fontSize}pt\n` +
        `Print Layout Active: ${isPrintLayout}\n`
    );
    
    // Trigger the OS mail client redirect
    window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${bodyText}`;
}

// --- Insert Menu Functional Execution Engine ---

async function execAction(action) {
    if (editor.contentEditable === "false") return;
    editor.focus();

    if (action === 'copy') {
        document.execCommand('copy');
    } else if (action === 'paste') {
        try {
            // Attempt modern clipboard fetch
            const text = await navigator.clipboard.readText();
            document.execCommand('insertText', false, text);
        } catch (err) {
            // Fallback warning for rigid browser sandboxes
            alert("Your browser security blocks automatic pasting from this menu. Please use Ctrl+V (or Cmd+V) to paste.");
        }
    }
    
    handleWorkspaceMutation();
    closeMenus();
}

function insertElement(type) {
    if (editor.contentEditable === "false") return;
    editor.focus(); 

    if (type === 'image') {
        // Updated to use the local OS file explorer
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.execCommand('insertImage', false, event.target.result);
                    handleWorkspaceMutation();
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    } 
    else if (type === 'link') {
        const url = prompt("Enter the destination URL:");
        if (url) {
            // Fallback if no text is actively highlighted
            if (document.getSelection().toString() === "") {
                document.execCommand('insertHTML', false, `<a href="${url}">${url}</a>`);
            } else {
                document.execCommand('createLink', false, url);
            }
        }
    } 
    else if (type === 'horizontal_line') {
        document.execCommand('insertHorizontalRule', false, null);
    } 
    else if (type === 'emoji') {
        const emoji = prompt("Copy and paste an emoji here:");
        if (emoji) document.execCommand('insertText', false, emoji);
    } 
    else if (type === 'break') {
        // Injects a visual page break indicator
        const breakNode = '<hr style="border: none; border-top: 2px dashed #999; margin: 30px 0; page-break-after: always;" title="Page Break">';
        document.execCommand('insertHTML', false, breakNode);
    }
    
    handleWorkspaceMutation();
    closeMenus();
}
// --- Format Menu Execution Engine ---
function execFormat(command) {
    if (editor.contentEditable === "false") return;
    editor.focus();
    
    // Execute the native formatting command
    document.execCommand(command, false, null);
    
    // Trigger auto-save and UI state updates
    handleWorkspaceMutation();
    closeMenus();
}
// =======================================================
// CONTEXT RICH TEXT TOOLBAR FUNCTIONAL MODULE ENGINE
// =======================================================

function execTool(command, value = null) {
    if (editor.contentEditable === "false") return;
    editor.focus();

    document.execCommand(command, false, value);
    
    // Propagate updates instantly through system memory and filesystem tracking sync loops
    if (typeof handleWorkspaceMutation === "function") {
        handleWorkspaceMutation();
    } else {
        updateUI();
    }
}

function adjustToolbarFontSize(direction) {
    if (editor.contentEditable === "false") return;
    
    // Sync adjustments cleanly with your existing global fontSize variable tracking limits
    fontSize = Math.max(1, fontSize + direction);
    
    const displayInput = document.getElementById('toolbar-size-display');
    if (displayInput) displayInput.value = fontSize;
    
    // Update local toolbar input box if present
    const sizeInputLocal = document.getElementById('size-val');
    if (sizeInputLocal) sizeInputLocal.value = fontSize;

    editor.focus();
    document.execCommand('fontSize', false, "1");
    
    const fontTags = editor.getElementsByTagName('font');
    for (let f of fontTags) { 
        f.style.fontSize = fontSize + "pt"; 
        f.removeAttribute('size'); 
    }

    if (typeof handleWorkspaceMutation === "function") {
        handleWorkspaceMutation();
    }
}

// Extend your existing selection status listeners array framework to monitor state rules
function syncToolbarSelectionStates() {
    const boldActive = document.queryCommandState('bold');
    const italicActive = document.queryCommandState('italic');
    const underlineActive = document.queryCommandState('underline');
    const strikeActive = document.queryCommandState('strikethrough');

    const btnB = document.getElementById('t-btn-b');
    const btnI = document.getElementById('t-btn-i');
    const btnU = document.getElementById('t-btn-u');
    const btnStrike = document.getElementById('t-btn-strike');

    if (btnB) btnB.classList.toggle('active', boldActive);
    if (btnI) btnI.classList.toggle('active', italicActive);
    if (btnU) btnU.classList.toggle('active', underlineActive);
    if (btnStrike) btnStrike.classList.toggle('active', strikeActive);
    
    // Sync numerical state indicator displays
    const displayInput = document.getElementById('toolbar-size-display');
    if (displayInput) displayInput.value = fontSize;
}

// Hook selection change listeners to trigger tracking passes safely across user actions
editor.addEventListener('keyup', syncToolbarSelectionStates);
editor.addEventListener('mouseup', syncToolbarSelectionStates);
window.addEventListener('load', syncToolbarSelectionStates);

// =======================================================
// TOOLBAR REPLACEMENT ADDITIONS ACTION ENGINES
// =======================================================

// Tracks the local toggle states independently
let isWorkspaceZoomed = false;
let isDarkThemeActive = false;

/**
 * Addition 2: Workspace Zoom Focused Layout Frame Toggle
 */
function toggleWorkspaceZoom() {
    const targetWorkspace = document.getElementById('editor-container');
    const zoomButton = document.getElementById('t-btn-zoom');
    
    if (!targetWorkspace) return;
    
    isWorkspaceZoomed = !isWorkspaceZoomed;
    targetWorkspace.classList.toggle('zoomed-focus', isWorkspaceZoomed);
    
    if (zoomButton) {
        zoomButton.classList.toggle('active', isWorkspaceZoomed);
        // Swap visual cue to signify zoom state out
        zoomButton.querySelector('span').innerText = isWorkspaceZoomed ? 'zoom_out' : 'zoom_in';
    }
}

/**
 * Addition 3: Global Base Application Theme Context Switcher
 */
function toggleDarkModeLayout() {
    const rootBody = document.body;
    const darkButton = document.getElementById('t-btn-dark');
    
    isDarkThemeActive = !isDarkThemeActive;
    rootBody.classList.toggle('dark-theme-active', isDarkThemeActive);
    
    if (darkButton) {
        darkButton.classList.toggle('active', isDarkThemeActive);
    }
    
    // Optional: If you want this option to survive tab refreshes,
    // you could pipe this flag to localStorage right here.
}

// =======================================================
// EXTENDED TOOLS UTILITIES ENGINE CONTROLLERS
// =======================================================

let voiceRecognitionInstance = null;
let isVoiceListening = false;

// =======================================================
// FIXED TOOLS ROUTING ENGINE AND MODAL INTERFACE VIA DROPDOWN
// =======================================================

function runToolAction(action) {
    closeMenus(); // Clean out visible dropdown states instantly
    
    // FIXED: Routed cleanly to the custom modal display card instead of the browser alert
    if (action === 'wordCount') {
        openWordCountModal();
    } 
    
    else if (action === 'dictionary') {
        const selectedText = window.getSelection().toString().trim();
        const lookupWord = selectedText || prompt("Enter the word you would like to look up:");
        if (lookupWord) {
            window.open(`https://www.google.com/search?q=define+${encodeURIComponent(lookupWord)}`, '_blank');
        }
    } 
    
    else if (action === 'translate') {
        alert("To translate your document offline, select your target text, copy it, and paste into a translation engine.");
    } 
    
    else if (action === 'voiceTyping') {
        initiateVoiceTypingEngine();
    }
}

/**
 * Open Word Count Modal Overlay Frame
 * FIXED: Explicitly unhides the container over the layout body using the flex target rule
 */
function openWordCountModal() {
    // Run the metric calculator engine to populate text values into the fields
    if (typeof calculateDocumentMetrics === "function") {
        calculateDocumentMetrics();
    }
    
    const modalBackplate = document.getElementById('wordcount-modal-backplate');
    if (modalBackplate) {
        modalBackplate.style.display = 'flex'; // Unhides the backdrop over the screen viewport
    }
}

/**
 * Close Word Count Modal Overlay Frame
 */
function closeWordCountModal() {
    const modalBackplate = document.getElementById('wordcount-modal-backplate');
    if (modalBackplate) {
        modalBackplate.style.display = 'none'; // Hides the interface gracefully
    }
}

/**
 * Built-In Web Speech Transcription Pipeline API Hook
 */
function initiateVoiceTypingEngine() {
    if (editor.contentEditable === "false") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your current browser engine does not support native Web Speech Voice Recognition infrastructure features.");
        return;
    }

    const voiceIcon = document.getElementById('voice-icon');
    const voiceLabel = document.getElementById('voice-text-label');

    if (isVoiceListening) {
        if (voiceRecognitionInstance) voiceRecognitionInstance.stop();
        return;
    }

    voiceRecognitionInstance = new SpeechRecognition();
    voiceRecognitionInstance.continuous = true;
    voiceRecognitionInstance.interimResults = false;
    voiceRecognitionInstance.lang = 'en-US';

    voiceRecognitionInstance.onstart = () => {
        isVoiceListening = true;
        editor.focus();
        if (voiceIcon) { voiceIcon.style.color = '#d93025'; voiceIcon.innerText = 'mic_active'; }
        if (voiceLabel) voiceLabel.innerText = "Listening...";
    };

    voiceRecognitionInstance.onresult = (event) => {
        const resultIndex = event.resultIndex;
        const transcriptText = event.results[resultIndex][0].transcript;
        
        // Push speech block down streaming directly to caret focal node position paths
        document.execCommand('insertText', false, transcriptText);
        if (typeof handleWorkspaceMutation === "function") handleWorkspaceMutation();
    };

    voiceRecognitionInstance.onerror = (err) => {
        console.error("Speech capturing operational subsystem fault error context:", err);
        terminateVoiceTrackingState();
    };

    voiceRecognitionInstance.onend = () => {
        terminateVoiceTrackingState();
    };

    voiceRecognitionInstance.start();
}

function terminateVoiceTrackingState() {
    isVoiceListening = false;
    const voiceIcon = document.getElementById('voice-icon');
    const voiceLabel = document.getElementById('voice-text-label');
    
    if (voiceIcon) { voiceIcon.style.color = ''; voiceIcon.innerText = 'mic'; }
    if (voiceLabel) voiceLabel.innerText = "Voice typing";
}

// Add system global event listeners tracking matrix hooks to match keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        if (e.key === 'c' || e.key === 'C') { e.preventDefault(); runToolAction('wordCount'); }
        if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); runToolAction('dictionary'); }
        if (e.key === 's' || e.key === 'S') { e.preventDefault(); runToolAction('voiceTyping'); }
    }
});

// =======================================================
// HIGH-FIDELITY WORD COUNT AND OVERLAY LOGIC MODULE
// =======================================================

let isLivePillTrackingActive = false;

function openWordCountModal() {
    calculateDocumentMetrics(); // Update calculations inside nodes
    const modalNode = document.getElementById('wordcount-modal-backplate');
    if (modalNode) modalNode.style.display = 'flex';
}

function closeWordCountModal() {
    const modalNode = document.getElementById('wordcount-modal-backplate');
    if (modalNode) modalNode.style.display = 'none';
}

/**
 * Metric Parser Computation Engine Logic Loop
 */
function calculateDocumentMetrics() {
    const textSurface = document.getElementById('editor');
    if (!textSurface) return { words: 0, chars: 0, noSpaces: 0, pages: 1 };

    const cleanRawString = textSurface.innerText || '';
    
    // Process text string patterns cleanly via targeted regex filters
    const layoutNormalizedText = cleanRawString.trim().replace(/\s+/g, ' ');
    const computedWordCount = layoutNormalizedText === '' ? 0 : layoutNormalizedText.split(' ').length;
    const computedCharCount = cleanRawString.length;
    const computedCharsNoSpaces = cleanRawString.replace(/\s/g, '').length;
    
    // Assume basic Google standard ratio criteria mapping of 500 words per physical page
    const computedPageEstimate = Math.max(1, Math.ceil(computedWordCount / 500));

    // Map calculated counts over layout visual display field nodes
    const nodePages = document.getElementById('stat-val-pages');
    const nodeWords = document.getElementById('stat-val-words');
    const nodeChars = document.getElementById('stat-val-chars');
    const nodeNoSpaces = document.getElementById('stat-val-nospaces');

    if (nodePages) nodePages.innerText = computedPageEstimate;
    if (nodeWords) nodeWords.innerText = computedWordCount;
    if (nodeChars) nodeChars.innerText = computedCharCount;
    if (nodeNoSpaces) nodeNoSpaces.innerText = computedCharsNoSpaces;

    return {
        words: computedWordCount,
        chars: computedCharCount
    };
}

/**
 * Live Tracking UI Switch Interface Coordinator
 */
function handlePillVisibilitySwitch(checkboxNode) {
    const trackingPill = document.getElementById('workspace-wordcount-pill');
    isLivePillTrackingActive = checkboxNode.checked;

    if (isLivePillTrackingActive) {
        if (trackingPill) trackingPill.style.display = 'block';
        triggerLivePillMetricsRefresh();
    } else {
        if (trackingPill) trackingPill.style.display = 'none';
    }
}

function triggerLivePillMetricsRefresh() {
    if (!isLivePillTrackingActive) return;
    
    const currentMetrics = calculateDocumentMetrics();
    const pillTextNode = document.getElementById('pill-text-render');
    
    if (pillTextNode) {
        pillTextNode.innerText = `${currentMetrics.words} words`;
    }
}

/**
 * Intercept your application's central mutation listener hooks 
 * to pass processing streams down to tracking panels passively.
 */
document.getElementById('editor').addEventListener('input', () => {
    if (isLivePillTrackingActive) {
        triggerLivePillMetricsRefresh();
    }
});
// =======================================================
// MODULAR WORKSPACE SEARCH AND FIND ENGINE MODULE
// =======================================================

let activeSearchHighlights = [];

/**
 * Main Orchestrator: Scans, Highlights, or Resets the workspace view
 * @param {string} query - The search term passed from your navbar input
 */
function executeWorkspaceSearch(query) {
    // 1. Always clear old highlights first to reset state gracefully
    clearWorkspaceHighlights();

    const normalizedQuery = query ? query.trim().toLowerCase() : '';
    if (!normalizedQuery) return; // Exit if search box was cleared

    const editorWorkspace = document.getElementById('editor');
    if (!editorWorkspace) return;

    // Use a DOM Tree Walker to scan ONLY text nodes (leaves formatting tags safe)
    const treeWalker = document.createTreeWalker(
        editorWorkspace,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const nodesToProcess = [];
    while (treeWalker.nextNode()) {
        nodesToProcess.push(treeWalker.currentNode);
    }

    // Passively track matches without mutating persistent structural markup strings
    nodesToProcess.forEach(textNode => {
        const textContent = textNode.nodeValue;
        const lowercaseContent = textContent.toLowerCase();
        let matchIndex = lowercaseContent.indexOf(normalizedQuery);

        // Loop handles multiple matches found within a single text string block
        if (matchIndex !== -1) {
            const parentElement = textNode.parentNode;
            
            // Safety guard: Don't highlight matches inside elements that are already search marks
            if (parentElement && parentElement.classList.contains('search-mark-highlight')) {
                return;
            }

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            while (matchIndex !== -1) {
                // Append text preceding the match string
                if (matchIndex > lastIndex) {
                    fragment.appendChild(document.createTextNode(textContent.substring(lastIndex, matchIndex)));
                }

                // Create the temporary visual markup indicator token node
                const highlightWrapper = document.createElement('mark');
                highlightWrapper.className = 'search-mark-highlight';
                highlightWrapper.textContent = textContent.substring(matchIndex, matchIndex + normalizedQuery.length);
                
                fragment.appendChild(highlightWrapper);
                activeSearchHighlights.push(highlightWrapper); // Push to tracking register index stack

                lastIndex = matchIndex + normalizedQuery.length;
                matchIndex = lowercaseContent.indexOf(normalizedQuery, lastIndex);
            }

            // Append remaining text tail segment if present
            if (lastIndex < textContent.length) {
                fragment.appendChild(document.createTextNode(textContent.substring(lastIndex)));
            }

            // Swap the plain node with the compiled highlight fragment directly on the DOM tree
            if (parentElement) {
                parentElement.replaceChild(fragment, textNode);
            }
        }
    });
}

/**
 * State Reset: Cleanly strips visual highlight layers without altering underlying document content
 */
function clearWorkspaceHighlights() {
    if (activeSearchHighlights.length === 0) return;

    // Process bottom-up array loops to merge text blocks seamlessly back together
    activeSearchHighlights.forEach(markElement => {
        if (markElement && markElement.parentNode) {
            const parent = markElement.parentNode;
            const plainTextNode = document.createTextNode(markElement.textContent);
            
            parent.replaceChild(plainTextNode, markElement);
            parent.normalize(); // Collapses adjacent text nodes automatically to avoid structure fragmentation
        }
    });

    activeSearchHighlights = [];
}
/**
 * UI Helper: Handles manual clearing via the structural 'X' icon link click
 */
function clearSearchInput() {
    const searchField = document.getElementById('navbar-search-input');
    const clearBtn = document.getElementById('navbar-search-clear');
    
    if (searchField) {
        searchField.value = '';
        searchField.focus();
    }
    if (clearBtn) clearBtn.style.display = 'none';
    
    // Fire the engine back to strip highlights instantly
    if (typeof clearWorkspaceHighlights === 'function') {
        clearWorkspaceHighlights();
    }
}

// Observe live entry cycles to reveal/hide the clear icon dynamically
document.getElementById('navbar-search-input')?.addEventListener('input', (e) => {
    const clearBtn = document.getElementById('navbar-search-clear');
    if (clearBtn) {
        clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
    }
});
const searchField = document.getElementById('navbar-search-input');

if (searchField) {
    // Listens to character key-up changes to drive real-time highlights seamlessly
    searchField.addEventListener('input', (e) => {
        const currentQuery = e.target.value;
        executeWorkspaceSearch(currentQuery);
        console.log(`Searching for: ${currentQueryw}`)
    });

    //Strips highlights instantly if user presses the Escape key
    searchField.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchField.value = '';
            clearWorkspaceHighlights();
            searchField.blur();
        }
    });
}