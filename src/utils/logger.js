// src/utils/logger.js
// Централизованное логирование с временными метками

const DEBUG = true; // Выключить в продакшене

export function log(module, message, data = null) {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}][${module}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export function logError(module, message, error) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.error(`[${timestamp}][${module}] ❌ ${message}`, error?.message || error);
}

export function logStart(module, action) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}][${module}] 🚀 ${action}`);
}

export function logEnd(module, action, duration) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}][${module}] ✅ ${action} (${duration}ms)`);
}

// Замер времени выполнения
export function startTimer() {
  return Date.now();
}

export function endTimer(startTime) {
  return Date.now() - startTime;
}