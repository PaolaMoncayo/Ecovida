// src/pages/Blog.jsx
import React from 'react';

function Blog() {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Blog Educativo</h2>
      <p>
        En esta sección puedes publicar artículos, consejos y recetas sobre agricultura orgánica y vida sostenible.
      </p>
      <hr />
      <article>
        <h3>Ejemplo de Artículo 1</h3>
        <p>Contenido sobre técnicas de cultivo orgánico...</p>
      </article>
      <hr />
      <article>
        <h3>Ejemplo de Artículo 2</h3>
        <p>Receta saludable usando productos ecológicos...</p>
      </article>
    </div>
  );
}

export default Blog;
