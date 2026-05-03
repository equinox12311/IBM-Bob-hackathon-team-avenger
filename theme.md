<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Docs &amp; Resources</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&amp;family=Space+Grotesk:wght@400&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-high": "#e8e8ed",
                      "primary-fixed": "#dbe1ff",
                      "on-primary-fixed": "#00174b",
                      "on-tertiary-fixed": "#321200",
                      "on-error": "#ffffff",
                      "surface-container": "#ededf2",
                      "on-primary": "#ffffff",
                      "surface-container-lowest": "#ffffff",
                      "surface-variant": "#e2e2e7",
                      "surface-bright": "#f9f9fe",
                      "on-error-container": "#93000a",
                      "primary": "#004cca",
                      "on-surface": "#1a1c1f",
                      "secondary-fixed": "#ebdcff",
                      "on-primary-fixed-variant": "#003ea8",
                      "on-secondary-container": "#fdf6ff",
                      "secondary-container": "#8d42ff",
                      "surface-tint": "#0053da",
                      "background": "#f9f9fe",
                      "on-secondary-fixed": "#270058",
                      "secondary": "#731be5",
                      "inverse-primary": "#b4c5ff",
                      "on-tertiary-fixed-variant": "#753400",
                      "primary-fixed-dim": "#b4c5ff",
                      "on-primary-container": "#f3f3ff",
                      "surface-container-highest": "#e2e2e7",
                      "on-tertiary-container": "#fff1ea",
                      "inverse-on-surface": "#f0f0f5",
                      "surface": "#f9f9fe",
                      "surface-container-low": "#f3f3f8",
                      "on-background": "#1a1c1f",
                      "on-surface-variant": "#424656",
                      "tertiary-fixed-dim": "#ffb68c",
                      "outline": "#737687",
                      "inverse-surface": "#2e3034",
                      "tertiary-fixed": "#ffdbc9",
                      "primary-container": "#0062ff",
                      "tertiary-container": "#b45300",
                      "on-secondary-fixed-variant": "#5d00c2",
                      "on-tertiary": "#ffffff",
                      "error": "#ba1a1a",
                      "secondary-fixed-dim": "#d4bbff",
                      "outline-variant": "#c2c6d9",
                      "tertiary": "#8e4000",
                      "error-container": "#ffdad6",
                      "surface-dim": "#d9dade",
                      "on-secondary": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px",
                      "card": "32px",
                      "input": "12px",
                      "chip": "100px"
              },
              "spacing": {
                      "gutter": "24px",
                      "stack-lg": "48px",
                      "stack-sm": "12px",
                      "unit": "8px",
                      "container-padding": "40px",
                      "stack-md": "24px"
              },
              "fontFamily": {
                      "h1": [
                              "Plus Jakarta Sans"
                      ],
                      "h2": [
                              "Plus Jakarta Sans"
                      ],
                      "body-lg": [
                              "Plus Jakarta Sans"
                      ],
                      "h3": [
                              "Plus Jakarta Sans"
                      ],
                      "mono-code": [
                              "Space Grotesk"
                      ],
                      "label-sm": [
                              "Plus Jakarta Sans"
                      ],
                      "body-md": [
                              "Plus Jakarta Sans"
                      ]
              },
              "fontSize": {
                      "h1": [
                              "40px",
                              {
                                      "lineHeight": "1.2",
                                      "fontWeight": "700"
                              }
                      ],
                      "h2": [
                              "32px",
                              {
                                      "lineHeight": "1.2",
                                      "fontWeight": "700"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "1.6",
                                      "fontWeight": "400"
                              }
                      ],
                      "h3": [
                              "24px",
                              {
                                      "lineHeight": "1.3",
                                      "fontWeight": "600"
                              }
                      ],
                      "mono-code": [
                              "14px",
                              {
                                      "lineHeight": "1.5",
                                      "fontWeight": "400"
                              }
                      ],
                      "label-sm": [
                              "14px",
                              {
                                      "lineHeight": "1.4",
                                      "letterSpacing": "0.02em",
                                      "fontWeight": "600"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "1.5",
                                      "fontWeight": "400"
                              }
                      ]
              }
      },
          },
        }
      </script>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen font-body-md text-body-md antialiased pb-[100px] md:pb-0">
