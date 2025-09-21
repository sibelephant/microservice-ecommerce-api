export class Logger {
  static info(service, message, data = {}) {
    console.log(
      `[${new Date().toISOString()}] [${service}] INFO: ${message}`,
      data
    );
  }

  static error(service, message, error = {}) {
    console.error(
      `[${new Date().toISOString()}] [${service}] ERROR: ${message}`,
      error
    );
  }

  static warn(service, message, data = {}) {
    console.warn(
      `[${new Date().toISOString()}] [${service}] WARN: ${message}`,
      data
    );
  }
}
