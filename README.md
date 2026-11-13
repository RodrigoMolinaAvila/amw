# Untangling the Academic Network · AMW 2026

Prototype deck for the 17-minute AMW talk. English only. White, sober,
technical. The 3D graph is the argument, not a backdrop.

Seven slides, 30 states:

1. **Cover** — full paper title, centered; FCFM, IDIA and IMFD marks.
2. **The question** — one central paragraph, then an arrow into the graph.
3. **The graph** — seven complex query paths covering every schema node except
   Topic; the full path is outlined in accent.
4. **BERTopic** — the inherited eight-step pipeline; Explore returns to the s3
   graph interface with Topic-only queries.
5. **Communities** — 84.2%, 496/700/21, and the three-community structure.
6. **Future** — the full co-authorship field.
7. **Close** — evaluate networks, not only degrees.

Run it from this folder:

```bash
python -m http.server 8123
# http://127.0.0.1:8123/
```

No build, no dependencies beyond the vendored fonts, KaTeX and Font Awesome. The network
data is the real 496-node / 700-edge intra-cohort component used in the thesis
defence (`data/red.js`). Topic data is the real Annex H table (`data/topicos.js`)
and the Topic × Fellow × Journal profile (`data/perfiles.js`).

## Running order · 17:00

Times are cumulative. `→` advances one beat; `←` goes back.

| time | slide / beat | on screen | what is said |
|---|---|---|---|
| 0:00 | Cover | full title, real network | the paper, the cohort, the graph |
| 0:40 | The question | central paragraph + arrow | the system cannot answer the follow-up questions |
| 2:10 | The graph · Trajectory | 7-node path outlined | one traversal recovers a career |
| 2:55 | The graph · Origin | 4-node path outlined | 322 of 797 schools |
| 3:40 | The graph · Collaboration | 4-node path outlined | 496 fellows in one component |
| 4:25 | The graph · Funding | 3-node path outlined | 1,031 Fondecyt projects |
| 5:10 | The graph · Prestige | 4-node path outlined | QS/Shanghai graduate institutions |
| 5:55 | The graph · Disciplines | 5-node path outlined | author/publication disciplines |
| 6:40 | The graph · Fields | 3-node path outlined | publication fields; no Topic |
| 7:10 | BERTopic · Data | 3,000-document cloud; source fields | where the corpus comes from |
| 7:45 | BERTopic · SBERT | words moved into a 384-d vector | text becomes geometry |
| 8:25 | BERTopic · UMAP | 384-d reduced to 5-d | the cloud becomes a manifold |
| 9:05 | BERTopic · HDBSCAN | density clusters; 56.3% noise | 274 clusters on the first pass |
| 9:45 | BERTopic · Optuna | c_v surface | the search is not hand-tuned |
| 10:25 | BERTopic · Outliers | noise migrates to centroids | the −1 category disappears |
| 11:05 | BERTopic · c-TF-IDF | terms per topic | what defines each group |
| 11:45 | BERTopic · Fusion | 274 → 237 | semantic fusion with entailment |
| 12:25 | Explore · Journals | s3 graph; topic→journal query | where topics publish |
| 13:05 | Explore · Authors | s3 graph; author→topic query | who writes the topics |
| 13:45 | Explore · Fields | s3 graph; topic→field query | which fields host the topics |
| 14:25 | Communities · fragmentation | 84.2% + 496/700/21 | the network is fragmented |
| 15:10 | Communities · structure | 21-community structural table | what distinguishes the communities |
| 15:50 | Future · field | full co-authorship field | the graph already holds the rest |
| 16:20 | Future · next | next steps | full co-authorship, regional/institutional cuts, causal designs |
| 16:45 | Close | takeaway + links | evaluate networks, not only degrees |
| 17:00 | — | — | questions |

## The seven graph queries

Each query highlights its complete path and is displayed in Cypher in the
banner. The s3 set covers every schema node except Topic; Topic is reserved for
BERTopic Explore.

1. **Trajectory** — 3,143 careers.
2. **Origin** — 322 of 797 schools.
3. **Collaboration** — 496 fellows in the giant component.
4. **Funding** — 1,031 Fondecyt projects.
5. **Prestige** — 597 QS-ranked graduate institutions.
6. **Disciplines** — 2,655 author disciplines.
7. **Fields** — 46,706 publication–field links.

## BERTopic

The inherited pipeline, design and transition are from the thesis deck:
Data → SBERT → UMAP → HDBSCAN → Optuna → Outliers → c-TF-IDF → Fusion.

At Explore the s3 schema interface returns, now restricted to Topic queries:

- **Topic** — which topics exist, their terms and coherence.
- **Journals** — `Publication → Topic` and `Publication → Journal`.
- **Authors** — `Fellow → Author → Publication → Topic`.
- **Fields** — `Publication → Topic` and `Publication → Field`.
- **Coauthors** — `Publication → Topic` and `Publication → Coauthor`.
- **Disciplines** — `Topic`, `PubDiscipline` and `AuthorDiscipline`.
- **Fellows** — `Fellow → Author → Publication → Topic`.
- **Territory** — `HighSchool ← Fellow → Author → Publication → Topic`.

The M key / Xbox View button opens the full example table in the same
bottom-left panel as s3.

## Communities

- 84.2% of fellows share no publication with another fellow.
- 496 fellows, 700 edges, 21 Louvain communities.
- Structural table: salmon genomics (49, 49.0% F, 80.9% Q1, 26.5% high GSE),
  patient-centred (31, 54.8%, 58.9%, 29.0%), microbiology (33, 48.5%, 78.0%,
  6.1%).
- Colour chips in the table match the three community colours in the graph.

## Xbox controller · one hand, rotated 90°

Same mapping and orientation as the thesis deck. The controller reports d-pad
left as up in the hand.

| input | action |
|---|---|
| D-pad reported ↑ (12) | next beat |
| D-pad reported ↓ (13) | previous beat |
| D-pad reported ← (14) | previous query |
| D-pad reported → (15) | next query |
| A / B | next / previous |
| X | previous slide |
| Menu | slide index |
| M | example result table on the graph (keyboard) |
| View | example result table on the graph |
| Share | edges on/off |
| R3 | pause / resume orbit |
| Right stick | orbit the 3D scene |

LB/LT/RB/RT stay disabled on purpose: the palm grazes them in this grip.

## Honesty notes

- The 496 nodes and 700 edges are real. The 3D layouts are drawing decisions;
  no node position is a new result.
- The co-author field on the future slide is a **schematic**: 22,254 dots
  generated around the real 496 fellows, labelled as such. The headline counts
  (113,221 co-authors, 2,884,376 edges) are from the paper. The field is not a
  claim that all 113,221 co-authors are drawn.
- Region is a school-level property. The deck does not claim a fellow-level
  regional effect.
- The graph query paths are traversals, not causal claims. Origin is a
  school-level property; the deck does not claim a fellow-level regional effect.
- The AMW 2026 mark sits between authors and affiliations on the cover; on every other slide it is in the top-right corner, with a CSS transition when leaving the cover.
- The deck is English-only; source field names and topic terms remain in their
  original form because they are data, not interface copy.

## Example results

Each graph query has a real per-fellow result table from the `becarios`
database, with no LIMIT. Press `M` or the Xbox **View** button to open it. The
panel occupies the bottom-left quarter of the slide and the full result set is
scrollable.

The filter bar in the top-left of the graph filters the active table by
**gender**, **social class / GSE** and **territory** (Metropolitan / Regions /
Other). Filters apply to both the s3 tables and the Topic Explore tables.

## Icons

Font Awesome Free 6.7.2 (solid) is vendored under `vendor/fontawesome/`.
It labels the graph queries, the topic Explore menu and the three close links.

## Files

```
index.html      7 slides, one <section> each
css/deck.css    white system, viridis only for data marks
js/deck.js      beats, navigation, index
js/graph.js     canvas 3D engine, layouts, morphs
js/schema3d.js  glass bubbles, source logos, query-path outline
js/substrate.js seven graph queries, menu, banner, SCENES.graph
js/topics.js    BERTopic constellation and result tables
js/graph-scenes.js community and future scenes
js/mando.js     Xbox mapping
data/red.js     real 496-node network
data/topicos.js 237 real topics (Annex H)
data/perfiles.js Topic × Fellow × Journal profile
logos/          AMW 2026 + official source logos
vendor/         fonts, KaTeX
```

## Logos

`logos/amw2026.png` is the AMW 2026 mark. Source logos in `logos/fuentes/`
are the official marks used in the thesis artifact (ANID, MINEDUC, CNA, QS,
ShanghaiRanking, Scopus, SJR) plus the BERTopic project icon. The Scopus mark
is the Simple Icons rendition; the BERTopic icon comes from
`MaartenGr/BERTopic/images/icon.png`.

## Design constraints

The deck follows the anti-slop rules from
[Vinayak-Shukla-03/anti-ai-slop](https://github.com/Vinayak-Shukla-03/anti-ai-slop)
and the [banned-list principle](https://github.com/brycewang-stanford/many-ppt-skills/blob/main/principles/02-anti-ai-slop.md):
no kicker on every slide, no pager or progress chrome, no code walls, no
3–4 bullet template, no repeated wordmark, no decorative rules. One idea per
slide; numbers and the graph carry the story. Type is Space Grotesk at display
sizes, with JetBrains Mono only for data and graph patterns.

Master prompt for reproducing this deck: `PROMPT.md`.