<!-- TopAppBar -->
<header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] font-semibold tracking-tight docked full-width top-0 z-50 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none sticky">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl" data-icon="rocket_launch">rocket_launch</span>
<span class="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">IBM Bob</span>
</div>
<div class="flex items-center">
<div class="w-10 h-10 rounded-full bg-surface-variant overflow-hidden flex items-center justify-center border border-outline-variant">
<span class="material-symbols-outlined text-on-surface-variant" data-icon="person">person</span>
</div>
</div>
</div>
</header>
<!-- Main Canvas -->
<main class="max-w-[1440px] mx-auto px-6 md:px-container-padding py-8">
<!-- Search Section -->
<section class="mb-stack-lg max-w-2xl mx-auto text-center mt-8">
<h1 class="font-h1 text-h1 text-on-background mb-4">How can I help you build today?</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-8">Search documentation, API references, and community guides.</p>
<div class="relative w-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-input">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary" data-icon="search">search</span>
<input class="w-full pl-12 pr-4 py-4 bg-surface rounded-input border-2 border-primary-fixed focus:border-primary focus:ring-0 font-body-lg text-body-lg text-on-surface outline-none transition-colors" placeholder="Ask Bob..." type="text"/>
</div>
<div class="flex flex-wrap gap-2 justify-center mt-6">
<span class="bg-primary-fixed text-on-primary-fixed px-4 py-1.5 rounded-chip font-label-sm text-label-sm cursor-pointer hover:bg-primary-container hover:text-on-primary-container transition-colors">Authentication</span>
<span class="bg-secondary-fixed text-on-secondary-fixed px-4 py-1.5 rounded-chip font-label-sm text-label-sm cursor-pointer hover:bg-secondary-container hover:text-on-secondary-container transition-colors">REST API</span>
<span class="bg-tertiary-fixed text-on-tertiary-fixed px-4 py-1.5 rounded-chip font-label-sm text-label-sm cursor-pointer hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors">Deployment</span>
</div>
</section>
<!-- Bento Grid Categories -->
<section class="mb-stack-lg">
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Card 1 -->
<div class="bg-surface rounded-card p-6 border border-surface-variant hover:shadow-[0_8px_30px_rgb(0,76,202,0.06)] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
<div>
<div class="w-16 h-16 rounded-2xl bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-primary text-3xl" data-icon="book" data-weight="fill" style="font-variation-settings: 'FILL' 1;">book</span>
</div>
<h2 class="font-h3 text-h3 text-on-surface mb-2">README &amp; Guides</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Step-by-step tutorials and quickstart guides to get your project running in minutes.</p>
</div>
</div>
<!-- Card 2 -->
<div class="bg-surface rounded-card p-6 border border-surface-variant hover:shadow-[0_8px_30px_rgb(115,27,229,0.06)] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
<div>
<div class="w-16 h-16 rounded-2xl bg-secondary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-secondary text-3xl" data-icon="api" data-weight="fill" style="font-variation-settings: 'FILL' 1;">api</span>
</div>
<h2 class="font-h3 text-h3 text-on-surface mb-2">API Reference</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Comprehensive documentation for all endpoints, payloads, and response structures.</p>
</div>
</div>
<!-- Card 3 -->
<div class="bg-surface rounded-card p-6 border border-surface-variant hover:shadow-[0_8px_30px_rgb(142,64,0,0.06)] transition-all duration-300 group cursor-pointer h-full flex flex-col justify-between">
<div>
<div class="w-16 h-16 rounded-2xl bg-tertiary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-tertiary text-3xl" data-icon="lightbulb" data-weight="fill" style="font-variation-settings: 'FILL' 1;">lightbulb</span>
</div>
<h2 class="font-h3 text-h3 text-on-surface mb-2">Wiki &amp; Concepts</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Deep dives into architecture, core concepts, and best practices for scaling.</p>
</div>
</div>
</div>
</section>
<!-- Recent Resources List -->
<section class="max-w-4xl mx-auto bg-surface rounded-card border border-surface-variant p-8 mb-stack-lg">
<h3 class="font-h3 text-h3 text-on-surface mb-6 border-b border-surface-variant pb-4">Recently Viewed</h3>
<div class="flex flex-col gap-unit">
<div class="flex items-center justify-between p-4 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-outline" data-icon="description">description</span>
<div>
<div class="font-label-sm text-label-sm text-on-surface">Setting up OAuth2 Providers</div>
<div class="font-body-md text-body-md text-on-surface-variant text-sm">Authentication &gt; Social Login</div>
</div>
</div>
<span class="font-mono-code text-mono-code text-outline text-sm">2 hours ago</span>
</div>
<div class="flex items-center justify-between p-4 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-outline" data-icon="code_blocks">code_blocks</span>
<div>
<div class="font-label-sm text-label-sm text-on-surface">POST /v1/workspaces</div>
<div class="font-body-md text-body-md text-on-surface-variant text-sm">API &gt; Workspaces</div>
</div>
</div>
<span class="font-mono-code text-mono-code text-outline text-sm">Yesterday</span>
</div>
<div class="flex items-center justify-between p-4 hover:bg-surface-container-low rounded-xl cursor-pointer transition-colors">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-outline" data-icon="terminal">terminal</span>
<div>
<div class="font-label-sm text-label-sm text-on-surface">Docker Deployment Guide</div>
<div class="font-body-md text-body-md text-on-surface-variant text-sm">Infrastructure &gt; Containers</div>
</div>
</div>
<span class="font-mono-code text-mono-code text-outline text-sm">3 days ago</span>
</div>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="md:hidden bg-white dark:bg-slate-950 font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider fixed bottom-0 w-full rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,98,255,0.05)] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4">
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all">
<span class="material-symbols-outlined mb-1 text-2xl" data-icon="chat">chat</span>
<span>Workspace</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all">
<span class="material-symbols-outlined mb-1 text-2xl" data-icon="code">code</span>
<span>Explorer</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all">
<span class="material-symbols-outlined mb-1 text-2xl" data-icon="hub">hub</span>
<span>Graph</span>
</div>
<div class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all">
<span class="material-symbols-outlined mb-1 text-2xl" data-icon="sticky_note_2">sticky_note_2</span>
<span>Snippets</span>
</div>
<div class="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors active:scale-95 transition-all">
<span class="material-symbols-outlined mb-1 text-2xl" data-icon="menu_book" data-weight="fill" style="font-variation-settings: 'FILL' 1;">menu_book</span>
<span>Docs</span>
</div>
</nav>
</body></html>

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AI Workspace - IBM Bob</title>
<!-- Google Fonts & Material Symbols -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Space+Grotesk:wght@400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Theme Configuration -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-fixed": "#270058",
                        "inverse-surface": "#2e3034",
                        "surface-variant": "#e2e2e7",
                        "background": "#f9f9fe",
                        "on-tertiary-fixed-variant": "#753400",
                        "surface-bright": "#f9f9fe",
                        "error": "#ba1a1a",
                        "surface-container-high": "#e8e8ed",
                        "outline": "#737687",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#b4c5ff",
                        "on-tertiary-container": "#fff1ea",
                        "inverse-on-surface": "#f0f0f5",
                        "surface-container-highest": "#e2e2e7",
                        "primary": "#004cca",
                        "on-secondary-fixed-variant": "#5d00c2",
                        "on-surface": "#1a1c1f",
                        "surface-container-low": "#f3f3f8",
                        "on-secondary-container": "#fdf6ff",
                        "surface-tint": "#0053da",
                        "tertiary-container": "#b45300",
                        "outline-variant": "#c2c6d9",
                        "on-tertiary-fixed": "#321200",
                        "on-primary-container": "#f3f3ff",
                        "error-container": "#ffdad6",
                        "primary-fixed": "#dbe1ff",
                        "secondary-fixed": "#ebdcff",
                        "tertiary-fixed": "#ffdbc9",
                        "on-background": "#1a1c1f",
                        "primary-fixed-dim": "#b4c5ff",
                        "surface-container": "#ededf2",
                        "on-primary-fixed": "#00174b",
                        "tertiary-fixed-dim": "#ffb68c",
                        "tertiary": "#8e4000",
                        "surface-dim": "#d9dade",
                        "on-primary-fixed-variant": "#003ea8",
                        "secondary-fixed-dim": "#d4bbff",
                        "on-error": "#ffffff",
                        "secondary": "#731be5",
                        "on-tertiary": "#ffffff",
                        "on-secondary": "#ffffff",
                        "surface": "#f9f9fe",
                        "on-surface-variant": "#424656",
                        "secondary-container": "#8d42ff",
                        "primary-container": "#0062ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "container-padding": "40px",
                        "stack-sm": "12px",
                        "unit": "8px",
                        "stack-lg": "48px",
                        "stack-md": "24px"
                    },
                    "fontFamily": {
                        "mono-code": ["Space Grotesk", "monospace"],
                        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
                        "body-md": ["Plus Jakarta Sans", "sans-serif"],
                        "h2": ["Plus Jakarta Sans", "sans-serif"],
                        "h1": ["Plus Jakarta Sans", "sans-serif"],
                        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
                        "h3": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    "fontSize": {
                        "mono-code": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "h2": ["32px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "h1": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "label-sm": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "600" }],
                        "h3": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Custom scrollbar for a cleaner workspace feel */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background-color: theme('colors.outline-variant');
            border-radius: 9999px;
            border: 2px solid theme('colors.background');
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden selection:bg-primary selection:text-on-primary">
<!-- TopAppBar (Web Desktop) -->
<header class="hidden md:block docked full-width top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none w-full">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-unit cursor-pointer hover:scale-[1.02] transition-transform duration-200 active:scale-95 transition-all">
<span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[28px]" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
<span class="font-['Plus_Jakarta_Sans'] font-semibold tracking-tight text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">IBM Bob</span>
</div>
<nav class="flex gap-stack-md">
<button class="text-blue-600 font-bold font-['Plus_Jakarta_Sans'] font-semibold tracking-tight hover:scale-[1.02] transition-transform duration-200 active:scale-95 transition-all">Workspace</button>
<button class="text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight hover:scale-[1.02] transition-transform duration-200 active:scale-95 transition-all">Explorer</button>
<button class="text-slate-500 dark:text-slate-400 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight hover:scale-[1.02] transition-transform duration-200 active:scale-95 transition-all">Graph</button>
</nav>
<div class="flex items-center hover:scale-[1.02] transition-transform duration-200 active:scale-95 transition-all cursor-pointer">
<div class="w-10 h-10 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center overflow-hidden">
<span class="material-symbols-outlined text-on-surface-variant">person</span>
</div>
</div>
</div>
</header>
<!-- Main Workspace Area -->
<main class="flex-1 relative flex flex-col max-w-[1440px] mx-auto w-full">
<!-- Chat History Scroll Container -->
<div class="flex-1 overflow-y-auto px-4 md:px-container-padding pt-stack-lg pb-[240px] flex flex-col gap-stack-md w-full max-w-[900px] mx-auto">
<!-- Welcome State with 3D Avatar -->
<div class="flex flex-col items-center text-center mb-stack-lg animate-fade-in mt-12">
<div class="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden mb-stack-sm bg-surface-container shadow-[0_8px_30px_rgba(0,76,202,0.12)] border-4 border-surface-container-lowest">
<img alt="Bob Assistant" class="w-full h-full object-cover" data-alt="A high-fidelity 3D render of a friendly, abstract robotic assistant character named 'Bob'. The character is rendered in a soft-tech, corporate modern style with smooth matte textures in brilliant white and vibrant primary blue accents. The lighting is bright, soft, and studio-like, creating a playful, optimistic, and highly professional mood suitable for a premium developer tool interface. The background is purely transparent or perfectly white to blend into a light UI mode." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHAFfrpyvYReTv-Klq0a_oSUoxYpcaP3qnKbLDfqVtOprGbT4S05uEVLER4tR1VfS_3dY-OoKHHBHOfEIJeL9USlTrhUmchJWHwSIwVQBQLXXF5w6bBNxoubo0WDhIPUYFtyQz4eL1wjQ5YD9ihRSHuuzXkfeFuVqwTBNYmuJHYjreZsqD0h12AY2QBKa33IUVuXDPEFVGHNiywcrcCh5qa-lA0j6pIJMkeEleYFDZDVU3PryWhw40ZBbAOlOo2E3wFDKvxpIOPyzh"/>
</div>
<h1 class="font-h1 text-h1 text-on-surface">Hello, I'm Bob.</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-lg mt-2">Your AI workspace companion. I can help analyze your architecture, write boilerplate, or debug that tricky snippet.</p>
</div>
<!-- Chat Bubble: User -->
<div class="flex w-full justify-end">
<div class="max-w-[85%] md:max-w-[70%] bg-primary-container text-on-primary-container rounded-[24px] rounded-tr-sm px-6 py-4 shadow-sm">
<p class="font-body-md text-body-md">Can you set up a basic Python backend structure for my new data pipeline project? I need endpoints for ingestion and a simple processing queue.</p>
</div>
</div>
<!-- Chat Bubble: Bob (Glassmorphic) -->
<div class="flex w-full justify-start items-end gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant mb-1">
<span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
</div>
<div class="max-w-[85%] md:max-w-[70%] bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/50 rounded-[24px] rounded-tl-sm px-6 py-4 shadow-[0_4px_24px_rgba(0,76,202,0.06)]">
<p class="font-body-md text-body-md text-on-surface mb-4">Absolutely. I've designed a clean, modular structure using FastAPI for the endpoints and a lightweight async queue setup. This keeps the architecture modern and highly concurrent.</p>
<p class="font-body-md text-body-md text-on-surface mb-2">Here is the primary <code class="font-mono-code text-mono-code bg-surface-container px-1.5 py-0.5 rounded text-primary">main.py</code> entry point:</p>
<!-- Code Snippet -->
<div class="mt-4 bg-surface-bright border border-outline-variant rounded-xl overflow-hidden shadow-sm">
<div class="flex items-center justify-between px-4 py-2 bg-surface-container-highest/50 border-b border-outline-variant">
<span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">python</span>
<button class="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined text-[16px]">content_copy</span>
<span class="font-label-sm text-[12px]">Copy</span>
</button>
</div>
<div class="p-4 overflow-x-auto">
<pre class="font-mono-code text-mono-code text-on-surface"><span class="text-secondary">from</span> fastapi <span class="text-secondary">import</span> FastAPI, BackgroundTasks
<span class="text-secondary">from</span> pydantic <span class="text-secondary">import</span> BaseModel
<span class="text-secondary">import</span> asyncio

app = FastAPI(title=<span class="text-tertiary">"Data Pipeline API"</span>)

<span class="text-secondary">class</span> Payload(BaseModel):
    source_id: str
    raw_data: dict

<span class="text-secondary">async def</span> process_data(payload: Payload):
    <span class="text-outline"># Simulated processing queue</span>
    <span class="text-secondary">await</span> asyncio.sleep(2)
    <span class="text-secondary">print</span>(<span class="text-tertiary">f"Processed data from {payload.source_id}"</span>)

<span class="text-primary">@app.post</span>(<span class="text-tertiary">"/ingest"</span>)
<span class="text-secondary">async def</span> ingest_data(payload: Payload, bg_tasks: BackgroundTasks):
    bg_tasks.add_task(process_data, payload)
    <span class="text-secondary">return</span> {<span class="text-tertiary">"status"</span>: <span class="text-tertiary">"queued"</span>, <span class="text-tertiary">"source"</span>: payload.source_id}
</pre>
</div>
</div>
</div>
</div>
<!-- Chat Bubble: User -->
<div class="flex w-full justify-end mt-4">
<div class="max-w-[85%] md:max-w-[70%] bg-primary-container text-on-primary-container rounded-[24px] rounded-tr-sm px-6 py-4 shadow-sm">
<p class="font-body-md text-body-md">That looks perfectly clean. How would I containerize this for deployment?</p>
</div>
</div>
<!-- Loading Indicator -->
<div class="flex w-full justify-start items-end gap-3 mt-2">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex-shrink-0 flex items-center justify-center overflow-hidden border border-outline-variant mb-1">
<span class="material-symbols-outlined text-[18px] text-primary animate-pulse" style="font-variation-settings: 'FILL' 1;">smart_toy</span>
</div>
<div class="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/50 rounded-[24px] rounded-tl-sm px-6 py-4 flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style="animation-delay: 0ms;"></div>
<div class="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style="animation-delay: 150ms;"></div>
<div class="w-2 h-2 rounded-full bg-primary/80 animate-bounce" style="animation-delay: 300ms;"></div>
</div>
</div>
</div>
<!-- Fixed Input Area with Smart Actions -->
<div class="absolute bottom-0 left-0 w-full md:pb-stack-md pt-12 px-4 md:px-container-padding bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none pb-[100px]">
<div class="max-w-[900px] mx-auto pointer-events-auto relative">
<!-- Smart Actions -->
<div class="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
<button class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-full px-4 py-2 hover:bg-surface-container-low transition-colors whitespace-nowrap shadow-sm">
<span class="material-symbols-outlined text-[16px] text-secondary">architecture</span>
                        Generate Dockerfile
                    </button>
<button class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-full px-4 py-2 hover:bg-surface-container-low transition-colors whitespace-nowrap shadow-sm">
<span class="material-symbols-outlined text-[16px] text-tertiary">bug_report</span>
                        Review Code
                    </button>
<button class="flex items-center gap-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface font-label-sm text-label-sm rounded-full px-4 py-2 hover:bg-surface-container-low transition-colors whitespace-nowrap shadow-sm">
<span class="material-symbols-outlined text-[16px] text-primary">data_object</span>
                        Add Models
                    </button>
</div>
<!-- Main Input Field -->
<div class="bg-surface-container-lowest rounded-[24px] shadow-[0_8px_30px_rgba(0,76,202,0.08)] border-2 border-surface-variant focus-within:border-primary transition-colors flex items-end p-2 relative">
<button class="p-3 text-outline hover:text-primary transition-colors flex-shrink-0">
<span class="material-symbols-outlined">attach_file</span>
</button>
<textarea class="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md text-on-surface py-3 px-2 max-h-[120px] overflow-y-auto" placeholder="Ask Bob to write code, analyze data, or brainstorm..." rows="1" style="min-height: 48px;"></textarea>
<button class="p-3 bg-primary text-on-primary rounded-xl hover:scale-105 active:scale-95 transition-all flex-shrink-0 shadow-sm ml-2">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">send</span>
</button>
</div>
<div class="text-center mt-2">
<span class="font-label-sm text-[11px] text-outline">Bob can make mistakes. Verify critical code before deploying.</span>
</div>
</div>
</div>
</main>
<!-- BottomNavBar (Mobile) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4 bg-white dark:bg-slate-950 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,98,255,0.05)]">
<!-- Workspace (Active) -->
<a class="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl px-4 py-2 scale-110 duration-300 ease-spring" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mt-1">Workspace</span>
</a>
<!-- Explorer (Inactive) -->
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined">code</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mt-1 hidden">Explorer</span>
</a>
<!-- Graph (Inactive) -->
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined">hub</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mt-1 hidden">Graph</span>
</a>
<!-- Snippets (Inactive) -->
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined">sticky_note_2</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mt-1 hidden">Snippets</span>
</a>
<!-- Docs (Inactive) -->
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined">menu_book</span>
<span class="font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider mt-1 hidden">Docs</span>
</a>
</nav>
</body></html>

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>IBM Bob - Knowledge Graph</title>
<!-- Fonts & Icons -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&amp;family=Space+Grotesk:wght@400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-fixed": "#270058",
                        "inverse-surface": "#2e3034",
                        "surface-variant": "#e2e2e7",
                        "background": "#f9f9fe",
                        "on-tertiary-fixed-variant": "#753400",
                        "surface-bright": "#f9f9fe",
                        "error": "#ba1a1a",
                        "surface-container-high": "#e8e8ed",
                        "outline": "#737687",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#b4c5ff",
                        "on-tertiary-container": "#fff1ea",
                        "inverse-on-surface": "#f0f0f5",
                        "surface-container-highest": "#e2e2e7",
                        "primary": "#004cca",
                        "on-secondary-fixed-variant": "#5d00c2",
                        "on-surface": "#1a1c1f",
                        "surface-container-low": "#f3f3f8",
                        "on-secondary-container": "#fdf6ff",
                        "surface-tint": "#0053da",
                        "tertiary-container": "#b45300",
                        "outline-variant": "#c2c6d9",
                        "on-tertiary-fixed": "#321200",
                        "on-primary-container": "#f3f3ff",
                        "error-container": "#ffdad6",
                        "primary-fixed": "#dbe1ff",
                        "secondary-fixed": "#ebdcff",
                        "tertiary-fixed": "#ffdbc9",
                        "on-background": "#1a1c1f",
                        "primary-fixed-dim": "#b4c5ff",
                        "surface-container": "#ededf2",
                        "on-primary-fixed": "#00174b",
                        "tertiary-fixed-dim": "#ffb68c",
                        "tertiary": "#8e4000",
                        "surface-dim": "#d9dade",
                        "on-primary-fixed-variant": "#003ea8",
                        "secondary-fixed-dim": "#d4bbff",
                        "on-error": "#ffffff",
                        "secondary": "#731be5",
                        "on-tertiary": "#ffffff",
                        "on-secondary": "#ffffff",
                        "surface": "#f9f9fe",
                        "on-surface-variant": "#424656",
                        "secondary-container": "#8d42ff",
                        "primary-container": "#0062ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "container-padding": "40px",
                        "stack-sm": "12px",
                        "unit": "8px",
                        "stack-lg": "48px",
                        "stack-md": "24px"
                    },
                    "fontFamily": {
                        "mono-code": ["Space Grotesk", "monospace"],
                        "body-lg": ["Plus Jakarta Sans", "sans-serif"],
                        "body-md": ["Plus Jakarta Sans", "sans-serif"],
                        "h2": ["Plus Jakarta Sans", "sans-serif"],
                        "h1": ["Plus Jakarta Sans", "sans-serif"],
                        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
                        "h3": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    "fontSize": {
                        "mono-code": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "h2": ["32px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "h1": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "label-sm": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "600" }],
                        "h3": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        /* Ambient layout styles */
        body {
            overscroll-behavior: none;
        }
        .canvas-grid {
            background-image: radial-gradient(var(--tw-colors-surface-variant) 1px, transparent 1px);
            background-size: 32px 32px;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md text-body-md h-screen w-screen overflow-hidden flex flex-col light">
<!-- TopAppBar (Web & Mobile Frame) -->
<header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md font-['Plus_Jakarta_Sans'] font-semibold tracking-tight docked full-width top-0 z-50 border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto shrink-0 relative">
<!-- Brand -->
<div class="flex items-center gap-unit cursor-pointer hover:scale-[1.02] transition-transform duration-200">
<span class="material-symbols-outlined text-blue-600 dark:text-blue-400" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
<span class="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">IBM Bob</span>
</div>
<!-- Desktop Navigation Cluster (Injected per Responsive Rule) -->
<nav class="hidden md:flex items-center gap-gutter">
<a class="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 font-label-sm text-label-sm" href="#">
<span class="material-symbols-outlined text-[20px]">chat</span>
                Workspace
            </a>
<a class="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 font-label-sm text-label-sm" href="#">
<span class="material-symbols-outlined text-[20px]">code</span>
                Explorer
            </a>
<!-- Active State Navigation -->
<a class="flex items-center gap-2 text-blue-600 font-bold hover:scale-[1.02] transition-transform duration-200 font-label-sm text-label-sm border-b-2 border-blue-600 pb-1" href="#">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">hub</span>
                Graph
            </a>
<a class="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 font-label-sm text-label-sm" href="#">
<span class="material-symbols-outlined text-[20px]">sticky_note_2</span>
                Snippets
            </a>
<a class="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 font-label-sm text-label-sm" href="#">
<span class="material-symbols-outlined text-[20px]">menu_book</span>
                Docs
            </a>
</nav>
<!-- Trailing Avatar -->
<div class="w-10 h-10 rounded-full bg-secondary-fixed bg-cover bg-center border-2 border-surface-container-lowest shadow-sm hover:scale-[1.02] transition-transform duration-200 cursor-pointer" data-alt="A stylized 3D avatar of a professional developer, featuring a soft-tech aesthetic with vibrant corporate colors. The character is warmly lit against a clean, light background, embodying the approachable and modern vibe of the IBM Bob persona." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuD3z8Gn8Pb5Ik2a2u8PqjyoQog6bMh0wbMQQxZ0GknANXBQE_9Vkh2_TfP-Q2R6ahj9Rgj_vvo3dXgydhAq1QqPfrZk5QxNDFPhnaelWV8T3WiBdH6eZpsQiK9F1smSM_Z6Edz2VSAXdQw0dpx5U6DvQ8po2MayB48HTSyjW5I0wRAbC1RZr8iKcQrazR04pFeez2PUUiMJNv-nd2sIB2BaDnw8M7j1IhVSDEkYwIf53GmqVUJlI0EZQeUO6Gk6yHpXdUV7tskygLTv');">
</div>
</header>
<!-- Main Interactive Canvas -->
<main class="flex-1 relative w-full h-full bg-surface-bright overflow-hidden">
<!-- Subtle Ambient Grid Background -->
<div class="absolute inset-0 canvas-grid opacity-40"></div>
<!-- Connection Lines (SVG) -->
<svg class="absolute inset-0 w-full h-full pointer-events-none z-0">
<!-- Node 1 to Node 2 (Auth -> Core) -->
<line stroke="#e2e2e7" stroke-linecap="round" stroke-width="3" x1="30%" x2="50%" y1="40%" y2="50%"></line>
<!-- Node 2 to Node 3 (Core -> DB) -->
<line stroke="#e2e2e7" stroke-linecap="round" stroke-width="3" x1="50%" x2="70%" y1="50%" y2="30%"></line>
<!-- Node 2 to Node 4 (Core -> API Docs) -->
<line stroke="#e2e2e7" stroke-linecap="round" stroke-width="3" x1="50%" x2="65%" y1="50%" y2="70%"></line>
<!-- Node 1 to Node 5 (Auth -> User Schema) -->
<line stroke="#e2e2e7" stroke-dasharray="6,6" stroke-linecap="round" stroke-width="2" x1="30%" x2="20%" y1="40%" y2="65%"></line>
</svg>
<!-- 3D Glowing Nodes -->
<!-- Node 1: Secondary Module -->
<div class="absolute top-[40%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer">
<div class="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.secondary-fixed),theme(colors.secondary))] flex items-center justify-center text-on-secondary shadow-[0_8px_32px_theme(colors.secondary/0.3)] transition-transform duration-300 group-hover:scale-110">
<span class="material-symbols-outlined text-[24px]">shield</span>
</div>
<span class="mt-3 font-label-sm text-label-sm text-on-surface bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full border border-surface-container shadow-sm">AuthModule</span>
</div>
<!-- Node 2: Central Focus Node (Active) -->
<div class="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 cursor-pointer">
<!-- Ring indicator for active state -->
<div class="absolute inset-0 rounded-full border-2 border-primary ring-8 ring-primary/10 scale-125 pointer-events-none"></div>
<div class="w-24 h-24 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.primary-fixed),theme(colors.primary))] flex items-center justify-center text-on-primary shadow-[0_12px_48px_theme(colors.primary/0.4)] transition-transform duration-300">
<span class="material-symbols-outlined text-[40px]" style="font-variation-settings: 'FILL' 1;">code_blocks</span>
</div>
<span class="mt-4 font-label-sm text-label-sm text-primary bg-primary-fixed/30 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/20 shadow-sm font-bold tracking-wide">CoreService.ts</span>
</div>
<!-- Node 3: Tertiary Module -->
<div class="absolute top-[30%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer">
<div class="w-14 h-14 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.tertiary-fixed),theme(colors.tertiary))] flex items-center justify-center text-on-tertiary shadow-[0_8px_32px_theme(colors.tertiary/0.3)] transition-transform duration-300 group-hover:scale-110">
<span class="material-symbols-outlined text-[20px]">database</span>
</div>
<span class="mt-3 font-label-sm text-label-sm text-on-surface bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full border border-surface-container shadow-sm">UserDB</span>
</div>
<!-- Node 4: Document Node -->
<div class="absolute top-[70%] left-[65%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer">
<div class="w-12 h-12 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.surface-container-highest),theme(colors.outline))] flex items-center justify-center text-surface-container-lowest shadow-[0_8px_24px_theme(colors.outline/0.2)] transition-transform duration-300 group-hover:scale-110">
<span class="material-symbols-outlined text-[18px]">menu_book</span>
</div>
<span class="mt-3 font-label-sm text-label-sm text-on-surface bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full border border-surface-container shadow-sm text-xs">api-v2.md</span>
</div>
<!-- Node 5: Note Node -->
<div class="absolute top-[65%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 group cursor-pointer">
<div class="w-10 h-10 rounded-full bg-[radial-gradient(circle_at_30%_30%,theme(colors.surface-container-highest),theme(colors.outline-variant))] flex items-center justify-center text-on-surface-variant shadow-[0_4px_16px_theme(colors.outline/0.1)] transition-transform duration-300 group-hover:scale-110">
<span class="material-symbols-outlined text-[16px]">sticky_note_2</span>
</div>
<span class="mt-2 font-label-sm text-label-sm text-on-surface-variant bg-surface-container-lowest/90 backdrop-blur-md px-2 py-0.5 rounded-full border border-surface-container shadow-sm text-[10px]">Refactor Plan</span>
</div>
<!-- Focus State Bottom Sheet (Simulated Active Selection) -->
<aside class="absolute bottom-[80px] md:bottom-gutter right-0 md:right-gutter w-full md:w-[420px] bg-surface-container-lowest/80 backdrop-blur-2xl border-t md:border border-outline-variant/30 rounded-t-[32px] md:rounded-[32px] shadow-[0_24px_80px_theme(colors.primary/0.08)] z-40 flex flex-col max-h-[618px] md:max-h-[751px] transition-transform duration-500 transform translate-y-0">
<!-- Sheet Header -->
<div class="p-stack-md flex flex-col gap-stack-sm border-b border-surface-container/50">
<div class="flex justify-between items-start">
<div class="flex items-center gap-3">
<div class="w-12 h-12 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary border border-primary/20">
<span class="material-symbols-outlined text-[24px]">code_blocks</span>
</div>
<div>
<h2 class="font-h3 text-h3 text-on-surface tracking-tight">CoreService.ts</h2>
<p class="font-mono-code text-mono-code text-on-surface-variant text-sm mt-0.5">src/services/core</p>
</div>
</div>
<button class="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-variant transition-colors">
<span class="material-symbols-outlined text-[18px]">close</span>
</button>
</div>
<!-- Metadata Chips -->
<div class="flex flex-wrap gap-2 mt-2">
<span class="bg-secondary-fixed/50 text-on-secondary-fixed px-3 py-1 rounded-full font-label-sm text-[12px] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">language</span> TypeScript
                    </span>
<span class="bg-surface-container text-on-surface px-3 py-1 rounded-full font-label-sm text-[12px] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">format_list_numbered</span> 1,204 Lines
                    </span>
<span class="bg-error-container/50 text-on-error-container px-3 py-1 rounded-full font-label-sm text-[12px] flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">warning</span> High Complexity
                    </span>
</div>
</div>
<!-- Sheet Content (AI Analysis) -->
<div class="p-stack-md overflow-y-auto flex-1 flex flex-col gap-stack-md custom-scrollbar">
<!-- AI Insight Card -->
<div class="bg-gradient-to-br from-primary-fixed/20 to-secondary-fixed/20 rounded-2xl p-4 border border-primary/10">
<h3 class="font-label-sm text-label-sm text-primary mb-2 flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">auto_awesome</span>
                        AI Insight
                    </h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm leading-relaxed">
                        This module orchestrates primary data flow between <span class="font-mono-code text-primary bg-primary-fixed/50 px-1 rounded">AuthModule</span> and <span class="font-mono-code text-tertiary bg-tertiary-fixed/50 px-1 rounded">UserDB</span>. Recent commits show a high frequency of changes around the token validation loop, suggesting potential technical debt or unstable requirements in that logic block.
                    </p>
</div>
<!-- Dependencies -->
<div>
<h4 class="font-label-sm text-label-sm text-on-surface mb-3">Direct Dependencies (3)</h4>
<div class="flex flex-col gap-2">
<div class="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-surface-variant">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-secondary text-[20px]">shield</span>
<span class="font-label-sm text-[13px] text-on-surface">AuthModule</span>
</div>
<span class="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
</div>
<div class="flex items-center justify-between p-3 rounded-xl bg-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-transparent hover:border-surface-variant">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-tertiary text-[20px]">database</span>
<span class="font-label-sm text-[13px] text-on-surface">UserDB</span>
</div>
<span class="material-symbols-outlined text-outline text-[16px]">chevron_right</span>
</div>
</div>
</div>
</div>
<!-- Sheet Actions -->
<div class="p-stack-md border-t border-surface-container/50 bg-surface-container-lowest flex gap-stack-sm shrink-0">
<button class="flex-1 bg-primary text-on-primary font-label-sm text-label-sm py-3.5 px-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_12px_theme(colors.primary/0.2)] flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open in Workspace
                </button>
</div>
</aside>
</main>
<!-- BottomNavBar (Mobile Only per Strict Rule) -->
<nav class="md:hidden bg-white dark:bg-slate-950 font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 fixed bottom-0 w-full rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,98,255,0.05)] z-50 flex justify-around items-center px-4 pb-8 pt-4">
<button class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl">
<span class="material-symbols-outlined text-[24px] mb-1">chat</span>
            Workspace
        </button>
<button class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl">
<span class="material-symbols-outlined text-[24px] mb-1">code</span>
            Explorer
        </button>
<!-- Active Tab -->
<button class="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl px-4 py-2 transform scale-110 duration-300 shadow-sm">
<span class="material-symbols-outlined text-[24px] mb-1" style="font-variation-settings: 'FILL' 1;">hub</span>
            Graph
        </button>
<button class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl">
<span class="material-symbols-outlined text-[24px] mb-1">sticky_note_2</span>
            Snippets
        </button>
<button class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-2xl">
<span class="material-symbols-outlined text-[24px] mb-1">menu_book</span>
            Docs
        </button>
</nav>
</body></html>

<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Notes &amp; Snippets Vault</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Space+Grotesk:wght@400;600&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "surface-container-lowest": "#ffffff",
                      "on-secondary-fixed": "#270058",
                      "inverse-surface": "#2e3034",
                      "surface-variant": "#e2e2e7",
                      "background": "#f9f9fe",
                      "on-tertiary-fixed-variant": "#753400",
                      "surface-bright": "#f9f9fe",
                      "error": "#ba1a1a",
                      "surface-container-high": "#e8e8ed",
                      "outline": "#737687",
                      "on-primary": "#ffffff",
                      "on-error-container": "#93000a",
                      "inverse-primary": "#b4c5ff",
                      "on-tertiary-container": "#fff1ea",
                      "inverse-on-surface": "#f0f0f5",
                      "surface-container-highest": "#e2e2e7",
                      "primary": "#004cca",
                      "on-secondary-fixed-variant": "#5d00c2",
                      "on-surface": "#1a1c1f",
                      "surface-container-low": "#f3f3f8",
                      "on-secondary-container": "#fdf6ff",
                      "surface-tint": "#0053da",
                      "tertiary-container": "#b45300",
                      "outline-variant": "#c2c6d9",
                      "on-tertiary-fixed": "#321200",
                      "on-primary-container": "#f3f3ff",
                      "error-container": "#ffdad6",
                      "primary-fixed": "#dbe1ff",
                      "secondary-fixed": "#ebdcff",
                      "tertiary-fixed": "#ffdbc9",
                      "on-background": "#1a1c1f",
                      "primary-fixed-dim": "#b4c5ff",
                      "surface-container": "#ededf2",
                      "on-primary-fixed": "#00174b",
                      "tertiary-fixed-dim": "#ffb68c",
                      "tertiary": "#8e4000",
                      "surface-dim": "#d9dade",
                      "on-primary-fixed-variant": "#003ea8",
                      "secondary-fixed-dim": "#d4bbff",
                      "on-error": "#ffffff",
                      "secondary": "#731be5",
                      "on-tertiary": "#ffffff",
                      "on-secondary": "#ffffff",
                      "surface": "#f9f9fe",
                      "on-surface-variant": "#424656",
                      "secondary-container": "#8d42ff",
                      "primary-container": "#0062ff"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "gutter": "24px",
                      "container-padding": "40px",
                      "stack-sm": "12px",
                      "unit": "8px",
                      "stack-lg": "48px",
                      "stack-md": "24px"
              },
              "fontFamily": {
                      "mono-code": [
                              "Space Grotesk"
                      ],
                      "body-lg": [
                              "Plus Jakarta Sans"
                      ],
                      "body-md": [
                              "Plus Jakarta Sans"
                      ],
                      "h2": [
                              "Plus Jakarta Sans"
                      ],
                      "h1": [
                              "Plus Jakarta Sans"
                      ],
                      "label-sm": [
                              "Plus Jakarta Sans"
                      ],
                      "h3": [
                              "Plus Jakarta Sans"
                      ]
              },
              "fontSize": {
                      "mono-code": [
                              "14px",
                              {
                                      "lineHeight": "1.5",
                                      "fontWeight": "400"
                              }
                      ],
                      "body-lg": [
                              "18px",
                              {
                                      "lineHeight": "1.6",
                                      "fontWeight": "400"
                              }
                      ],
                      "body-md": [
                              "16px",
                              {
                                      "lineHeight": "1.5",
                                      "fontWeight": "400"
                              }
                      ],
                      "h2": [
                              "32px",
                              {
                                      "lineHeight": "1.2",
                                      "fontWeight": "700"
                              }
                      ],
                      "h1": [
                              "40px",
                              {
                                      "lineHeight": "1.2",
                                      "fontWeight": "700"
                              }
                      ],
                      "label-sm": [
                              "14px",
                              {
                                      "lineHeight": "1.4",
                                      "letterSpacing": "0.02em",
                                      "fontWeight": "600"
                              }
                      ],
                      "h3": [
                              "24px",
                              {
                                      "lineHeight": "1.3",
                                      "fontWeight": "600"
                              }
                      ]
              }
      },
          },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        /* Custom Masonry support for varied sizing */
        .masonry-grid {
            column-count: 1;
            column-gap: 24px;
        }
        @media (min-width: 768px) {
            .masonry-grid {
                column-count: 2;
            }
        }
        @media (min-width: 1024px) {
            .masonry-grid {
                column-count: 3;
            }
        }
        .masonry-item {
            break-inside: avoid;
            margin-bottom: 24px;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col pb-24 md:pb-0">
<!-- TopAppBar -->
<header class="fixed top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none font-['Plus_Jakarta_Sans'] font-semibold tracking-tight">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto">
<!-- Brand -->
<div class="flex items-center gap-2 text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
<span>IBM Bob</span>
</div>
<!-- Desktop Navigation -->
<nav class="hidden md:flex items-center gap-8">
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 active:scale-95 flex items-center gap-2" href="#">
<span class="material-symbols-outlined">chat</span> Workspace
                </a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 active:scale-95 flex items-center gap-2" href="#">
<span class="material-symbols-outlined">code</span> Explorer
                </a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 active:scale-95 flex items-center gap-2" href="#">
<span class="material-symbols-outlined">hub</span> Graph
                </a>
<a class="text-blue-600 font-bold hover:scale-[1.02] transition-transform duration-200 active:scale-95 flex items-center gap-2" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">sticky_note_2</span> Snippets
                </a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200 active:scale-95 flex items-center gap-2" href="#">
<span class="material-symbols-outlined">menu_book</span> Docs
                </a>
</nav>
<!-- Trailing -->
<div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-label-sm text-label-sm">
                UB
            </div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="flex-grow pt-[104px] px-container-padding max-w-[1440px] mx-auto w-full">
<!-- Page Header -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-stack-lg gap-stack-md">
<div>
<h1 class="font-h1 text-h1 text-on-background mb-unit">Notes &amp; Vault</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
                    Your personal repository of code fragments, architectural thoughts, and essential links. Categorized with soft purples and oranges for intuitive recall.
                </p>
</div>
<button class="bg-primary text-on-primary font-label-sm text-label-sm px-8 py-4 rounded-full flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_24px_rgba(0,76,202,0.25)] border-2 border-transparent focus:border-primary-fixed">
<span class="material-symbols-outlined">add</span>
                Create Snippet
            </button>
</div>
<!-- Masonry Grid -->
<div class="masonry-grid">
<!-- Card 1: Rich Markdown Preview (Soft Purple Category) -->
<div class="masonry-item bg-surface-container-lowest rounded-[32px] border border-outline-variant p-stack-md hover:border-outline transition-colors group">
<div class="flex items-center justify-between mb-stack-sm">
<span class="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-4 py-1.5 rounded-full flex items-center gap-1.5">
<span class="material-symbols-outlined text-[16px]">book</span> React Architecture
                    </span>
<button class="text-outline-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">more_horiz</span>
</button>
</div>
<h3 class="font-h3 text-h3 text-on-surface mb-unit group-hover:text-primary transition-colors">State Management Strategy</h3>
<div class="bg-surface-container-low rounded-xl p-4 mt-stack-sm border border-outline-variant/50">
<pre class="font-mono-code text-mono-code text-on-surface-variant overflow-x-auto"><code>const useAppState = create((set) =&gt; ({
  user: null,
  theme: 'light',
  setUser: (user) =&gt; set({ user }),
  toggleTheme: () =&gt; set((state) =&gt; ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  }))
}))</code></pre>
</div>
<div class="flex items-center gap-4 mt-stack-md text-on-surface-variant font-label-sm text-label-sm">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span> 2h ago</span>
<a class="flex items-center gap-1 text-primary hover:underline" href="#"><span class="material-symbols-outlined text-[16px]">link</span> Live Link</a>
</div>
</div>
<!-- Card 2: Small Code Snippet (Soft Orange Category) -->
<div class="masonry-item bg-surface-container-lowest rounded-[32px] border border-outline-variant p-stack-md hover:border-outline transition-colors group">
<div class="flex items-center justify-between mb-stack-sm">
<span class="bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm px-4 py-1.5 rounded-full flex items-center gap-1.5">
<span class="material-symbols-outlined text-[16px]">terminal</span> Utility Functions
                    </span>
