import type { ReactNode, SVGProps } from 'react';

/**
 * Set de íconos propio, estilo línea botánica (04 §4): 24 px, trazo 1.75,
 * `currentColor`. Regla del proyecto: ver el ícono debe alcanzar para entender
 * el concepto, y nunca comunica solo (siempre acompañado de texto).
 */

export type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

// ---------- semáforo (Fase 2 lo usa entero; el glosario ya lo explica) ----------

export function IconHojaEntera(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 4C10.5 4.5 4.5 10.5 4 20c9.5-.5 15.5-6.5 16-16Z" />
      <path d="M5.5 18.5C9 14 13 10 18.5 5.5" />
    </Base>
  );
}

export function IconHojaMedia(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 4C10.5 4.5 4.5 10.5 4 20c9.5-.5 15.5-6.5 16-16Z" />
      <path d="M5.5 18.5C9 14 13 10 18.5 5.5" />
      <path d="M6.5 14.5c1.5.6 3 .9 4.3.8M9.5 17.6c1.3.3 2.6.4 3.8.2" />
    </Base>
  );
}

export function IconHojaCaida(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 4c.5 5.5 2.5 9.5 6.5 12.5" />
      <path d="M10.5 16.5c6.5 3 10 1.5 10.5-3.5-4.5-1.5-8.5 0-10.5 3.5Z" />
      <path d="M12.5 15.7c2.7-.9 5.3-1.2 7.3-.9" />
    </Base>
  );
}

export function IconCapsula(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-28 12 12)" />
      <path d="M10.6 8.9l2.8 6.2" />
    </Base>
  );
}

export function IconHojaPunteada(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M20 4C10.5 4.5 4.5 10.5 4 20c9.5-.5 15.5-6.5 16-16Z" strokeDasharray="2.6 2.6" />
      <path d="M5.5 18.5C9 14 13 10 18.5 5.5" strokeDasharray="2.6 2.6" />
    </Base>
  );
}

// ---------- ventanas de evaluación ----------

export function IconSol(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </Base>
  );
}

export function IconSemanaArco(props: IconProps) {
  return (
    <Base {...props}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const angle = Math.PI - (Math.PI * i) / 6;
        const cx = 12 + 8 * Math.cos(angle);
        const cy = 16 - 7.5 * Math.sin(angle);
        return <circle key={i} cx={cx} cy={cy} r="1.15" fill="currentColor" stroke="none" />;
      })}
      <path d="M4 19.5h16" />
    </Base>
  );
}

// ---------- datos con incertidumbre ----------

export function IconBandaAprox(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 8.5c2.3-1.8 4.4-1.8 7 0s4.7 1.8 7 0" />
      <path d="M5 13c2.3-1.8 4.4-1.8 7 0s4.7 1.8 7 0" />
      <path d="M5 18.5h14" />
    </Base>
  );
}

export function IconBrotesIc({ nivel = 3, ...props }: IconProps & { nivel?: 1 | 2 | 3 }) {
  const brote = (x: number, alto: number, activo: boolean, key: number) => (
    <g key={key} opacity={activo ? 1 : 0.25}>
      <path d={`M${x} 20v-${alto}`} />
      <path d={`M${x} ${20 - alto}c0-2-1.4-3-3-3.3M${x} ${20 - alto}c0-2 1.4-3 3-3.3`} />
    </g>
  );
  return (
    <Base {...props}>
      <path d="M3.5 20h17" />
      {brote(7, 3.5, nivel >= 1, 1)}
      {brote(12, 6, nivel >= 2, 2)}
      {brote(17, 8.5, nivel >= 3, 3)}
    </Base>
  );
}

export function IconCobertura(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none" opacity="0.55" />
    </Base>
  );
}

// ---------- tipos de receta ----------

export function IconMortero(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 11h16l-1.2 3.4A6 6 0 0 1 13.1 18h-2.2a6 6 0 0 1-5.7-3.6Z" />
      <path d="M9 21h6" />
      <path d="M14.5 4.5 18 8" />
      <path d="M13 8.5c1-2 2.5-3.5 4.5-4.5" />
    </Base>
  );
}

export function IconFlor(props: IconProps) {
  return (
    <Base {...props}>
      {[0, 72, 144, 216, 288].map((deg) => (
        <path key={deg} d="M12 9.6c1.7-1.4 1.7-4.2 0-5.8-1.7 1.6-1.7 4.4 0 5.8Z" transform={`rotate(${deg} 12 12.6)`} />
      ))}
      <circle cx="12" cy="12.6" r="1.9" />
    </Base>
  );
}

export function IconEspiga(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21V6" />
      <path d="M12 8.5C10 8 8.7 6.5 8.5 4c2.5.2 4 1.5 3.5 4.5ZM12 8.5c2-.5 3.3-2 3.5-4.5-2.5.2-4 1.5-3.5 4.5Z" />
      <path d="M12 13c-2-.5-3.3-2-3.5-4.5 2.5.2 4 1.5 3.5 4.5ZM12 13c2-.5 3.3-2 3.5-4.5-2.5.2-4 1.5-3.5 4.5Z" />
      <path d="M12 17.5c-2-.5-3.3-2-3.5-4.5 2.5.2 4 1.5 3.5 4.5ZM12 17.5c2-.5 3.3-2 3.5-4.5-2.5.2-4 1.5-3.5 4.5Z" />
    </Base>
  );
}

