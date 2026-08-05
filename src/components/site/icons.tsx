import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Ícones de interface: Lucide (ISC) — https://github.com/lucide-icons/lucide
 * Marcas (Pix, WhatsApp, Instagram): Simple Icons (CC0) —
 * https://github.com/simple-icons/simple-icons
 *
 * Os paths são os oficiais, sem redesenho. Marcas são preenchidas (fill) e não
 * devem ter a geometria alterada; ícones de interface são traçados com a
 * métrica padrão do Lucide (grid 24, stroke 2, cantos arredondados).
 */

const outline: IconProps = {
  "aria-hidden": true,
  fill: "none",
  focusable: "false",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 2,
  viewBox: "0 0 24 24",
};

/**
 * Os logotipos do Simple Icons preenchem o viewBox de ponta a ponta (0→24),
 * enquanto os ícones Lucide desenham só de 2 a 22. Renderizados no mesmo tamanho,
 * as marcas ficariam ~20% maiores e encostariam nas bordas do contêiner. O
 * viewBox ampliado devolve esse respiro sem tocar na geometria da marca — que
 * não pode ser alterada — e funciona em qualquer tamanho de renderização.
 */
const brand: IconProps = {
  "aria-hidden": true,
  fill: "currentColor",
  focusable: "false",
  viewBox: "-2 -2 28 28",
};

/* ---------------------------------------------------------------- marcas */

/** Marca oficial do Pix (Banco Central do Brasil), via Simple Icons. */
export function PixIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.191.31-.278.694-.278 1.153v1.897h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...brand} {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ---------------------------------------------------------- interface */

/** Lucide `truck` */
export function TruckIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

/** Lucide `motorbike` — a entrega por motoboy. */
export function MotorbikeIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="m18 14-1-3" />
      <path d="m3 9 6 2a2 2 0 0 1 2-2h2a2 2 0 0 1 1.99 1.81" />
      <path d="M8 17h3a1 1 0 0 0 1-1 6 6 0 0 1 6-6 1 1 0 0 0 1-1v-.75A5 5 0 0 0 17 5" />
      <circle cx="19" cy="17" r="3" />
      <circle cx="5" cy="17" r="3" />
    </svg>
  );
}

/** Lucide `mailbox` — os Correios. */
export function MailboxIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
      <polyline points="15,9 18,9 18,11" />
      <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2" />
      <line x1="6" x2="7" y1="10" y2="10" />
    </svg>
  );
}

/** Lucide `package` — transportadora de encomenda. */
export function PackageIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}

/** Lucide `store` */
export function StoreIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="m2 7 4.4-4.4A2 2 0 0 1 7.8 2h8.4a2 2 0 0 1 1.4.6L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M9 22v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
      <path d="M2 7h20" />
      <path d="M4 7v3a2 2 0 0 0 4 0V7" />
      <path d="M8 7v3a2 2 0 0 0 4 0V7" />
      <path d="M12 7v3a2 2 0 0 0 4 0V7" />
      <path d="M16 7v3a2 2 0 0 0 4 0V7" />
    </svg>
  );
}

/** Lucide `refresh-cw` */
export function RefreshIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
    </svg>
  );
}

/** Lucide `credit-card` */
export function CardIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

/** Lucide `shield-check` */
export function ShieldIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/** Lucide `phone` */
export function PhoneIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </svg>
  );
}

/** Lucide `search` */
export function SearchIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </svg>
  );
}

/** Lucide `user` */
export function AccountIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/** Lucide `shopping-bag` */
export function BagIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M16 10a4 4 0 0 1-8 0" />
      <path d="M3.103 6.034h17.794" />
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </svg>
  );
}

/** Lucide `menu` */
export function MenuIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </svg>
  );
}

/** Lucide `x` */
export function CloseIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

/** Lucide `package` */
export function BoxIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <path d="m7.5 4.27 9 5.15" />
    </svg>
  );
}

/** Lucide `arrow-right` */
export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

/** Lucide `chevron-down` */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Lucide `check` */
export function CheckIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Lucide `flame` */
export function FlameIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
    </svg>
  );
}

