# PROMPT MAESTRO — Presentación AMW 2026
## “Untangling the Academic Network”: deck HTML blanco, visual y controlado con Xbox

Este documento es un prompt de producción. Está escrito para que otra IA pueda
reconstruir una presentación equivalente sin ver el código original. No es una
descripción aspiracional: fija contenido, números, composición, tamaños,
tipografía, animaciones, interacción, datos y criterios de aceptación.

---

## v2 · HISTORIA ACTUAL (reemplaza el orden de láminas de las secciones 5.1–5.5)

Esta es la versión vigente. Mantiene el sistema visual, la arquitectura y el
control de las secciones 3, 4 y 6, pero cambia el relato. Reemplaza el orden
y el contenido de las secciones 5.1–5.5 y el handoff de 4.3b: la escena del
esquema solo resalta paths.

**7 láminas · 15 estados**

1. **Cover**
   - Título completo:
     `Untangling the Academic Network`
     `Analyzing Scientific Trajectories With Graphs and Natural Language Processing`
   - Tagline: `3,143 Chilean doctoral trajectories. One graph.`
   - Autores.
   - Único logo institucional: `logos/amw2026.png` (AMW 2026, Arequipa).
   - Sin IMFD, sin UChile.

2. **The question**
   - Un solo párrafo central, 56 px:
     `Chile funds advanced human capital. Its records cannot answer the follow-up questions: who entered science, with whom, where, and what came of it.`
   - Una flecha grande de acento abajo a la derecha, apuntando al grafo.
   - Sin estadísticas, sin kicker.

3. **The graph · five query paths**
   - El esquema de 16 burbujas con logos oficiales.
   - Menú a la derecha: Trajectory, Origin, Collaboration, Funding, Semantics.
   - Cada beat resalta el **camino completo** con línea de acento de 4 px y
     anillos de 3 px en cada nodo del camino.
   - Banner negro grande abajo con título, cifra y patrón.
   - Sin handoff a 496; el handoff se elimina.

   | Query | Nodos | Resultado |
   |---|---|---|
   | Trajectory | HighSchool ← Fellow → Undergrad; Fellow → Grad; Fellow → Author → Publication → Journal | 3,143 careers |
   | Origin | HighSchool ← Fellow → Undergrad → Quality | 322 of 797 schools |
   | Collaboration | Fellow → Author → Publication → Coauthor | 84.2% isolated |
   | Funding | Grad ← Fellow → Fondecyt | 1,031 projects |
   | Semantics | Author → Publication → Topic; Publication → Field | 237 topics |

4. **BERTopic · 237 topics**
   - Transición: primero `Fellow 3,143` y `Topic 237` unidos; luego se
     expanden las 237 burbujas. Es el Fellow → Topic que pidió el usuario.
   - Constelación 2D: tamaño = publicaciones, color viridis = % mujeres.
   - Título: `From publications to topics.`
   - Tres estados con tabla:
     1. `Largest topics` — top 5, publicaciones, % mujeres.
     2. `Who writes it` — GSE de topic 0 (High 54.6%, Upper-middle 37.0%,
        Middle 0.4%, Low 3.1%, Abroad 1.6%, Unknown 3.3%).
     3. `Where published` — Q1 89.8%, Q2 1.9%, Q3 3.3%, Q4 0.2%, No data 4.8%.
   - Path visible en cada estado.
   - Datos: `data/topicos.js` y `data/perfiles.js`; nada simulado.

5. **Communities · structural**
   - 84.2% `never publish with a peer`, a 160 px.
   - 496 fellows, 700 edges, 21 communities, a 38 px.
   - Tabla estructural de tres comunidades, 21 px:
     | Community | Fellows | Female | Q1 | High GSE |
     | Salmon genomics | 49 | 49.0% | 80.9% | 26.5% |
     | Patient-centred | 31 | 54.8% | 58.9% | 29.0% |
     | Microbiology | 33 | 48.5% | 78.0% | 6.1% |
   - Chips de color en la tabla; el grafo de comunidades va sin etiquetas de
     canvas para no competir. El foco es la estructura.
   - Sin notas pequeñas.

6. **Future**
   - `The graph already holds the rest.`
   - 113,221 co-authors; 2,884,376 edges; 15.8% of the cohort.
   - Una línea de next steps; nota esquemática a 16 px.

7. **Close**
   - `Evaluate programmes by the networks they build.`
   - Links y cita a 16 px.

**Tipografía mínima**

- Nada de letras pequeñas. El texto principal va de 20 px a 160 px.
- Tablas a 20–21 px; headers a 16 px; paths a 15–16 px.
- Los labels de canvas del esquema a 18 px; contadores a 16 px.
- Contraste: `--muted` 80%, `--faint` 58%; sin grises lavados.

**Interacción**

- D-pad reportado ← / → cambia query en The graph y BERTopic.
- ↑ / ↓ avanza/retrocede beat.
- A/B avanzan/retroceden; X lámina anterior; Menu índice.
- Stick derecho orbita esquema/topics/comunidades/futuro.
- View/Share/R3: etiquetas/aristas/órbita.

