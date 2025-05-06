/**
 * IndexedDBを使用した会話データの保存・読み込みクラス
 */
class ConversationStorage {
    constructor() {
        this.dbName = 'ClaudeLineViewerDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDatabase();
    }

    /**
     * データベースの初期化
     * @returns {Promise} - データベース初期化の結果
     */
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 会話データ用のオブジェクトストア
                if (!db.objectStoreNames.contains('conversations')) {
                    const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id', autoIncrement: true });
                    conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    conversationsStore.createIndex('title', 'title', { unique: false });
                }
                
                // 会話メッセージ用のオブジェクトストア
                if (!db.objectStoreNames.contains('messages')) {
                    const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
                    messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * 新しい会話を作成
     * @param {string} title - 会話のタイトル
     * @returns {Promise<number>} - 作成された会話のID
     */
    async createConversation(title) {
        if (!this.db) {
            await this.initDatabase();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['conversations'], 'readwrite');
            const store = transaction.objectStore('conversations');
            
            const conversation = {
                title: title,
                timestamp: new Date().toISOString(),
                messageCount: 0
            };
            
            const request = store.add(conversation);
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error('Error creating conversation:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 会話にメッセージを追加
     * @param {number} conversationId - 会話ID
     * @param {string} role - メッセージの送信者（user/assistant）
     * @param {string} content - メッセージ内容
     * @returns {Promise<number>} - 作成されたメッセージのID
     */
    async addMessage(conversationId, role, content) {
        if (!this.db) {
            await this.initDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages', 'conversations'], 'readwrite');
            const messagesStore = transaction.objectStore('messages');
            const conversationsStore = transaction.objectStore('conversations');
            
            // メッセージの追加
            const message = {
                conversationId: conversationId,
                role: role,
                content: content,
                timestamp: new Date().toISOString()
            };
            
            const addMessageRequest = messagesStore.add(message);
            
            addMessageRequest.onsuccess = (event) => {
                const messageId = event.target.result;
                
                // 会話のメッセージ数を更新
                const getConversationRequest = conversationsStore.get(conversationId);
                
                getConversationRequest.onsuccess = () => {
                    const conversation = getConversationRequest.result;
                    conversation.messageCount = (conversation.messageCount || 0) + 1;
                    
                    // 会話の最初のメッセージがuserからの場合、そのメッセージを会話タイトルとして使用
                    if (conversation.messageCount === 1 && role === 'user') {
                        const title = content.length > 50 ? content.substring(0, 47) + '...' : content;
                        conversation.title = title;
                    }
                    
                    conversationsStore.put(conversation);
                };
                
                resolve(messageId);
            };
            
            addMessageRequest.onerror = (event) => {
                console.error('Error adding message:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 会話の取得
     * @param {number} conversationId - 会話ID
     * @returns {Promise<Object>} - 会話データ
     */
    async getConversation(conversationId) {
        if (!this.db) {
            await this.initDatabase();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['conversations'], 'readonly');
            const store = transaction.objectStore('conversations');
            const request = store.get(conversationId);
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = (event) => {
                console.error('Error getting conversation:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 会話のメッセージを取得
     * @param {number} conversationId - 会話ID
     * @returns {Promise<Array>} - メッセージの配列
     */
    async getMessages(conversationId) {
        if (!this.db) {
            await this.initDatabase();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const index = store.index('conversationId');
            const request = index.getAll(conversationId);
            
            request.onsuccess = () => {
                // タイムスタンプでソート
                const messages = request.result.sort((a, b) => {
                    return new Date(a.timestamp) - new Date(b.timestamp);
                });
                resolve(messages);
            };
            
            request.onerror = (event) => {
                console.error('Error getting messages:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * すべての会話を取得
     * @returns {Promise<Array>} - 会話の配列
     */
    async getAllConversations() {
        if (!this.db) {
            await this.initDatabase();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['conversations'], 'readonly');
            const store = transaction.objectStore('conversations');
            const request = store.getAll();
            
            request.onsuccess = () => {
                // タイムスタンプの新しい順にソート
                const conversations = request.result.sort((a, b) => {
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
                resolve(conversations);
            };
            
            request.onerror = (event) => {
                console.error('Error getting all conversations:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 会話の削除
     * @param {number} conversationId - 削除する会話のID
     * @returns {Promise<boolean>} - 削除の成否
     */
    async deleteConversation(conversationId) {
        if (!this.db) {
            await this.initDatabase();
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['conversations', 'messages'], 'readwrite');
            const conversationsStore = transaction.objectStore('conversations');
            const messagesStore = transaction.objectStore('messages');
            const messagesIndex = messagesStore.index('conversationId');
            
            // まず会話を削除
            const deleteConversationRequest = conversationsStore.delete(conversationId);
            
            deleteConversationRequest.onsuccess = () => {
                // 次に関連メッセージを取得して削除
                const getMessagesRequest = messagesIndex.getAll(conversationId);
                
                getMessagesRequest.onsuccess = () => {
                    const messages = getMessagesRequest.result;
                    let deletedCount = 0;
                    
                    if (messages.length === 0) {
                        resolve(true);
                        return;
                    }
                    
                    messages.forEach(message => {
                        const deleteMessageRequest = messagesStore.delete(message.id);
                        
                        deleteMessageRequest.onsuccess = () => {
                            deletedCount++;
                            if (deletedCount === messages.length) {
                                resolve(true);
                            }
                        };
                        
                        deleteMessageRequest.onerror = (event) => {
                            console.error('Error deleting message:', event.target.error);
                            reject(event.target.error);
                        };
                    });
                };
                
                getMessagesRequest.onerror = (event) => {
                    console.error('Error getting messages for deletion:', event.target.error);
                    reject(event.target.error);
                };
            };
            
            deleteConversationRequest.onerror = (event) => {
                console.error('Error deleting conversation:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * 会話のエクスポート
     * @param {number} conversationId - エクスポートする会話のID
     * @returns {Promise<Object>} - エクスポート用のJSONオブジェクト
     */
    async exportConversation(conversationId) {
        const conversation = await this.getConversation(conversationId);
        const messages = await this.getMessages(conversationId);
        
        return {
            title: conversation.title,
            timestamp: conversation.timestamp,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp
            }))
        };
    }

    /**
     * 会話のインポート
     * @param {Object} data - インポートするJSONオブジェクト
     * @returns {Promise<number>} - インポートされた会話のID
     */
    async importConversation(data) {
        const conversationId = await this.createConversation(data.title || 'インポートされた会話');
        
        if (data.messages && Array.isArray(data.messages)) {
            for (const msg of data.messages) {
                await this.addMessage(conversationId, msg.role, msg.content);
            }
        }
        
        return conversationId;
    }

    /**
     * キーワードで会話を検索
     * @param {string} query - 検索キーワード
     * @returns {Promise<Array>} - 検索結果の会話の配列
     */
    async searchConversations(query) {
        if (!query || query.trim() === '') {
            return await this.getAllConversations();
        }
        
        const allConversations = await this.getAllConversations();
        const matchingConversations = [];
        
        for (const conversation of allConversations) {
            // タイトルで検索
            if (conversation.title.toLowerCase().includes(query.toLowerCase())) {
                matchingConversations.push(conversation);
                continue;
            }
            
            // メッセージ内容で検索
            const messages = await this.getMessages(conversation.id);
            const hasMatchingMessage = messages.some(msg => 
                msg.content.toLowerCase().includes(query.toLowerCase())
            );
            
            if (hasMatchingMessage) {
                matchingConversations.push(conversation);
            }
        }
        
        return matchingConversations;
    }
}

// グローバルインスタンス
const conversationStorage = new ConversationStorage();