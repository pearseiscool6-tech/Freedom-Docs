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
// --- Document System Storage States ---
let documents = [];
let tags = [];
let currentdocumentId = 1;
let nextdocumentId = 2;
let nextTagId = 1;

// --- File System Access API Handles ---
let localFileHandle = null; 

// --- Initialize Workspace Application Sequence ---
function initWorkspace() {
    // Attempt to pull workspace data back out of Browser Local Memory
    const savedData = localStorage.getItem('freedom_docs_workspace');
    
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            // Backward compatibility fallback to safely migrate older session arrays
            documents = parsed.documents || parsed.tabs || [];
            tags = parsed.tags || [];
            currentdocumentId = parsed.currentdocumentId || parsed.currentTabId || 1;
            nextdocumentId = parsed.nextdocumentId || parsed.nextTabId || 2;
            nextTagId = parsed.nextTagId || 1;
            
            // Restore toggle preference if it was explicitly saved previously
            if (parsed.hasOwnProperty('isAutoSaveEnabled')) {
                isAutoSaveEnabled = parsed.isAutoSaveEnabled;
            }
        } catch (e) {
            showError("Workspace Error", "Local recovery corrupted. Clearing frame registry.");
            console.error("Local recovery corrupted. Clearing frame registry.");
            loadDefaultdocumentState();
        }
    } else {
        console.log("No saved date found")
        loadDefaultdocumentState();
    }

    if (!documents || documents.length === 0) {
        loadDefaultdocumentState();
    }

    // Render workspace target nodes
    const activedocument = documents.find(t => t.id === currentdocumentId);
    if (activedocument) {
        editor.innerHTML = activedocument.content;
        docNameInput.value = activedocument.name;
        document.getElementById('note-pad').value = activedocument.notePad || '';
        document.title = `${activedocument.name} - Freedom Docs`;
        console.log(`Workspace Title: ${activedocument.name}`)
    }
    
    // Sync Visual State of the Switch UI matching Preference Rules
    updateSwitchUI();
    renderdocuments();
    renderTags();
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
        // If turned off, clean out browser memory but retain internal document matrices array
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

    // Force active workspace changes into the primary document structural matrix state array
    const currentdocument = documents.find(t => t.id === currentdocumentId);
    if (currentdocument) {
        currentdocument.content = editor.innerHTML;
        currentdocument.notePad = document.getElementById('note-pad').value;
    }

    const payload = {
        documents: documents,
        tags: tags,
        currentdocumentId: currentdocumentId,
        nextdocumentId: nextdocumentId,
        nextTagId: nextTagId,
        isAutoSaveEnabled: isAutoSaveEnabled // Persist configuration flag state parameter
    };
    localStorage.setItem('freedom_docs_workspace', JSON.stringify(payload));
}

function loadDefaultdocumentState() {
    //sets precedent for new documents
    documents = [{ id: 1, name: 'Untitled Document', content: 'Type here...', notePad: '', isbookmarked: false }];
    tags = [];
    currentdocumentId = 1;
    nextdocumentId = 2;
    nextTagId = 1;
    document.title = "Untitled Document - Freedom Docs";
}

