// A free directory of places to source products, shown to every seller in the app.
// Researched October 2026 from supplier sites and 2026 roundups; prices change, so the app says to check each site.
// `connect` = the supplier Snapfront already plugs into (search, import and automatic orders).

export const UPDATED = "October 2026";

export const GROUPS = [
  { id: "general", name: "Big catalogs", blurb: "Huge choice at low prices. Most ship from China, so delivery is slower and US orders now pay import duty." },
  { id: "fast", name: "Fast US and EU shipping", blurb: "Suppliers with warehouses in the US or Europe: 2 to 7 day delivery, higher prices." },
  { id: "fashion", name: "Fashion and beauty", blurb: "Clothing, designer brands and ready-to-brand beauty products." },
  { id: "pod", name: "Print on demand", blurb: "Put your own designs on shirts, mugs, posters and more. Printed only when someone orders." },
  { id: "wholesale", name: "Wholesale and private label", blurb: "Buy in bulk or have products made with your brand. Better margins, but you hold stock." },
  { id: "tools", name: "Directories and tools", blurb: "Lists of vetted suppliers and apps that automate ordering." },
];

const S = (o) => o;
export const SUPPLIERS = [
  // Big catalogs
  S({ id: "cj", group: "general", name: "CJdropshipping", url: "https://cjdropshipping.com", sells: "Almost everything, plus sourcing, custom packaging and print on demand",
    shipsFrom: "China, with warehouses in the US, Germany and Thailand", cost: "Free account; you pay per order", delivery: "About 4 to 8 days to the US with CJ Packet", connect: "cj",
    tip: "Already built into Snapfront: search it in the Find tab and orders are placed for you." }),
  S({ id: "aliexpress", group: "general", name: "AliExpress", url: "https://www.aliexpress.com", sells: "The biggest consumer catalog: 100M+ products", shipsFrom: "Mostly China",
    cost: "Free; you pay product and shipping", delivery: "7 to 15 days on premium shipping, up to 45 days on standard", connect: "aliexpress",
    tip: "Connect your AliExpress account in Settings, then import from the Find tab." }),
  S({ id: "zendrop", group: "general", name: "Zendrop", url: "https://www.zendrop.com", sells: "Trending products, branding and custom packaging", shipsFrom: "China, plus a US warehouse program",
    cost: "Free plan; Pro about $49/month", delivery: "About 5 to 8 business days to the US" }),
  S({ id: "banggood", group: "general", name: "Banggood", url: "https://www.banggood.com", sells: "Electronics, gadgets, home and outdoor gear", shipsFrom: "China, with some EU and US warehouses",
    cost: "Free to use", delivery: "Faster on items in overseas warehouses" }),
  S({ id: "dhgate", group: "general", name: "DHgate", url: "https://www.dhgate.com", sells: "Low-minimum wholesale and niche products", shipsFrom: "China",
    cost: "Free; small order fees", delivery: "Varies by seller", tip: "Check each seller's ratings carefully before ordering." }),

  // Fast US / EU shipping
  S({ id: "spocket", group: "fast", name: "Spocket", url: "https://www.spocket.co", sells: "Curated products from US and EU suppliers: home, beauty, fashion, pets",
    shipsFrom: "US and Europe", cost: "Browse free; plans from $39.99/month", delivery: "About 2 to 7 days in the US and EU" }),
  S({ id: "syncee", group: "fast", name: "Syncee", url: "https://syncee.com", sells: "A marketplace of 12,000+ brands", shipsFrom: "US, Europe, Canada, Australia and more",
    cost: "Free plan (25 products); paid plans from about $29 to $39.99/month", delivery: "Mostly local to each region" }),
  S({ id: "modalyst", group: "fast", name: "Modalyst", url: "https://www.modalyst.co", sells: "Independent and designer brands", shipsFrom: "US and Europe",
    cost: "Free (25 products); $35 or $90/month; 5% fee per sale", delivery: "About 2 to 7 days" }),
  S({ id: "doba", group: "fast", name: "Doba", url: "https://www.doba.com", sells: "2M+ products from 200+ suppliers", shipsFrom: "Mostly US, some China",
    cost: "From about $29.99/month", delivery: "Varies by supplier" }),
  S({ id: "wholesale2b", group: "fast", name: "Wholesale2B", url: "https://www.wholesale2b.com", sells: "About 1M products from many suppliers", shipsFrom: "Mostly US",
    cost: "Free to browse; about $37.99/month plus 3% per order", delivery: "Varies by supplier" }),
  S({ id: "sunrise", group: "fast", name: "Sunrise Wholesale", url: "https://www.sunrisewholesalemerchandise.com", sells: "About 30,000 branded US products", shipsFrom: "US",
    cost: "$49/month after a 7-day trial", delivery: "US domestic" }),
  S({ id: "megagoods", group: "fast", name: "Megagoods", url: "https://www.megagoods.com", sells: "Electronics and video games", shipsFrom: "California, US",
    cost: "$14.99/month plus $1.50 per order", delivery: "1 to 2 business days in the US" }),
  S({ id: "bigbuy", group: "fast", name: "BigBuy", url: "https://www.bigbuy.eu", sells: "400,000+ products across most categories", shipsFrom: "Spain",
    cost: "From about €89/month plus setup", delivery: "Fast across Europe", tip: "Best if most of your buyers are in Europe." }),

  // Fashion and beauty
  S({ id: "trendsi", group: "fashion", name: "Trendsi", url: "https://www.trendsi.com", sells: "Women's fashion and beauty", shipsFrom: "US warehouse",
    cost: "Free; pay per order", delivery: "About 2 to 3 days in the US" }),
  S({ id: "brandsgateway", group: "fashion", name: "BrandsGateway", url: "https://brandsgateway.com", sells: "Designer and luxury fashion (100+ brands)", shipsFrom: "Germany, Sweden and Italy",
    cost: "From about €180/month", delivery: "About 3 days in the EU, 5 to 7 outside" }),
  S({ id: "bdroppy", group: "fashion", name: "BDroppy", url: "https://www.bdroppy.com", sells: "Italian luxury fashion (120+ brands)", shipsFrom: "Italy",
    cost: "€29 to €199/month", delivery: "2 to 8 business days" }),
  S({ id: "selfnamed", group: "fashion", name: "SelfNamed", url: "https://www.selfnamed.com", sells: "200+ ready-to-brand skincare and beauty products", shipsFrom: "EU and US (made in Latvia)",
    cost: "Free to start; Pro about €29/month", delivery: "From about 3 business days", tip: "Your own beauty brand without a factory." }),

  // Print on demand
  S({ id: "printful", group: "pod", name: "Printful", url: "https://www.printful.com", sells: "500+ printable products: apparel, mugs, posters, phone cases", shipsFrom: "US and Europe",
    cost: "Free; pay per order (optional $24.99/month for discounts)", delivery: "2 to 5 days to print, plus shipping", connect: "printful",
    tip: "Already built into Snapfront: connect it in Settings." }),
  S({ id: "printify", group: "pod", name: "Printify", url: "https://printify.com", sells: "Hundreds of products through a network of print shops", shipsFrom: "US, Europe and more",
    cost: "Free; Premium plan for lower product prices", delivery: "Depends on the print shop you pick" }),
  S({ id: "gelato", group: "pod", name: "Gelato", url: "https://www.gelato.com", sells: "Apparel, wall art, mugs, cards and photo books", shipsFrom: "Printed locally in 30+ countries",
    cost: "Free; Gelato+ about $24/month", delivery: "Fast, because it prints near the buyer" }),
  S({ id: "gooten", group: "pod", name: "Gooten", url: "https://www.gooten.com", sells: "Wide catalog of print-on-demand products", shipsFrom: "US and global partners", cost: "Free; pay per sale", delivery: "Varies by product" }),
  S({ id: "customcat", group: "pod", name: "CustomCat", url: "https://customcat.com", sells: "300+ apparel products", shipsFrom: "US", cost: "Free; Pro about $25/month", delivery: "US production" }),
  S({ id: "prodigi", group: "pod", name: "Prodigi", url: "https://www.prodigi.com", sells: "Art prints, canvases and gifts", shipsFrom: "Global network of print shops", cost: "Free; pay per order", delivery: "Printed close to the buyer" }),

  // Wholesale and private label
  S({ id: "alibaba", group: "wholesale", name: "Alibaba", url: "https://www.alibaba.com", sells: "Factories for bulk orders and private label", shipsFrom: "Mostly China",
    cost: "Free; pay per bulk order", delivery: "Air freight for samples, sea freight for bulk", tip: "Order samples first. Best once a product is proven." }),
  S({ id: "faire", group: "wholesale", name: "Faire", url: "https://www.faire.com", sells: "Wholesale from independent brands", shipsFrom: "US, Europe and more",
    cost: "Free for retailers; low order minimums", delivery: "Varies by brand", tip: "Stock unique brands that big marketplaces don't carry." }),
  S({ id: "globalsources", group: "wholesale", name: "Global Sources", url: "https://www.globalsources.com", sells: "Verified manufacturers", shipsFrom: "Mostly Asia", cost: "Terms set by each factory", delivery: "Set by the factory" }),

  // Directories and tools
  S({ id: "salehoo", group: "tools", name: "SaleHoo", url: "https://www.salehoo.com", sells: "Directory of vetted suppliers, plus research tools", shipsFrom: "US, UK, EU, Australia, Canada, China",
    cost: "From about $9/month", delivery: "Depends on the supplier", tip: "A directory: it lists suppliers but doesn't ship anything." }),
  S({ id: "worldwidebrands", group: "tools", name: "Worldwide Brands", url: "https://www.worldwidebrands.com", sells: "Directory of certified wholesale suppliers", shipsFrom: "Mostly US",
    cost: "$299 one time", delivery: "Depends on the supplier" }),
  S({ id: "autods", group: "tools", name: "AutoDS", url: "https://www.autods.com", sells: "Automates importing and ordering from AliExpress, Amazon, Walmart and 1,000+ suppliers", shipsFrom: "US, UK, EU, China and more",
    cost: "From about $26.90/month", delivery: "Depends on the supplier" }),
  S({ id: "dsers", group: "tools", name: "DSers", url: "https://www.dsers.com", sells: "Bulk ordering and automation for AliExpress", shipsFrom: "China (AliExpress)",
    cost: "Free plan; paid from about $19.90/month", delivery: "Same as AliExpress" }),
];

export const NOTE = "Since 2025, US orders shipped from China pay import duty instead of coming in duty-free. Suppliers with US or EU warehouses are often the better deal for US buyers now, even at a higher product price.";

export const directory = () => ({ updated: UPDATED, note: NOTE, groups: GROUPS.map((g) => ({ ...g, suppliers: SUPPLIERS.filter((s) => s.group === g.id) })) });