**Plan v2.** Cover 0:00; Question 0:40; Graph 2:10; BERTopic 7:10;
Communities 11:10; Future 13:40; Close 15:40; buffer 16:30.

Las listas de aceptación de la sección 9 siguen vigentes, salvo las
referencias a Query Studio, al logo IMFD y al handoff Fellow → 496.

**Lo que queda eliminado**

- La antigua lámina Query Studio con Statistical/Causal/Demographic/
  Institutional/Communities.
- El handoff Fellow → 496 nodos.
- El logo IMFD.
- Las notas y caveats de 10–13 px.

## 0. Rol y resultado esperado

Actúa como un equipo de tres personas:

1. **Director de arte editorial** con criterio suizo: grilla, jerarquía,
   tipografía grande, nada decorativo.
2. **Ingeniero de visualización** capaz de escribir un motor 3D en Canvas 2D,
   sin librerías de grafos.
3. **Investigador de datos** que no inventa cifras y separa resultado de
   especificación.

Entrega una presentación HTML estática, autocontenida y sin build, compuesta
por **7 láminas** y **15 estados de beats**. Debe funcionar en local, con
teclado y con un control Xbox sostenido con una mano.

La presentación se llama:

> **Untangling the Academic Network**
> 3,143 Chilean doctoral trajectories. One graph.

El objetivo narrativo no es “mostrar la tesis”. Es hacer que una audiencia de
bases de datos vea, en 17 minutos, que un grafo de conocimiento convierte una
política pública ciega en una red observable.

---

## 1. Insumos obligatorios

### 1.1 Paper

Molina, Chiappa & Ferrada.
*Untangling the Academic Network: Analyzing Scientific Trajectories With Graphs
and Natural Language Processing.* AMW 2026.

Hechos que se pueden usar y que **no se deben inventar**:

| Hecho | Valor |
|---|---|
| Cohortes | 3,143 becarios doctorales, 2014–2016 |
| Fuentes federadas | 8 |
| Tipos de nodo | 16 |
| Tipos de relación | 15 |
| Nodos totales | 155,391 |
| Relaciones totales | 3,087,304 |
| Publicaciones | 26,071 |
| Revistas | 5,488 |
| Coautores | 113,221 |
| Tópicos BERTopic | 237 |
| Proyectos Fondecyt | 1,031 |
| Becarios sin coautoría de cohorte | 84.2% |
| Componente gigante intra-cohorte | 496 nodos, 700 aristas |
| Comunidades Louvain / Leiden | 21 / 23 |
| Modularidad Louvain / Leiden | 0.895 / 0.886 |
| Mujeres en betweenness P90 | 32.7% |
| Mujeres en el resto del componente | 40.7% |
| Mujeres en PageRank P90 | 42.9% |
| Mujeres en closeness P90 | 36.7% |
| C478 · salmon genomics | 49 fellows; 49.0% F; 80.9% Q1; 22.4% posgrado en el extranjero |
| C483 · patient-centred | 31 fellows; 54.8% F; 58.9% Q1 |
| C452 · microbiology | 33 fellows; 48.5% F; 78.0% Q1; 6.1% GSE Alto |
| Colegios de origen | 797 |
| Colegios en Región Metropolitana | 322 |
| Valparaíso / Biobío / Maule / Los Lagos / Araucanía | 104 / 98 / 40 / 39 / 36 colegios |
| Fellows con pregrado elite | 142 de 496 |
| Fellows con doctorado en Chile | 434 de 496 |
| Vínculos QS / Shanghai | 597 / 629 |
| Cobertura del componente gigante | 15.8% de la cohorte |

### 1.2 Repositorio de referencia

`https://github.com/RodrigoMolinaAvila/presentacion-tesis-magister`

De ahí se reutilizan:

- el componente real de 496 nodos y 700 aristas;
- el mapeo de control Xbox;
- el principio de escenas 3D en Canvas 2D con proyección manual;
- el sistema de beats, escenas y navegación;
- el vocabulario visual de viridis para marcas de datos.

No se copia el texto en español ni la estructura de 41 láminas de la defensa.

### 1.3 Reglas anti-AI-slop

Aplicar explícitamente:

- `https://github.com/Vinayak-Shukla-03/anti-ai-slop`
- `https://github.com/brycewang-stanford/many-ppt-skills/blob/main/principles/02-anti-ai-slop.md`

Prohibiciones concretas:

- no kicker/eyebrow uppercase encima del título en cada lámina;
- no pager visible, no barra de progreso, no flechas de navegación;
- no “Thank you for your attention”;
- no muros de texto;
- no listas de 3–4 bullets iguales;
- no bloques de código Cypher a la vista;
- no footer con wordmark repetido en cada lámina;
- no microcopy en cada esquina;
- no colores decorativos sin significado;
- no degradados decorativos;
- no iconos emoji;
- no tarjetas redondeadas uniformes;
- no “not X — it’s Y”;
- no cifras inventadas;
- no tipografía de sistema ni Inter/Poppins;
- no acento púrpura/indigo.

La estética permitida es: **blanco, tinta negra, un azul de acento y viridis
solo para datos**. La tipografía es Space Grotesk para display/body y
JetBrains Mono para datos, patrones y cifras.

