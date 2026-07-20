# Liberté — Recomendaciones para escalar

Preparado el 18 de julio de 2026. Basado en una auditoría completa del código, la base de datos y las funcionalidades del producto.

---

## 1. Resumen ejecutivo

La plataforma es sólida a nivel técnico: hoy funciona íntegramente sobre infraestructura propia, con 21 alumnas migradas, corrección con IA en funcionamiento, tutora de conversación por voz, analítica en vivo y un flujo de aprobación de cuentas. Hay 241 pruebas automatizadas cubriendo los caminos críticos.

**La limitación no es la tecnología. Es el contenido y la forma en que se produce.**

Se está vendiendo un programa de seis meses del que hay construidas dos semanas. Peor aún: añadir un día nuevo exige hoy que un programador escriba unas 760 líneas de código a mano. A ese ritmo, completar el programa significa alrededor de 83.000 líneas de TSX. Eso no es un problema de escala: es un muro, y aparece el día en que una alumna termina el Día 10.

Todo lo demás en este documento vale menos que resolver eso.

| Prioridad | Iniciativa | Por qué ahora |
|---|---|---|
| 1 | Sistema de creación de contenido | Elimina el único bloqueo real para entregar lo que se vende |
| 2 | Pagos (Stripe) | El crecimiento está limitado por la inscripción manual |
| 3 | Recordatorios automáticos | La retención más barata disponible; los datos ya existen |
| 4 | Test de nivel | El mejor imán de leads, y ubica a cada alumna en la semana correcta |
| 5 | Evaluación de pronunciación | El diferenciador más claro frente a Duolingo y similares |

---

## 2. Dónde está el producto hoy

**Construido y funcionando**

- Lecciones diarias del Día 1 al 10 (Semanas 1 y 2), con video, vocabulario, gramática, ejercicios y un desafío final hablado
- Evaluación con IA: corrección del défi diario, corrección por actividad, evaluación semanal con informe en PDF
- Tutora de conversación con IA: roleplay por escena según el día, texto y voz manos libres, correcciones amables y objetivos
- Persistencia del progreso: estado por lección, días completados, estrellas y rachas — en cualquier dispositivo
- Calendario de clases en vivo gestionable por la profesora
- Panel de administración: analítica en vivo con rangos de fecha, cola de aprobación, detalle por alumna y modo "ver como alumna"
- Página pública con captación de leads y control de aprobación para cuentas nuevas

**Falta o está incompleto**

- Contenido de las Semanas 3 a 24 (el 92% del programa)
- Cualquier forma de pago o inscripción autónoma
- Toda comunicación posterior al registro (sin recordatorios ni reactivación)
- Creación de contenido por personas que no programan
- Evaluación de pronunciación, test de nivel, certificados
- Monitoreo de errores, política de respaldos y control de costos de IA

---

## 3. Prioridad 1 — Sistema de creación de contenido

**El problema, medido.** 7.605 líneas de código producen 10 días de lecciones. Hay 37 componentes React escritos a mano dentro de un solo archivo de ruta. Cada día nuevo requiere un programador.

**La oportunidad.** Todas las lecciones existentes responden a unos pocos patrones que se repiten: práctica de vocabulario, comprensión lectora, comprensión auditiva de opción múltiple, expresión oral, expresión escrita, pares de gramática y desafío hablado por etapas. No hay ninguna razón estructural para que cada día necesite código propio.

**Qué construir**

1. Sacar el contenido del código y llevarlo a tablas de base de datos (`lessons`, `lesson_blocks`, `lesson_items`)
2. Construir un único renderizador genérico capaz de dibujar cualquier lección a partir de esos datos — reemplazando los 37 componentes
3. Construir una interfaz de autoría para la profesora: crear un día, añadir bloques, pegar la URL del video, escribir el vocabulario, definir los criterios del desafío
4. Migrar los Días 1 a 10 al nuevo sistema para que no quede nada en código
5. Opcional: un asistente de IA que proponga el vocabulario y los ejercicios de un día a partir de un tema, para que la profesora los edite

**Impacto.** La producción de contenido pasa de una semana de programador por día a aproximadamente una hora por día, hecha por la profesora. Esa es la diferencia entre una demo de dos semanas y un producto de seis meses.

**Esfuerzo aproximado.** Dos a tres semanas de desarrollo. Es el trabajo con mayor retorno disponible.

---

## 4. Prioridad 2 — Pagos e inscripción autónoma