// --- Direct Local File System Auto-Save Trigger Sync ---
async function triggerFileAutoSave() {
    if (!localFileHandle) return; // Silent return if file
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
        showError("File Error", "Your current web browser does not support persistent directory write access loops (this is where this file saves your work to a folder on your machine). Please use an updated browser.");
        console.error("Your current web browser does not support persistent directory write access loops.");
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
        alert("File Success", "File linked successfully!");
        triggerFileAutoSave();
    } catch (err) {
        console.error("File handle handshake connection sequence aborted: ", err);
        showError("File Error", "File handle handshake connection sequence aborted: " + err.message);
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

function sendBugReportEmail() {
    const activedocument = documents.find(t => t.id === currentdocumentId);
    const documentName = activedocument ? activedocument.name : "Unknown document";
    
    const developerEmail = "bug.reports@outlook.com"; 
    const subject = encodeURIComponent(`Bug Report - Freedom Docs: ${documentName}`);
    
    const bodyText = encodeURIComponent(
        `User Contact Email: Your email here ...\n\n` +
        `Description of Bug: Describe the bug and steps to reproduce\n\n` +
        `-------------------------------------\n` +
        `DEBUG TELEMETRY SYSTEM LOGS:\n` +
        `-------------------------------------\n` +
        `Active document Workspace: ${documentName}\n` +
        `Browser App Version: ${navigator.userAgent}\n` +
        `Platform: ${navigator.platform}\n` +
        `Workspace Font Size: ${fontSize}pt\n` +
        `Print Layout Active: ${isPrintLayout}\n` +
        `Auto-Save Enabled: ${isAutoSaveEnabled}\n` +
        `Number of Open documents: ${documents.length}\n` +
        `Current Mode: ${document.getElementById('mode-text').innerText}\n` +
        `-------------------------------------\n` +
        `Disclaimer: This email will be received by the me, the sole developer and is intended solely for the purpose of improving Freedom Docs. \n` +
        `Telemetry data is collected to help improve the application, and run completely locally. \n` +
        `Please avoid including personal information in your report. `
    );
    
    window.location.href = `mailto:${developerEmail}?subject=${subject}&body=${bodyText}`;
    toggleBugModal(false);
}

// --- Functional document Rendering Matrix Engine ---
function renderdocuments() {
    const documentsContainer = document.getElementById('documents-container');
    if (!documentsContainer) return;
    documentsContainer.innerHTML = '';
    
    // Using 'doc' instead of 'document' to prevent breaking global scope variables
    documents.forEach(doc => {
        const documentEl = document.createElement('div');
        documentEl.className = `document ${doc.id === currentdocumentId ? 'active' : ''}`;
        
        // Wrap switch in an arrow function so the element registers properly
        documentEl.onclick = () => switchdocument(doc.id);
        documentEl.draggable = true;
        documentEl.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', String(doc.id));
            e.dataTransfer.effectAllowed = 'move';
            documentEl.classList.add('dragging');
        });
        documentEl.addEventListener('dragend', () => {
            documentEl.classList.remove('dragging');
        });
        
        // 1. Generate bookmark Icon Configuration
        const bookmarkSpan = document.createElement('span');
        bookmarkSpan.className = 'material-symbols-outlined bookmark';
        bookmarkSpan.innerText = doc.isbookmarked ? 'bookmark' : 'bookmark';
        if (doc.isbookmarked) bookmarkSpan.classList.add('bookmarked');
        
        // 2. Click Handler Matrix
        bookmarkSpan.onclick = (e) => {
            e.stopPropagation(); // Block the click from firing switchdocument()
            doc.isbookmarked = !doc.isbookmarked;
            
            // Instantly update visual local DOM state
            bookmarkSpan.innerText = doc.isbookmarked ? 'bookmark' : 'bookmark';
            bookmarkSpan.style.fontVariationSettings = "'FILL' 1";
            bookmarkSpan.classList.toggle('bookmarked', doc.isbookmarked);
            
            // Persist mutation array to localStorage
            triggerMemoryAutoSave();
        };
        
        // 3. document Title Configuration
        const nameSpan = document.createElement('span');
        nameSpan.id = `document-title-node-${doc.id}`;
        nameSpan.innerText = doc.name;
        nameSpan.style.overflow = "hidden";
        nameSpan.style.textOverflow = "ellipsis";
        nameSpan.style.whiteSpace = "nowrap";
        nameSpan.style.maxWidth = "180px";
        nameSpan.title = "Double-click to rename document";
        
        nameSpan.ondblclick = (e) => {
            e.stopPropagation();
            const newName = prompt("Rename document title:", doc.name);
            if (newName && newName.trim() !== "") {
                doc.name = newName.trim();
                nameSpan.innerText = doc.name;
                
                if (doc.id === currentdocumentId) {
                    if (docNameInput) docNameInput.value = doc.name;
                    document.title = `${doc.name} - Freedom Docs`;
                }
                triggerMemoryAutoSave();
            }
        };
        
        // 4. Close Configuration
        const closeSpan = document.createElement('span');
        closeSpan.className = 'material-symbols-outlined close-document-btn';
        closeSpan.innerText = 'close';
        closeSpan.onclick = (e) => { e.stopPropagation(); closedocument(doc.id); };
        
        // Append all elements left-to-right structurally
        documentEl.appendChild(bookmarkSpan);
        documentEl.appendChild(nameSpan);
        documentEl.appendChild(closeSpan);
        documentsContainer.appendChild(documentEl);
    });
}

