/**
 * 3カラムレイアウトの制御スクリプト
 * レスポンシブ表示とカラムの切り替え機能を提供
 */

document.addEventListener('DOMContentLoaded', () => {
    // 要素の取得
    const toggleLeftColumnBtn = document.getElementById('toggleLeftColumnBtn');
    const toggleRightColumnBtn = document.getElementById('toggleRightColumnBtn');
    const leftColumnOverlay = document.getElementById('leftColumnOverlay');
    const rightColumnOverlay = document.getElementById('rightColumnOverlay');
    const overlayBackdrop = document.getElementById('overlayBackdrop');
    const leftColumn = document.querySelector('.left-column');
    const rightColumn = document.querySelector('.right-column');

    // 左カラム内容をオーバーレイにコピー
    if (leftColumn && leftColumnOverlay) {
        leftColumnOverlay.innerHTML = leftColumn.innerHTML;
    }

    // 右カラム内容をオーバーレイにコピー
    if (rightColumn && rightColumnOverlay) {
        rightColumnOverlay.innerHTML = rightColumn.innerHTML;
    }

    // 左カラムトグルボタンのイベントハンドラ
    if (toggleLeftColumnBtn) {
        toggleLeftColumnBtn.addEventListener('click', () => {
            leftColumnOverlay.classList.toggle('active');
            overlayBackdrop.classList.toggle('active');
            rightColumnOverlay.classList.remove('active');
        });
    }

    // 右カラムトグルボタンのイベントハンドラ
    if (toggleRightColumnBtn) {
        toggleRightColumnBtn.addEventListener('click', () => {
            rightColumnOverlay.classList.toggle('active');
            overlayBackdrop.classList.toggle('active');
            leftColumnOverlay.classList.remove('active');
        });
    }

    // バックドロップクリックでオーバーレイを閉じる
    if (overlayBackdrop) {
        overlayBackdrop.addEventListener('click', () => {
            leftColumnOverlay.classList.remove('active');
            rightColumnOverlay.classList.remove('active');
            overlayBackdrop.classList.remove('active');
        });
    }

    // ウィンドウサイズ変更時の処理
    window.addEventListener('resize', handleResize);
    
    // 初回ロード時にもサイズチェック
    handleResize();

    /**
     * ウィンドウサイズに応じてUIを調整
     */
    function handleResize() {
        // モバイル表示の場合、オーバーレイを閉じる
        if (window.innerWidth <= 768) {
            // モバイル表示設定
            document.querySelector('.toggle-left-column-btn').style.display = 'block';
        } else {
            // デスクトップ表示設定
            document.querySelector('.toggle-left-column-btn').style.display = 'none';
            leftColumnOverlay.classList.remove('active');
        }

        // タブレット表示の場合
        if (window.innerWidth <= 992) {
            document.querySelector('.toggle-right-column-btn').style.display = 'block';
        } else {
            document.querySelector('.toggle-right-column-btn').style.display = 'none';
            rightColumnOverlay.classList.remove('active');
        }

        // オーバーレイがどちらも非表示ならバックドロップも非表示
        if (!leftColumnOverlay.classList.contains('active') && 
            !rightColumnOverlay.classList.contains('active')) {
            overlayBackdrop.classList.remove('active');
        }
    }

    // 会話詳細の更新
    updateConversationDetails();

    /**
     * 会話詳細情報を更新
     * @param {Object} conversation - 会話オブジェクト
     */
    function updateConversationDetails(conversation = null) {
        const titleElement = document.getElementById('conversationTitle');
        const createdElement = document.getElementById('conversationCreated');
        const updatedElement = document.getElementById('conversationUpdated');
        const countElement = document.getElementById('messageCount');

        if (conversation) {
            // 会話データがある場合は詳細を表示
            titleElement.textContent = conversation.title || 'Untitled Conversation';
            
            // 日付フォーマット
            const createdDate = new Date(conversation.createdAt);
            const updatedDate = new Date(conversation.updatedAt);
            
            createdElement.textContent = formatDate(createdDate);
            updatedElement.textContent = formatDate(updatedDate);
            countElement.textContent = conversation.messages ? conversation.messages.length : 0;
        } else {
            // 会話データがない場合はデフォルト表示
            titleElement.textContent = '-';
            createdElement.textContent = '-';
            updatedElement.textContent = '-';
            countElement.textContent = '-';
        }
    }

    /**
     * 日付を表示用にフォーマット
     * @param {Date} date - フォーマットする日付
     * @returns {string} フォーマットされた日付文字列
     */
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) {
            return '-';
        }
        
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // グローバルスコープに関数を公開
    window.updateConversationDetails = updateConversationDetails;
});

// 会話コントローラと連携：会話読み込み時に詳細を更新
document.addEventListener('conversationLoaded', (event) => {
    if (window.updateConversationDetails && event.detail) {
        window.updateConversationDetails(event.detail);
    }
});

// メッセージ追加時に会話詳細を更新
document.addEventListener('messageAdded', (event) => {
    if (window.updateConversationDetails && event.detail) {
        window.updateConversationDetails(event.detail);
    }
});
