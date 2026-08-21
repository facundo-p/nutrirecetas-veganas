#!/bin/bash
# guard-main: hace cumplir el flujo de ramas del proyecto.
#   - 'main' solo recibe releases: PR desde 'staging' mergeado a mano por Facu.
#   - 'staging' solo recibe PRs desde ramas de issue; la única excepción es el
#     commit 'chore(release)' de /release.
# Falla abierto (exit 0) si no puede parsear el input: la regla también vive en CLAUDE.md.

input=$(cat)
cmd=$(printf '%s' "$input" | node -e '
let d = "";
process.stdin.on("data", c => d += c).on("end", () => {
  try { process.stdout.write(String(JSON.parse(d).tool_input?.command ?? "")); } catch {}
});' 2>/dev/null)

[ -z "$cmd" ] && exit 0
case "$cmd" in *git*) ;; *) exit 0 ;; esac

branch=$(git symbolic-ref --short HEAD 2>/dev/null)

if [ "$branch" = "main" ] && printf '%s' "$cmd" | grep -qE '\bgit\b[^|;&]*\b(commit|merge|rebase|cherry-pick|am|revert)\b'; then
  echo "BLOQUEADO por guard-main: estás parado en 'main'. Cambiá a 'staging' (git checkout staging). A 'main' solo se llega por PR aprobado explícitamente por Facu." >&2
  exit 2
fi

if [ "$branch" = "staging" ] && printf '%s' "$cmd" | grep -qE '\bgit\b[^|;&]*\bcommit\b'; then
  if ! printf '%s' "$cmd" | grep -qF 'chore(release)'; then
    echo "BLOQUEADO por guard-main: 'staging' no recibe commits directos. Abrí la rama de su issue con 'gh issue develop N --checkout' y entrá por PR. La única excepción es el commit 'chore(release)' que escribe /release." >&2
    exit 2
  fi
fi

if printf '%s' "$cmd" | grep -qE '\bgit\b[^|;&]*\bpush\b[^|;&]*\bmain\b'; then
  echo "BLOQUEADO por guard-main: push a 'main' no permitido. El único camino a 'main' es un PR desde 'staging' aprobado explícitamente por Facu." >&2
  exit 2
fi

if printf '%s' "$cmd" | grep -qE '\bgit\b[^|;&]*\b(branch\s+(-D|-d|--delete)|push\b[^|;&]*--delete)\b[^|;&]*\bmain\b'; then
  echo "BLOQUEADO por guard-main: no se borra la rama 'main'." >&2
  exit 2
fi

exit 0
