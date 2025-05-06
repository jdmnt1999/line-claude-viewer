/**
 * 会話インポート用のヘルパー関数
 * プログレスバー表示と取り込み済み会話のスキップ機能を提供
 */

// デバッグモード
const DEBUG = localStorage.getItem('debugMode') === 'true';

/**
 * インポートヘルパーモジュール
 */
const ImportHelper = {
    // 処理中フラグ
    isProcessing: false,
    
    // キャンセルフラグ
    isCancelled: false,
    
    // 処理対象の会話配列
    conversations: [],
    
    // インポート設定
    options: {
        skipExisting: true, // 既存の会話をスキップするか
        overwriteExisting: false, // 既存の会話を上書きするか
        preserveIds: false // IDを保持するか
    },
    
    /**
     * プログレスバーの要素を作成
     * @returns {HTMLElement} - プログレスバー要素
     */
    createProgressBar: () => {
        const container = document.createElement('div');
        container.className = 'progress-container';
        container.id = 'importProgress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        
        const progressInfo = document.createElement('div');
        progressInfo.className = 'progress-info';
        
        const progressCount = document.createElement('div');
        progressCount.className = 'progress-count';
        progressCount.textContent = '0/0';
        progressInfo.appendChild(progressCount);
        
        const progressPercent = document.createElement('div');
        progressPercent.className = 'progress-percent';
        progressPercent.textContent = '0%';
        progressInfo.appendChild(progressPercent);
        
        const progressStatus = document.createElement('div');
        progressStatus.className = 'progress-status';
        progressStatus.textContent = '準備中...';
        
        const progressControls = document.createElement('div');
        progressControls.className = 'progress-controls';
        
        const pauseBtn = document.createElement('button');
        pauseBtn.className = 'pause-btn';
        pauseBtn.textContent = '一時停止';
        pauseBtn.addEventListener('click', () => {
            if (pauseBtn.textContent === '一時停止') {
                ImportHelper.pause();
                pauseBtn.textContent = '再開';
            } else {
                ImportHelper.resume();
                pauseBtn.textContent = '一時停止';
            }
        });
        progressControls.appendChild(pauseBtn);
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'キャンセル';
        cancelBtn.addEventListener('click', () => {
            if (confirm('インポート処理をキャンセルしますか？')) {
                ImportHelper.cancel();
            }
        });
        progressControls.appendChild(cancelBtn);
        
        container.appendChild(progressBar);
        container.appendChild(progressInfo);
        container.appendChild(progressStatus);
        container.appendChild(progressControls);
        
        return container;
    },
    
    /**
     * インポートオプション選択UI作成
     * @returns {HTMLElement} - オプション選択要素
     */
    createImportOptions: () => {
        const container = document.createElement('div');
        container.className = 'import-options';
        
        // 既存会話のスキップオプション
        const skipOption = document.createElement('div');
        skipOption.className = 'import-option';
        
        const skipCheckbox = document.createElement('input');
        skipCheckbox.type = 'checkbox';
        skipCheckbox.id = 'skipExistingCheckbox';
        skipCheckbox.checked = ImportHelper.options.skipExisting;
        skipCheckbox.addEventListener('change', () => {
            ImportHelper.options.skipExisting = skipCheckbox.checked;
            // スキップと上書きは同時に有効にできない
            if (skipCheckbox.checked) {
                overwriteCheckbox.checked = false;
                ImportHelper.options.overwriteExisting = false;
            }
        });
        
        const skipLabel = document.createElement('label');
        skipLabel.className = 'import-option-label';
        skipLabel.htmlFor = 'skipExistingCheckbox';
        skipLabel.textContent = '取り込み済みの会話をスキップする';
        
        skipOption.appendChild(skipCheckbox);
        skipOption.appendChild(skipLabel);
        
        const skipDescription = document.createElement('div');
        skipDescription.className = 'import-option-description';
        skipDescription.textContent = '同じIDまたは内容の会話が既に存在する場合、その会話をスキップします。';
        
        // 既存会話の上書きオプション
        const overwriteOption = document.createElement('div');
        overwriteOption.className = 'import-option';
        
        const overwriteCheckbox = document.createElement('input');
        overwriteCheckbox.type = 'checkbox';
        overwriteCheckbox.id = 'overwriteExistingCheckbox';
        overwriteCheckbox.checked = ImportHelper.options.overwriteExisting;
        overwriteCheckbox.addEventListener('change', () => {
            ImportHelper.options.overwriteExisting = overwriteCheckbox.checked;
            // スキップと上書きは同時に有効にできない
            if (overwriteCheckbox.checked) {
                skipCheckbox.checked = false;
                ImportHelper.options.skipExisting = false;
            }
        });
        
        const overwriteLabel = document.createElement('label');
        overwriteLabel.className = 'import-option-label';
        overwriteLabel.htmlFor = 'overwriteExistingCheckbox';
        overwriteLabel.textContent = '取り込み済みの会話を上書きする';
        
        overwriteOption.appendChild(overwriteCheckbox);
        overwriteOption.appendChild(overwriteLabel);
        
        const overwriteDescription = document.createElement('div');
        overwriteDescription.className = 'import-option-description';
        overwriteDescription.textContent = '同じIDまたは内容の会話が既に存在する場合、その会話を上書きします。';
        
        // IDの保持オプション
        const preserveOption = document.createElement('div');
        preserveOption.className = 'import-option';
        
        const preserveCheckbox = document.createElement('input');
        preserveCheckbox.type = 'checkbox';
        preserveCheckbox.id = 'preserveIdsCheckbox';
        preserveCheckbox.checked = ImportHelper.options.preserveIds;
        preserveCheckbox.addEventListener('change', () => {
            ImportHelper.options.preserveIds = preserveCheckbox.checked;
        });
        
        const preserveLabel = document.createElement('label');
        preserveLabel.className = 'import-option-label';
        preserveLabel.htmlFor = 'preserveIdsCheckbox';
        preserveLabel.textContent = '会話IDを保持する';
        
        preserveOption.appendChild(preserveCheckbox);
        preserveOption.appendChild(preserveLabel);
        
        const preserveDescription = document.createElement('div');
        preserveDescription.className = 'import-option-description';
        preserveDescription.textContent = 'インポートする会話のIDを保持します。IDの重複がある場合は新しいIDが割り当てられます。';
        
        container.appendChild(skipOption);
        container.appendChild(skipDescription);
        container.appendChild(overwriteOption);
        container.appendChild(overwriteDescription);
        container.appendChild(preserveOption);
        container.appendChild(preserveDescription);
        
        return container;
    },
    
    /**
     * インポート処理の開始
     * @param {Array} conversations - インポートする会話の配列
     * @param {Object} options - インポートオプション
     * @returns {Promise<Array>} - インポート結果
     */
    startImport: async (conversations, options = {}) => {
        if (ImportHelper.isProcessing) {
            throw new Error('既にインポート処理が実行中です');
        }
        
        // オプション設定
        ImportHelper.options = { ...ImportHelper.options, ...options };
        
        // 処理状態の初期化
        ImportHelper.isProcessing = true;
        ImportHelper.isCancelled = false;
        ImportHelper.conversations = Array.isArray(conversations) ? conversations : [conversations];
        
        // 結果の初期化
        const results = {
            total: ImportHelper.conversations.length,
            imported: 0,
            skipped: 0,
            failed: 0,
            details: []
        };
        
        try {
            // プログレスバーの作成
            const progressBarContainer = document.getElementById('importProgress');
            if (!progressBarContainer) {
                // モーダルがある場合はその中に追加
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.appendChild(ImportHelper.createProgressBar());
                    modalBody.appendChild(ImportHelper.createImportOptions());
                }
            }
            
            // プログレスバーの更新
            ImportHelper.updateProgress(0, ImportHelper.conversations.length, '準備中...');
            
            // 会話を1つずつインポート
            for (let i = 0; i < ImportHelper.conversations.length; i++) {
                // キャンセルされた場合は中断
                if (ImportHelper.isCancelled) {
                    ImportHelper.updateProgress(
                        i, 
                        ImportHelper.conversations.length, 
                        'インポートがキャンセルされました'
                    );
                    break;
                }
                
                const conversation = ImportHelper.conversations[i];
                
                try {
                    // 進捗状況の更新
                    ImportHelper.updateProgress(
                        i, 
                        ImportHelper.conversations.length, 
                        `会話 ${i + 1}/${ImportHelper.conversations.length} をインポート中...`
                    );
                    
                    // 既存の会話をチェック
                    const existingConversation = await ImportHelper.checkExistingConversation(conversation);
                    
                    if (existingConversation && ImportHelper.options.skipExisting) {
                        // 既存の会話をスキップ
                        results.skipped++;
                        results.details.push({
                            status: 'skipped',
                            conversation: conversation,
                            reason: '既に同じ会話が存在します'
                        });
                        
                        ImportHelper.updateProgress(
                            i + 1, 
                            ImportHelper.conversations.length, 
                            `会話 ${i + 1} をスキップしました（既存）`
                        );
                    } else if (existingConversation && ImportHelper.options.overwriteExisting) {
                        // 既存の会話を上書き
                        await ImportHelper.overwriteConversation(existingConversation.id, conversation);
                        
                        results.imported++;
                        results.details.push({
                            status: 'overwritten',
                            conversation: conversation,
                            existingId: existingConversation.id
                        });
                        
                        ImportHelper.updateProgress(
                            i + 1, 
                            ImportHelper.conversations.length, 
                            `会話 ${i + 1} を上書きしました`
                        );
                    } else {
                        // 新しい会話としてインポート
                        await ImportHelper.importConversation(conversation);
                        
                        results.imported++;
                        results.details.push({
                            status: 'imported',
                            conversation: conversation
                        });
                        
                        ImportHelper.updateProgress(
                            i + 1, 
                            ImportHelper.conversations.length, 
                            `会話 ${i + 1} をインポートしました`
                        );
                    }
                } catch (error) {
                    console.error(`会話 ${i + 1} のインポート中にエラーが発生しました:`, error);
                    
                    results.failed++;
                    results.details.push({
                        status: 'failed',
                        conversation: conversation,
                        error: error.message
                    });
                    
                    ImportHelper.updateProgress(
                        i + 1, 
                        ImportHelper.conversations.length, 
                        `会話 ${i + 1} のインポートに失敗しました`
                    );
                }
                
                // 少し待機して UI の更新を反映
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // 完了メッセージ
            const completeMessage = ImportHelper.isCancelled 
                ? 'インポートはキャンセルされました' 
                : `インポート完了: ${results.imported} 件インポート, ${results.skipped} 件スキップ, ${results.failed} 件失敗`;
            
            ImportHelper.updateProgress(
                ImportHelper.conversations.length, 
                ImportHelper.conversations.length, 
                completeMessage
            );
            
            // 会話リストの更新（UIのupdateConversationsListを呼び出し）
            if (window.ui && window.ui.updateConversationsList) {
                await window.ui.updateConversationsList();
            }
            
            return results;
            
        } catch (error) {
            console.error('インポート処理中にエラーが発生しました:', error);
            ImportHelper.updateProgress(0, 0, 'インポート処理中にエラーが発生しました');
            throw error;
        } finally {
            // 処理状態のリセット
            ImportHelper.isProcessing = false;
        }
    },
    
    /**
     * プログレスバーの更新
     * @param {number} current - 現在の処理数
     * @param {number} total - 全体の処理数
     * @param {string} status - 状態メッセージ
     */
    updateProgress: (current, total, status) => {
        const progressContainer = document.getElementById('importProgress');
        if (!progressContainer) return;
        
        const progressBar = progressContainer.querySelector('.progress-bar');
        const progressCount = progressContainer.querySelector('.progress-count');
        const progressPercent = progressContainer.querySelector('.progress-percent');
        const progressStatus = progressContainer.querySelector('.progress-status');
        
        if (!progressBar || !progressCount || !progressPercent || !progressStatus) return;
        
        // 進捗率の計算
        const percent = total === 0 ? 0 : Math.round((current / total) * 100);
        
        // UI更新
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
        progressCount.textContent = `${current}/${total}`;
        progressPercent.textContent = `${percent}%`;
        progressStatus.textContent = status;
        
        // 処理中であれば処理中スタイルを適用
        if (status.includes('中')) {
            progressStatus.classList.add('processing');
        } else {
            progressStatus.classList.remove('processing');
        }
    },
    
    /**
     * 一時停止
     */
    pause: () => {
        // 一時停止の実装
        // 現在のバージョンでは非同期処理を完全に一時停止する機能は提供していない
        // 必要に応じて拡張する
    },
    
    /**
     * 再開
     */
    resume: () => {
        // 再開の実装
        // 現在のバージョンでは非同期処理を完全に一時停止する機能は提供していない
        // 必要に応じて拡張する
    },
    
    /**
     * キャンセル
     */
    cancel: () => {
        ImportHelper.isCancelled = true;
        const progressStatus = document.querySelector('#importProgress .progress-status');
        if (progressStatus) {
            progressStatus.textContent = 'キャンセル中...';
            progressStatus.classList.add('processing');
        }
    },
    
    /**
     * 既存の会話をチェック
     * @param {Object} conversation - インポートする会話
     * @returns {Promise<Object|null>} - 既存の会話またはnull
     */
    checkExistingConversation: async (conversation) => {
        if (!window.conversationStorage) {
            throw new Error('ConversationStorageが初期化されていません');
        }
        
        try {
            // IDベースでチェック
            if (conversation.id) {
                try {
                    const existingConversation = await window.conversationStorage.getConversation(conversation.id);
                    if (existingConversation) {
                        return existingConversation;
                    }
                } catch (error) {
                    // IDが見つからない場合はエラーになるので無視
                }
            }
            
            // タイトルとタイムスタンプでチェック
            if (conversation.title && (conversation.createdAt || conversation.timestamp)) {
                const conversations = await window.conversationStorage.getAllConversations();
                
                const timestamp = conversation.createdAt || conversation.timestamp;
                
                const existingConversation = conversations.find(c => 
                    c.title === conversation.title && 
                    (c.createdAt === timestamp || c.timestamp === timestamp)
                );
                
                if (existingConversation) {
                    return existingConversation;
                }
            }
            
            // メッセージの内容でチェック
            if (conversation.messages && conversation.messages.length > 0) {
                const conversations = await window.conversationStorage.getAllConversations();
                
                for (const c of conversations) {
                    // 各会話のメッセージを取得
                    const messages = await window.conversationStorage.getMessages(c.id);
                    
                    // メッセージの数が同じかつ内容が似ている場合
                    if (messages.length === conversation.messages.length) {
                        // 最初と最後のメッセージを比較
                        const firstMatch = messages[0] && conversation.messages[0] &&
                            messages[0].role === conversation.messages[0].role &&
                            messages[0].content === conversation.messages[0].content;
                            
                        const lastMatch = messages[messages.length - 1] && conversation.messages[conversation.messages.length - 1] &&
                            messages[messages.length - 1].role === conversation.messages[conversation.messages.length - 1].role &&
                            messages[messages.length - 1].content === conversation.messages[conversation.messages.length - 1].content;
                            
                        if (firstMatch && lastMatch) {
                            return c;
                        }
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('既存会話のチェック中にエラーが発生しました:', error);
            return null;
        }
    },
    
    /**
     * 会話のインポート
     * @param {Object} conversation - インポートする会話
     * @returns {Promise<number>} - インポートされた会話のID
     */
    importConversation: async (conversation) => {
        if (!window.conversationStorage) {
            throw new Error('ConversationStorageが初期化されていません');
        }
        
        try {
            let conversationId;
            
            // 会話のインポート
            if (ImportHelper.options.preserveIds && conversation.id) {
                try {
                    // 指定されたIDで会話を作成
                    conversationId = await window.conversationStorage.createConversationWithId(
                        conversation.id,
                        conversation.title || 'インポートされた会話',
                        conversation.createdAt || conversation.timestamp || new Date().toISOString()
                    );
                } catch (error) {
                    // IDが既に存在する場合など
                    console.warn('指定されたIDで会話を作成できませんでした。新しいIDで作成します:', error);
                    conversationId = await window.conversationStorage.createConversation(
                        conversation.title || 'インポートされた会話',
                        conversation.createdAt || conversation.timestamp || new Date().toISOString()
                    );
                }
            } else {
                // 新しいIDで会話を作成
                conversationId = await window.conversationStorage.createConversation(
                    conversation.title || 'インポートされた会話',
                    conversation.createdAt || conversation.timestamp || new Date().toISOString()
                );
            }
            
            // メッセージのインポート
            if (conversation.messages && conversation.messages.length > 0) {
                for (const message of conversation.messages) {
                    await window.conversationStorage.addMessage(
                        conversationId,
                        message.role,
                        message.content,
                        message.timestamp || new Date().toISOString()
                    );
                }
            }
            
            return conversationId;
        } catch (error) {
            console.error('会話のインポート中にエラーが発生しました:', error);
            throw error;
        }
    },
    
    /**
     * 会話の上書き
     * @param {number} conversationId - 上書きする会話のID
     * @param {Object} newConversation - 新しい会話データ
     * @returns {Promise<number>} - 上書きされた会話のID
     */
    overwriteConversation: async (conversationId, newConversation) => {
        if (!window.conversationStorage) {
            throw new Error('ConversationStorageが初期化されていません');
        }
        
        try {
            // 既存のメッセージをクリア
            await window.conversationStorage.clearMessages(conversationId);
            
            // 会話情報の更新
            await window.conversationStorage.updateConversation(
                conversationId,
                newConversation.title || 'インポートされた会話',
                newConversation.createdAt || newConversation.timestamp || new Date().toISOString()
            );
            
            // メッセージのインポート
            if (newConversation.messages && newConversation.messages.length > 0) {
                for (const message of newConversation.messages) {
                    await window.conversationStorage.addMessage(
                        conversationId,
                        message.role,
                        message.content,
                        message.timestamp || new Date().toISOString()
                    );
                }
            }
            
            return conversationId;
        } catch (error) {
            console.error('会話の上書き中にエラーが発生しました:', error);
            throw error;
        }
    }
};

// デバッグモード時のログ
if (DEBUG) {
    console.log('ImportHelperモジュールが初期化されました');
}

// グローバルスコープにエクスポート
window.ImportHelper = ImportHelper;
