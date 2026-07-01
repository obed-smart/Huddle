export class ApiResponse {
  static success<T>(data?: T, message?: string) {
    return { success: true, data: data ?? null, message };
  }

  static error(message: any | string) {
    return {
      success: false,
      message,
    };
  }
}