</div>
<h3 class="font-h3 text-h3 text-on-surface mb-unit group-hover:text-primary transition-colors">Debounce Hook</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-stack-sm">Essential for search inputs to prevent API spam.</p>
<div class="bg-inverse-surface text-inverse-on-surface rounded-xl p-4 border border-outline/20">
<pre class="font-mono-code text-mono-code overflow-x-auto"><code>function useDebounce(val, delay) {
  // Implementation details
}</code></pre>
</div>
</div>
<!-- Card 3: Image/Visual Note -->
<div class="masonry-item bg-surface-container-lowest rounded-[32px] border border-outline-variant p-stack-md hover:border-outline transition-colors group">
<div class="flex items-center justify-between mb-stack-sm">
<span class="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-4 py-1.5 rounded-full flex items-center gap-1.5">
<span class="material-symbols-outlined text-[16px]">design_services</span> UI Inspiration
                    </span>
</div>
<div class="w-full h-48 rounded-xl overflow-hidden mb-stack-sm relative bg-surface-variant">
<img alt="A sleek, modern workspace featuring a high-end monitor displaying abstract, generative digital art. The scene is illuminated by soft, natural light coming from an unseen window, highlighting the minimalist white desk surface and premium metallic accessories. The overall mood is focused, professional, and creatively inspiring, utilizing a bright light-mode aesthetic with subtle contrasting shadows." class="object-cover w-full h-full hover:scale-105 transition-transform duration-500" data-alt="A sleek, modern workspace featuring a high-end monitor displaying abstract, generative digital art. The scene is illuminated by soft, natural light coming from an unseen window, highlighting the minimalist white desk surface and premium metallic accessories. The overall mood is focused, professional, and creatively inspiring, utilizing a bright light-mode aesthetic with subtle contrasting shadows." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm_m0t2olD1IU5FLRwN6HEcKKQFdWPBol8p3nGx-5_BHRyEW5wZrdf204IveAl-MHXBnUDrPHDPrUMmyWWYko5rqElnhkiKfXoLcwsVImdLaW8HGi7pkdrShkUTX-r_nfqvloGBi2suzUdXWSFiaRgK-4vBZjWRe6vzRBFij5nCj8y8epnavMAQDuY9J4GLS1pyfMpQ5sRlHvTCZeX3_SNIKhIGTPttWxDDAgLFi5qQgQXQ_0ze7Xr84vrr-gBY3PCfBoIQou4DVBD"/>
</div>
<h3 class="font-h3 text-h3 text-on-surface mb-unit">Dashboard Layout Idea</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Using a fixed-fluid hybrid grid for the new analytics overview.</p>
</div>
<!-- Card 4: Quick Text Note -->
<div class="masonry-item bg-surface-container-highest rounded-[32px] border border-outline-variant p-stack-md relative overflow-hidden">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary-fixed rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
<h3 class="font-h3 text-h3 text-on-surface mb-unit relative z-10">Meeting Notes: API v3</h3>
<ul class="font-body-md text-body-md text-on-surface-variant list-disc pl-5 space-y-2 relative z-10">
<li>Deprecate legacy endpoints by Q3.</li>
<li>Move authentication to OAuth 2.0 flow.</li>
<li>Update Swagger documentation.</li>
</ul>
<div class="mt-stack-sm flex gap-2 relative z-10">
<span class="bg-white text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full shadow-sm border border-outline-variant">Backend</span>
<span class="bg-white text-on-surface font-label-sm text-label-sm px-3 py-1 rounded-full shadow-sm border border-outline-variant">Important</span>
</div>
</div>
<!-- Card 5: Link Style Note -->
<div class="masonry-item bg-surface-container-lowest rounded-[32px] border border-outline-variant p-stack-md hover:border-outline transition-colors group flex flex-col items-center text-center">
<div class="w-16 h-16 bg-secondary-fixed text-on-secondary-fixed rounded-full flex items-center justify-center mb-stack-sm group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined text-[32px]">link</span>
</div>
<h3 class="font-h3 text-h3 text-on-surface mb-unit group-hover:text-primary transition-colors">Tailwind CSS Documentation</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-stack-sm">Quick reference for utility classes and grid layouts.</p>
<a class="font-label-sm text-label-sm text-primary flex items-center gap-1 hover:underline" href="#">
                    Visit Resource <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</a>
