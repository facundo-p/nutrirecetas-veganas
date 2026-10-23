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
  IconEspiga,
  IconEstrellaBrotada,
  IconFlor,
  IconFrasco,
  IconFrascoFermento,
  IconGota,
  IconHeladera,
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
import { GlifoBarra, GlifoCuadrados, GlifoPuntos } from '../common/GlifosDeColor';

/**
 * Catálogo del set de íconos y del vocabulario de color: cada uno con su
 * significado. Lo consumen el Glosario y la «i» de cada pantalla (pedido
 * explícito de Facu: todo ícono explicado). `catalog.test.ts` avisa si un
 * ícono nuevo queda sin entrada.
 */

export interface CatalogEntry {
  id: string;
  Componente: ComponentType<IconProps>;
  significado: string;
  grupo: 'colores' | 'ventana' | 'datos' | 'tipo de receta' | 'prácticos' | 'extras' | 'navegación';
}

export const ICON_CATALOG: CatalogEntry[] = [
  {
    id: 'cuadrado-nutriente',
    Componente: GlifoCuadrados,
    significado: 'El color de un nutriente, delante de su nombre. Hueco: no aporta. Hueco y gris: no entra a las barras',
    grupo: 'colores',
  },
  {
    id: 'punto-ingrediente',
    Componente: GlifoPuntos,
    significado:
      'El punto de un ingrediente: el color de lo que más trae; gris si no trae ninguno de los once; hueco si es condicional, como la B12 de la levadura',
    grupo: 'colores',
  },
  {
    id: 'barra-aporte',
    Componente: GlifoBarra,
    significado: 'Los seis nutrientes que más cubre una porción, siempre en el mismo orden. Lo pintado es cuánto del día cubre',
    grupo: 'colores',
  },
  { id: 'sol', Componente: IconSol, significado: 'Nutriente que se mira día a día', grupo: 'ventana' },
  { id: 'semana-arco', Componente: IconSemanaArco, significado: 'Se mira en la semana, no en el día suelto', grupo: 'ventana' },
  { id: 'banda-aprox', Componente: IconBandaAprox, significado: 'Valor con banda de incertidumbre (rango)', grupo: 'datos' },
  { id: 'brotes-ic', Componente: IconBrotesIc, significado: 'Índice de confianza del dato (1 a 3 brotes)', grupo: 'datos' },
  { id: 'dificultad', Componente: IconDificultad, significado: 'Dificultad de la receta: de uno (trivial) a cinco casilleros (difícil)', grupo: 'datos' },
  { id: 'cobertura', Componente: IconCobertura, significado: 'Cobertura del cálculo: % del peso con dato', grupo: 'datos' },
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
  { id: 'marcar', Componente: IconMarcar, significado: 'Sin probar: tocalo en la ficha para marcar la receta', grupo: 'extras' },
  { id: 'tilde-brote', Componente: IconTildeBrote, significado: 'La cocinaste: probada', grupo: 'extras' },
  { id: 'senalador', Componente: IconSenalador, significado: 'Pendiente: de las que querés cocinar', grupo: 'extras' },
  { id: 'estrella-brotada', Componente: IconEstrellaBrotada, significado: 'Favorita: de las que repetís', grupo: 'extras' },
  { id: 'laurel', Componente: IconLaurel, significado: 'Candidata a clásica (lo dice el recetario, no vos)', grupo: 'extras' },
  { id: 'cuchara', Componente: IconCuchara, significado: 'Indulgente: para disfrutar sin cuentas', grupo: 'extras' },
  { id: 'carta', Componente: IconCarta, significado: 'Sección Recetario', grupo: 'navegación' },
  { id: 'gota', Componente: IconGota, significado: 'Sección Nutrientes', grupo: 'navegación' },
  { id: 'zanahoria', Componente: IconZanahoria, significado: 'Sección Ingredientes', grupo: 'navegación' },
  { id: 'libro', Componente: IconLibro, significado: 'Sección Diario: lo que cocinaste, y de ahí el perfil, el glosario y los ajustes', grupo: 'navegación' },
  { id: 'ajustes', Componente: IconAjustes, significado: 'Ajustes y datos: apariencia, copia de seguridad y versiones', grupo: 'navegación' },
  { id: 'info', Componente: IconInfo, significado: 'Para saber: lo que explica cada pantalla', grupo: 'navegación' },
];
