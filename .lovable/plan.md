## Reestructura del Défi Final (todos los días) + panel del profesor

### 1. Nuevo componente reutilizable `StagedDefi`
Reemplaza los 4 `DefiLessonDayX` actuales (día 2, 3, 4, 5) por un único componente por etapas:

- Recibe `dayId`, `title`, `intro`, `steps[]` (serveur/hint/example + criterio de éxito), `criteria[]`.
- Cada etapa = tarjeta numerada con: instrucción de Antoine, pista, ejemplo, y su **propio botón de micrófono** (usa `MediaRecorder`, guarda `Blob` en memoria — sin storage).
- Estados por etapa: pendiente / grabando / guardada ✓ (check dorado). Permite reproducir y regrabar.
- Botón único al final: **📤 Subir mi desafío** — solo activo cuando TODAS las etapas están grabadas.

Los `DefiLessonDayX` actuales se refactorizan a wrappers finos que pasan sus `steps` + `criteria` al `StagedDefi`.

### 2. Evaluación automática al subir

Server function `evaluateDefi` (`src/lib/defi.functions.ts`, `requireSupabaseAuth`):

1. Recibe `{ dayId, stages: [{ transcript, criterion, expected }] }`.
   - Transcripción: se hace en el **cliente** con Lovable AI STT (`openai/gpt-4o-mini-transcribe`, francés) porque el audio no se persiste; el server solo recibe texto.
2. Llama Lovable AI (chat, `google/gemini-3.5-flash`) con schema Zod estricto:
   - Por etapa: `passed: bool`, `matched_criteria: string[]`, `error: { said, corrected } | null`.
   - Global: `strengths: string[]` (2), `improvement: { said, corrected }` (1), `score_10`, `celebration_message`, `weak_points: string[]`, `recommendation: string`.
3. Devuelve resultado + guarda en BD.
4. UI muestra devolución cálida: ✅ 2 aciertos · 💡 1 mejora · puntuación /10 · mensaje.

### 3. Base de datos (migración)

**`user_roles`** + enum `app_role ('student','coach','admin')` + función `has_role` (patrón estándar, SECURITY DEFINER).

**`defi_results`**:
- `user_id`, `day_id`, `score_10`, `strengths jsonb`, `errors jsonb` (lista {said, corrected, stage}), `weak_points jsonb`, `recommendation text`, `stages jsonb` (transcript + passed por etapa), `hits int`, `misses int`, `created_at`.
- RLS: alumno lee/escribe lo suyo; coach/admin lee todo (via `has_role`).
- GRANTs a `authenticated` y `service_role`.

### 4. Panel del profesor

Ruta `src/routes/_authenticated/coach.tsx` (gate: `has_role(coach|admin)`).
- Lista de alumnos (profiles) con: días completados, promedio, últimos errores.
- Detalle por alumno: tabla de días con score, aciertos, errores comunes, puntos débiles, recomendación.

### 5. Conexión con evaluación semanal

Función SQL `get_week_summary(user_id, week)` que agrega `defi_results` de esa semana (aciertos, errores, puntos débiles, recomendaciones). La autoevaluación semanal existente la consume y pondera al 50% con la nota manual del alumno. *(Solo dejo la función SQL + el server fn `getWeekDefiSummary`; el cálculo final ya vive en la UI semanal actual.)*

### Detalles técnicos

- **STT en cliente**: `MediaRecorder` → WAV/webm → llamada a server fn `transcribeStage` (envía audio base64, devuelve texto, no persiste). Evita mandar audios grandes por RPC múltiples veces.
- **Modelos**: `openai/gpt-4o-mini-transcribe` (STT) · `google/gemini-3.5-flash` (evaluación, con `Output.object` schema plano sin bounds).
- **Sin storage** de audios (confirmado).
- **AuthPage**: sin cambios.

### Orden de ejecución

1. Migración BD (roles + `defi_results` + `has_role` + `get_week_summary`).
2. Server fns: `transcribeStage`, `evaluateDefi`, `getMyDefiResults`, `getCoachRoster`, `getStudentResults`.
3. Componente `StagedDefi` + refactor de `DefiLessonDay2..5`.
4. Ruta `/coach` con lista + detalle.
5. Hook en la autoevaluación semanal para leer los agregados.
6. Verificación con Playwright (grabar 1 etapa, subir, ver devolución).

### Nota
Aún no se creó una autoevaluación semanal en el código actual (no la encontré al buscar). Si ya existe en otro nombre, dímelo; si no, el paso 5 queda como *stub* (server fn + función SQL listos para conectarse cuando construyamos esa pantalla).