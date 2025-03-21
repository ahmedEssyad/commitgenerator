class CommitMessageGenerator {
    constructor() {
        this.elements = {
            form: document.getElementById('commitForm'),
            commitType: document.getElementById('commitType'),
            customType: document.getElementById('customType'),
            scope: document.getElementById('scope'),
            description: document.getElementById('description'),
            preview: document.getElementById('preview'),
            previewContainer: document.getElementById('previewContainer'),
            resetBtn: document.getElementById('resetBtn'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            githubPreview: document.getElementById('githubPreview'),
            historyList: document.getElementById('historyList'),
            helpBtn: document.getElementById('helpBtn'),
            helpModal: document.getElementById('helpModal'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            alertBox: document.getElementById('alertBox'),
        };
        this.debounceTimeout = null;
        this.isGithubStyle = false;
        this.history = JSON.parse(localStorage.getItem('commitHistory')) || [];
        this.settings = { previewFontSize: 16, autoSave: false };
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.updatePreview();
        this.updateHistory();
    }

    bindEvents() {
        // Real-time preview
        [this.elements.commitType, this.elements.customType, this.elements.scope, this.elements.description].forEach(el => {
            el.addEventListener('input', () => this.debounce(this.updatePreview.bind(this), 200));
        });

        // Toggle custom type input
        this.elements.commitType.addEventListener('change', () => this.toggleCustomType());

        // Buttons
        this.elements.resetBtn.addEventListener('click', () => this.resetForm());
        this.elements.copyBtn.addEventListener('click', () => this.copyToClipboard());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadText());
        this.elements.githubPreview.addEventListener('click', () => this.toggleGithubStyle());
        this.elements.helpBtn.addEventListener('click', () => this.showHelpModal());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('closeHelp').addEventListener('click', () => this.elements.helpModal.style.display = 'none');
        document.getElementById('darkModeToggle').addEventListener('click', () => document.body.classList.toggle('dark-mode'));
        document.getElementById('highContrastToggle').addEventListener('click', () => document.body.classList.toggle('high-contrast'));
    }

    /** @description Debounces a function to limit execution rate */
    debounce(func, delay) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, delay);
    }

    /** @description Updates the commit message preview */
    updatePreview() {
        const type = this.elements.commitType.value === 'custom' ? this.elements.customType.value.trim() : this.elements.commitType.value;
        const scope = this.elements.scope.value.trim();
        const description = this.elements.description.value.trim();

        if (!description) {
            this.showAlert('Description is required.', 'error');
            this.elements.preview.textContent = 'Please enter a description.';
            return;
        }

        const scopePart = scope ? `(${scope})` : '';
        const commitMessage = `${type}${scopePart}: ${description}`;
        
        this.elements.preview.textContent = commitMessage;
        this.elements.preview.className = `preview ${this.isGithubStyle ? 'github-style' : ''}`;
        this.elements.preview.style.fontSize = `${this.settings.previewFontSize}px`;
        
        if (this.settings.autoSave) this.autoSave();
    }

    /** @description Toggles visibility of custom type input */
    toggleCustomType() {
        const isCustom = this.elements.commitType.value === 'custom';
        this.elements.customType.classList.toggle('hidden', !isCustom);
        if (isCustom) this.elements.customType.focus();
        this.updatePreview();
    }

    /** @description Resets the form and preview */
    resetForm() {
        this.elements.form.reset();
        this.elements.customType.classList.add('hidden');
        this.updatePreview();
    }

    /** @description Copies the preview to the clipboard and adds to history */
    copyToClipboard() {
        const text = this.elements.preview.textContent;
        navigator.clipboard.writeText(text)
            .then(() => {
                this.showAlert('Copied to clipboard!', 'success');
                this.addToHistory(text);
            })
            .catch(() => this.showAlert('Failed to copy.', 'error'));
    }

    /** @description Downloads the commit message as a text file */
    downloadText() {
        const text = this.elements.preview.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'commit-message.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.addToHistory(text);
    }

    /** @description Toggles GitHub-style preview */
    toggleGithubStyle() {
        this.isGithubStyle = !this.isGithubStyle;
        this.elements.githubPreview.textContent = this.isGithubStyle ? 'Default Style' : 'GitHub Style';
        this.updatePreview();
    }

    /** @description Adds a commit message to history */
    addToHistory(message) {
        if (this.history.includes(message)) return;
        this.history.unshift(message);
        if (this.history.length > 5) this.history.pop(); // Limit to 5 recent commits
        localStorage.setItem('commitHistory', JSON.stringify(this.history));
        this.updateHistory();
    }

    /** @description Updates the history list UI */
    updateHistory() {
        this.elements.historyList.innerHTML = '';
        this.history.forEach(msg => {
            const li = document.createElement('li');
            li.textContent = msg;
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.className = 'btn btn-primary';
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(msg)
                    .then(() => this.showAlert('Copied from history!', 'success'))
                    .catch(() => this.showAlert('Failed to copy.', 'error'));
            });
            li.appendChild(copyBtn);
            this.elements.historyList.appendChild(li);
        });
    }

    /** @description Shows an alert message */
    showAlert(message, type) {
        this.elements.alertBox.textContent = message;
        this.elements.alertBox.style.display = 'flex';
        this.elements.alertBox.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.elements.alertBox.style.display = 'none');
        this.elements.alertBox.appendChild(closeBtn);
        setTimeout(() => this.elements.alertBox.style.display = 'none', 5000);
    }

    /** @description Shows the help modal with tabs */
    showHelpModal() {
        this.elements.helpModal.style.display = 'flex';
        const content = this.elements.helpModal.querySelector('#helpContent');
        const tabs = this.elements.helpModal.querySelectorAll('.tab-btn');
        const helpContent = {
            'guide': `
                <h3>Guide</h3>
                <p>Follow the <a href="https://www.conventionalcommits.org/" target="_blank">Conventional Commits</a> format:</p>
                <ul>
                    <li><strong>Type:</strong> e.g., feat, fix, docs</li>
                    <li><strong>Scope:</strong> Optional area (e.g., ui, api)</li>
                    <li><strong>Description:</strong> Short, imperative summary</li>
                </ul>
            `,
            'examples': `
                <h3>Examples</h3>
                <ul>
                    <li><code>feat(ui): add dark mode toggle</code></li>
                    <li><code>fix(api): resolve timeout error</code></li>
                    <li><code>docs(readme): update installation guide</code></li>
                </ul>
            `
        };

        const showTab = (tab) => {
            content.innerHTML = helpContent[tab];
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        };

        tabs.forEach(tab => tab.addEventListener('click', () => showTab(tab.dataset.tab)));
        showTab('guide');
    }

    /** @description Shows the settings modal */
    showSettings() {
        this.elements.settingsModal.style.display = 'flex';
        document.getElementById('previewFontSize').value = this.settings.previewFontSize;
        document.getElementById('autoSave').checked = this.settings.autoSave;
    }

    /** @description Saves settings and updates preview */
    saveSettings() {
        this.settings.previewFontSize = parseInt(document.getElementById('previewFontSize').value);
        this.settings.autoSave = document.getElementById('autoSave').checked;
        localStorage.setItem('commitSettings', JSON.stringify(this.settings));
        this.elements.settingsModal.style.display = 'none';
        this.updatePreview();
    }

    /** @description Loads saved settings */
    loadSettings() {
        const saved = JSON.parse(localStorage.getItem('commitSettings'));
        if (saved) this.settings = saved;
    }

    /** @description Auto-saves the current commit message */
    autoSave() {
        const data = {
            type: this.elements.commitType.value,
            customType: this.elements.customType.value,
            scope: this.elements.scope.value,
            description: this.elements.description.value,
        };
        localStorage.setItem('commitAutoSave', JSON.stringify(data));
    }
}

document.addEventListener('DOMContentLoaded', () => new CommitMessageGenerator());