---

## 2. Audiencia, tono y duración

- Audiencia: investigadores de bases de datos, grafos y NLP en AMW 2026.
- Idioma: **100% inglés**. No debe quedar texto visible en español salvo
  nombres propios y nombres de programas.
- Duración: 17 minutos. 15:10 de contenido + buffer.
- Tono: sobrio, técnico, seguro. Sin marketing.
- La audiencia debe poder leer la idea desde el fondo de la sala. Los textos
  principales van entre 42 px y 152 px; los secundarios entre 12 px y 24 px.

---

## 3. Sistema visual

### 3.1 Lienzo

- `DESIGN_W = 1600`.
- Altura de diseño: `innerHeight / zoom`, con
  `zoom = innerWidth / 1600`.
- No usar `transform: scale()` para el lienzo; usar `zoom` CSS.
- Fondo: `#fbfcfd`.
- Grilla: 48 × 48 px, líneas `rgba(10,16,32,.07)`, enmascarada con un radial
  suave para que no compita con el contenido.
- Sin sombras, sin radios grandes, sin glassmorphism.

### 3.2 Color

```
--bg:        #fbfcfd
--ink:       #0a1020
--muted:     rgba(10,16,32,.80)
--faint:     rgba(10,16,32,.58)
--line:      rgba(10,16,32,.14)
--line-soft: rgba(10,16,32,.07)
--accent:    #1b4dff
--ok:        #0f9b6c

viridis de datos:
#440154  #414487  #355f8d  #2a788e
#21918c  #27ad81  #5cc863  #aadc32
```

El azul se usa para: query activa, foco de nodos, barras y acento del banner.
No se usa como color de texto grande decorativo.

### 3.3 Tipografía

Vendorizar:

- **Space Grotesk** 300–700, `space-grotesk-latin.woff2`.
- **JetBrains Mono** 400/500/700, ya existe en el repo de la tesis.

Reglas:

- Display: Space Grotesk 500, tracking negativo entre `-.03em` y `-.06em`.
- Cuerpo: Space Grotesk 400.
- Datos, cifras, patrones: JetBrains Mono 400/500.
- No usar Arimo/Helvetica/Arial como fuente principal.
- No usar Poppins.
- No usar `font-size` con `clamp()` decorativo: fijar una escala real.

Escala exacta usada:

| Rol | Tamaño |
|---|---:|
| Cover title | 124 px |
| Cover subtitle | 34 px |
| Cover authors | 24 px |
| Big question | 88 px |
| Stat number | 144 px |
| Stat label | 20 px |
| Substrate title | 72 px |
| Substrate verb | 40 px |
| Substrate verb label | 17 px |
| Schema node label | 17 px |
| Schema count | 15 px |
| Number-row number | 26 px |
| Studio menu item | 24 px |
| Studio banner title | 42 px |
| Studio result number | 86 px |
| Studio result unit | 21 px |
| Studio result sub | 16 px |
| Studio pattern | 13.5 px |
| Studio caveat | 12 px |
| Community huge | 152 px |
| Community sub | 26 px |
| Community stat number | 34 px |
| Community list name | 24 px |
| Community list value | 16 px |
| Future title | 58 px |
| Future stat number | 32 px |
| Future next line | 20 px |
| Close title | 96 px |
| Close link | 18 px |
| Close citation | 13 px |

### 3.4 Chrome

No hay pager visible. No hay barra de progreso. No hay “graph online”. No hay
footer repetido. El índice existe, pero se abre solo con **Menu** o **M** y
queda en overlay.

La marca AMW 2026 (`logos/amw2026.png`) aparece en el cover y en The graph.
No usar IMFD ni el logo de la Universidad de Chile. No usar logos MDS/DCC/FCFM.

---

## 4. Arquitectura técnica

### 4.1 Archivos

```
index.html          7 <section class="slide">
css/deck.css        sistema visual, layouts, banner, index
js/deck.js          zoom, beats, navegación, índice
js/graph.js         motor Canvas 3D, layouts, morphs, escenas
js/schema3d.js      burbujas, logos y resaltado del path
js/substrate.js     red real, logos oficiales y alias SCENES.graph
js/topics.js        BERTopic, constelación y tablas
js/graph-scenes.js  comunidades y futuro
js/mando.js         Gamepad API, mapeo Xbox
data/red.js         496 nodos y 700 aristas reales
vendor/fonts.css
vendor/fonts/       Space Grotesk + JetBrains Mono
vendor/katex/       fórmulas
logos/amw2026.png
data/topicos.js     237 tópicos BERTopic
data/perfiles.js    Topic × Fellow × Journal
logos/fuentes/      anid, mineduc, cna, qs, arwu, scopus, sjr, bertopic
```

Sin frameworks. Sin build. Sin CDN obligatorio. Las fuentes y KaTeX se sirven
localmente.

### 4.2 Motor de deck

Cada lámina es:

```html
<section class="slide" data-slide="slug" data-title="..." data-sub="..."
         data-jump="1">
```

