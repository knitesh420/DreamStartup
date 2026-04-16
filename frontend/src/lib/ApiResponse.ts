export class ApiResponse {
  success: boolean;
  statusCode: number;
  data: unknown;
  message: string;

  constructor(statusCode: number, data: unknown, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
  }
}
