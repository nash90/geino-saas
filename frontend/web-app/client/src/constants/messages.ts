/**
 * Centralized UI Messages
 *
 * All user-facing messages are defined here to:
 * - Avoid duplication across components
 * - Enable easy translation/localization
 * - Maintain consistency in messaging
 */

import {
  HTTP_ERROR_MESSAGES,
  OPERATION_ERROR_MESSAGES,
  PERMISSION_ERROR_MESSAGES,
  GENERAL_ERROR_MESSAGES,
} from './errorMessages';

// ============================================================================
// User Search & Member Management
// ============================================================================

export const MEMBER_MESSAGES = {
  // Search
  SEARCH_PLACEHOLDER_EMAIL: "正確なメールアドレスを入力してください",
  SEARCH_PLACEHOLDER_EMAIL_SHORT: "正確なメールアドレスを入力...",
  SEARCH_HELP_TEXT: "正確なメールアドレスが必要です",
  SEARCH_HELP_TEXT_SECURITY: "セキュリティのため、正確なメールアドレスが必要です",

  // Search Results
  USER_FOUND: "ユーザーが見つかりました",
  USER_NOT_FOUND: "このメールアドレスのユーザーが見つかりませんでした",
  USER_ALREADY_PROJECT_MEMBER: "このユーザーはすでにプロジェクトのメンバーです",
  USER_ALREADY_ORGANIZATION_MEMBER: "このユーザーはすでに組織のメンバーです",
  USER_SEARCH_FAILED: "ユーザーの検索に失敗しました",

  // Actions
  MEMBER_ADDED_SUCCESS: "メンバーを追加しました",
  MEMBER_ADD_FAILED: "メンバーの追加に失敗しました",
  MEMBER_REMOVED_SUCCESS: "メンバーを削除しました",
  MEMBER_REMOVE_FAILED: "メンバーの削除に失敗しました",
} as const;

// ============================================================================
// Task Management
// ============================================================================

export const TASK_MESSAGES = {
  // Creation
  TASK_CREATED_SUCCESS: "タスクが作成されました",
  TASK_CREATE_FAILED: "タスクの作成に失敗しました",
  TASK_TITLE_REQUIRED: "タスク名を入力してください",

  // Updates
  TASK_UPDATED_SUCCESS: "タスクが更新されました",
  TASK_UPDATE_FAILED: "タスクの更新に失敗しました",
  TASK_STATUS_UPDATED: "タスクのステータスが更新されました",
  TASK_STATUS_UPDATE_FAILED: "タスクの更新に失敗しました",

  // Deletion
  TASK_DELETED_SUCCESS: "タスクが削除されました",
  TASK_DELETE_FAILED: "タスクの削除に失敗しました",

  // Duplication
  TASK_DUPLICATED_SUCCESS: "タスクが複製されました",
  TASK_DUPLICATE_FAILED: "タスクの複製に失敗しました",

  // Loading
  TASK_LOAD_FAILED: "タスクの読み込みに失敗しました",
  TASK_DETAILS_LOAD_FAILED: "タスク詳細の読み込みに失敗しました",

  // Calendar
  CALENDAR_TASKS_LOAD_FAILED: "カレンダータスクの読み込みに失敗しました",
} as const;

// ============================================================================
// Project Management
// ============================================================================

export const PROJECT_MESSAGES = {
  // Creation
  PROJECT_CREATED_SUCCESS: "プロジェクトを作成しました",
  PROJECT_CREATE_FAILED: "プロジェクトの作成に失敗しました",

  // Updates
  PROJECT_UPDATED_SUCCESS: "プロジェクトを更新しました",
  PROJECT_UPDATE_FAILED: "プロジェクトの更新に失敗しました",

  // Deletion
  PROJECT_DELETED_SUCCESS: "プロジェクトを削除しました",
  PROJECT_DELETE_FAILED: "プロジェクトの削除に失敗しました",

  // Loading
  PROJECT_LOAD_FAILED: "プロジェクトの読み込みに失敗しました",
} as const;

// ============================================================================
// Organization Management
// ============================================================================

export const ORGANIZATION_MESSAGES = {
  // Creation
  ORGANIZATION_CREATED_SUCCESS: "組織が作成されました",
  ORGANIZATION_CREATE_FAILED: "組織の作成に失敗しました",

  // Updates
  ORGANIZATION_UPDATED_SUCCESS: "組織が更新されました",
  ORGANIZATION_UPDATE_FAILED: "組織の更新に失敗しました",

  // Deletion
  ORGANIZATION_DELETED_SUCCESS: "組織が削除されました",
  ORGANIZATION_DELETE_FAILED: "組織の削除に失敗しました",
} as const;

// ============================================================================
// Authentication
// ============================================================================

export const AUTH_MESSAGES = {
  // Login
  LOGIN_SUCCESS: "ログインしました",
  LOGIN_FAILED: "ログインに失敗しました",

  // Logout
  LOGOUT_SUCCESS: "ログアウトしました",
  LOGOUT_FAILED: "ログアウトに失敗しました",

  // Registration
  REGISTRATION_SUCCESS: "登録が完了しました",
  REGISTRATION_FAILED: "登録に失敗しました",

  // Unauthorized
  UNAUTHORIZED: "権限がありません",
  NO_PERMISSION_CREATE_TASK: "タスクを作成する権限がありません",
  NO_PERMISSION_MOVE_TASK: "このタスクを移動する権限がありません",
  NO_PERMISSION_CHANGE_STATUS: "タスクのステータスを変更する権限がありません。プロジェクトマネージャーのみがステータスを変更できます。",
} as const;

