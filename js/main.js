/**
 * LINE Claude Viewerのエントリーポイント
 * アプリ全体の初期化を行う
 */

// デバッグモード
const DEBUG = localStorage.getItem('debugMode') === 'true';

// アプリケーションのバージョン
const APP_VERSION = '1.0.0';

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    console.log(`LINE Claude Viewer ${APP_VERSION} を初期化中...`);
    
    // デバッグモード
    if (DEBUG) {
        console.log('デバッグモードが有効です');
        enableDebugFeatures();
    }
    
    // システム情報の表示
    logSystemInfo();
}

/**
 * デバッグ機能の有効化
 */
function enableDebugFeatures() {
    // エラー情報の詳細表示
    window.onerror = function(message, source, lineno, colno, error) {
        console.error('詳細エラー情報:', {
            message,
            source,
            lineno,
            colno,
            stack: error ? error.stack : null
        });
        
        return false;
    };
    
    // パフォーマンスモニタリングの有効化
    if (window.performance) {
        const perfData = window.performance.timing;
        
        window.addEventListener('load', () => {
            console.log('ページ読み込みパフォーマンス:');
            console.log('DNS解決時間:', perfData.domainLookupEnd - perfData.domainLookupStart, 'ms');
            console.log('サーバー接続時間:', perfData.connectEnd - perfData.connectStart, 'ms');
            console.log('サーバーレスポンス時間:', perfData.responseStart - perfData.requestStart, 'ms');
            console.log('DOM解析時間:', perfData.domComplete - perfData.domLoading, 'ms');
            console.log('ページ読み込み完了時間:', perfData.loadEventEnd - perfData.navigationStart, 'ms');
        });
    }
}

/**
 * システム情報のログ出力
 */
function logSystemInfo() {
    if (!DEBUG) return;
    
    console.log('システム情報:');
    console.log('ブラウザ:', navigator.userAgent);
    console.log('言語:', navigator.language);
    console.log('画面解像度:', `${window.screen.width}x${window.screen.height}`);
    console.log('ビューポート:', `${window.innerWidth}x${window.innerHeight}`);
    console.log('LocalStorageサポート:', !!window.localStorage);
    console.log('IndexedDBサポート:', !!window.indexedDB);
}

// DOMの準備ができたら初期化
document.addEventListener('DOMContentLoaded', initializeApp);

// エクスポート（ESモジュールではない場合はグローバルに公開）
window.APP_VERSION = APP_VERSION;
