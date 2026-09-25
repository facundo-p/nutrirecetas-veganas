import type { ComponentType } from 'react';
import {
  IconAsterisco,
  IconBandaAprox,
  IconBandeja,
  IconBrotesIc,
  IconDificultad,
  IconCarta,
  IconCobertura,
  IconCopoNieve,
  IconCuchara,
  IconEscudoB12,
  IconEspiga,
  IconEstrellaBrotada,
  IconFlor,
  IconFrasco,
  IconFrascoFermento,
  IconGota,
  IconHeladera,
  IconHojaPunteada,
  IconAjustes,
  IconInfo,
  IconLaurel,
  IconLibro,
  IconMarcar,
  IconMortero,
  IconPlato,
  IconRamaBifurca,
  IconReloj,
  IconSemanaArco,
  IconSenalador,
  IconSol,
  IconSustituir,
  IconTemporada,
  IconTildeBrote,
  IconZanahoria,
  type IconProps,
} from './icons';

/**
 * Catálogo del set de íconos: cada uno con su significado. Lo consume la
 * pestaña "Íconos" del Glosario (pedido explícito de Facu: todo ícono explicado).
 */

export interface CatalogEntry {
  id: string;
  Componente: ComponentType<IconProps>;
  significado: string;
  grupo: 'ventana' | 'datos' | 'tipo de receta' | 'prácticos' | 'alerta' | 'extras' | 'navegación';
}

export const ICON_CATALOG: CatalogEntry[] = [
  { id: 'sol', Componente: IconSol, significado: 'Nutriente que se mira día a día', grupo: 'ventana' },
  { id: 'semana-arco', Componente: IconSemanaArco, significado: 'Se mira en la semana, no en el día suelto', grupo: 'ventana' },
  { id: 'banda-aprox', Componente: IconBandaAprox, significado: 'Valor con banda de incertidumbre (rango)', grupo: 'datos' },
  { id: 'brotes-ic', Componente: IconBrotesIc, significado: 'Índice de confianza del dato (1 a 3 brotes)', grupo: 'datos' },
  { id: 'dificultad', Componente: IconDificultad, significado: 'Dificultad de la receta: de uno (trivial) a cinco casilleros (difícil)', grupo: 'datos' },
  { id: 'cobertura', Componente: IconCobertura, significado: 'Cobertura del cálculo: % del peso con dato', grupo: 'datos' },
  { id: 'hoja-punteada', Componente: IconHojaPunteada, significado: 'Sin datos suficientes para afirmar nada', grupo: 'datos' },
  { id: 'mortero', Componente: IconMortero, significado: 'Receta salada', grupo: 'tipo de receta' },
  { id: 'flor', Componente: IconFlor, significado: 'Receta dulce', grupo: 'tipo de receta' },
  { id: 'espiga', Componente: IconEspiga, significado: 'Pan / masa', grupo: 'tipo de receta' },
  { id: 'frasco', Componente: IconFrasco, significado: 'Preparado: componente reutilizable', grupo: 'tipo de receta' },
  {
    id: 'frasco-fermento',
    Componente: IconFrascoFermento,
    significado: 'Conserva o fermento (escabeches, encurtidos)',
    grupo: 'tipo de receta',
  },
  { id: 'rama-bifurca', Componente: IconRamaBifurca, significado: 'Variante de otra receta', grupo: 'tipo de receta' },
  { id: 'bandeja', Componente: IconBandeja, significado: 'Combo (plato compuesto)', grupo: 'tipo de receta' },
  { id: 'reloj', Componente: IconReloj, significado: 'Tiempo total (preparación + cocción)', grupo: 'prácticos' },
  { id: 'plato', Componente: IconPlato, significado: 'Porciones que rinde', grupo: 'prácticos' },
  { id: 'asterisco', Componente: IconAsterisco, significado: 'Ingrediente imprescindible del plato', grupo: 'prácticos' },
  { id: 'sustituir', Componente: IconSustituir, significado: 'Sustituible / sustitución disponible', grupo: 'prácticos' },
  { id: 'copo-nieve', Componente: IconCopoNieve, significado: 'Va bien al freezer', grupo: 'prácticos' },
  { id: 'heladera', Componente: IconHeladera, significado: 'Guarda en heladera (días)', grupo: 'prácticos' },
  { id: 'temporada', Componente: IconTemporada, significado: 'En temporada (AMBA)', grupo: 'prácticos' },
  { id: 'escudo-b12', Componente: IconEscudoB12, significado: 'Advertencia B12: levadura no siempre fortificada', grupo: 'alerta' },
  { id: 'marcar', Componente: IconMarcar, significado: 'Sin probar: tocalo en la ficha para marcar la receta', grupo: 'extras' },
  { id: 'tilde-brote', Componente: IconTildeBrote, significado: 'La cocinaste: probada', grupo: 'extras' },
  { id: 'senalador', Componente: IconSenalador, significado: 'Pendiente: de las que querés cocinar', grupo: 'extras' },
  { id: 'estrella-brotada', Componente: IconEstrellaBrotada, significado: 'Favorita: de las que repetís', grupo: 'extras' },
  { id: 'laurel', Componente: IconLaurel, significado: 'Candidata a clásica (lo dice el recetario, no vos)', grupo: 'extras' },
  { id: 'cuchara', Componente: IconCuchara, significado: 'Indulgente: para disfrutar sin cuentas', grupo: 'extras' },
  { id: 'carta', Componente: IconCarta, significado: 'Sección Recetario', grupo: 'navegación' },
  { id: 'gota', Componente: IconGota, significado: 'Sección Nutrientes', grupo: 'navegación' },
  { id: 'zanahoria', Componente: IconZanahoria, significado: 'Sección Ingredientes', grupo: 'navegación' },
  { id: 'libro', Componente: IconLibro, significado: 'Sección Glosario', grupo: 'navegación' },
  { id: 'ajustes', Componente: IconAjustes, significado: 'Ajustes y datos: temas, export e import', grupo: 'navegación' },
  { id: 'info', Componente: IconInfo, significado: 'Para saber: lo que explica cada pantalla', grupo: 'navegación' },
];