Cada estado visual dentro de la lámina usa `data-beat="N"`.

Reglas:

- `Deck.slides` es la lista de secciones.
- `Deck.beat` parte en 1.
- `next()` avanza beat; si está en el último, avanza slide.
- `prev()` retrocede beat; si está en el primero, retrocede slide.
- Los elementos con `data-beat` reciben `.beat-on`, `.beat-dim` o
  `.beat-hidden`; no se usan animaciones de opacidad indiscriminadas.
- Cada slide puede registrar una escena en `window.SCENES[slug]`:
  `{ mount, beat, destroy }`.
- El deck destruye la escena anterior al cambiar de slide.
- El índice se construye con títulos y subtítulos, pero no se muestra salvo
  que el usuario lo pida.
- `#pager` y `#mando-luz` pueden existir en el DOM pero están ocultos; el JS
  debe tolerar que `#progress` no exista.

Teclado:

| Tecla | Acción |
|---|---|
| → / Space / PageDown | siguiente beat |
| ← / PageUp | beat anterior |
| ↓ / ↑ | query siguiente / anterior en Studio |
| M / Esc | índice |
| Home / End | primera / última lámina |

### 4.3 Escenas 3D

El motor es una clase `GraphScene` sobre Canvas 2D. No usa Three.js.

Datos:

- 496 nodos reales del componente gigante.
- 700 aristas reales.
- Campos por nodo: `id`, `female`, `gse`, `oecd`, `louvain`, `leiden`,
  `pagerank`, `betweenness`, `closeness`, `coauthors`, `pct_q1`,
  `elite_undergrad`, `phd_in_chile`, `x0`, `y0`.
- La posición base normaliza `x0,y0` a un cuadrado de lado 2.15.

Proyección:

```js
const cy = Math.cos(yaw), sy = Math.sin(yaw);
const cp = Math.cos(pitch), sp = Math.sin(pitch);
const x1 = p.x * cy - p.z * sy;
const z1 = p.x * sy + p.z * cy;
const y2 = p.y * cp - z1 * sp;
const z2 = p.y * sp + z1 * cp;
const f  = dist / (dist + z2);
const sc = Math.min(w, h) * scale;
sx = w * cx + x1 * f * sc;
sy = h * cyScreen - y2 * f * sc;
```

Cámara:

- yaw inicial `-0.56`.
- pitch inicial `0.42`.
- dist `3.15`.
- auto-rotación `+0.055 rad/s`; cover `+0.028`.
- drag con pointer: `dx * .006`, `dy * .004`.
- rueda: dist entre 2.2 y 4.6.
- inercia suave.
- pausa de auto-rotación 2.4 s después de input.

Dibujo:

1. Limpiar canvas.
2. Proyectar nodos.
3. Aristas de fondo en `rgba(10,16,32,.10)`.
4. Aristas resaltadas en azul o color de comunidad.
5. Nodos ordenados por profundidad, radio `2.4 + min(5.4, sqrt(grado)*.66)`.
6. Nodos resaltados con anillo azul de 2.6 px.
7. Etiquetas de campo/comunidad con halo blanco.

### 4.3b La escena del substrate (`schema3d.js`)

El substrate no es un SVG. Es una escena Canvas 2D de **16 burbujas de vidrio
3D**, con logos oficiales en el centro y relaciones dirigidas rotuladas.

- `Schema3D.config.network = { nodes: RED, edges: RED_ARISTAS }`.
- `Schema3D.config.handoff.fieldOf` mapea `oecd` a los seis anillos.
- `Schema3D.config.handoff.layout` replica exactamente el layout field de
  `GraphScene` (anillo 1.08, ángulo dorado, `rad = .22 + .20*sqrt(n/120)`).
- `Schema3D.config.handoff.nodeColor` usa el viridis de `FIELD_COLORS`.
- `Schema3D.config.handoff.edgeColor = rgba(10,16,32,.07)`.
- `Schema3D.config.bubble = { r:.155, rFellow:.215, sprite:512, plate:.68,
  plateFill:true, icon:1.08 }`.
- Cámara schema: yaw `-.18`, pitch `.2`, dist `5.5`, cx `.585`, cy `.5`,
  scale `.25`.
- Sway: amplitud `.16`, rate `.055`.
- Build: `stepMs 240`, `growMs 560`, por profundidad BFS desde Fellow.
- Edge labels: `unique`; cada tipo de relación se rotula una vez.
- Handoff en beat 2: duración 2600 ms; la burbuja Fellow estalla, se
  materializan los 496 nodos reales y aterrizan en el layout field con la
  cámara exacta de Studio: yaw `-.56`, pitch `.42`, dist `3.15`,
  cx `.36`, cy `.42`, scale `.3`.
- `data-s3d-fade` en título, verbos y totales: se desvanecen durante el
  handoff.
- El canvas ocupa toda la lámina; los overlays son HTML absoluto.

Logos por origen:

