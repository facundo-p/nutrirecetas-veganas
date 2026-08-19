# lessons.md — Bitácora de lecciones

Al cierre de cada fase se anota: qué funcionó, qué se rompió, qué decisión cambió y por qué. Cualquier sesión futura de Claude arranca leyendo esto.

---

## Fase 0 — Plan y dirección visual (2026-08-18)

- **La documentación del dataset tiene puntos ciegos reales**: la auditoría con scripts encontró que las condiciones de las reglas R1–R15 SÍ son objetos estructurados (el README las declara "prosa no ejecutable"), que los perfiles nutricionales precargados no tienen kcal y desvían >30 % en el 45 % de los chequeos, y que `ajuste_vegano` es un objeto y no un número. Lección: **nunca confiar en la doc del dataset sin verificar contra el JSON real** — vale para toda fase futura.
- `p08` (bifecitos de seitán) es un preparado de facto (p12 y p20 lo consumen) aunque no está tipado como tal: la migración de preparados debe incluirlo.
- Decisiones de producto tomadas con Facu: migrar modelo de preparados en ingesta · escalado lineal con avisos · estética "botánica editorial" · prioridad a planificador semanal + estacionalidad · gramos como medida principal de compras (compra por peso, tiene balanza, no compra enlatados) · mobile-first absoluto (no hay sync entre dispositivos sin backend; export/import como transferencia manual).
- La app debe quedar compartible con amigos: nada hardcodeado a Facu, perfil vacío al primer uso.
