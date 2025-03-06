// utils/sanitize.js
export function sanitizeInput(input) {
    // Elimina etiquetas HTML
    return input.replace(/<[^>]*>?/gm, '');
  }
  