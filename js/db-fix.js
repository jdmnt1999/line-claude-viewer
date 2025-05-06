/**
 * データベース修正用のユーティリティクラス
 * データベース関連の問題が発生した場合の修正ツール
 */
class DatabaseFixer {
    constructor() {
        this.dbName = 'ClaudeLineViewerDB';
        this.db = null;
    }

    /**
     * データベースを開く
     * @returns {Promise} - データベース接続
     */
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName);
            
            request.onerror = (event) => {
                console.error('Database open error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
        });
    }

    /**
     * データベースの削除
     * 注意: 全データが失われます
     * @returns {Promise<boolean>} - 削除の成否
     */
    async deleteDatabase() {
        return new Promise((resolve, reject) => {
            // データベース接続を閉じる
            if (this.db) {
                this.db.close();
                this.db = null;
            }
            
            const request = indexedDB.deleteDatabase(this.dbName);
            
            request.onerror = (event) => {
                console.error('Database deletion error:', event.target.error);
                reject(event.target.error);
            };
            
            request.onsuccess = () => {
                console.log('Database deleted successfully');
                resolve(true);
            };
        });
    }

    /**
     * データベースのエクスポート
     * データのバックアップ用
     * @returns {Promise<Object>} - エクスポートされたデータ
     */
    async exportDatabase() {
        if (!this.db) {
            await this.openDatabase();
        }
        
        const exportData = {
            conversations: [],
            messages: []
        };
        
        // 会話データの取得
        try {
            exportData.conversations = await this.getAllObjects('conversations');
        } catch (error) {
            console.error('Error exporting conversations:', error);
        }
        
        // メッセージデータの取得
        try {
            exportData.messages = await this.getAllObjects('messages');
        } catch (error) {
            console.error('Error exporting messages:', error);
        }
        
        return exportData;
    }

    /**
     * データベースのインポート
     * @param {Object} data - インポートするデータ
     * @param {boolean} clearExisting - 既存データをクリアするかどうか
     * @returns {Promise<boolean>} - インポートの成否
     */
    async importDatabase(data, clearExisting = false) {
        if (!this.db) {
            await this.openDatabase();
        }
        
        // 既存データのクリア
        if (clearExisting) {
            try {
                await this.clearStore('conversations');
                await this.clearStore('messages');
            } catch (error) {
                console.error('Error clearing existing data:', error);
                return false;
            }
        }
        
        // 会話データのインポート
        if (data.conversations && Array.isArray(data.conversations)) {
            try {
                await this.importObjects('conversations', data.conversations);
            } catch (error) {
                console.error('Error importing conversations:', error);
                return false;
            }
        }
        
        // メッセージデータのインポート
        if (data.messages && Array.isArray(data.messages)) {
            try {
                await this.importObjects('messages', data.messages);
            } catch (error) {
                console.error('Error importing messages:', error);
                return false;
            }
        }
        
        return true;
    }

    /**
     * すべてのオブジェクトを取得
     * @param {string} storeName - ストア名
     * @returns {Promise<Array>} - オブジェクト配列
     */
    async getAllObjects(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not opened'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result);
                };
                
                request.onerror = (event) => {
                    console.error(`Error getting all ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Error accessing ${storeName}:`, error);
                reject(error);
            }
        });
    }

    /**
     * オブジェクトをインポート
     * @param {string} storeName - ストア名
     * @param {Array} objects - インポートするオブジェクト配列
     * @returns {Promise<boolean>} - インポートの成否
     */
    async importObjects(storeName, objects) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not opened'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                let completed = 0;
                
                objects.forEach(obj => {
                    const request = store.add(obj);
                    
                    request.onsuccess = () => {
                        completed++;
                        if (completed === objects.length) {
                            resolve(true);
                        }
                    };
                    
                    request.onerror = (event) => {
                        console.warn(`Error adding object to ${storeName}:`, event.target.error);
                        // エラーが発生しても続行
                        completed++;
                        if (completed === objects.length) {
                            resolve(true);
                        }
                    };
                });
                
                if (objects.length === 0) {
                    resolve(true);
                }
            } catch (error) {
                console.error(`Error importing to ${storeName}:`, error);
                reject(error);
            }
        });
    }

    /**
     * ストアのクリア
     * @param {string} storeName - ストア名
     * @returns {Promise<boolean>} - クリアの成否
     */
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not opened'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => {
                    resolve(true);
                };
                
                request.onerror = (event) => {
                    console.error(`Error clearing ${storeName}:`, event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error(`Error accessing ${storeName} for clear:`, error);
                reject(error);
            }
        });
    }

    /**
     * 不整合データの修復
     * 会話IDが存在しないメッセージを削除など
     * @returns {Promise<Object>} - 修復結果
     */
    async repairInconsistentData() {
        if (!this.db) {
            await this.openDatabase();
        }
        
        const result = {
            orphanedMessages: 0,
            fixedConversations: 0
        };
        
        try {
            // 全会話を取得
            const conversations = await this.getAllObjects('conversations');
            const conversationIds = new Set(conversations.map(conv => conv.id));
            
            // 全メッセージを取得
            const messages = await this.getAllObjects('messages');
            
            // 各会話のメッセージ数を集計
            const messageCounts = {};
            const orphanedMessages = [];
            
            for (const message of messages) {
                const convId = message.conversationId;
                
                if (conversationIds.has(convId)) {
                    // 会話が存在する場合はカウント
                    messageCounts[convId] = (messageCounts[convId] || 0) + 1;
                } else {
                    // 会話が存在しない場合は孤立メッセージ
                    orphanedMessages.push(message);
                }
            }
            
            // 孤立メッセージの削除
            if (orphanedMessages.length > 0) {
                const transaction = this.db.transaction(['messages'], 'readwrite');
                const messagesStore = transaction.objectStore('messages');
                
                for (const message of orphanedMessages) {
                    messagesStore.delete(message.id);
                }
                
                result.orphanedMessages = orphanedMessages.length;
            }
            
            // 会話のメッセージ数を修正
            const transaction = this.db.transaction(['conversations'], 'readwrite');
            const conversationsStore = transaction.objectStore('conversations');
            
            for (const conversation of conversations) {
                const correctCount = messageCounts[conversation.id] || 0;
                
                if (conversation.messageCount !== correctCount) {
                    conversation.messageCount = correctCount;
                    conversationsStore.put(conversation);
                    result.fixedConversations++;
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('Error repairing data:', error);
            throw error;
        }
    }

    /**
     * データベースバックアップのダウンロード
     */
    async downloadBackup() {
        try {
            const data = await this.exportDatabase();
            
            // JSONをダウンロード
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `claude_line_viewer_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            
            // クリーンアップ
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 0);
            
        } catch (error) {
            console.error('Error downloading backup:', error);
            alert('バックアップのダウンロードに失敗しました: ' + error.message);
        }
    }

    /**
     * データ修復ユーティリティの実行
     */
    async runRepairUtility() {
        if (confirm('データベースの修復を実行しますか？\n※データに問題がない場合は実行する必要はありません。')) {
            try {
                ui.showLoader();
                
                // まずバックアップを取る
                const data = await this.exportDatabase();
                localStorage.setItem('db_backup_before_repair', JSON.stringify(data));
                
                // 修復実行
                const result = await this.repairInconsistentData();
                
                ui.hideLoader();
                
                alert(`修復完了:\n・孤立メッセージの削除: ${result.orphanedMessages}件\n・会話のメッセージ数修正: ${result.fixedConversations}件`);
                
            } catch (error) {
                ui.hideLoader();
                console.error('Repair error:', error);
                alert('修復中にエラーが発生しました: ' + error.message);
            }
        }
    }

    /**
     * データベースリセットの実行
     */
    async runDatabaseReset() {
        if (confirm('データベースをリセットしますか？\n※全てのデータが削除されます。')) {
            if (confirm('本当によろしいですか？\nこの操作は元に戻せません。')) {
                try {
                    ui.showLoader();
                    
                    // バックアップを取る
                    const data = await this.exportDatabase();
                    localStorage.setItem('db_backup_before_reset', JSON.stringify(data));
                    
                    // データベース削除
                    await this.deleteDatabase();
                    
                    ui.hideLoader();
                    
                    alert('データベースをリセットしました。\nページを再読み込みしてください。');
                    location.reload();
                    
                } catch (error) {
                    ui.hideLoader();
                    console.error('Database reset error:', error);
                    alert('リセット中にエラーが発生しました: ' + error.message);
                }
            }
        }
    }
}

// データベース修正ユーティリティのインスタンス
const dbFixer = new DatabaseFixer();