| Nodo(s) | Fuente | Archivo |
|---|---|---|
| Fellow, Undergrad, Grad, Fondecyt | ANID | `logos/fuentes/anid.png` |
| HighSchool | MINEDUC | `logos/fuentes/mineduc.png` |
| Quality | CNA | `logos/fuentes/cna.png` |
| QS | QS | `logos/fuentes/qs.png` |
| Shanghai | ShanghaiRanking | `logos/fuentes/arwu.png` |
| Author, Publication, Coauthor, Field, PubDiscipline, AuthorDiscipline | Scopus | `logos/fuentes/scopus.png` |
| Journal | SCImago / SJR | `logos/fuentes/sjr.png` |
| Topic | BERTopic | `logos/fuentes/bertopic.png` |

Relaciones reales (no provisionales):

```
Fellow -STUDIED_SECONDARY_AT-> HighSchool
Fellow -STUDIED_UNDERGRAD_AT-> Undergrad
Fellow -STUDIED_GRADUATE_AT-> Grad
Undergrad -HAS_QUALITY-> Quality
Grad -HAS_QS_PRESTIGE-> QS
Grad -HAS_SHANGHAI_PRESTIGE-> Shanghai
Fellow -HAS_SCOPUS_PROFILE-> Author
Author -AUTHORED-> Publication
Publication -IS_PUBLISHED_IN-> Journal
Coauthor -COAUTHORED-> Publication
Publication -HAS_TOPIC-> Topic
Publication -IN_DISCIPLINE-> PubDiscipline
Author -HAS_DISCIPLINE-> AuthorDiscipline
Publication -IN_FIELD-> Field
Fellow -HAS_FONDECYT-> Fondecyt
```

Conteos visibles en las burbujas:

```
Fellow 3,143 · HighSchool 797 · Undergrad 253 · Grad 1,288
Quality 9 · QS 264 · Shanghai 301 · Author 2,703
Publication 26,071 · Journal 5,488 · Coauthor 113,221
Topic 237 · PubDiscipline 325 · AuthorDiscipline 233
Field 27 · Fondecyt 1,031
```

### 4.4 Layouts

**Base / relief**

- `x,z` desde la Kamada–Kawai real.
- `y=0` salvo relief.

**Field**

- 6 clusters en un anillo de radio 1.08.
- Cada nodo dentro de su cluster con ángulo dorado
  `q * 2.39996` y radio `sqrt((q+.5)/n) * rad`.
- `rad = .22 + .20 * sqrt(n/120)`.
- Etiquetas en inglés arriba de cada cluster:
  Natural sciences, Agricultural sciences, Health sciences,
  Engineering & tech., Social sciences, Humanities.

**Relief**

- `y = (betweenness / max)^.55 * 1.02`.
- Nodos sobre el P90 en azul, con anillo; resto gris.
- No destacar aristas que toquen un nodo alto: solo aristas entre dos nodos
  altos, para evitar una maraña.

**Community**

- 21 comunidades Louvain.
- Un disco por comunidad en un anillo 3D de radio 1.12.
- Cada disco conserva la forma local de la Kamada–Kawai real.
- Radio del disco `.07 + .20 * sqrt(n / n_max)`.
- Comunidades top 6 con color; resto gris.
- Etiquetas solo para las tres comunidades del paper:
  salmon genomics, microbiology, patient-centred.
- En el beat 2 de la lámina Communities se resaltan las comunidades
  `[2, 4, 3]` (IDs internos reindexados por tamaño).

**Coauthor**

- Campo de coautoría esquemático, no topología real.
- 496 hubs en una esfera aleatoria determinista.
- Satélites alrededor de cada hub:
  `count = min(68, 13 + floor(sqrt(coauthors) / 1.15))`.
- Total esperado: **9,651 satélites**.
- Hubs azules; satélites negros; telaraña tenue cada 4 satélites.
- Etiqueta honesta: “Schematic: 9,651 of 113,221 co-authors.”
- Fondo con máscara radial para que el campo no invada el texto.

### 4.5 Centros y escalas por escena

| Escena | cx | cy | scale | Notas |
|---|---:|---:|---:|---|
| Cover | .70 | .48 | .54 | alpha .78, sin etiquetas |
| Substrate schema | .585 | .50 | .25 | 16 burbujas, logos |
| Handoff / Studio | .36 | .42 | .30 | campo de 496 nodos |
| Studio | .36 | .42 | .30 | banner abajo |
| Community | .62 | .56 | .34 | sin header |
| Future | .72 | .50 | .32 | máscara radial |

---

## 5. Guion exacto, lámina por lámina

### 5.1 Lámina 0 — Cover

**Layout**

- Blanco.
- Red 3D real de fondo, solo en la mitad derecha.
- Título a la izquierda, enorme.
- Autores debajo.
- AMW 2026 abajo a la izquierda.

**Texto exacto**

```
Untangling the
Academic Network

3,143 Chilean doctoral trajectories. One graph.

Rodrigo Molina     Roxana Chiappa     Sebastián Ferrada

AMW 2026, Arequipa, 9–13 November
```

**Escena**

- `GraphScene` con layout base real, sin interacción.
- Rotación muy lenta.
- Alpha .78.
- Sin etiquetas.

**Prohibido**

- Logo UChile.
- Kicker “AMW 2026 · 17th…” arriba.
- Afiliaciones largas.
- Subtítulo de dos o tres líneas.

