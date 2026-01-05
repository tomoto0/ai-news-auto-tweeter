# AI News Auto Tweeter - TODO

## Core Features
- [x] Database schema for X API credentials storage
- [x] Database schema for tweet history
- [x] Database schema for schedule settings
- [x] X API credentials CRUD operations
- [x] AI news fetching from Manus API
- [x] LLM-based news summarization
- [x] X (Twitter) tweet posting integration
- [x] Tweet history management
- [x] Auto-tweet scheduling system
- [x] Tweet preview functionality

## Frontend Pages
- [x] Landing page with International Typographic Style
- [x] Dashboard layout with sidebar navigation
- [x] X API Keys settings page
- [x] News feed and summary generation page
- [x] Tweet history page
- [x] Schedule settings page
- [x] Tweet preview and manual posting page

## Backend APIs
- [x] tRPC router for X credentials management
- [x] tRPC router for news fetching
- [x] tRPC router for tweet operations
- [x] tRPC router for schedule management
- [x] LLM integration for summarization

## Testing
- [x] Unit tests for X API integration
- [x] Unit tests for tweet operations
- [x] Unit tests for schedule management


## SEO修正
- [x] ページタイトルを30〜60文字に最適化
- [x] メタディスクリプションを50〜160文字で追加
- [x] キーワードを含むコンテンツを追加


## 構造化データ（Schema.org）
- [x] JSON-LDスキーマの実装（SoftwareApplication）
- [x] WebApplicationスキーマの追加
- [x] Organization/Creatorスキーマの追加
- [x] 構造化データのテスト検証


## ダッシュボード手動投稿機能
- [x] ダッシュボードに手動投稿セクションを追加
- [x] ニュースフィードから最新ニュースを取得して表示
- [x] ニュース選択と要約生成機能
- [x] 手動投稿ボタンと確認ダイアログ
- [x] 投稿結果の即座表示


## バグ修正
- [x] React error #321の原因特定
- [x] Dashboard.tsxのコンポーネント構造を修正
- [x] 投稿機能の動作確認


## リアルタイムニュースAPI統合
- [x] Manus Data APIの調查と設定
- [x] news.tsのAPI統合実装
- [x] キャッシング機構の実装
- [x] エラーハンドリングの改善
- [x] ニュース取得機能のテスト


## ニュースフィード更新機能
- [x] ニュース更新tRPCプロシージャの追加
- [x] キャッシュクリア機能の実装
- [x] フロントエンドの更新ボタン実装
- [x] ローディング状态の管理

## 投稿スケジュール自動実行エンジン
- [x] Node.jsスケジューラ（node-cron）のインストール
- [x] スケジュール実行エンジンの実装
- [x] 自動投稿ロジックの実装
- [x] エラーハンドリングとログ記録
- [x] スケジュール実行エンジンのテスト


## ニュース更新エラー修正
- [x] React error #321の原因特定
- [x] refreshNewsMutationの型エラー修正
- [x] キャッシュ無効化の改善
- [x] 記事更新後の表示確認
- [x] 手動投稿での新規記事投稿確認


## ニュース取得ロジック修正
- [x] news.tsのfetchAINews関数の詳細確認
- [x] キャッシュ無効化ロジックの検証
- [x] API呼び出しのエラーハンドリング確認
- [x] フロントエンドのrefresh mutation確認
- [x] キャッシュ無効化後のデータ取得確認


## React error #321とニュース表示更新の修正
- [x] refreshNewsMutationのエラーハンドリング確認
- [x] news.fetch queryの無効化タイミング確認
- [x] ニュース表示コンポーネントの再レンダリング確認
- [x] 古いニュースが残る理由の特定
- [x] 新規ニュースの確実な表示実装


## 更新ボタン動作不具合の修正
- [x] refreshNewsMutationの実行確認
- [x] server/routers.tsのrefreshプロシージャの動作確認
- [x] キャッシュクリアロジックの検証
- [x] フロントエンドのrefetch()の実行確認
- [x] ニュース表示の再レンダリング確認


## React error #321修正（onSuccess内のhooks呼び出し）
- [x] refreshNewsMutationのonSuccessコールバックを修正
- [x] trpc.useUtils()をコンポーネント最上位に移動
- [x] invalidate()とrefetch()の呼び出しを修正
- [x] ニュース更新機能の動作確認


## ニュースフィード更新問題の根本修正
- [x] キャッシュクリアロジックの詳細確認
- [x] server/news.tsのfetchAINews関数の動作検証
- [x] モック記事が残る原因の特定
- [x] キャッシュ無効化後の新規データ取得確認
- [x] フロントエンドのrefetch()が正常に動作しているか確認
- [x] ニュース更新ボタンクリック時のデータフロー全体の検証


## 更新ボタン動作不具合の根本調查
- [x] refreshNewsMutationの実行確認
- [x] server/routers.tsのrefreshプロシージャのログ確認
- [x] fetchAINews(true)の実行確認
- [x] キャッシュクリアが実行されているか確認
- [x] フロントエンドのinvalidate()とrefetch()が実行されているか確認
- [x] ニュース表示コンポーネントの再レンダリング確認


## ニュース更新速報機能
- [x] Dashboard.tsxのrefreshNewsMutationのonSuccessで速報を表示
- [x] 速報メッセージを「ニュースが更新されました」に統一
- [x] 速報の表示位置と表示時間を調整
- [x] 更新件数を速報メッセージに含める
