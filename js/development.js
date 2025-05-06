/**
 * 開発モード関連の機能を管理するクラス
 */
class Development {
    constructor() {
        this.isDevelopmentMode = false;
        this.debugLoggingEnabled = false;
        this.currentProject = null;
        this.bindEvents();
        this.loadSettings();
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        // 開発リクエストボタン
        const newDevelopmentBtn = document.getElementById('newDevelopmentBtn');
        if (newDevelopmentBtn) {
            newDevelopmentBtn.addEventListener('click', this.showNewDevelopmentModal.bind(this));
        }
    }

    /**
     * 設定読み込み
     */
    loadSettings() {
        this.isDevelopmentMode = localStorage.getItem('development_mode') === 'true';
        this.debugLoggingEnabled = localStorage.getItem('debug_logging') === 'true';
        
        // プロジェクト情報の読み込み
        const savedProject = localStorage.getItem('current_project');
        if (savedProject) {
            try {
                this.currentProject = JSON.parse(savedProject);
                this.updateProjectsList();
            } catch (error) {
                console.error('Error loading saved project:', error);
                localStorage.removeItem('current_project');
            }
        }
    }

    /**
     * 設定保存
     */
    saveSettings() {
        localStorage.setItem('development_mode', this.isDevelopmentMode.toString());
        localStorage.setItem('debug_logging', this.debugLoggingEnabled.toString());
        
        if (this.currentProject) {
            localStorage.setItem('current_project', JSON.stringify(this.currentProject));
        } else {
            localStorage.removeItem('current_project');
        }
    }

    /**
     * 開発モードの切り替え
     * @param {boolean} enabled - 有効にするかどうか
     */
    setDevelopmentMode(enabled) {
        this.isDevelopmentMode = enabled;
        this.saveSettings();
        
        // UI更新
        this.updateDevelopmentUI();
    }

    /**
     * デバッグログの切り替え
     * @param {boolean} enabled - 有効にするかどうか
     */
    setDebugLogging(enabled) {
        this.debugLoggingEnabled = enabled;
        this.saveSettings();
        
        // コンソールログをオーバーライド
        if (enabled) {
            this.enableDebugLogging();
        } else {
            this.disableDebugLogging();
        }
    }

    /**
     * デバッグログを有効化
     */
    enableDebugLogging() {
        // 元のコンソールメソッドを保存
        if (!window._originalConsole) {
            window._originalConsole = {
                log: console.log,
                info: console.info,
                warn: console.warn,
                error: console.error
            };
        }
        
        // ログを拡張して保存
        console.log = (...args) => {
            this.saveLog('log', args);
            window._originalConsole.log(...args);
        };
        
        console.info = (...args) => {
            this.saveLog('info', args);
            window._originalConsole.info(...args);
        };
        
        console.warn = (...args) => {
            this.saveLog('warn', args);
            window._originalConsole.warn(...args);
        };
        
        console.error = (...args) => {
            this.saveLog('error', args);
            window._originalConsole.error(...args);
        };
    }

    /**
     * デバッグログを無効化
     */
    disableDebugLogging() {
        if (window._originalConsole) {
            console.log = window._originalConsole.log;
            console.info = window._originalConsole.info;
            console.warn = window._originalConsole.warn;
            console.error = window._originalConsole.error;
        }
    }

    /**
     * ログを保存
     * @param {string} level - ログレベル
     * @param {Array} args - ログ引数
     */
    saveLog(level, args) {
        if (!this.debugLoggingEnabled || !this.currentProject) return;
        
        try {
            const logs = JSON.parse(localStorage.getItem(`debug_logs_${this.currentProject.id}`) || '[]');
            
            logs.push({
                timestamp: new Date().toISOString(),
                level: level,
                message: args.map(arg => {
                    try {
                        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                    } catch (e) {
                        return '[Unstringifiable Object]';
                    }
                }).join(' ')
            });
            
            // 最大1000件まで保存
            if (logs.length > 1000) {
                logs.shift();
            }
            
            localStorage.setItem(`debug_logs_${this.currentProject.id}`, JSON.stringify(logs));
            
        } catch (error) {
            // エラーが発生した場合は元のコンソールにエラーを出力
            if (window._originalConsole) {
                window._originalConsole.error('Error saving log:', error);
            }
        }
    }