function renderTags() {
    const tagsContainer = document.getElementById('tags-container');
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';

    if (tags.length === 0) {
        const placeholder = document.createElement('div');
        placeholder.className = 'tag-placeholder';
        placeholder.innerText = 'No tags yet. Create one to organize documents.';
        tagsContainer.appendChild(placeholder);
        return;
    }

    tags.forEach(tag => {
        const tagChip = document.createElement('div');
        tagChip.className = `tag-chip ${tag.documentIds.includes(currentdocumentId) ? 'active' : ''}`;
        tagChip.title = 'Click the tag name to toggle this document in the tag';

        const tagHeader = document.createElement('div');
        tagHeader.className = 'tag-header';
        tagChip.appendChild(tagHeader);

        const labelContainer = document.createElement('div');
        labelContainer.className = 'tag-label';
        labelContainer.style.flex = '1';
        labelContainer.style.display = 'flex';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.gap = '6px';
        if (!tag.editing) labelContainer.style.cursor = 'pointer';
        labelContainer.onclick = (e) => {
            e.stopPropagation();
            if (!tag.editing) toggleTagMembership(tag.id, currentdocumentId);
        };

        if (tag.editing) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = tag.name;
            input.className = 'tag-name-input';
            input.style.flex = '1';
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    input.value = tag.name;
                    input.blur();
                }
            };
            input.addEventListener('click', (e) => e.stopPropagation());
            input.addEventListener('mousedown', (e) => e.stopPropagation());
            input.onblur = () => finishTagNameEdit(tag.id, input.value);
            setTimeout(() => input.focus(), 0);
            labelContainer.appendChild(input);
        } else {
            const labelText = document.createElement('span');
            labelText.innerText = `${tag.name} (${tag.documentIds.length})`;
            labelText.style.flex = '1';
            labelContainer.appendChild(labelText);
        }

        tagHeader.appendChild(labelContainer);

        const chevron = document.createElement('span');
        chevron.className = 'material-symbols-outlined tag-chevron';
        chevron.innerText = tag.expanded ? 'expand_less' : 'expand_more';
        chevron.title = 'Show documents in this tag';
        chevron.onclick = (e) => {
            e.stopPropagation();
            toggleTagExpanded(tag.id);
        };
        tagHeader.appendChild(chevron);

        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-symbols-outlined tag-delete';
        deleteIcon.innerText = 'close';
        deleteIcon.title = 'Remove tag';
        deleteIcon.onclick = (e) => {
            e.stopPropagation();
            deleteTag(tag.id);
        };
        tagHeader.appendChild(deleteIcon);

        const listContainer = document.createElement('div');
        listContainer.className = 'tag-doc-list';
        listContainer.style.display = tag.expanded ? 'block' : 'none';

        if (tag.documentIds.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'tag-doc-empty';
            emptyMessage.innerText = 'No documents assigned';
            listContainer.appendChild(emptyMessage);
        } else {
            tag.documentIds.forEach(docId => {
                const doc = documents.find(d => d.id === docId);
                if (!doc) return;
                const docItem = document.createElement('div');
                docItem.className = 'tag-doc-item';
                docItem.innerText = doc.name;
                docItem.title = 'Open this document';
                docItem.onclick = (e) => {
                    e.stopPropagation();
                    switchdocument(doc.id);
                };
                listContainer.appendChild(docItem);
            });
        }

        tagChip.appendChild(listContainer);
        tagChip.addEventListener('dragover', (e) => {
            e.preventDefault();
            tagChip.classList.add('drop-target');
        });
        tagChip.addEventListener('dragleave', () => {
            tagChip.classList.remove('drop-target');
        });
        tagChip.addEventListener('drop', (e) => {
            e.preventDefault();
            tagChip.classList.remove('drop-target');
            const droppedId = Number(e.dataTransfer.getData('text/plain'));
            if (!isNaN(droppedId)) {
                toggleTagMembership(tag.id, droppedId);
            }
        });
        tagChip.ondblclick = (e) => {
            e.stopPropagation();
            startTagNameEdit(tag.id);
        };

        tagsContainer.appendChild(tagChip);
    });
}

function startTagNameEdit(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    tag.editing = true;
    tag.expanded = true;
    renderTags();
}

function toggleTagExpanded(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    tag.expanded = !tag.expanded;
    renderTags();
}

