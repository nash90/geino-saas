/**
 * Error Messages for Geino SaaS
 * 
 * Centralized error messages for consistent user-facing error handling.
 * All messages are in Japanese for better user experience.
 */

/**
 * HTTP Status Code Error Messages
 * Maps HTTP status codes to user-friendly Japanese messages
 */
export const HTTP_ERROR_MESSAGES = {
  // 4xx Client Errors
  400: 'リクエストが無効です。入力内容を確認してください',
  401: '認証が必要です。再度ログインしてください',
  403: 'この操作を実行する権限がありません',
  404: 'リソースが見つかりません',
  409: 'データが競合しています。ページを再読み込みしてください',
  422: '入力内容に誤りがあります。確認してください',
  429: 'リクエスト数が多すぎます。しばらくしてから再試行してください',
  
  // 5xx Server Errors
  500: 'サーバーエラーが発生しました。しばらくしてから再試行してください',
  502: 'サーバーに接続できません。しばらくしてから再試行してください',
  503: 'サービスが一時的に利用できません。しばらくしてから再試行してください',
  504: 'サーバーの応答がタイムアウトしました。再試行してください',
  
  // Network Errors
  NETWORK_ERROR: 'ネットワークエラーが発生しました。インターネット接続を確認してください',
  TIMEOUT: 'リクエストがタイムアウトしました。再試行してください',
  UNKNOWN: '予期しないエラーが発生しました。もう一度お試しください',
} as const;

/**
 * Operation-Specific Error Messages
 * Context-specific errors for different operations
 */
export const OPERATION_ERROR_MESSAGES = {
  // Task operations
  TASK_CREATE_FAILED: 'タスクの作成に失敗しました',
  TASK_UPDATE_FAILED: 'タスクの更新に失敗しました',
  TASK_DELETE_FAILED: 'タスクの削除に失敗しました',
  TASK_LOAD_FAILED: 'タスクの読み込みに失敗しました',
  TASK_STATUS_UPDATE_FAILED: 'ステータスの更新に失敗しました',
  
  // Project operations
  PROJECT_LOAD_FAILED: 'プロジェクトの読み込みに失敗しました',
  PROJECT_CREATE_FAILED: 'プロジェクトの作成に失敗しました',
  PROJECT_UPDATE_FAILED: 'プロジェクトの更新に失敗しました',
  PROJECT_DELETE_FAILED: 'プロジェクトの削除に失敗しました',
  
  // Organization operations
  ORGANIZATION_LOAD_FAILED: '組織の読み込みに失敗しました',
  ORGANIZATION_LIST_LOAD_FAILED: '組織一覧の取得に失敗しました',
  ORGANIZATION_CREATE_FAILED: '組織の作成に失敗しました',
  ORGANIZATION_UPDATE_FAILED: '組織の更新に失敗しました',
  ORGANIZATION_DELETE_FAILED: '組織の削除に失敗しました',
  
  // Member operations
  MEMBER_ADD_FAILED: 'メンバーの追加に失敗しました',
  MEMBER_REMOVE_FAILED: 'メンバーの削除に失敗しました',
  MEMBER_LOAD_FAILED: 'メンバーの読み込みに失敗しました',
  MEMBER_UPDATE_FAILED: 'メンバーの更新に失敗しました',
  
  // Comment operations
  COMMENT_ADD_FAILED: 'コメントの投稿に失敗しました',
  COMMENT_POST_FAILED: 'コメントの投稿に失敗しました',
  COMMENT_LOAD_FAILED: 'コメントの読み込みに失敗しました',
  COMMENT_DELETE_FAILED: 'コメントの削除に失敗しました',
  
  // File operations
  FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
  FILE_DELETE_FAILED: 'ファイルの削除に失敗しました',
  FILE_DOWNLOAD_FAILED: 'ファイルのダウンロードに失敗しました',
  FILE_LOAD_FAILED: 'ファイルの読み込みに失敗しました',
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます',
  INVALID_FILE_TYPE: 'サポートされていないファイル形式です',
  ATTACHMENT_DELETE_FAILED: '添付ファイルの削除に失敗しました',
  ATTACHMENT_DOWNLOAD_FAILED: '添付ファイルのダウンロードに失敗しました',
  ATTACHMENT_NOT_FOUND: '添付ファイルが見つかりません',
  COMMENT_NOT_FOUND: 'コメントが見つかりません',
  
  // Notification operations
  NOTIFICATION_LOAD_FAILED: '通知の読み込みに失敗しました',
  NOTIFICATION_UPDATE_FAILED: '通知の更新に失敗しました',
  NOTIFICATION_MARK_READ_FAILED: '通知の既読処理に失敗しました',
  NOTIFICATION_MARK_ALL_READ_FAILED: 'すべての通知の既読処理に失敗しました',
  NOTIFICATION_NOT_FOUND: '通知が見つかりません',
  
  // Auth operations
  LOGIN_FAILED: 'ログインに失敗しました。認証情報を確認してください',
  LOGOUT_FAILED: 'ログアウトに失敗しました',
  REGISTER_FAILED: '登録に失敗しました。もう一度お試しください',
  REGISTRATION_FAILED: '登録に失敗しました。もう一度お試しください',
  PASSWORD_RESET_FAILED: 'パスワードの更新に失敗しました。もう一度お試しください',
  PASSWORD_RESET_REQUEST_FAILED: 'パスワードリセットに失敗しました。もう一度お試しください',
  PASSWORD_UPDATE_FAILED: 'パスワードの更新に失敗しました',
  TOKEN_REFRESH_FAILED: 'セッションの更新に失敗しました。再度ログインしてください',
  SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',
  UNAUTHORIZED: '認証が必要です。再度ログインしてください',
  INVALID_CREDENTIALS: '認証情報が正しくありません',
  
  // Calendar operations
  CALENDAR_LOAD_FAILED: 'カレンダーの読み込みに失敗しました',
  
  // User operations
  USER_LOAD_FAILED: 'ユーザー情報の読み込みに失敗しました',
  USER_UPDATE_FAILED: 'ユーザー情報の更新に失敗しました',
  USER_DELETE_FAILED: 'ユーザーの削除に失敗しました',
  USER_LIST_LOAD_FAILED: 'ユーザー一覧の取得に失敗しました',
} as const;

