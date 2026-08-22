#!/bin/bash
# guard-main: hace cumplir el flujo de ramas del proyecto.
#   - 'main' solo recibe releases: PR desde 'staging' mergeado a mano por Facu.
#   - 'staging' solo recibe PRs desde ramas de issue; las excepciones son el
#     commit 'chore(release)' de /release y cerrar un merge ya empezado.
# Falla abierto (exit 0) si no puede parsear el input: la regla también vive en CLAUDE.md.

input=$(cat)
cmd=$(printf '%s' "$input" | node -e '
let d = "";
process.stdin.on("data", c => d += c).on("end", () => {
  try { process.stdout.write(String(JSON.parse(d).tool_input?.command ?? "")); } catch {}
});' 2>/dev/null)

[ -z "$cmd" ] && exit 0
case "$cmd" in *git*) ;; *) exit 0 ;; esac

# El verbo tiene que ser el subcomando de git, no una palabra suelta más
# adelante en la línea. Con un comodín entre "git" y el verbo, cualquier texto
# que nombre los dos quedaba bloqueado: los cuerpos de los issues de este
# proyecto hablan de git todo el tiempo y no se podían escribir.
#
# En el medio solo entran las opciones globales de git, que van antes del
# subcomando. Se matchea "git" en cualquier posición y no solo al principio de
# un comando: un falso positivo cuesta un rodeo, un falso negativo cuesta datos.
OPCIONES_GLOBALES='([[:space:]]+(-[cC][[:space:]]+[^[:space:]]+|--no-pager|--paginate|-p|--bare|--literal-pathspecs|--git-dir=[^[:space:]]+|--work-tree=[^[:space:]]+|--exec-path=[^[:space:]]*))*[[:space:]]+'

subcomando_es() { # $1 = alternativas del verbo, p.ej. 'commit|merge'
  printf '%s' "$cmd" | grep -qE "\bgit\b${OPCIONES_GLOBALES}($1)\b"
}

branch=$(git symbolic-ref --short HEAD 2>/dev/null)

if [ "$branch" = "main" ] && subcomando_es 'commit|merge|rebase|cherry-pick|am|revert'; then
  echo "BLOQUEADO por guard-main: estás parado en 'main'. Cambiá a 'staging' (git checkout staging). A 'main' solo se llega por PR aprobado explícitamente por Facu." >&2
  exit 2
fi

if [ "$branch" = "staging" ] && subcomando_es 'commit'; then
  # Un merge que entra limpio commitea solo y pasa; si hay conflicto, cerrarlo a
  # mano es la misma operación. Bloquear solo la segunda dejaba la regla atada al
  # azar del conflicto, y el mensaje mandaba a abrir una rama en medio del merge.
  merge_en_curso=false
  git_dir=$(git rev-parse --git-dir 2>/dev/null)
  [ -n "$git_dir" ] && [ -f "$git_dir/MERGE_HEAD" ] && merge_en_curso=true

  if ! printf '%s' "$cmd" | grep -qF 'chore(release)' && [ "$merge_en_curso" = false ]; then
    echo "BLOQUEADO por guard-main: 'staging' no recibe commits directos. Abrí la rama de su issue con 'gh issue develop N --checkout' y entrá por PR. Las excepciones son el commit 'chore(release)' que escribe /release y cerrar un merge ya empezado." >&2
    exit 2
  fi
fi

if subcomando_es 'push' && printf '%s' "$cmd" | grep -qE "\bgit\b${OPCIONES_GLOBALES}push\b[^|;&]*\bmain\b"; then
  echo "BLOQUEADO por guard-main: push a 'main' no permitido. El único camino a 'main' es un PR desde 'staging' aprobado explícitamente por Facu." >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -qE "\bgit\b${OPCIONES_GLOBALES}(branch[[:space:]]+(-D|-d|--delete)|push\b[^|;&]*--delete)\b[^|;&]*\bmain\b"; then
  echo "BLOQUEADO por guard-main: no se borra la rama 'main'." >&2
  exit 2
fi

exit 0