function finishTagNameEdit(tagId, newName) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    tag.name = newName.trim() || tag.name;
    tag.editing = false;
    triggerMemoryAutoSave();
    renderTags();
}

function toggleTagMembership(tagId, docId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag || !docId) return;

    const index = tag.documentIds.indexOf(docId);
    if (index === -1) {
        tag.documentIds.push(docId);
    } else {
        tag.documentIds.splice(index, 1);
    }

    triggerMemoryAutoSave();
    renderTags();
}

function renameTag(tagId) {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    const newName = prompt('Rename tag:', tag.name);
    if (newName && newName.trim()) {
        tag.name = newName.trim();
        triggerMemoryAutoSave();
        renderTags();
    }
}

function deleteTag(tagId) {
    const index = tags.findIndex(t => t.id === tagId);
    if (index === -1) return;
    tags.splice(index, 1);
    triggerMemoryAutoSave();
    renderTags();
}

function removeDocumentFromAllTags(docId) {
    tags.forEach(tag => {
        const index = tag.documentIds.indexOf(docId);
        if (index !== -1) {
            tag.documentIds.splice(index, 1);
        }
    });
}

function switchdocument(id) {
    if (id === currentdocumentId) return;
    
    // Sever active connection handle to ensure we don't overwrite alternative document files
    localFileHandle = null; 

    const currentdocument = documents.find(t => t.id === currentdocumentId);
    if (currentdocument) {
        currentdocument.content = editor.innerHTML;
        currentdocument.notePad = document.getElementById('note-pad').value;
    }

    currentdocumentId = id;
    const targetdocument = documents.find(t => t.id === currentdocumentId);
    if (targetdocument) {
        editor.innerHTML = targetdocument.content;
        docNameInput.value = targetdocument.name;
        document.getElementById('note-pad').value = targetdocument.notePad || '';
        document.title = `${targetdocument.name} - Freedom Docs`;
    }
    renderdocuments();
    renderTags();
    updateUI();
    triggerMemoryAutoSave();
}

function createNewdocument() {
    localFileHandle = null;

    const currentdocument = documents.find(t => t.id === currentdocumentId);
    if (currentdocument) {
        currentdocument.content = editor.innerHTML;
        currentdocument.notePad = document.getElementById('note-pad').value;
    }

    const newId = nextdocumentId++;
    const newName = `Untitled Document (${documents.length + 1})`;
    const newdocument = { 
        id: newId, 
        name: newName, 
        content: 'Type here...', 
        notePad: '',
        isbookmarked: false 
    };
    
    documents.push(newdocument);
    currentdocumentId = newId;
    
    editor.innerHTML = newdocument.content;
    docNameInput.value = newdocument.name;
    document.getElementById('note-pad').value = '';
    document.title = `${newName} - Freedom Docs`;
    
    renderdocuments();
    renderTags();
    updateUI();
    triggerMemoryAutoSave();
}

function createNewtag() {
    const currentdocument = documents.find(t => t.id === currentdocumentId);
    const newTag = {
        id: nextTagId++,
        name: `New Tag ${tags.length + 1}`,
        documentIds: currentdocument ? [currentdocument.id] : [],
        editing: true
    };

    tags.push(newTag);
    renderTags();
    triggerMemoryAutoSave();
}

function closedocument(id) {
    if (documents.length === 1) {
        showError("Document Error", "Workspace must preserve at least one active document record frame.");
        return;
    }
    
    const index = documents.findIndex(t => t.id === id);
    if (index === -1) return;
    
    documents.splice(index, 1);

    if (currentdocumentId === id) {
        localFileHandle = null;
        const structuralFallbackdocument = documents[index] || documents[index - 1];
        currentdocumentId = structuralFallbackdocument.id;
        editor.innerHTML = structuralFallbackdocument.content;
        docNameInput.value = structuralFallbackdocument.name;
        document.getElementById('note-pad').value = structuralFallbackdocument.notePad || '';
        document.title = `${structuralFallbackdocument.name} - Freedom Docs`;
    }
    removeDocumentFromAllTags(id);
    renderdocuments();
    renderTags();
    updateUI();
    triggerMemoryAutoSave();
}

