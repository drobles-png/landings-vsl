import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Meta Pixel: lee META_PIXEL_ID de src/config/funnel.ts (única fuente) y lo inyecta en index.html.
 * - Vacío → no se inyecta nada (la página funciona sin pixel).
 * - El snippet no carga en localhost/127.0.0.1 (las pruebas locales no ensucian el dataset).
 * - El PageView de las navegaciones SPA lo manda el router (solo desde la 2.ª navegación).
 */
function metaPixel(): Plugin {
  const configFile = fileURLToPath(new URL('./src/config/funnel.ts', import.meta.url))
  return {
    name: 'meta-pixel',
    transformIndexHtml() {
      const src = readFileSync(configFile, 'utf8')
      const id = src.match(/export const META_PIXEL_ID\s*=\s*['"](\d*)['"]/)?.[1] ?? ''
      if (!id) return []
      return [
        {
          tag: 'script',
          injectTo: 'head',
          children: `if (!/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) {
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${id}');
fbq('track', 'PageView');
}`,
        },
        {
          tag: 'noscript',
          injectTo: 'body-prepend',
          children: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" alt="" />`,
        },
      ]
    },
  }
}

/** Lee un string de src/config/funnel.ts: `export const KEY = '…'` o `key: '…'` (dentro de un objeto). */
function configString(src: string, key: string): string {
  const re = new RegExp(`(?:export const ${key}\\s*=|\\b${key}\\s*:)\\s*['"]([^'"]*)['"]`)
  return src.match(re)?.[1] ?? ''
}

/**
 * JSON-LD de la empresa (schema.org/Organization) para Google y las IAs. Se arma solo con
 * src/config/funnel.ts: CLIENT.name/instagram/facebook, SITE_URL, LOGO_URL, LEGAL, DEFAULT_COUNTRY.
 * Sin CLIENT.name no se inyecta nada.
 */
function organizationJsonLd(): Plugin {
  const configFile = fileURLToPath(new URL('./src/config/funnel.ts', import.meta.url))
  return {
    name: 'organization-json-ld',
    transformIndexHtml() {
      const src = readFileSync(configFile, 'utf8')
      const name = configString(src, 'name')
      if (!name) return []
      const url = configString(src, 'SITE_URL')
      const logo = configString(src, 'LOGO_URL')
      const legalName = configString(src, 'razonSocial')
      const email = configString(src, 'email')
      const city = configString(src, 'ciudad')
      const country = configString(src, 'DEFAULT_COUNTRY')
      const sameAs = ['instagram', 'facebook'].map((k) => configString(src, k)).filter(Boolean)

      const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        ...(legalName && { legalName }),
        ...(url && { url }),
        ...(logo && { logo }),
        ...(email && { email }),
        ...(sameAs.length && { sameAs }),
        ...((city || country) && {
          address: {
            '@type': 'PostalAddress',
            ...(city && { addressLocality: city }),
            ...(country && { addressCountry: country }),
          },
        }),
      }
      return [
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          injectTo: 'head',
          // "<" escapado para que ningún valor pueda cerrar el <script>
          children: JSON.stringify(data).replace(/</g, '\\u003c'),
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Web component de Wistia: no tratarlo como componente Vue
          isCustomElement: (tag) => tag === 'wistia-player',
        },
      },
    }),
    vueDevTools(),
    metaPixel(),
    organizationJsonLd(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens.scss" as *;\n`,
      },
    },
  },
})