/**
 * Permission Error Messages
 * Specific messages for authorization/permission failures
 */
export const PERMISSION_ERROR_MESSAGES = {
  // System Admin
  SYSTEM_ADMIN_REQUIRED: 'この操作にはシステム管理者権限が必要です',
  
  // Task permissions
  NO_TASK_STATUS_CHANGE: 'タスクのステータスを変更する権限がありません',
  NO_TASK_EDIT: 'このタスクを編集する権限がありません',
  NO_TASK_DELETE: 'このタスクを削除する権限がありません',
  NO_TASK_CREATE: 'タスクを作成する権限がありません',
  NO_TASK_ACCESS: 'このタスクにアクセスする権限がありません',
  
  // Project permissions
  NO_PROJECT_ACCESS: 'このプロジェクトにアクセスする権限がありません',
  NO_PROJECT_MANAGE: 'このプロジェクトを管理する権限がありません',
  NO_PROJECT_CREATE: 'プロジェクトを作成する権限がありません',
  NO_PROJECT_UPDATE: 'このプロジェクトを更新する権限がありません',
  NO_PROJECT_DELETE: 'このプロジェクトを削除する権限がありません',
  
  // Organization permissions
  NO_ORGANIZATION_ACCESS: 'この組織にアクセスする権限がありません',
  NO_ORGANIZATION_MANAGE: '組織を管理する権限がありません',
  NO_ORGANIZATION_CREATE: '組織を作成する権限がありません',
  
  // Member permissions
  NO_MEMBER_MANAGE: 'メンバーを管理する権限がありません',
  
  // Attachment permissions
  NO_ATTACHMENT_DELETE: 'この添付ファイルを削除する権限がありません',
  NO_ATTACHMENT_ACCESS: 'この添付ファイルにアクセスする権限がありません',
} as const;

/**
 * General Error Messages
 * Common error messages used across the application
 */
export const GENERAL_ERROR_MESSAGES = {
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  TRY_AGAIN: 'もう一度お試しください',
  CONTACT_SUPPORT: 'エラーが続く場合は、サポートにお問い合わせください',
  PAGE_RELOAD_REQUIRED: 'ページを再読み込みしてください',
} as const;