// ============================================================================
// Comment Management
// ============================================================================

export const COMMENT_MESSAGES = {
  // Creation
  COMMENT_ADDED_SUCCESS: "コメントを追加しました",
  COMMENT_ADD_FAILED: "コメントの追加に失敗しました",
  COMMENT_OR_FILE_REQUIRED: "コメントまたはファイルを入力してください",

  // Deletion
  COMMENT_DELETED_SUCCESS: "コメントを削除しました",
  COMMENT_DELETE_FAILED: "コメントの削除に失敗しました",

  // Loading
  COMMENT_LOAD_FAILED: "コメントの読み込みに失敗しました",
} as const;

// ============================================================================
// File & Attachment Management
// ============================================================================

export const FILE_MESSAGES = {
  // Upload
  FILE_UPLOADED_SUCCESS: "ファイルをアップロードしました",
  FILE_UPLOAD_FAILED: "アップロードに失敗しました",

  // Download
  FILE_DOWNLOADED_SUCCESS: "ファイルをダウンロードしました",
  FILE_DOWNLOAD_FAILED: "ダウンロードに失敗しました",

  // Deletion
  FILE_DELETED_SUCCESS: "ファイルを削除しました",
  FILE_DELETE_FAILED: "削除に失敗しました",
  ATTACHMENT_DELETED_SUCCESS: "添付ファイルを削除しました",
  ATTACHMENT_DELETE_FAILED: "添付ファイルの削除に失敗しました",
} as const;

// ============================================================================
// Validation Messages
// ============================================================================

export const VALIDATION_MESSAGES = {
  // Date/Time Validation
  DATE_INVALID_FORMAT: "無効な日付形式です",
  DATE_INVALID: "無効な日付です",
  DATE_REQUIRED: "期限を入力してください",
  DATE_FORMAT_INCORRECT: "日付形式が正しくありません",
  DATE_FORMAT_INCORRECT_DATETIME: "日付形式が正しくありません (YYYY-MM-DDTHH:mm)",
  DATE_BELOW_MIN: "指定された最小日時より前の日付は選択できません",
  DATE_ABOVE_MAX: "指定された最大日時より後の日付は選択できません",
  DATE_STEP_MISMATCH: "指定された時間間隔に合わせてください",
  DEADLINE_MUST_BE_FUTURE: "期限は現在時刻より後に設定してください",
  DEADLINE_TOO_FAR_FUTURE: "期限は{years}年以内に設定してください",
  DEADLINE_INVALID: "無効な期限です",
  DATE_ISO_INVALID: "無効なISO日付形式です",
} as const;

// ============================================================================
// Notification Management
// ============================================================================

export const NOTIFICATION_MESSAGES = {
  // Actions
  NOTIFICATIONS_MARKED_READ: "すべての通知を既読にしました",
  NOTIFICATIONS_MARK_READ_FAILED: "通知の更新に失敗しました",

  // Loading
  NOTIFICATIONS_LOAD_FAILED: "通知の読み込みに失敗しました",
} as const;

// ============================================================================
// Common UI Messages
// ============================================================================

export const COMMON_MESSAGES = {
  // Generic Actions
  SAVE_SUCCESS: "保存しました",
  SAVE_FAILED: "保存に失敗しました",
  DELETE_CONFIRM: "本当に削除しますか？",
  CANCEL: "キャンセル",
  CONFIRM: "確認",

  // Loading States
  LOADING: "読み込み中...",
  SAVING: "保存中...",
  ADDING: "追加中...",
  DELETING: "削除中...",

  // Empty States
  NO_DATA: "データがありません",
  NO_RESULTS: "結果が見つかりませんでした",

  // Errors
  ERROR_OCCURRED: "エラーが発生しました",
  UNEXPECTED_ERROR: "予期しないエラーが発生しました",
  NETWORK_ERROR: "ネットワークエラーが発生しました",
} as const;

// ============================================================================
// Export all messages
// ============================================================================

export const MESSAGES = {
  MEMBER: MEMBER_MESSAGES,
  TASK: TASK_MESSAGES,
  PROJECT: PROJECT_MESSAGES,
  ORGANIZATION: ORGANIZATION_MESSAGES,
  AUTH: AUTH_MESSAGES,
  COMMENT: COMMENT_MESSAGES,
  FILE: FILE_MESSAGES,
  VALIDATION: VALIDATION_MESSAGES,
  NOTIFICATION: NOTIFICATION_MESSAGES,
  COMMON: COMMON_MESSAGES,
  // Error messages
  HTTP_ERROR: HTTP_ERROR_MESSAGES,
  OPERATION_ERROR: OPERATION_ERROR_MESSAGES,
  PERMISSION_ERROR: PERMISSION_ERROR_MESSAGES,
  GENERAL_ERROR: GENERAL_ERROR_MESSAGES,
} as const;

// Type exports for TypeScript support
export type MessageKey = keyof typeof MESSAGES;
