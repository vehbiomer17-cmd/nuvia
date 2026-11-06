# GLUNOVA

Sitio completo en HTML, CSS y JavaScript, sin framework ni compilación.

## Ver la página

Abrí `index.html` en un navegador, o ejecutá `python3 -m http.server 8080` y visitá http://localhost:8080.

## Editar

- `index.html`: secciones, contenido, metadatos y logo.
- `styles.css`: diseño responsive, colores, renders del dispositivo y cápsulas.
- `app.js`: catálogo `products` (precios ARS), publicaciones `posts`, preguntas `faqs` e interacciones.

`dist/` contiene la copia estática lista para hosting. Sincronizá los tres archivos y `logo.jpeg` después de editar.

## Funcionalidad

Menú móvil, navegación suave, FAQ, selector de cantidades, carrito con edición y eliminación, total, favoritos y ventanas de detalles. El carrito y los favoritos se guardan únicamente en este navegador. El checkout no procesa pagos.

## Integración futura

El catálogo usa IDs estables. Sustituí los datos y funciones locales por una API para catálogo, cuentas, pedidos, favoritos y comunidad. Validá precios y stock en el servidor antes de incorporar pagos. Nunca guardes contraseñas en almacenamiento local.

## Contenido provisional

Marca, renders conceptuales, datos técnicos, productos, precios, perfiles, testimonios, establecimientos y beneficios son ilustrativos. Los tiempos, cantidades y límites de detección requieren validación. Fotos y avatares: Unsplash y Pravatar. Fuentes: Google Fonts. Reemplazar con recursos propios para el lanzamiento.

## Administración y Supabase

Abrí `admin.html` para ingresar por correo y contraseña, crear o editar experiencias y productos, subir imágenes y publicar o guardar borradores. Configurá las tres variables públicas en `config.js` y seguí [supabase/SETUP.md](supabase/SETUP.md) para ejecutar el esquema, migrar el contenido existente y habilitar tu administrador. Sin configuración, el sitio conserva su contenido de demostración.

Archivos nuevos: `config.js` (variables públicas), `content.js` (conexión compartida), `admin.html`, `admin.css`, `admin.js` y `supabase/` (SQL e instrucciones). Después de editar, sincronizá todos los archivos estáticos con `dist/`. Nunca subas contraseñas ni claves secretas al repositorio.

## Verificación local

Con Node.js instalado, ejecutá `node tests/check.js`. La prueba cubre contenido de demostración, estados vacíos y errores de conexión, escape de contenido, URLs de imágenes, mapas, acceso de administrador y guardado/edición/publicación con un cliente simulado. Para validar Auth, Storage y RLS en Supabase, seguí la lista de verificación de `supabase/SETUP.md` después de configurar tu proyecto.

## Validación y activación de cápsulas

La sección **Validación de cápsulas** incluye una demostración claramente identificada y un modo real conectado al mismo proyecto Supabase. El panel **Cápsulas y lotes** permite administrar lotes, generar códigos únicos, registrar detectores, revocar registros y revisar el historial. El modo real requiere desplegar la migración y `capsule-api`; ver [supabase/CAPSULES.md](supabase/CAPSULES.md) para seguridad, despliegue, contrato del detector y estado de las pruebas. El código no afirma impedir reutilización física sin hardware integrado y probado.

Pruebas adicionales: `node tests/capsule-check.js`; pruebas SQL, WebCrypto y red documentadas en esa guía. Los archivos nuevos de frontend también se incluyen en `dist/`. Las claves privadas y los códigos emitidos no deben subirse a GitHub.