export function IconFrasco(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="8" y="3.5" width="8" height="3" rx="1.2" />
      <path d="M8.5 6.5 7 9.5v8A3.5 3.5 0 0 0 10.5 21h3A3.5 3.5 0 0 0 17 17.5v-8l-1.5-3" />
      <path d="M7 13h10" />
    </Base>
  );
}

/** Conserva o fermento: el mismo frasco del preparado, pero burbujeando. */
export function IconFrascoFermento(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="8" y="3.5" width="8" height="3" rx="1.2" />
      <path d="M8.5 6.5 7 9.5v8A3.5 3.5 0 0 0 10.5 21h3A3.5 3.5 0 0 0 17 17.5v-8l-1.5-3" />
      <path d="M7 15.5c1.4-1 2.6-1 4 0s2.6 1 4 0" />
      <circle cx="10.4" cy="11.4" r="1.1" />
      <circle cx="13.9" cy="12.6" r="0.8" />
    </Base>
  );
}

export function IconRamaBifurca(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21v-8" />
      <path d="M12 13C12 9.5 9.5 7 6 6.5" />
      <path d="M12 13c0-3.5 2.5-6 6-6.5" />
      <circle cx="5.2" cy="5.8" r="1.4" />
      <circle cx="18.8" cy="5.8" r="1.4" />
    </Base>
  );
}

export function IconBandeja(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3.5 16.5h17" />
      <path d="M5 16.5a7 7 0 0 1 14 0" />
      <path d="M12 9.5V8" />
      <circle cx="12" cy="6.8" r="1.1" />
    </Base>
  );
}

// ---------- prácticos ----------

export function IconReloj(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Base>
  );
}

export function IconLlama(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3c1.2 3.2 5 5.2 5 9.8a5 5 0 0 1-10 0C7 8.2 10.8 6.2 12 3Z" />
      <path d="M12 12.5c.9 1.3 2 2.1 2 3.6a2 2 0 0 1-4 0c0-1.5 1.1-2.3 2-3.6Z" />
    </Base>
  );
}

export function IconPlato(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
    </Base>
  );
}

export function IconAsterisco(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4v16M5.1 8l13.8 8M18.9 8 5.1 16" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconSustituir(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19.5 12a7.5 7.5 0 0 1-13 5.1" />
      <path d="M6.2 20.7v-3.9h3.9" />
      <path d="M4.5 12a7.5 7.5 0 0 1 13-5.1" />
      <path d="M17.8 3.3v3.9h-3.9" />
    </Base>
  );
}

export function IconCopoNieve(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5v17M4.6 7.75l14.8 8.5M19.4 7.75l-14.8 8.5" />
      <path d="M12 3.5 10 5.5M12 3.5l2 2M12 20.5l-2-2M12 20.5l2-2" />
    </Base>
  );
}

export function IconHeladera(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M6 10h12" />
      <path d="M15.2 5.8v1.8M15.2 12.8v2.6" />
    </Base>
  );
}

export function IconTemporada(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 16a5 5 0 0 1 10 0" />
      <path d="M12 8V6M6.5 10.5 5.2 9.2M17.5 10.5l1.3-1.3" />
      <path d="M3.5 19.5c1.7-1.2 3.3-1.2 5 0M15.5 19.5c1.7-1.2 3.3-1.2 5 0" />
    </Base>
  );
}

// ---------- alerta y extras ----------

export function IconEscudoB12(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l7 2.6v4.9c0 4.9-2.9 8.3-7 10-4.1-1.7-7-5.1-7-10V5.6Z" />
      <text
        x="12"
        y="13.6"
        textAnchor="middle"
        fontSize="6.2"
        fontFamily="inherit"
        fontWeight="700"
        fill="currentColor"
        stroke="none"
      >
        B12
      </text>
    </Base>
  );
}

export function IconEstrellaBrotada(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 6.5l1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6Z" />
      <path d="M12 6.5c0-2 1-3.4 2.8-4" />
    </Base>
  );
}

export function IconCuchara(props: IconProps) {
  return (
    <Base {...props}>
      <ellipse cx="8.2" cy="15.8" rx="4.6" ry="3.6" transform="rotate(-38 8.2 15.8)" />
      <path d="M11.6 12.9 20 4.5" />
      <path d="M4.6 13.2c1.6-2.2 4.9-2.6 6.8-.8" />
    </Base>
  );
}

// ---------- navegación ----------

export function IconCarta(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 7.5h8M8 7.9h8" strokeWidth="0.9" />
      <path d="M8 11.5h8M8 15h8M8 18h4.5" />
    </Base>
  );
}

export function IconZanahoria(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15.3 8.7c2 2 1.6 5.6-1.1 8.3-2.6 2.6-7.3 4-10 2.8-1.2-2.7.2-7.4 2.8-10 2.7-2.7 6.3-3.1 8.3-1.1Z" />
      <path d="M15.8 8.2c-.2-2 .7-3.6 2.7-4.7M15.8 8.2c2 .2 3.6-.7 4.7-2.7" />
      <path d="M11.5 12.5 9 15M13.5 15.5l-1.8 1.8" />
    </Base>
  );
}

export function IconLibro(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 6.2C10 4.8 7.3 4.2 4 4.2v14.6c3.3 0 6 .6 8 2 2-1.4 4.7-2 8-2V4.2c-3.3 0-6 .6-8 2Z" />
      <path d="M12 6.2v14.6" />
    </Base>
  );
}
