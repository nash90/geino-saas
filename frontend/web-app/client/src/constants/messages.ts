/**
 * Centralized UI Messages
 *
 * All user-facing messages are defined here to:
 * - Avoid duplication across components
 * - Enable easy translation/localization
 * - Maintain consistency in messaging
 */

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
  TASK_STATUS_UPDATED: "Task status updated",
  TASK_STATUS_UPDATE_FAILED: "Failed to update task",

  // Deletion
  TASK_DELETED_SUCCESS: "タスクが削除されました",
  TASK_DELETE_FAILED: "タスクの削除に失敗しました",

  // Duplication
  TASK_DUPLICATED_SUCCESS: "タスクが複製されました",
  TASK_DUPLICATE_FAILED: "タスクの複製に失敗しました",

  // Loading
  TASK_LOAD_FAILED: "Failed to load tasks",
  TASK_DETAILS_LOAD_FAILED: "Failed to load task details",

  // Calendar
  CALENDAR_TASKS_LOAD_FAILED: "Failed to load calendar tasks",
} as const;

// ============================================================================
// Project Management
// ============================================================================

export const PROJECT_MESSAGES = {
  // Creation
  PROJECT_CREATED_SUCCESS: "プロジェクトが作成されました",
  PROJECT_CREATE_FAILED: "プロジェクトの作成に失敗しました",

  // Updates
  PROJECT_UPDATED_SUCCESS: "プロジェクトが更新されました",
  PROJECT_UPDATE_FAILED: "プロジェクトの更新に失敗しました",

  // Deletion
  PROJECT_DELETED_SUCCESS: "プロジェクトが削除されました",
  PROJECT_DELETE_FAILED: "プロジェクトの削除に失敗しました",

  // Loading
  PROJECT_LOAD_FAILED: "Failed to load project data",
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
  NO_PERMISSION_CREATE_TASK: "You don't have permission to create tasks",
  NO_PERMISSION_MOVE_TASK: "You don't have permission to move this task",
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
  COMMON: COMMON_MESSAGES,
} as const;

// Type exports for TypeScript support
export type MessageKey = keyof typeof MESSAGES;