docNameInput.addEventListener('input', () => {
    const currentdocument = documents.find(t => t.id === currentdocumentId);
    if (currentdocument) {
        currentdocument.name = docNameInput.value || 'Untitled Document';
        const livedocumentLabel = document.getElementById(`document-title-node-${currentdocumentId}`);
        if (livedocumentLabel) livedocumentLabel.innerText = currentdocument.name;
        document.title = `${currentdocument.name} - Freedom Docs`;
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

fnSizeDir = 0;
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
    if(confirm("Are you sure you want to completely clear the workspace layout parameters on this specific document?")) {
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
        
        const activedocument = documents.find(t => t.id === currentdocumentId);
        if (activedocument) {
            activedocument.name = name;
            activedocument.content = editor.innerHTML;
            document.title = `${name} - Freedom Docs`;
            renderdocuments();
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
            showError("Clipboard Error", "Your browser security blocks automatic pasting from this menu. Please use Ctrl+V (or Cmd+V) to paste.");
        }
    }
    
    handleWorkspaceMutation();
    closeMenus();
}
// Insert functionality 
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
// TOOLBAR FUNCTIONALITY AND STATE MANAGEMENT
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
//changes font size to be applied to selected text or future text if no selection, with a live numerical display in the toolbar
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

// Add bold, italic, underline, and strikethrough state synchronization 
// to update the toolbar button active states based on the current selection
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
// TOOLS UTILITIES ENGINES
// =======================================================

// Tracks the local toggle states independently
let isWorkspaceZoomed = false;
let isDarkThemeActive = false;

// Zoom 
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

// Dark/Light Mode
function toggleDarkModeLayout() {
    const rootBody = document.body;
    const darkButton = document.getElementById('t-btn-dark');
    
    isDarkThemeActive = !isDarkThemeActive;
    rootBody.classList.toggle('dark-theme-active', isDarkThemeActive);
    
    if (darkButton) {
        darkButton.classList.toggle('active', isDarkThemeActive);
    }
}

let voiceRecognitionInstance = null;
let isVoiceListening = false;

function runToolAction(action) {
    closeMenus(); // Clean out visible dropdown states instantly
    if (action === 'wordCount') {
        openWordCountModal();
        console.log("Word count modal opened.");
    } else if (action === 'dictionary') {
        const selectedText = window.getSelection().toString().trim();
        const lookupWord = selectedText || prompt("Enter the word you would like to look up:");
        if (lookupWord) {
            window.open(`https://www.google.com/search?q=define+${encodeURIComponent(lookupWord)}`, '_blank');
            console.log(`Initiated dictionary lookup for: ${lookupWord}`);
        }
    } else if (action === 'voiceTyping') {
        initiateVoiceTypingEngine();
        console.log("Voice typing engine initiated.");
    }
}

function openWordCountModal() {
    if (typeof calculateDocumentMetrics === "function") {
        calculateDocumentMetrics();
    }
    console.log("Opening word count modal.");
    const modalBackplate = document.getElementById('wordcount-modal-backplate');
    if (modalBackplate) {
        modalBackplate.style.display = 'flex'; 
    }
}

function closeWordCountModal() {
    const modalBackplate = document.getElementById('wordcount-modal-backplate');
    if (modalBackplate) {
        modalBackplate.style.display = 'none'; 
    }
}

/**
 * Built-In Web Speech Transcription Pipeline API Hook
 */
function initiateVoiceTypingEngine() {
    if (editor.contentEditable === "false") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showError("Voice Recognition Error", "Your current browser does not support Voice Recognition features.");
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
        showError("Voice Recognition Error", "An error occurred with the voice recognition system. Voice recognition has been terminated. Please try again.");
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
// Zen Mode toggle 
function toggleZenMode() {
    console.log("Toggling Zen Mode layout.");
    // Toggles the sidebar layout
    document.getElementById('doc-sidebar').classList.toggle('collapsed');
    
    // Toggles the toolbar layout
    const toolbar = document.querySelector('.rich-toolbar');
    if (toolbar) {
        toolbar.classList.toggle('collapsed');
    }
    console.log("Zen Mode toggled successfully.");
}

//shows a temporary error message popup with a title and description, 
// sliding in from the top and then out after a few seconds, used instead of alerts
function showError(title, desc) {
    const popup = document.getElementById('error-popup');
    const titleEl = document.getElementById('error-title');
    const descEl = document.getElementById('error-desc');

    // Set the text
    titleEl.innerText = title;
    descEl.innerText = desc;

    // Slide it in
    popup.classList.add('show');

    // Slide it back out after 4 seconds
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
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