---

### 5.2 Lámina 1 — The gap

**No hay título pequeño ni kicker.**

**Texto exacto**

```
Chile funds careers.
It cannot follow them.

8
sources, no common identifier

3,143
doctoral trajectories, 2014–2016

84.2%
share no publication with a peer

The data existed. The joins did not.
```

**Layout**

- Pregunta de 88 px arriba.
- Tres columnas debajo, separadas por una línea horizontal.
- Números a 144 px.
- Etiquetas a 20 px, ancho máximo 320 px.
- Frase final abajo a la izquierda, 22 px.

**Intención**

No explicar las ocho fuentes. El número 8 y el 84.2% hacen el trabajo. La frase
final es el giro: los datos existían, faltaban las uniones.

---

### 5.3 Lámina 2 — The substrate

**Texto exacto**

```
One graph.
Every trajectory.

Federate
8 sources

Embed
26,071 abstracts

Analyze
21 communities

One traversal recovers a whole career.

155,391  nodes
3,087,304  relationships
16  node types
15  relationship types
```

**Visual**

- Canvas 3D de 16 burbujas de vidrio, no un SVG.
- Los logos oficiales van dentro de una placa blanca en cada burbuja.
- Relaciones dirigidas con el nombre real del tipo sobre la arista.
- Grupos: Education, People / output, Funding.
- El grafo se construye por traversal desde Fellow.
- En beat 2, el esquema se desvanece y la burbuja Fellow estalla en los
  **496 nodos reales**, que aterrizan en el layout field con la cámara de
  Studio. Es el handoff visual entre las dos láminas.
- Sin Cypher, sin párrafos.

**Layout**

- Canvas full-bleed.
- Título 72 px, arriba a la izquierda, `data-s3d-fade`.
- Verbos a 40 px, izquierda, `data-s3d-fade`.
- Totales abajo, cuatro columnas, `data-s3d-fade`.
- La cámara deja el esquema al centro-derecha; el texto ocupa la izquierda.
- Sin footer.

---

### 5.4 Lámina 3 — Query Studio

Esta es la lámina central. Debe seguir el dibujo del pizarrón:

- grafo 3D arriba a la izquierda;
- menú de queries arriba a la derecha;
- un banner negro grande abajo, de ancho completo, con el título, la cifra,
  el patrón del grafo y el crédito;
- AMW 2026 arriba a la izquierda.

#### 5.4.1 Menú derecho

Cinco ítems, solo etiqueta, 24 px. Sin números, sin subpreguntas, sin header.

```
Statistical
Causal
Demographic
Institutional
Communities
```

El ítem activo lleva una barra azul de 2 px a la izquierda y pasa a peso 500.

#### 5.4.2 Banner

- Negro `--ink`.
- Ancho completo, `left:24px`, `right:24px`, `bottom:24px`.
- Altura mínima 210 px.
- Grid de tres columnas: `1.1fr .78fr 1.12fr`.
- Texto blanco.
- Título 42 px.
- Cifra 86 px.
- Unidad 21 px, en bloque debajo de la cifra.
- Sub 16 px.
- Patrón 13.5 px mono.
- Caveat 12 px mono.
- Crédito 10 px mono.

#### 5.4.3 Las cinco queries

Cada beat cambia el texto, el layout y el panel derecho.

**1 · Statistical**

```
Tax:       WHO
Headline:  Who is in the cohort?
Number:    3,143
Unit:      fellows
Sub:       26,071 publications
Caveat:    496-node component shown.
Pattern:   (f:Fellow) → (p:Publication) ← (t:Topic)
Layout:    field
Bars:      topics
```

Barras:

| Tema | Publicaciones |
|---|---:|
| tev, detector, atlas | 1,228 |
| reaction, synthesis | 724 |
| species, distribution | 654 |
| education, school | 586 |
| health, clinical | 542 |

**2 · Causal**

```
Tax:       WHAT
Headline:  Does gender predict position?
Number:    32.7%
Unit:      women at P90
Sub:       40.7% across the component
Caveat:    Association, not a programme effect.
Pattern:   (f:Fellow) → (a:Author) → [centrality]
Layout:    relief
```

Fórmulas KaTeX:

```latex
\begin{aligned}
\text{centrality}_i ={}& \alpha + \beta_1\,\text{female}_i
+ \beta_2\,\text{alto}_i \\
&+ \gamma^\top X_i + \varepsilon_i
\end{aligned}
```

```latex
\tau = \mathbb{E}\,[\,Y(1)-Y(0)\mid D=1\,]
```

**3 · Demographic**

```
Tax:       WHERE
Headline:  Where does the cohort come from?
Number:    322
Unit:      of 797 schools
Sub:       Metropolitan Region
Caveat:    Recorded at the school, not the fellow.
Pattern:   (f:Fellow) → (h:HighSchool) → [region]
Layout:    base dim
Bars:      schools by region
```

Barras:

| Región | Colegios |
|---|---:|
| Metropolitan | 322 |
| Valparaíso | 104 |
| Biobío | 98 |
| Maule | 40 |
| Los Lagos | 39 |
| Araucanía | 36 |

