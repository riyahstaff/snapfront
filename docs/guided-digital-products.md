# Guided digital product creation

Digital products now starts with 25 illustrated topics and their 500 existing ideas. Selecting an idea opens a genre-styled private draft, followed by Make it yours, Check your product, and Finish your download. The final step attaches the reviewed PDF; listing and publication remain separate explicit actions.

Mira can propose changes to a whole product or one page. Image requests use the existing durable image-assistant jobs, seller allowance, ownership checks, and idempotency keys. Completed images are placed in their intended pages. Apply proposals explicitly; manual controls and undo remain available.

## Validation

- Mobile: 90 tests passed; lint and TypeScript passed.
- Server: 34 targeted tests passed across digital ideas, designs, image assistant, API, and renderers. The five digital-ideas tests passed again after final artwork replacement.
- Production Expo web export committed under server/webapp, because Render's build only installs server dependencies.
- Chromium browser walkthrough at desktop and mobile widths: all 25 cards, idea selection, whole-product proposal, two image placements, saved preview, PDF export and attachment, and retained private draft. No page errors.
- The browser walkthrough used a local test seller and simulated AI/provider responses; it exercised the real local save, rendering, export, and attachment endpoints without spending provider credits. A production model generation was not tested.

## New artwork

Eight generated editorial photographs were converted to 1280px WebP in `server/assets/themes/digital-topic-*-hero.webp`. Existing topic art is retained where it matches the subject; wedding and event artwork was also added for this change. These assets are starter imagery; Mira's personalized images use the seller's normal image generation service.

Shared generation direction: Photorealistic editorial photograph for a digital-product topic card. Landscape 16:9. Premium modern styling, clear subject at thumbnail size, visually distinct composition. No people, readable words, brand logos, or watermark.

- **planning** (`digital-topic-planning-hero.webp`): An open weekly planner with clear unlettered calendar grids, a pen, colored sticky notes and a tablet showing a simple unlettered task-board layout. Organized bright desk. Planning and productivity are unmistakable.
- **finance** (`digital-topic-finance-hero.webp`): A household budgeting workspace: calculator, neat cash envelopes, a few coins, a budget worksheet with unlettered ruled columns, and a tablet showing simple spreadsheet cells and a modest bar chart. Finance and money organization are unmistakable. No luxury goods.
- **education** (`digital-topic-education-hero.webp`): A bright teacher's preparation table with colorful learning flashcards showing simple shapes and numbers, an open lesson-planning notebook, pencils, classroom books and a small globe. Education and classroom resources are unmistakable.
- **tutorials** (`digital-topic-tutorials-hero.webp`): A laptop showing a video lesson with a large play icon and a small view of hands demonstrating a craft, beside a notebook containing a simple illustrated three-step diagram, headphones and a pencil. Learning from a tutorial is unmistakable.
- **marketing** (`digital-topic-marketing-hero.webp`): A content creator's desk with a phone on a small tripod, laptop displaying a tidy grid of colorful social-post designs without text, physical brand color swatches and content-planning cards. Digital marketing and editable social templates are unmistakable.
- **lifestyle** (`digital-topic-lifestyle-hero.webp`): A warm inviting personal-growth journaling scene: open reflection journal with unlettered lines and a gentle habit grid, a pen, tea, small flowers and a soft linen cushion beside a bright window. The focus is on journaling and wellbeing, not furniture.
- **faith** (`digital-topic-faith-hero.webp`): An intimate faith and reflection journaling table: an open well-loved Bible with indistinct unreadable print, a plain prayer journal with ruled pages, a pen, soft candle and small olive branch, warm natural morning light. No religious symbols or people.
- **tech** (`digital-topic-tech-hero.webp`): A modern approachable AI workflow workstation: laptop screen showing an unlettered connected workflow diagram of rounded cards with simple robot, document and message icons, a compact keyboard, notebook and small plant. Blue accents with natural daylight. No code or illegible text.