Hoy la inscripción es manual: llega un lead, alguien lo contacta, un administrador aprueba la cuenta. Eso limita el crecimiento a la capacidad personal de la profesora y pierde todo lead que se enfría.

**Recomendado**

- Stripe Checkout desde la página pública, con aprobación automática al confirmarse el pago
- Mantener el control de aprobación actual para becas, pruebas y casos manuales
- Permitir pago en cuotas — importante en el mercado latinoamericano
- Evaluar medios de pago locales por país (la penetración de tarjeta varía mucho); Stripe cubre parte, pero Bolivia en particular puede requerir una alternativa

**Estructura de precios a probar**

| Plan | Contenido |
|---|---|
| Autoestudio | Lecciones diarias, corrección con IA, tutora IA |
| Completo (recomendado) | Autoestudio más clases en vivo e informes semanales |
| Premium | Completo más sesiones individuales periódicas |

La tutora de IA es notablemente más cara de operar que el resto; es una palanca razonable para diferenciar planes por límite de uso, en lugar de quitarla por completo.

---

## 5. Prioridad 3 — Retención y reactivación

Existen rachas y datos de finalización, y un proveedor de correo ya integrado, pero **hoy nada sale al encuentro de la alumna**. En un producto de hábito diario esta es la mayor palanca de retención, y es barata.

**Recomendado, en orden**

1. **Recordatorio de racha** — "llevas 4 días seguidos" antes de que se pierda
2. **Aviso por inactividad** — 3 días sin actividad disparan un mensaje de ánimo; la analítica ya identifica exactamente a esas alumnas
3. **Alerta a la profesora** — resumen semanal de quiénes se están quedando atrás, para que la intervención sea humana y personal
4. **Resumen semanal a la alumna** — estrellas ganadas, días completados y qué sigue
5. **WhatsApp** — en América Latina rinde mucho más que el correo. Vale la pena considerarlo seriamente vía la API de WhatsApp Business; las alumnas ya dejaron su teléfono al registrarse

---

## 6. Nuevas propuestas que vale la pena construir

**Test de nivel.** Un diagnóstico de cinco minutos que puntúa el nivel y recomienda la semana de inicio. Funciona además como el mejor imán de leads ("descubre tu nivel de francés en 5 minutos") y reduce el abandono temprano de quienes empiezan en el nivel equivocado. La maquinaria de evaluación con IA ya existe.

**Evaluación de pronunciación.** Ya se graba y transcribe la voz de la alumna. Puntuar sonidos específicos — el tipo de comentario sobre *voudrais* o *croissant* que ya aparece en los prompts de la semana 1 — y mostrar la mejora en el tiempo es el diferenciador más claro frente a las apps masivas, que lo hacen mal.

**Repaso espaciado.** Que el vocabulario de días anteriores reaparezca según un calendario de repaso es la técnica con mejor evidencia en aprendizaje de idiomas. El vocabulario ya está estructurado como datos; un repaso diario de cinco minutos es comparativamente barato de construir y mejora los resultados de forma real.

**Certificados de finalización.** Ya se generan PDFs. Un certificado por mes es marketing gratuito al compartirse en grupos de WhatsApp, y un hito motivacional.

**Nivel gratuito como embudo.** La tutora de IA es el activo más distintivo y hoy está completamente detrás de la inscripción. Una versión limitada gratuita — cinco mensajes al día, solo la escena del Día 1 — cuesta centavos por usuario y da a los prospectos una muestra real de aquello que la competencia no puede igualar.

**Instalación como aplicación (PWA).** Las alumnas usan esto a diario en el teléfono. Instalarla elimina los permisos repetidos de micrófono, deja un ícono en la pantalla de inicio y habilita notificaciones push, mucho más efectivas que el correo para hábitos diarios.

**Comunidad.** Un espacio de cohorte — incluso un grupo de WhatsApp bien llevado al principio — aumenta de forma notable las tasas de finalización en cursos por cohortes. Conviene hacerlo manualmente antes de construir nada.

---

## 7. Apalancamiento de la profesora y operación

El programa depende hoy de una sola profesora dictando ocho clases en vivo al mes. Esa es la segunda limitación después del contenido.

- **Grabar e indexar las clases en vivo** para que quien falte no se atrase y las grabaciones se vuelvan activos reutilizables
- **Automatizar el informe semanal** — las alumnas ya generan PDFs de evaluación; enviarlos automáticamente a alumna y profesora elimina trabajo manual
- **Agrupar cohortes similares** a medida que crece la inscripción, en lugar de multiplicar las clases linealmente
- **Documentar el método de enseñanza** para poder incorporar a una segunda profesora. Hoy el negocio no puede operar sin Alejandra; eso es un riesgo real tanto para la continuidad como para el valor de la empresa