</div>
</div>
</main>
<!-- BottomNavBar (Mobile Only) -->
<nav class="md:hidden bg-white dark:bg-slate-950 fixed bottom-0 w-full rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,98,255,0.05)] font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider z-50 flex justify-around items-center px-4 pb-8 pt-4">
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">chat</span>
<span>Workspace</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">code</span>
<span>Explorer</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">hub</span>
<span>Graph</span>
</a>
<a class="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl px-4 py-2 scale-110 duration-300 ease-spring" href="#">
<span class="material-symbols-outlined mb-1" style="font-variation-settings: 'FILL' 1;">sticky_note_2</span>
<span>Snippets</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined mb-1">menu_book</span>
<span>Docs</span>
</a>
</nav>
</body></html>

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Docs &amp; Resources - IBM Bob</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Space+Grotesk:wght@400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-container-lowest": "#ffffff",
                        "on-secondary-fixed": "#270058",
                        "inverse-surface": "#2e3034",
                        "surface-variant": "#e2e2e7",
                        "background": "#f9f9fe",
                        "on-tertiary-fixed-variant": "#753400",
                        "surface-bright": "#f9f9fe",
                        "error": "#ba1a1a",
                        "surface-container-high": "#e8e8ed",
                        "outline": "#737687",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "inverse-primary": "#b4c5ff",
                        "on-tertiary-container": "#fff1ea",
                        "inverse-on-surface": "#f0f0f5",
                        "surface-container-highest": "#e2e2e7",
                        "primary": "#004cca",
                        "on-secondary-fixed-variant": "#5d00c2",
                        "on-surface": "#1a1c1f",
                        "surface-container-low": "#f3f3f8",
                        "on-secondary-container": "#fdf6ff",
                        "surface-tint": "#0053da",
                        "tertiary-container": "#b45300",
                        "outline-variant": "#c2c6d9",
                        "on-tertiary-fixed": "#321200",
                        "on-primary-container": "#f3f3ff",
                        "error-container": "#ffdad6",
                        "primary-fixed": "#dbe1ff",
                        "secondary-fixed": "#ebdcff",
                        "tertiary-fixed": "#ffdbc9",
                        "on-background": "#1a1c1f",
                        "primary-fixed-dim": "#b4c5ff",
                        "surface-container": "#ededf2",
                        "on-primary-fixed": "#00174b",
                        "tertiary-fixed-dim": "#ffb68c",
                        "tertiary": "#8e4000",
                        "surface-dim": "#d9dade",
                        "on-primary-fixed-variant": "#003ea8",
                        "secondary-fixed-dim": "#d4bbff",
                        "on-error": "#ffffff",
                        "secondary": "#731be5",
                        "on-tertiary": "#ffffff",
                        "on-secondary": "#ffffff",
                        "surface": "#f9f9fe",
                        "on-surface-variant": "#424656",
                        "secondary-container": "#8d42ff",
                        "primary-container": "#0062ff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "gutter": "24px",
                        "container-padding": "40px",
                        "stack-sm": "12px",
                        "unit": "8px",
                        "stack-lg": "48px",
                        "stack-md": "24px"
                    },
                    "fontFamily": {
                        "mono-code": ["Space Grotesk"],
                        "body-lg": ["Plus Jakarta Sans"],
                        "body-md": ["Plus Jakarta Sans"],
                        "h2": ["Plus Jakarta Sans"],
                        "h1": ["Plus Jakarta Sans"],
                        "label-sm": ["Plus Jakarta Sans"],
                        "h3": ["Plus Jakarta Sans"]
                    },
                    "fontSize": {
                        "mono-code": ["14px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "body-md": ["16px", { "lineHeight": "1.5", "fontWeight": "400" }],
                        "h2": ["32px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "h1": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
                        "label-sm": ["14px", { "lineHeight": "1.4", "letterSpacing": "0.02em", "fontWeight": "600" }],
                        "h3": ["24px", { "lineHeight": "1.3", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        body {
            background-color: #f9f9fe; /* fallback if class isn't applied immediately */
        }
        /* Custom scrollbar for a cleaner look */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f9f9fe;
        }
        ::-webkit-scrollbar-thumb {
            background: #c2c6d9;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #737687;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background font-body-md min-h-screen pb-32 md:pb-0">
<!-- TopAppBar -->
<header class="hidden md:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-blue-600 dark:text-blue-400 font-['Plus_Jakarta_Sans'] font-semibold tracking-tight docked full-width top-0 z-50 shadow-sm dark:shadow-none sticky top-0">
<div class="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
<div class="flex items-center gap-2 hover:scale-[1.02] transition-transform duration-200 cursor-pointer active:scale-95 transition-all">
<span class="material-symbols-outlined text-3xl" data-icon="rocket_launch">rocket_launch</span>
<span class="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">IBM Bob</span>
</div>
<nav class="flex gap-8 items-center">
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200" href="#">Workspace</a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200" href="#">Explorer</a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200" href="#">Graph</a>
<a class="text-slate-500 dark:text-slate-400 hover:scale-[1.02] transition-transform duration-200" href="#">Snippets</a>
<a class="text-blue-600 font-bold hover:scale-[1.02] transition-transform duration-200 border-b-2 border-blue-600 pb-1" href="#">Docs</a>
</nav>
<div class="flex items-center gap-4 hover:scale-[1.02] transition-transform duration-200 cursor-pointer active:scale-95 transition-all">
<div class="w-10 h-10 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center overflow-hidden">
<img alt="User profile" class="w-full h-full object-cover" data-alt="A brightly lit, high-quality professional headshot of a person, set against a soft, clean white background. The lighting is flattering and modern, conveying an approachable yet highly professional Corporate Modern style. The image serves as an avatar in a premium digital workspace, embodying a human-centric approach." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDolzDl-jqSTb5qUdxGE2_YKUtpuQwYHlhQVjhWMqUA6nNZp6aEwDOb3lJi0pnWu7grrazrxPr7NikYjptgcVaIzKfChU5kJOKS71LGZc2CWgKd_aN97uPl1euHusBj2xWpc27nApZAMQFeDxF-hXtDAENtuYkzEmR1oI0PIpMgXCEitdXERjAAI8XFcKIugjifZf7MwkqOjJ9IgP9GTzcQk8lHCKXuLIQuMtNfdIwFFLSucPhWFdwp3D_cqyaBaC9_hML72w4S1EiW"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="max-w-[1440px] mx-auto px-container-padding py-stack-lg flex flex-col gap-stack-lg">
<!-- Hero / Search Section -->
<section class="flex flex-col items-center text-center gap-stack-md pt-12 pb-8">
<div class="flex flex-col gap-unit">
<h1 class="font-h1 text-h1 text-on-surface">Knowledge Base</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">Find contracts, architectural guides, and engineering wikis to accelerate your workflow.</p>
</div>
<!-- Glassmorphic Search Bar -->
<div class="w-full max-w-3xl relative mt-4">
<div class="absolute inset-0 bg-primary/5 blur-xl rounded-[32px]"></div>
<div class="relative bg-surface-container-lowest/80 backdrop-blur-xl border border-surface-variant rounded-[32px] p-2 flex items-center shadow-[0_8px_30px_rgba(0,76,202,0.08)] hover:shadow-[0_12px_40px_rgba(0,76,202,0.12)] transition-shadow duration-300">
<span class="material-symbols-outlined text-primary px-4 text-2xl" data-icon="search">search</span>
<input class="flex-1 bg-transparent border-none focus:ring-0 text-body-lg font-body-lg text-on-surface placeholder:text-outline outline-none h-14 w-full" placeholder="Ask AI or search docs..." type="text"/>
<button class="bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm px-6 h-12 rounded-[24px] flex items-center gap-2 transition-transform hover:scale-[1.02]">
<span class="material-symbols-outlined text-lg" data-icon="auto_awesome">auto_awesome</span>
                        Ask
                    </button>
</div>
<!-- AI Suggestions Pill -->
<div class="flex justify-center gap-unit mt-6 flex-wrap">
<span class="text-label-sm font-label-sm text-on-surface-variant py-2">Try:</span>
<button class="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-4 py-2 rounded-full hover:bg-secondary-fixed-dim transition-colors">How to setup local env?</button>
<button class="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors">Authentication API</button>
<button class="bg-surface-container-high text-on-surface font-label-sm text-label-sm px-4 py-2 rounded-full hover:bg-surface-container-highest transition-colors">GraphQL Schema</button>
</div>
</div>
</section>
<!-- Categories Bento Grid -->
<section class="flex flex-col gap-stack-md">
<h2 class="font-h3 text-h3 text-on-surface">Explore Resources</h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<!-- Contracts Card -->
<a class="group relative bg-surface-container-lowest rounded-[32px] border border-surface-variant p-8 flex flex-col gap-6 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,76,202,0.06)] transition-all duration-300 hover:-translate-y-1" href="#">
<div class="w-full h-48 bg-primary-fixed rounded-[24px] flex items-center justify-center relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
<img alt="Contracts 3D illustration" class="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-500" data-alt="A playful, high-quality 3D illustration of a futuristic, glowing digital contract document floating in a bright, airy space. The document is rendered in soft, smooth geometric shapes, accented with the Corporate Modern primary blue and crisp whites. The lighting is soft and ambient, casting a gentle, diffused shadow that perfectly aligns with a premium, optimistic developer tool aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkc5zAx8RrnYcob4Bkz2X3VnwMPvdJ0WAJ59yBPnPa3vO18DdlIr_xutMA5zuu2x0De18oPBBMMsqcskhqy4ZSWG0K_mfcpLdNQ4zXanlnDnXL7hlrDzQp4mk5mjP7mV4K_xQ0MMQry_nwON7DFabi8ozMjNLomA47hYo0tQrEWWqB0bV2JiMkPpP2nI36ZkcBebM-uhIATAeDkRzaWoWkE_RB4ysdRl6jqtSh8HsxKT10Gfp9Q7-hujR9pZnPehSOWCnLl3twqwHp"/>
<div class="absolute bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-sm text-primary">
<span class="material-symbols-outlined text-4xl" data-icon="description">description</span>
</div>
</div>
<div class="flex flex-col gap-2">
<h3 class="font-h3 text-h3 text-on-surface group-hover:text-primary transition-colors">Contracts</h3>
<p class="font-body-md text-body-md text-on-surface-variant">API definitions, schema structures, and data agreements.</p>
</div>
</a>
<!-- Guides Card -->
<a class="group relative bg-surface-container-lowest rounded-[32px] border border-surface-variant p-8 flex flex-col gap-6 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,76,202,0.06)] transition-all duration-300 hover:-translate-y-1" href="#">
<div class="w-full h-48 bg-tertiary-fixed rounded-[24px] flex items-center justify-center relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-tertiary/10 to-transparent"></div>
<img alt="Guides 3D illustration" class="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-500" data-alt="A high-quality, modern 3D illustration of a floating compass and map constructed from soft, playful geometric primitives. The elements use a bright, tertiary color palette featuring warm oranges and crisp whites, set against a highly illuminated, airy background. The rendering is polished and optimistic, embodying a premium Soft-Tech workspace vibe with clean, ambient depth." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEjYLTieage7ZI04V_-F_lOmL05j_JYIN_8ErFiC_yKHgJkFFfBfbK4kVXrM1HtvL5jldOaCR6PhJt_rL9arS9sWIHE3GZ8yYTCyJjVXQMCPLUHSPkAuX7PrB7m60wkEbBAhshaLhDdlfy1HfMhF_rb0094WO8oGYm934yJUo0kN6qw4VPKGPyYH2jW_qCf3A7QZyhTP6xQ5MZF1B-EaDnkmRvWfpTAgeg4KW5y94fybDUMdy523G4OeCNpqEPJCGEQocWqTFJo-rN"/>
<div class="absolute bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-sm text-tertiary">
<span class="material-symbols-outlined text-4xl" data-icon="explore">explore</span>
</div>
</div>
<div class="flex flex-col gap-2">
<h3 class="font-h3 text-h3 text-on-surface group-hover:text-primary transition-colors">Guides</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Step-by-step tutorials, architectural overviews, and best practices.</p>
</div>
</a>
<!-- Wikis Card -->
<a class="group relative bg-surface-container-lowest rounded-[32px] border border-surface-variant p-8 flex flex-col gap-6 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,76,202,0.06)] transition-all duration-300 hover:-translate-y-1" href="#">
<div class="w-full h-48 bg-secondary-fixed rounded-[24px] flex items-center justify-center relative overflow-hidden">
<div class="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent"></div>
<img alt="Wikis 3D illustration" class="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-500" data-alt="A polished 3D illustration of a collaborative digital workspace, featuring floating blocks of text and sticky notes arranged playfully in mid-air. The scene is brightly lit with a high-key light mode aesthetic, utilizing soft secondary purples and clean whites. The shapes are rounded and friendly, ensuring the visual perfectly fits a highly professional, optimistic, and human-centric corporate modern identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1AeCXNCFAq9sq0tT3yze08CpQh1dGiVWYh5YHL8WwSwWmC491nfRuGnzP02ner8F7_Ila9PGz3sESO8ansBnQbn_yqxUx3lnpstuZz0vBGrhf9Gh_RoOmzX_dLjGYk406E3b7-on8f__svDUaQTBVV6PbjoSdVQGWvoXur0EU7jqbT7aRVse2-qqVfuOKb4HfZJM_FDuuOTsGoM9sXf261ubZSsQf18z-1Jb4R4FZOOrfVfPDIobg0IP14RIY4ru4gLl_FS3RGhMF"/>
<div class="absolute bg-white/90 backdrop-blur-sm p-4 rounded-full shadow-sm text-secondary">
<span class="material-symbols-outlined text-4xl" data-icon="menu_book">menu_book</span>
</div>
</div>
<div class="flex flex-col gap-2">
<h3 class="font-h3 text-h3 text-on-surface group-hover:text-primary transition-colors">Wikis</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Living documentation, team notes, and historical decisions.</p>
</div>
</a>
</div>
</section>
<!-- Recently Viewed (Developer List Style) -->
<section class="flex flex-col gap-stack-sm bg-surface-container-lowest rounded-[32px] border border-surface-variant p-8">
<div class="flex justify-between items-center mb-4">
<h2 class="font-h3 text-h3 text-on-surface">Recently Viewed</h2>
<a class="font-label-sm text-label-sm text-primary hover:text-primary-container transition-colors" href="#">View All</a>
</div>
<div class="flex flex-col gap-2">
<!-- List Item 1 -->
<a class="flex items-center justify-between p-5 rounded-2xl hover:bg-surface-container-low transition-colors group" href="#">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-xl bg-primary-fixed/50 text-primary flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="description">description</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface group-hover:text-primary transition-colors">Authentication API v2</span>
<span class="font-mono-code text-mono-code text-on-surface-variant text-xs">/contracts/core/auth-v2.yaml</span>
</div>
</div>
<span class="font-body-md text-body-md text-outline-variant group-hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</span>
</a>
<!-- List Item 2 -->
<a class="flex items-center justify-between p-5 rounded-2xl hover:bg-surface-container-low transition-colors group" href="#">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-xl bg-tertiary-fixed/50 text-tertiary flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="explore">explore</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface group-hover:text-primary transition-colors">Setting up Local Redis</span>
<span class="font-mono-code text-mono-code text-on-surface-variant text-xs">/guides/backend/redis-setup</span>
</div>
</div>
<span class="font-body-md text-body-md text-outline-variant group-hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</span>
</a>
<!-- List Item 3 -->
<a class="flex items-center justify-between p-5 rounded-2xl hover:bg-surface-container-low transition-colors group" href="#">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-xl bg-secondary-fixed/50 text-secondary flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="menu_book">menu_book</span>
</div>
<div class="flex flex-col">
<span class="font-label-sm text-label-sm text-on-surface group-hover:text-primary transition-colors">Frontend Architecture Decisions</span>
<span class="font-mono-code text-mono-code text-on-surface-variant text-xs">/wikis/frontend/architecture-adr</span>
</div>
</div>
<span class="font-body-md text-body-md text-outline-variant group-hover:text-primary transition-colors">
<span class="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
</span>
</a>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="md:hidden bg-white dark:bg-slate-950 font-['Plus_Jakarta_Sans'] text-[11px] font-bold uppercase tracking-wider text-blue-600 fixed bottom-0 w-full rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,98,255,0.05)] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-4">
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined text-2xl mb-1" data-icon="chat">chat</span>
<span>Workspace</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined text-2xl mb-1" data-icon="code">code</span>
<span>Explorer</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined text-2xl mb-1" data-icon="hub">hub</span>
<span>Graph</span>
</a>
<a class="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined text-2xl mb-1" data-icon="sticky_note_2">sticky_note_2</span>
<span>Snippets</span>
</a>
<!-- Active Item -->
<a class="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-2xl px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined text-2xl mb-1" data-icon="menu_book" data-weight="fill" style="font-variation-settings: 'FILL' 1;">menu_book</span>
<span>Docs</span>
</a>
</nav>
</body></html>