# landings-vsl

Plantilla neutra para los funnels VSL de Bakano: landing → registro → video → cualificación →
agenda en el calendario de GoHighLevel, con pago opcional. Vue 3 + Vite + TypeScript, webhooks de
GHL con contrato estándar, Meta Pixel + Conversions API deduplicados y deploy en Vercel.

La usa la skill **`landings-vsl`** (`~/.claude/skills/landings-vsl`, repo
`drobles-png/landings-vsl-skill`): pídele a Claude "arma la landing VSL de [cliente]" y la skill
hace todo el recorrido. No tiene contenido de ningún cliente: todo texto entre `[corchetes]` es un
marcador.

## Empezar un cliente

```bash
gh repo create drobles-png/<cliente>-landing --public --template drobles-png/landings-vsl --clone
cd <cliente>-landing
pnpm install
pnpm dev            # http://localhost:5173 (pnpm dev --host para probar en el celular)
```

Luego, en este orden:

| Qué | Dónde |
|---|---|
| Cliente, pixel, webhooks, calendario, Wistia, pago, legales, `STORAGE_PREFIX`, `FUNNEL_TAG` | `src/config/funnel.ts` |
| Portada del video (Cloudinary + respaldo local) y logo para el JSON-LD | `src/config/funnel.ts` → `VSL_POSTER`, `VSL_POSTER_FALLBACK`, `LOGO_URL` |
| Todos los textos (solo lo que dice el VSL; no inventar) | `src/content/copy.ts` |
| Testimonios y equipo (opcionales: vacíos = la sección no aparece) | `src/content/copy.ts` → `LANDING.testimonials`, `LANDING.team` |
| Preguntas de cualificación y regla `qualifies()` | `src/utils/qualification.ts` |
| Colores y tipografía | `src/styles/tokens.scss` (+ link de fuentes en `index.html`) |
| Logo | `src/components/BrandLogo.vue` (cambiar por `<img>`), `public/favicon.svg` |
| Título/OG iniciales, og:image | `index.html` |
| Token de CAPI | `.env.local` y env vars de Vercel (ver `.env.example`) |

Valor vacío = esa integración no envía nada y la página sigue funcionando (el video muestra un
marcador y `/agendar` dice "Calendario en configuración").

El JSON-LD de la empresa (schema.org/Organization, para Google y las IAs) se genera solo en el
build con `CLIENT`, `SITE_URL`, `LOGO_URL`, `LEGAL` y `DEFAULT_COUNTRY`. Sin `CLIENT.name` no se
inyecta.

## Flujos

```
Agenda (por defecto)
/                 landing + RegistrationModal ─ GHL contacto (registro) · CompleteRegistration
/ver-video        VSL + CTA bloqueado N s → QualificationModal ─ GHL cualificación · Lead (si califica)
  ├ califica    → /agendar (GhlCalendar) → /cita-confirmada ─ GHL contacto (cita_agendada) · Schedule
  └ no califica → /sin-espacio (cooldown 24 h)

Pago (PAYMENT_ENABLED = true)
/ → registro → /pago (InitiateCheckout · pago-iniciado) → pasarela
  → /inscripcion-confirmada (Purchase · pagado, 1 vez por dispositivo) → calendario opcional
```

Con `PAYMENT_ENABLED = false` las rutas `/pago` e `/inscripcion-confirmada` no existen.

## Contrato con GHL (resumen)

Todos los envíos pasan por `buildPayload` / `trackStage` / `postToGhl` (`src/utils/ghl.ts`):
`nombre, apellido, email, telefono (E.164), pais, etapa, tags, nota = notas, event_id, timestamp,
url_pagina, fbclid, fbc, fbp, utm_*`. La cualificación agrega `califica` (bool), `resultado`
(`CALIFICA`/`NO_CALIFICA`), cada respuesta y su `*_label`, y `objetivo`.
Etapas: `registro`, `registro_parcial`, `cualificacion`, `cita_agendada`, `pago-iniciado`, `pagado`.
El `event_id` es el mismo que va al Pixel y a CAPI. El `Lead` lleva además las respuestas de la
cualificación (valores internos, sin datos personales) para segmentar en Meta.
Detalle, mapeo y workflows: `references/contrato-ghl.md` y `references/ghl-workflows.md` de la skill.

## Probar

```bash
pnpm type-check && pnpm build
# con pnpm dev corriendo; modo stub: nada sale a GHL ni a Meta y el calendario es falso
python3 ~/.claude/skills/landings-vsl/scripts/e2e_funnel.py --base http://localhost:5173 --steps e2e/agenda.json
python3 ~/.claude/skills/landings-vsl/scripts/e2e_funnel.py --base http://localhost:5173 --steps e2e/pago.json   # con PAYMENT_ENABLED = true
```

- El script revisa que cada envío a GHL lleve los campos del contrato (teléfono en E.164, fbclid,
  UTMs), que cada evento del Pixel tenga `eventID` y, fuera de localhost, que CAPI lleve el mismo.
  Deja capturas y `report.json` en `e2e-out/`.
- `e2e/*.json` usan los `data-field` / `data-cta` y los `value` de las opciones de cualificación:
  si cambias las preguntas, actualiza los `value` en `e2e/agenda.json`.
- `booking_complete` necesita `GHL_BOOKING_CALENDAR` con valor (en stub se reemplaza por un
  calendario falso: no se agenda nada real).
- La primera corrida de `pnpm dev` puede recargar la página (Vite optimizando dependencias): el
  script lo avisa; vuelve a correrla o usa `pnpm build && pnpm preview`.
- Para ver CAPI: `pnpm dev --host` → `--base http://192.168.x.x:5173` con `CTA_UNLOCK_SECONDS = 0`
  temporal.
- Modos `ghl` y `full` (escriben en el CRM y el pixel del cliente): solo en producción y con permiso.

## Deploy (Vercel)

`vercel.json` ya trae framework, build y el rewrite SPA que excluye `/api/`. `api/capi.ts` es la
función serverless de CAPI: acepta solo los 6 eventos del funnel, solo desde el mismo dominio, y
manda el token a Meta en el cuerpo (nunca en la URL). Env vars en Production y Preview:
`META_PIXEL_ID`, `META_CAPI_TOKEN` (nunca con prefijo `VITE_`). `META_CAPI_TEST_EVENT_CODE` solo
mientras se usa el Probador de eventos. Repo público en `drobles-png`, proyecto en el equipo
`bakano-proyects`. Ver `references/deploy.md` de la skill.
Este repo es la plantilla: no tiene proyecto de Vercel propio.