**4 · Institutional**

```
Tax:       WHERE
Headline:  Does origin reach the core?
Number:    142
Unit:      of 496 fellows
Sub:       434 did their PhD in Chile
Caveat:    Elite origin does not dominate the core.
Pattern:   (f:Fellow) → (u:UndergradInstitution) → [elite]
Layout:    base + elite highlight
```

**5 · Communities**

```
Tax:       WHO
Headline:  What holds a field together?
Number:    21
Unit:      communities
Sub:       496 fellows, 700 edges
Caveat:    84.2% share no peer publication.
Pattern:   (c:Community) ← (f:Fellow) → (c:Community)
Layout:    community constellation
```

**Prohibiciones en Studio**

- No mostrar el Cypher completo.
- No mostrar “CYPHER”, “QUERY”, “MENU” en mayúsculas pequeñas.
- No mostrar una subpregunta debajo de cada ítem del menú.
- No mostrar el estado “graph online”.
- No mostrar footer.
- No mostrar pager.

---

### 5.5 Lámina 4 — Communities

**Sin título.** La cifra es el titular.

**Texto exacto**

```
84.2%
never publish with a peer

496
fellows

700
edges

21
communities

Salmon genomics      49 / 80.9% Q1
Patient-centred      31 / 54.8% female
Microbiology         33 / 6.1% high-origin
```

**Layout**

- 84.2% a 152 px, arriba a la izquierda.
- Sub a 26 px.
- Tres cifras en fila, números 34 px.
- Tres comunidades abajo, nombre 24 px y valor 16 px mono.
- Grafo de constelación a la derecha.
- Etiquetas de canvas solo para salmon genomics, microbiology y
  patient-centred.
- Sin footer, sin nota de modularidad.

**Beat 2**

- Se resaltan las tres comunidades del paper.
- El resto baja a alpha .07.
- Las etiquetas y los colores de las tres se mantienen.

---

### 5.6 Lámina 5 — Future

**Texto exacto**

```
The graph already
holds the rest.

113,221
co-authors

2,884,376
edges

15.8%
of the cohort

Next: full co-authorship, funded vs non-funded,
SciELO / Redalyc.

Schematic: 9,651 of 113,221 co-authors.
```

**Layout**

- Título 58 px arriba a la izquierda.
- Tres cifras en fila, números 32 px.
- Una sola línea de “Next”.
- Nota esquemática 11 px.
- Campo de coautoría a la derecha, máscara radial.
- Sin footer.

**Transición**

Al entrar, el grafo parte en la constelación de comunidades y, después de
420 ms, muta a la esfera aleatoria de coautoría. Los satélites aparecen con
fade. Es una transición visual, no un cambio de dato.

---

### 5.7 Lámina 6 — Close

**Texto exacto**

```
Evaluate programmes
by the networks they build.

Graph       interrogandolaacademia.cl
Artifact    rodrigomolinaavila.github.io/gds-becarios
Contact     rodmolina@ug.uchile.cl

Molina, Chiappa & Ferrada. Untangling the Academic Network. AMW 2026.
```

**Layout**

- Declaración a 96 px.
- Links en una fila, 18 px mono.
- Cita 13 px al pie.
- Sin “Thank you”.
- Sin logos adicionales.

---

## 6. Control Xbox

El control se sostiene con la mano derecha y girado 90°. Lo que la API reporta
como ← apunta hacia arriba en la mano.

### 6.1 Botones

| Índice | Acción |
|---:|---|
| 12 (↑ reportado) | siguiente beat |
| 13 (↓ reportado) | beat anterior |
| 14 (← reportado) | query anterior |
| 15 (→ reportado) | query siguiente |
| 0 (A) | siguiente beat |
| 1 (B) | beat anterior |
| 2 (X) | lámina anterior |
| 9 (Menu) | índice |
| 8 (View) | etiquetas on/off |
| 17 (Share) | aristas on/off |
| 11 (R3) | pausar/reanudar órbita |
| 4/5/6/7 (LB/LT/RB/RT) | ignorados |

### 6.2 Stick derecho

- Ejes 2 y 3.
- Deadzone .14.
- Deshacer el giro de 90°:
  - `vertical = -axes[2]`
  - `horizontal = -axes[3]`
- `yaw += horizontal * .035`
- `pitch += vertical * .028`
- pitch limitado a `[-1.15, 1.15]`.

### 6.3 Índice

Cuando el índice está abierto:

- LB/RB recorren entradas;
- A entra;
- B y Menu cierran;
- los sticks se desactivan;
- el resto de los botones no navega por detrás.

### 6.4 Polling

- `requestAnimationFrame`.
- Repetición cada 420 ms para cruceta.
- Deadzone de botones .55 para ejes discretos.
- Detección de `gamepadconnected` / `gamepaddisconnected`.

---

## 7. Copy y honestidad

- Todo el texto visible debe estar en inglés.
- Los nombres propios pueden conservar tilde.
- No inventar métricas.
- La query regional es **school-level**. No afirmar un efecto regional por
  fellow.