    /**
     * 開発UI更新
     */
    updateDevelopmentUI() {
        // 開発モードに応じてUI要素を変更
        const body = document.body;
        
        if (this.isDevelopmentMode) {
            body.classList.add('development-mode');
        } else {
            body.classList.remove('development-mode');
        }
        
        // プロジェクトリストの更新
        this.updateProjectsList();
    }

    /**
     * プロジェクトリスト更新
     */
    updateProjectsList() {
        const projectsList = document.getElementById('projectsList');
        if (!projectsList) return;
        
        if (!this.currentProject) {
            projectsList.innerHTML = '<p class="no-projects">No active projects</p>';
            return;
        }
        
        projectsList.innerHTML = '';
        
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        
        const projectTitle = document.createElement('div');
        projectTitle.className = 'project-title';
        projectTitle.textContent = this.currentProject.name;
        
        const projectActions = document.createElement('div');
        projectActions.className = 'project-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'project-edit-btn';
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Edit Project';
        editBtn.addEventListener('click', () => {
            this.showEditProjectModal(this.currentProject);
        });
        
        const logsBtn = document.createElement('button');
        logsBtn.className = 'project-logs-btn';
        logsBtn.innerHTML = '📋';
        logsBtn.title = 'View Logs';
        logsBtn.addEventListener('click', () => {
            this.showLogsModal(this.currentProject);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'project-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete Project';
        deleteBtn.addEventListener('click', () => {
            this.deleteProject(this.currentProject.id);
        });
        
        projectActions.appendChild(editBtn);
        projectActions.appendChild(logsBtn);
        projectActions.appendChild(deleteBtn);
        
        projectItem.appendChild(projectTitle);
        projectItem.appendChild(projectActions);
        
        projectsList.appendChild(projectItem);
    }

    /**
     * 新規開発モーダル表示
     */
    showNewDevelopmentModal() {
        ui.createModal(
            'New Development Request',
            `
            <div class="development-form">
                <div class="form-group">
                    <label for="projectName">Project Name</label>
                    <input type="text" id="projectName" placeholder="Enter project name">
                </div>
                <div class="form-group">
                    <label for="projectDescription">Description</label>
                    <textarea id="projectDescription" placeholder="Describe what you are building"></textarea>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="enableDebugLogging" ${this.debugLoggingEnabled ? 'checked' : ''}>
                        Enable Debug Logging
                    </label>
                </div>
            </div>
            `,
            [
                {
                    text: 'Cancel',
                    class: 'modal-btn-secondary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                },
                {
                    text: 'Create',
                    class: 'modal-btn-primary',
                    action: (modal) => {
                        const name = document.getElementById('projectName').value.trim();
                        const description = document.getElementById('projectDescription').value.trim();
                        const enableLogging = document.getElementById('enableDebugLogging').checked;
                        
                        if (!name) {
                            alert('Please enter a project name');
                            return;
                        }
                        
                        this.createProject(name, description, enableLogging);
                        document.body.removeChild(modal);
                    }
                }
            ]
        );
    }

    /**
     * プロジェクト編集モーダル表示
     * @param {Object} project - プロジェクト情報
     */
    showEditProjectModal(project) {
        ui.createModal(
            'Edit Project',
            `
            <div class="development-form">
                <div class="form-group">
                    <label for="editProjectName">Project Name</label>
                    <input type="text" id="editProjectName" value="${project.name}" placeholder="Enter project name">
                </div>
                <div class="form-group">
                    <label for="editProjectDescription">Description</label>
                    <textarea id="editProjectDescription" placeholder="Describe what you are building">${project.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="editEnableDebugLogging" ${this.debugLoggingEnabled ? 'checked' : ''}>
                        Enable Debug Logging
                    </label>
                </div>
            </div>
            `,
            [
                {
                    text: 'Cancel',
                    class: 'modal-btn-secondary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                },
                {
                    text: 'Save',
                    class: 'modal-btn-primary',
                    action: (modal) => {
                        const name = document.getElementById('editProjectName').value.trim();
                        const description = document.getElementById('editProjectDescription').value.trim();
                        const enableLogging = document.getElementById('editEnableDebugLogging').checked;
                        
                        if (!name) {
                            alert('Please enter a project name');
                            return;
                        }
                        
                        this.updateProject(project.id, name, description, enableLogging);
                        document.body.removeChild(modal);
                    }
                }
            ]
        );
    }

    /**
     * ログ表示モーダル
     * @param {Object} project - プロジェクト情報
     */
    showLogsModal(project) {
        const logs = JSON.parse(localStorage.getItem(`debug_logs_${project.id}`) || '[]');
        
        let logsHtml = '';
        
        if (logs.length === 0) {
            logsHtml = '<p class="no-logs">No logs available</p>';
        } else {
            logsHtml = '<div class="logs-container">';
            
            logs.forEach(log => {
                const date = new Date(log.timestamp);
                const formattedTime = date.toLocaleTimeString();
                
                let levelClass = '';
                switch (log.level) {
                    case 'error':
                        levelClass = 'log-error';
                        break;
                    case 'warn':
                        levelClass = 'log-warn';
                        break;
                    case 'info':
                        levelClass = 'log-info';
                        break;
                    default:
                        levelClass = 'log-log';
                }
                
                logsHtml += `
                <div class="log-entry ${levelClass}">
                    <div class="log-timestamp">${formattedTime}</div>
                    <div class="log-level">${log.level.toUpperCase()}</div>
                    <div class="log-message">${log.message}</div>
                </div>
                `;
            });
            
            logsHtml += '</div>';
        }
        
        ui.createModal(
            `Logs: ${project.name}`,
            `
            <div class="logs-header">
                <button id="clearLogsBtn" class="modal-btn-secondary">Clear Logs</button>
                <button id="exportLogsBtn" class="modal-btn-secondary">Export Logs</button>
            </div>
            ${logsHtml}
            `,
            [
                {
                    text: 'Close',
                    class: 'modal-btn-primary',
                    action: (modal) => {
                        document.body.removeChild(modal);
                    }
                }
            ]
        );
        
        // ログクリアボタン
        const clearLogsBtn = document.getElementById('clearLogsBtn');
        if (clearLogsBtn) {
            clearLogsBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all logs?')) {
                    localStorage.removeItem(`debug_logs_${project.id}`);
                    this.showLogsModal(project); // モーダルを再表示
                }
            });
        }
        
        // ログエクスポートボタン
        const exportLogsBtn = document.getElementById('exportLogsBtn');
        if (exportLogsBtn) {
            exportLogsBtn.addEventListener('click', () => {
                this.exportLogs(project);
            });
        }
    }

    /**
     * ログのエクスポート
     * @param {Object} project - プロジェクト情報
     */
    exportLogs(project) {
        const logs = JSON.parse(localStorage.getItem(`debug_logs_${project.id}`) || '[]');
        
        // JSONをダウンロード
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${project.name}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // クリーンアップ
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }

    /**
     * プロジェクト作成
     * @param {string} name - プロジェクト名
     * @param {string} description - プロジェクト説明
     * @param {boolean} enableLogging - ログ有効化
     */
    createProject(name, description, enableLogging) {
        const project = {
            id: Date.now().toString(),
            name: name,
            description: description,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.currentProject = project;
        this.setDevelopmentMode(true);
        this.setDebugLogging(enableLogging);
        this.saveSettings();
        
        this.updateProjectsList();
    }

    /**
     * プロジェクト更新
     * @param {string} id - プロジェクトID
     * @param {string} name - プロジェクト名
     * @param {string} description - プロジェクト説明
     * @param {boolean} enableLogging - ログ有効化
     */
    updateProject(id, name, description, enableLogging) {
        if (!this.currentProject || this.currentProject.id !== id) return;
        
        this.currentProject.name = name;
        this.currentProject.description = description;
        this.currentProject.updatedAt = new Date().toISOString();
        
        this.setDebugLogging(enableLogging);
        this.saveSettings();
        
        this.updateProjectsList();
    }

    /**
     * プロジェクト削除
     * @param {string} id - プロジェクトID
     */
    deleteProject(id) {
        if (!this.currentProject || this.currentProject.id !== id) return;
        
        if (!confirm('Are you sure you want to delete this project?')) {
            return;
        }
        
        // ログも削除
        localStorage.removeItem(`debug_logs_${id}`);
        
        this.currentProject = null;
        this.setDevelopmentMode(false);
        this.setDebugLogging(false);
        this.saveSettings();
        
        this.updateProjectsList();
    }
}

// 開発機能の初期化
document.addEventListener('DOMContentLoaded', () => {
    window.development = new Development();
});