---

## 8. Bases técnicas y riesgos

No es urgente con 21 alumnas; sí es importante antes de llegar a 200.

- **Monitoreo de errores** — hoy no hay visibilidad de fallas en producción. Si una alumna choca con un flujo roto, es invisible salvo que reclame
- **Respaldos y recuperación** — se acaba de tomar posesión de la base de datos. Conviene confirmar que los respaldos automáticos están activos y probar una restauración al menos una vez
- **Control de costos de IA** — el uso está limitado por alumna y por día, lo cual está bien. Falta un tope mensual global que degrade el servicio con elegancia en lugar de fallar de golpe o generar una factura sorpresa
- **Actualizar a Node 22** — el cliente de Supabase ya declaró obsoleto Node 20; hay un parche de compatibilidad en su lugar, pero no debería ser permanente
- **Límite de peticiones** — el endpoint público de leads tiene un límite básico en memoria; conviene uno persistente antes de invertir en tráfico pago
- **Higiene de credenciales** — las claves de OpenAI y de service role se manejaron en texto plano durante la migración. Conviene rotar ambas y guardarlas como secretos cifrados, no como variables de entorno en texto plano
- **Accesibilidad** — la aplicación no se ha auditado para lectores de pantalla ni contraste; una revisión básica protege legalmente y amplía la audiencia

---

## 9. Expansión de mercado

- **Mercado lusófono (Brasil).** La arquitectura del producto es agnóstica al idioma; la interfaz está en español y el idioma meta es el francés. Añadir la interfaz en portugués abre un mercado varias veces mayor que Bolivia y Colombia juntas
- **Otros idiomas meta.** Nada en la plataforma es específico del francés salvo el contenido y los prompts. Inglés para hispanohablantes es un mercado enormemente mayor, si alguna vez se quiere reutilizar el motor
- **Venta institucional.** Colegios, universidades y empresas comprando cupos es un modelo económico muy distinto al de la inscripción individual, y el panel de administración ya está cerca de lo que eso requiere
- **Marketing de contenidos y SEO.** La página pública es nueva e indexable, con sitemap. Publicar contenido gratuito de forma regular ("50 frases en francés para viajar") es el canal de adquisición de bajo costo estándar en esta categoría

---

## 10. Secuencia sugerida a 90 días

**Días 1 a 30 — Derribar el muro**
Sistema de creación de contenido; migrar los Días 1 a 10; la profesora produce la Semana 3 sin ayuda, como prueba de que funciona.

**Días 31 a 60 — Encender el motor**
Stripe e inscripción autónoma; recordatorios de racha e inactividad; instalación como PWA; monitoreo de errores; rotación de credenciales.

**Días 61 a 90 — Diferenciar y crecer**
Test de nivel como imán de leads; nivel gratuito de la tutora; evaluación de pronunciación; certificados; programa de referidos.

En paralelo: una vez que exista el sistema de autoría, la profesora debería producir contenido de forma continua. La velocidad de producción de contenido es la métrica que más importa en el próximo trimestre.

---

## 11. Decisiones que dependen de ustedes

1. **Plan de contenido** — ¿quién escribe las Semanas 3 a 24, y con qué calendario? Esto determina si el sistema de autoría se usa a plena capacidad o queda ocioso
2. **Precio** — hoy no existe ningún precio en el producto. El embudo no puede convertir sin uno
3. **Medios de pago** — ¿alcanza con Stripe para sus mercados, o hace falta un procesador local para Bolivia?
4. **Modelo de clases en vivo** — ¿se mantiene una profesora con cohortes pequeñas, o se avanza hacia grupos más grandes y grabaciones?
5. **Nivel gratuito** — ¿están dispuestos a gastar algo de presupuesto de IA en prospectos que no pagan, a cambio de un embudo mucho más fuerte?

---

## 12. Evaluación honesta

La plataforma está en buen estado y es claramente mejor que antes: es independiente de Lovable, está probada, asegurada y corriendo sobre infraestructura propia. El riesgo de ingeniería es bajo.

El riesgo de negocio se concentra en dos puntos: **se vende un programa de seis meses del que hay dos semanas construidas**, y **el negocio hoy no puede operar sin una persona en particular**. Ambos tienen solución, y ninguno se resuelve agregando funcionalidades.

Construyan el sistema de contenido. Todo lo demás se desprende de tener un producto que esté a la altura de lo prometido.
