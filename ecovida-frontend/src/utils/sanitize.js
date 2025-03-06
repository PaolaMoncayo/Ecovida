// utils/sanitize.js
export function sanitizeInput(input) {
    // Remueve etiquetas HTML
    let sanitized = input.replace(/<[^>]*>?/gm, '');
  
    // Lista de palabras clave SQL a eliminar (de forma case-insensitive)
    const sqlKeywords = [
      "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", 
      "ALTER", "CREATE", "EXEC", "UNION", "FROM", "WHERE", "OR", "AND"
    ];
    
    // Para cada palabra clave, remueve ocurrencias que aparezcan como palabra completa
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      sanitized = sanitized.replace(regex, '');
    });
  
    return sanitized;
  }
  