- La query causal es **asociación**, no efecto de programa.
- El campo de coautoría final es **esquemático** y debe decirlo.
- La red de 496/700 es real.
- Las posiciones 3D son decisiones de dibujo, no resultados.
- No usar “sample data”, “illustrative figures” en más de una lámina.
- La nota de honestidad va donde importa, no como tic en cada slide.

---

## 8. Plan de 17 minutos

| Tiempo | Lámina / beat | Idea |
|---|---|---|
| 0:00 | Cover | una red real, 3,143 trayectorias |
| 0:40 | The gap | Chile financia carreras, no las sigue |
| 2:40 | The substrate | ocho fuentes, un grafo, un traversal |
| 3:40 | Substrate · handoff | Fellow estalla en 496 nodos; aterriza en Studio |
| 4:40 | Studio · Statistical | quién está en la cohorte |
| 5:40 | Studio · Causal | el género en la posición estructural |
| 6:50 | Studio · Demographic | de dónde viene la cohorte |
| 7:55 | Studio · Institutional | el origen elite no domina el centro |
| 9:00 | Studio · Communities | 21 comunidades |
| 10:00 | Communities | 84.2% no colabora |
| 12:00 | Future | el grafo ya contiene el resto |
| 14:30 | Close | evaluar redes, no solo grados |
| 15:10 | — | buffer / preguntas |

Si falta tiempo, omitir Demographic y responderla en preguntas.

---

## 9. Criterios de aceptación

### Visual

- [ ] Fondo blanco, sin tema oscuro.
- [ ] Space Grotesk visible, no Helvetica/Arimo como fuente principal.
- [ ] No hay logo UChile ni IMFD; solo AMW 2026.
- [ ] No hay kicker en cada lámina.
- [ ] No hay pager, progreso, “graph online” ni footer repetido.
- [ ] El banner de Studio es negro, de ancho completo, con cifra ≥ 86 px.
- [ ] El menú de Studio está a la derecha.
- [ ] El grafo de Studio está arriba a la izquierda.
- [ ] La lámina Communities no tiene título; el 84.2% manda.
- [ ] La lámina Future tiene el campo de coautoría a la derecha.
- [ ] Close no dice “Thank you”.

### Contenido

- [ ] Los 5 beats de Studio actualizan título, cifra, sub, caveat, patrón y
      layout.
- [ ] Las cifras coinciden con la tabla de la sección 1.1.
- [ ] La fórmula causal aparece con KaTeX y se lee.
- [ ] La query regional muestra 322/797 y las seis regiones.
- [ ] La lámina Communities muestra 496/700/21 y las tres comunidades.
- [ ] La lámina Future muestra 113,221 / 2,884,376 / 15.8%.
- [ ] El campo de coautoría está rotulado como esquemático.
- [ ] Las 16 burbujas cargan el logo correcto y no hay warnings de logo.
- [ ] Las relaciones usan los nombres reales, no los provisionales.
- [ ] El beat 2 del substrate aterriza en el mismo layout field que Studio.
- [ ] El logo UChile y el IMFD no aparecen; solo AMW 2026 y los logos de fuentes.

### Técnico

- [ ] Funciona a 1600×900 y 1920×1080 sin overflow.
- [ ] No hay errores de consola.
- [ ] No hay 404 de fuentes, datos o logos.
- [ ] El zoom del stage preserva la composición.
- [ ] El canvas usa DPR ≤ 2.
- [ ] El control sintético mueve beats, abre el índice y rota la escena.
- [ ] El índice no muestra el contenido detrás de forma ilegible.
- [ ] La escena se destruye al cambiar de slide.

---

## 10. Prompt final para el modelo generador

Copia y ejecuta las instrucciones anteriores. Además, cumple estas reglas
globales:

1. **No empieces por el HTML.** Primero fija el brief: audiencia, duración,
   idea central, tres cifras que deben quedar en la memoria.
2. **Una idea por lámina.** Si una lámina necesita párrafos para entenderse,
   sepárala o elimina texto.
3. **La cifra es el diseño.** Cada lámina debe tener un número o un grafo que
   se lea desde lejos.
4. **No inventes datos.** Usa exactamente las cifras de la sección 1.1.
5. **No expliques la implementación en pantalla.** El Cypher, el pipeline y
   los detalles van en la charla, no en la lámina.
6. **No uses el estilo “AI deck”.** Sin kickers, sin pager, sin bullets
   iguales, sin “Thank you”, sin code blocks, sin footers repetidos.
7. **El blanco no es vacío.** Usa espacio negativo para separar ideas, no para
   esconder falta de contenido.
8. **El movimiento debe significar.** Morph de campos a comunidades, de
   comunidades a coautoría. Nada de fade-in decorativo.
9. **Verifica mirando.** Abre el deck en un navegador real, recorre los 13
   estados y corrige overflow, contraste y tamaños antes de entregar.
10. **Entrega HTML estático.** Sin build, sin servidor obligatorio, sin
    dependencias externas críticas.

El resultado debe sentirse como una charla de datos de alto nivel: pocas
palabras, cifras grandes, un grafo que se transforma y un cierre que se
recuerda.
