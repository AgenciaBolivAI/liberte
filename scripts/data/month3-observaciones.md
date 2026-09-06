# Mes 3 «JE M'EXPRIME» — observaciones sobre el documento

Transcripción hecha **verbatim**: nada de lo que sigue se ha corregido en la
plataforma. Son cosas que conviene que revise la profesora antes de que 600
frases entren en los juegos y en el tutor, porque el alumno las va a leer, oír
y repetir tal cual.

Verificado contra `scripts/data/month3-dictionary.json` (la transcripción
literal del documento), no de memoria.

---

## 1. « On est tous grandis dans la même maison. »

**Día 41 · Mi infancia · Passé composé avec avoir**

`grandir` se conjuga con **avoir**, no con être. Además el participio no
concuerda. La forma correcta:

> On **a** tous **grandi** dans la même maison.

Es especialmente delicado porque el día 41 enseña justamente el passé composé
**avec avoir** y esta frase lo contradice: el alumno ve un ejemplo con *être*
en la lección de *avoir*.

## 2. « J'ai voulu ce changement depuis il y a longtemps. »

**Día 53 · Mis sueños · Depuis / pendant / il y a**

`depuis` y `il y a` no se combinan — son las dos alternativas que el propio día
enseña a distinguir. Además, con `depuis` el francés usa **presente**, no passé
composé. Dos opciones correctas:

> Je **veux** ce changement **depuis** longtemps.
> J'ai voulu ce changement **il y a** longtemps.

Mismo problema que arriba: la frase de ejemplo rompe la regla del día.

## 3. Veinte frases sin el « ne » de la negación

Por ejemplo:

- « J'**avais pas** envie de rentrer à la maison après l'école. »
- « …même si je **voulais pas** l'admettre. »
- « J'ai eu tort de **pas** écouter mes parents à l'époque. »
- « c'était **vraiment pas** facile. »

Es francés hablado real y perfectamente natural, pero son **20 de 600 frases**
y el alumno de A1-A2 todavía está aprendiendo `ne… pas`. Dos caminos, los dos
válidos — es decisión de la profesora:

- **dejarlas** y marcarlas como registro oral («así se habla, así se escribe»), o
- **restituir el `ne`** para que el mes sea coherente con lo enseñado en los
  meses 1 y 2.

Ahora mismo están tal cual el documento, sin marca.

## 4. « Mi hermana llegó a mi vida como una maravilla sorpresa. »

**Día 43 · Mi familia**

La traducción al español no termina de funcionar: *maravilla sorpresa* no es
una construcción castellana. Probablemente se buscaba:

> …como una **sorpresa maravillosa**.

o bien *como una maravillosa sorpresa*.

---

## Lo que NO se ha tocado

Ninguna de estas cuatro cosas se ha corregido en el código. La regla es que el
documento manda; si la profesora confirma los cambios se editan en
`scripts/data/month3-dictionary.json` y se regenera `src/data/month3.ts` con
`node scripts/gen-month3-data.mjs`.
