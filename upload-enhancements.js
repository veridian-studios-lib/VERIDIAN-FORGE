/**
 * Veridian Forge - Upload Logic v2.0
 * Handles: PDF Parsing & Database Commit
 * Target Storage: 'veridian_forge_data'
 */

// --- 1. PDF EXTRACTION ENGINE ---
async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusObj = document.getElementById('pdf-status');
    const contentArea = document.getElementById('fileContent');
    
    if (file.type !== 'application/pdf') {
        alert("Error: Only PDF files are accepted by the Forge.");
        return;
    }

    statusObj.innerText = "DECRYPTING PDF LAYER...";
    contentArea.value = ""; // Clear previous

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = "";
        
        // Loop through all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            statusObj.innerText = `READING PAGE ${i} OF ${pdf.numPages}...`;
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Join text items with spaces
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `// --- PAGE ${i} ---\n${pageText}\n\n`;
        }

        contentArea.value = fullText;
        statusObj.innerText = "EXTRACTION COMPLETE.";
        
        // Auto-fill title if empty
        const titleInput = document.getElementById('fileTitle');
        if (!titleInput.value) {
            titleInput.value = file.name.replace('.pdf', '');
        }

    } catch (error) {
        console.error(error);
        statusObj.innerText = "ERROR: FILE CORRUPTED OR ENCRYPTED.";
    }
}

// --- 2. THE SAVE RITUAL ---
async function commitToForge() {
    const title = document.getElementById('fileTitle').value.trim();
    const content = document.getElementById('fileContent').value;
    const ext = document.getElementById('fileExt').value;
    
    if (!title || !content) {
        alert("Input Incomplete: Filename and Content are required.");
        return;
    }

    const fullTitle = title.includes('.') ? title : `${title}.${ext.toLowerCase()}`;

    // Create the Data Artifact
    const newFile = {
        id: "forge_" + Date.now(),
        title: fullTitle,
        content: content, // Can be text or extracted PDF content
        author: "Admin_User", // You can make this dynamic if needed
        timestamp: Date.now(),
        type: ext,
        isPublic: false, // Default to private
        starred: false
    };

    try {
        // TARGETING THE NEW KEY: veridian_forge_data
        let forgeData = await localforage.getItem('veridian_forge_data') || [];
        forgeData.unshift(newFile); // Add to top of list
        await localforage.setItem('veridian_forge_data', forgeData);

        alert(`Ritual Complete: [${fullTitle}] has been forged.`);
        window.location.href = 'index.html'; // Return to Hub

    } catch (err) {
        console.error("Forge Error:", err);
        alert("System Failure: Could not save to Local Drive.");
    }
}