/** Lucide `disc-3` — usado como carretel de filamento. */
export function FilamentIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M6 12c0-1.7.7-3.2 1.8-4.2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M18 12c0 1.7-.7 3.2-1.8 4.2" />
    </svg>
  );
}

/** Lucide `leaf` — usado para identificar PLA. */
export function LeafIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 18 2 18 2c0 6.5-3.5 12-10 12" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.4 12.92 12 13 14 13" />
    </svg>
  );
}

/** Lucide `tag` — usado para ofertas. */
export function TagIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

/** Lucide `wrench` — usado para acessórios e ferramentas. */
export function WrenchIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
    </svg>
  );
}

/** Lucide `headset` */
export function HeadsetIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
      <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
    </svg>
  );
}

/** Lucide `package-search` */
export function TrackingIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M12 22V12" />
      <path d="M20.27 18.27 22 20" />
      <path d="M21 10.498V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l.98-.559" />
      <path d="M3.29 7 12 12l8.71-5" />
      <path d="m7.5 4.27 8.997 5.148" />
      <circle cx="18.5" cy="16.5" r="2.5" />
    </svg>
  );
}

/** Lucide `circle-question-mark` */
export function HelpIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/** Lucide `star`, preenchida para uso em avaliações. */
export function StarIcon(props: IconProps) {
  return (
    <svg {...outline} fill="currentColor" stroke="none" {...props}>
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

/** Lucide `volume-2` / `volume-x` */
export function VolumeIcon({ muted, ...props }: IconProps & { muted: boolean }) {
  return (
    <svg {...outline} {...props}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      {muted ? (
        <>
          <line x1="22" x2="16" y1="9" y2="15" />
          <line x1="16" x2="22" y1="9" y2="15" />
        </>
      ) : (
        <>
          <path d="M16 9a5 5 0 0 1 0 6" />
          <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
        </>
      )}
    </svg>
  );
}

/** Lucide `play`, preenchido: aparece sobre o vídeo pausado, onde o traço some. */
export function PlayIcon(props: IconProps) {
  return (
    <svg {...outline} fill="currentColor" stroke="none" {...props}>
      <path d="M6.746 3.5a1 1 0 0 0-1.5.866v15.268a1 1 0 0 0 1.5.866l13.104-7.634a1 1 0 0 0 0-1.732z" />
    </svg>
  );
}

/* ------------------------------------------------------- checkout */

/** Lucide `mail` */
export function MailIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
    </svg>
  );
}

/** Lucide `map-pin` */
export function PinIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** Lucide `barcode` — usado para o boleto bancário. */
export function BarcodeIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M3 5v14" />
      <path d="M8 5v14" />
      <path d="M12 5v14" />
      <path d="M17 5v14" />
      <path d="M21 5v14" />
    </svg>
  );
}

/** Lucide `message-square` */
export function NoteIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Lucide `shopping-cart` — adicionar ao carrinho. Distinto do `BagIcon`, que
    representa a sacola já montada no cabeçalho e na gaveta. */
export function CartIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

/** Lucide `heart` — favoritos. `preenchido` troca o traçado pelo sólido, que é
    como o coração marca "já é seu favorito" sem depender de cor. */
export function HeartIcon({ preenchido, ...props }: IconProps & { preenchido?: boolean }) {
  return (
    <svg {...outline} {...props} fill={preenchido ? "currentColor" : "none"}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/** Lucide `map-pin-house` — endereços salvos. */
export function HouseIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z" />
      <path d="M20 15v-2.5a1 1 0 0 0-.4-.8l-4-3a1 1 0 0 0-1.2 0l-4 3a1 1 0 0 0-.4.8V15" />
      <path d="M10.5 20.4A13 13 0 0 1 4 11a8 8 0 0 1 16 0" />
    </svg>
  );
}

/** Lucide `log-out` — sair da conta. */
export function LogoutIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

/** Lucide `lock` — campos de senha. */
export function LockIcon(props: IconProps) {
  return (
    <svg {...outline} {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
