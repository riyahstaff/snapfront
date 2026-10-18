"""Build the original idea catalog. Titles are editorial ideas, not copied seller listings."""
import json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
sources=[
('etsy-spring','Etsy Spring/Summer 2026 trend report','https://www.etsy.com/seller-handbook/article/1473931456647','2026-03-17','Marketplace search trends; not a digital-product sales ranking.'),
('etsy-fall','Etsy Fall/Winter 2026 trend report','https://www.etsy.com/seller-handbook/article/1521255894814','2026-10-14','Seasonal search and sales signals across Etsy, including physical goods. Digital applications are editorial inferences.'),
('shopify','Shopify: digital products to sell in 2026','https://www.shopify.com/blog/digital-products','2026-06-12','Product-format overview, not audited item-level sales.'),
('canva','Canva Design Trends 2026','https://www.canva.com/newsroom/news/design-trends-2026/','2025-12-10','Design-use and creator trend signals for 2026; not purchase counts.'),
('creative','Creative Market marketplace','https://creativemarket.com/',None,'Current popular design-asset collections; no comparable 2026 unit-sales totals.'),
('notion','Notion template collections','https://www.notion.com/templates/collections',None,'Curated template categories; free and paid resources coexist.'),
('notion-budget','Notion: Top 10 Paid Budget Templates','https://www.notion.com/templates/collections/top-10-paid-budgets-templates-in-notion',None,'Paid-template collection; editorial placement is not a sales ranking.'),
('tpt-search','TPT search opportunities, April–June','https://sellerblog.teacherspayteachers.com/top-tpt-searches/','2026-04-10','Published in 2026 using April–June 2025 search opportunity data; not 2026 sales.'),
('tpt-survey','TPT educator survey 2026','https://sellerblog.teacherspayteachers.com/tpt-survey-whats-top-of-mind-for-educators-in-2026/','2026-04-01','Educator needs survey; demand context rather than sales data.'),
('wedding','Etsy wedding digital planners','https://www.etsy.com/market/wedding_digital_planner',None,'Paid listings and review activity establish category presence. Reviews are not sales counts.'),
('budget','Etsy digital budget spreadsheets','https://www.etsy.com/market/digital_budget_spreadsheet',None,'Current paid spreadsheet listings; no item-level year-to-date sales.'),
('meals','Etsy digital meal planners','https://www.etsy.com/market/meal_planner_digital',None,'Paid meal, recipe, shopping and pantry planning listings; review counts are not unit sales.'),
('fitness','Etsy digital fitness planners','https://www.etsy.com/market/digital_fitness_planners',None,'Current fitness-tracker listings; organizational products rather than medical guidance.'),
('travel','Etsy digital travel planners','https://www.etsy.com/market/digital_planner_travel_planner',None,'Paid travel planning category observed in October 2026.'),
('career','Etsy resume templates','https://www.etsy.com/market/resume_templates',None,'Current career-template listings; no hiring-outcome or sales-volume claims.'),
('craft','Etsy digital sewing patterns','https://www.etsy.com/market/digital_patterns_for_sewing',None,'Paid original pattern and tutorial category. Pattern ideas require maker testing.'),
('party','Etsy printable baby-shower games','https://www.etsy.com/market/games_for_baby_showers',None,'Paid printable-event game category; adjacent event ideas are editorial extensions.'),
('pet','Etsy pet planners','https://www.etsy.com/market/pet_planner',None,'Paid pet organizer listings; no veterinary claims.'),
('rental','Etsy digital vacation-rental welcome books','https://www.etsy.com/market/digital_airbnb_welcome_book_template',None,'Paid welcome-book and host-checklist category.'),
('art','Etsy custom coloring pages','https://www.etsy.com/market/custom_coloring_pages',None,'Current printable illustration category; original artwork must be created.'),
('envato','Envato Creative Trends 2026','https://elements.envato.com/lp/creative-trends-2026/',None,'Creative direction and asset-use trends; not per-product sales.'),
('teachable','Teachable product and creator overview','https://www.teachable.com/press',None,'Courses and downloadable learning formats; no public 500-item sales table.')]
S=[dict(id=i,title=t,url=u,published=p,note=n,checked='2026-10-18') for i,t,u,p,n in sources]
categories=[];ideas=[]
def group(slug,name,format,audience,sections,refs,rows,external=None):
    lines=[r.strip() for r in rows.strip().splitlines() if r.strip()]
    assert len(lines)==20,(slug,len(lines))
    categories.append(dict(id=slug,name=name,source_ids=refs.split(),evidence='Category evidence + editorial niche ideas',audience=audience))
    for n,row in enumerate(lines,1):
        title,*over=row.split('|')
        f=over[0] if over else format
        idea=dict(id=f'{slug}-{n:02}',title=title,category_id=slug,format=f,audience=audience,outline=sections.split('|'),source_ids=refs.split(),delivery='External asset + PDF companion' if external else 'PDF download',external_requirement=external,brief=f'Create an original {title.lower()} for {audience}. Make it specific, practical, and easy for a beginner to use. Include instructions, useful examples, and reusable pages. Replace all draft prompts before selling.')
        ideas.append(idea)
group('planning','Planning & productivity','planner','people organizing work and everyday life','Set priorities|Plan the week|Track progress|Review and reset','shopify notion', '''
Undated weekly life planner
Daily time-blocking planner
90-day goal-setting workbook
Habit-building tracker pack
Student assignment planner
Freelancer weekly focus planner
Shift-worker schedule planner
Small-step task planner
Annual vision and milestones planner
Reading journal and book tracker
Project kickoff workbook
Family command-center planner
Morning and evening routine cards|checklist
Digital decluttering checklist|checklist
Meeting notes and action planner
Content batching planner
Study-session focus planner
Side-project accountability journal
Monthly reset checklist|checklist
Work-from-home routine planner
''')
group('money','Finance & money organization','planner','households learning to organize their money','Income and expenses|Plan spending|Track a goal|Monthly review','budget notion-budget', '''
Paycheck budget workbook
Zero-based budget printable
Debt-payoff progress tracker
Savings challenge card pack|checklist
Sinking-fund planner
Couples money-meeting workbook
Freelancer irregular-income planner
Teen first-paycheck workbook|guide
Subscription spending audit|checklist
Cash-envelope label and tracker set
Emergency-fund progress journal
Holiday gift budget planner
New-home savings planner
Grocery spending tracker
No-spend month workbook
College living-cost planner
Retirement document organizer|checklist
Personal net-worth worksheet pack
Money habits reflection journal
Annual financial paperwork checklist|checklist
''')
group('cooking','Cooking & meal planning','planner','home cooks and busy households','Plan a menu|Shop and prep|Record recipes|Review what worked','meals shopify', '''
Weekly meal planner with grocery lists
Family recipe collection book
Freezer-meal preparation workbook|guide
Budget dinner recipe ebook|guide
One-pan weeknight recipe guide|guide
Beginner baking practice journal
Pantry and freezer inventory sheets
Lunchbox planning pack
Cooking-for-one meal planner
Batch-cooking weekend checklist|checklist
Vegetarian meal-prep recipe book|guide
Family potluck recipe organizer
Air-fryer beginner recipe guide|guide
Sourdough baking log
Seasonal produce cooking guide|guide
Dinner-party menu planner
Food-waste reduction workbook|checklist
Grocery price comparison notebook
Meal rotation recipe cards|checklist
Family holiday cookbook template|guide
''')
group('wellness','Fitness & wellness journals','planner','adults tracking personal routines and wellbeing','Choose a personal goal|Record daily activity|Notice patterns|Reflect and adapt','fitness shopify', '''
Workout log and progress journal
Walking habit tracker
Home-exercise planning journal
Stretching routine record book
Sleep routine journal
Hydration habit tracker
Mindful breathing reflection journal
Gratitude and mood journal
Fitness goal-setting workbook
Rest-day reflection planner
Yoga practice journal
Running training log
Gym session planning sheets
Self-care weekly planner
Screen-time awareness journal
Outdoor activity challenge tracker
Meal and movement journal
Personal wellness appointment organizer
Desk-break reminder cards|checklist
Wellbeing check-in prompt deck|hooks
''')
group('lifestyle','Lifestyle & personal growth','guide','adults building intentional everyday habits','Reflect on your starting point|Try a practical exercise|Make a personal plan|Review your progress','shopify notion canva', '''
Simple-living starter workbook
Personal values discovery journal|planner
Confidence-building reflection prompts|hooks
Digital boundaries workbook
Personal goal vision-board workbook
Friendship connection planner|planner
Weekly reflection question cards|hooks
Reading habit starter guide
Intentional shopping workbook
Capsule wardrobe planning guide
Creative hobby discovery workbook
Personal style moodboard workbook
Life transition planning journal|planner
Date-night idea cards|hooks
Family conversation prompt deck|hooks
Seasonal bucket-list planner|planner
Personal achievement journal|planner
Volunteer activity planner|planner
Learning-a-new-skill workbook
30-day creativity challenge pack|hooks
''')
group('business','Small business & freelancing','checklist','solo business owners and freelancers','Define the offer|Prepare the workflow|Serve the customer|Review results','shopify creative', '''
Freelancer client onboarding kit
Small business launch checklist
Service pricing worksheet pack|planner
Client discovery questionnaire
Project scope planning workbook|planner
Brand positioning workbook|guide
Customer interview question bank|hooks
Business goal quarterly planner|planner
Standard operating procedure workbook|guide
Virtual assistant onboarding guide|guide
Customer feedback survey templates
Client offboarding checklist
Business expense document organizer|planner
Business idea validation workbook|guide
Service menu planning template
Consultation preparation pack
Vendor comparison workbook|planner
Online shop launch checklist
Customer service response workbook|hooks
Weekly business review planner|planner
''')
group('marketing','Marketing & content creation','hooks','creators and small businesses promoting original products','Understand the audience|Plan the message|Create the content|Review engagement','creative canva shopify', '''
30-day social content prompt pack
Product launch email writing prompts
Short-video hook workbook
Brand storytelling prompt cards
Newsletter topic planning kit
Instagram caption idea bank
Pinterest content planning workbook|planner
Podcast episode planning journal|planner
UGC script development workbook
Product photography shot checklist|checklist
Lead-magnet planning guide|guide
Social content calendar printable|planner
Customer testimonial request templates
Community engagement question deck
Seasonal campaign planning workbook|planner
Behind-the-scenes content prompts
Small business FAQ content kit
Blog outline planning workbook|guide
Webinar presentation planning guide|guide
Marketing experiment tracker|planner
''')
group('career','Careers & professional development','guide','job seekers and professionals developing their careers','Identify strengths|Prepare your materials|Practice and apply|Track next steps','career shopify', '''
Resume writing workbook
Interview answer practice workbook
Career change planning guide
Job application tracking journal|planner
Professional portfolio planning workbook
Networking conversation prompt cards|hooks
New-manager first-90-days planner|planner
Performance review preparation pack|checklist
Salary conversation preparation workbook
Remote interview setup checklist|checklist
Graduate career launch workbook
Professional bio writing guide
Work accomplishment tracker|planner
Return-to-work planning journal|planner
LinkedIn profile writing workbook
Freelance pitch development guide
Internship application planner|planner
Public speaking practice journal|planner
Workplace communication exercise pack
Professional development learning planner|planner
''')
group('wedding','Weddings & celebrations','planner','couples planning their wedding','Define the celebration|Organize people and details|Build the timeline|Check the final details','wedding etsy-spring', '''
Wedding planning binder
Wedding budget worksheet pack
Wedding guest-list organizer
Wedding day timeline workbook
Venue comparison planner
Wedding vendor contact organizer
Bridal shower planning kit
Wedding seating-plan workbook
Wedding vows writing prompts|hooks
Wedding photography shot checklist|checklist
Destination wedding preparation checklist|checklist
Micro-wedding planning guide|guide
Wedding weekend itinerary planner
Wedding gift and thank-you tracker
Engagement party planner
DIY wedding decor checklist|checklist
Wedding rehearsal planning kit
Wedding emergency-kit checklist|checklist
Wedding keepsake journal
Newlywed household planning workbook
''')
group('events','Party games & event printables','checklist','hosts organizing memorable gatherings','Prepare the event|Set up the activity|Explain the rules|Record memories','party etsy-fall', '''
Baby shower bingo printable pack
Baby animal matching game
Bridal shower trivia cards
Birthday party scavenger hunt
Family reunion conversation cards|hooks
Dinner-party icebreaker deck|hooks
Retirement party memory cards
Graduation party advice cards
Holiday gift-exchange game kit
Housewarming party planner|planner
Kids birthday activity booklet
Anniversary celebration journal|planner
Neighborhood block-party organizer|planner
Virtual team social game pack
Book club discussion cards|hooks
Picnic games printable bundle
New-year reflection party cards|hooks
Friendsgiving host checklist
Baby shower wishes and predictions cards
Event guestbook prompt pages|hooks
''')
group('family','Parenting & family organization','planner','parents and caregivers organizing family life','Set up family information|Plan routines|Track important details|Review together','party pet shopify', '''
New-parent household organizer
Baby memory journal
Family chore chart pack|checklist
School morning routine cards|checklist
After-school activity planner
Family screen-time agreement workbook|guide
Kids allowance tracker
Family emergency contact organizer
Babysitter information packet|checklist
Summer activity planner for families
Sibling shared-space planning workbook
Family travel packing checklist|checklist
Children’s reading reward chart
Birthday memory interview journal
Family meal-duty rotation planner
School-year keepsake workbook
Teen independence skills checklist|checklist
Family meeting agenda planner
Caregiver handoff notebook
Grandparent memory question journal|hooks
''')
group('education','Education & classroom resources','checklist','educators and families supporting children’s learning','Introduce the skill|Practice with examples|Try an activity|Check understanding','tpt-search tpt-survey', '''
Early handwriting practice sheets
Letter-sound matching activities
Multiplication practice card pack
Fractions visual worksheet set
Reading comprehension question cards|hooks
Science observation journal|planner
Classroom morning routine cards
Homeschool weekly lesson planner|planner
Student reading log
Vocabulary practice workbook|guide
Creative writing prompt cards|hooks
Counting-money practice sheets
Telling-time practice worksheets
Classroom kindness activity pack
Teacher lesson reflection journal|planner
End-of-year student memory book|planner
Summer learning activity calendar|planner
Study skills printable workbook|guide
School project planning sheets|planner
Nature observation scavenger hunt
''')
group('tutorials','Tutorials & skill-building','guide','beginners learning a practical creative skill','Gather what you need|Follow a worked example|Practice independently|Troubleshoot and improve','shopify teachable craft', '''
Smartphone photography beginner guide
Canva layout fundamentals workbook
Beginner hand-lettering practice guide
Spreadsheet basics practice workbook
Podcast planning beginner guide
Video editing workflow workbook
Beginner watercolor technique guide
Digital journaling setup guide
Home sewing basics workbook
Crochet stitch practice guide
Embroidery sampler instruction book
Beginner calligraphy worksheet book
Product styling photography guide
Online workshop planning guide
Public speaking mini-course workbook
Basic graphic design practice guide
Creative writing mini-course workbook
Beginner music practice workbook
Language-learning study workbook
Personal website planning guide
''')
group('travel','Travel & experiences','planner','travelers planning organized, flexible trips','Choose your priorities|Plan logistics|Track daily experiences|Keep your memories','travel shopify', '''
Vacation itinerary planner
Road-trip route and stop planner
Carry-on packing checklist|checklist
Family vacation budget workbook
Solo travel planning journal
Weekend getaway planner
Cruise preparation checklist|checklist
Camping trip organizer
Travel memory journal
Group trip coordination workbook
Accessible travel research checklist|checklist
Travel document organizer
City-break activity planner
National park visit journal
Business travel preparation pack|checklist
International trip research workbook
Language phrase practice travel journal
Honeymoon itinerary workbook
Digital nomad trip planner
Travel photography shot planner
''')
group('home','Home & household systems','checklist','households organizing and maintaining their living spaces','Survey your space|Make a practical plan|Complete each task|Schedule the next review','shopify etsy-spring notion', '''
Room-by-room decluttering workbook|guide
Weekly home cleaning checklist
Moving-house planning binder|planner
Home maintenance calendar|planner
Household inventory workbook|planner
Laundry routine planner|planner
Seasonal home reset checklist
Garden planting journal|planner
Indoor plant care log|planner
Home renovation planning workbook|guide
Room makeover moodboard workbook|guide
Household paperwork organizer
Garage organization checklist
Pantry organization label plan|planner
Family command-center setup guide|guide
First-apartment essentials checklist
Home project budget notebook|planner
Sustainable household habits tracker|planner
Home appliance information binder|planner
Guest-room preparation checklist
''')
group('property','Real estate & hosting','checklist','property hosts and real-estate professionals organizing information','Gather property details|Prepare the experience|Manage the handoff|Record follow-up','rental creative shopify', '''
Vacation-rental welcome guide|guide
Short-term rental cleaning checklist
Guest check-in instruction booklet|guide
Property showing preparation checklist
Homebuyer viewing comparison workbook|planner
Rental property maintenance log|planner
Vacation-rental restocking tracker|planner
Real-estate open-house planner|planner
Host local recommendation booklet|guide
House-sitter instruction binder|guide
Vacation property photo shot list
Guest feedback survey pack
Property renovation idea workbook|guide
Home staging preparation guide|guide
Moving-in room condition checklist
Rental expense record workbook|planner
Host seasonal preparation planner|planner
Property vendor contact organizer|planner
Vacation checkout instruction cards
Real-estate client onboarding workbook|guide
''')
group('faith','Faith & reflection','planner','readers building a personal faith and reflection practice','Choose a theme|Read and take notes|Reflect personally|Plan an action','shopify notion', '''
Scripture study journal
Prayer request and reflection journal
Daily gratitude reflection cards|hooks
Bible reading schedule planner
Sermon notes workbook
Family scripture discussion cards|hooks
Faith milestone memory journal
Scripture comparison study worksheet|checklist
Spiritual goals reflection workbook|guide
Community service planning journal
Faith group meeting planner
Scripture memorization tracker
Religious holiday preparation planner
Prayer retreat planning workbook
Faith-inspired original quote prints|quotes
Weekly reflection prompt deck|hooks
Children’s scripture activity workbook|guide
Study group question planner
Acts of kindness challenge cards|checklist
Personal testimony writing workbook|guide
''')
group('pets','Pets & animal care organization','planner','pet owners keeping everyday care information organized','Record your pet’s details|Plan daily care|Track observations|Prepare for handoffs','pet shopify', '''
Pet care information binder
Puppy routine tracker
Cat feeding and play journal
Pet sitter instruction pack|checklist
Pet appointment record book
Dog walking log
Pet grooming schedule planner
New-pet shopping checklist|checklist
Pet travel preparation checklist|checklist
Multi-pet household organizer
Pet adoption memory journal
Pet expense tracker
Pet enrichment activity planner
Dog training observation journal
Senior pet care notes journal
Pet emergency contact organizer
Pet photo memory scrapbook planner
Aquarium maintenance log
Horse care record notebook
Small-pet daily care checklist|checklist
''')
group('crafts','Crafts & maker patterns','guide','makers learning and documenting original projects','List materials|Explain construction|Add diagrams and practice|Test the finished project','craft etsy-fall', '''
Beginner crochet coaster pattern
Simple tote bag sewing pattern
Embroidery sampler pattern book
Knitted scarf pattern workbook
Crochet basket pattern guide
Reusable fabric gift-wrap tutorial
Hand-sewn felt ornament pattern
Simple apron sewing pattern
Patchwork cushion pattern guide
Macrame plant hanger tutorial
Paper flower construction guide
Handmade greeting-card tutorial pack
Beginner quilt block pattern book
Crochet granny-square project guide
Fabric zipper pouch pattern
Visible-mending practice workbook
Needle-felting beginner project guide
Bead jewelry design workbook
Craft project inventory journal|planner
Handmade gift project planner|planner
''')
group('printable-art','Printable art & creative journals','quotes','buyers seeking original decorative prints and creative activities','Choose an original theme|Create the artwork or lettering|Arrange the collection|Check print quality','art creative canva etsy-spring', '''
Original kitchen quote print set
Minimalist motivational wall prints
Nursery affirmation print collection
Reading nook quote posters
Home-office encouragement prints
Botanical sketch coloring pages|checklist
Geometric coloring pattern pack|checklist
Family name artwork design workbook|guide
Pet portrait coloring-page collection|checklist
Seasonal gratitude printable art
Travel memory scrapbook pages|planner
Nature journaling sketch prompts|hooks
Original kindness classroom posters
Mindful doodling prompt book|hooks
Creative collage journal pages|planner
Wedding memory scrapbook pages|planner
Hand-lettered affirmation card set
Habit milestone celebration cards
Printable creative vision-board kit|planner
Book-lover illustration journal|planner
''')
group('spreadsheets','Spreadsheets & calculators','planner','buyers who want reusable, tested spreadsheet tools','Define inputs and outputs|Design tabs and formulas|Add realistic test cases|Write setup instructions','budget meals fitness notion-budget', '''
Monthly household budget spreadsheet
Paycheck allocation spreadsheet
Debt repayment scenario spreadsheet
Savings goals spreadsheet
Small business expense spreadsheet
Freelance invoice tracker spreadsheet
Project pricing calculator spreadsheet
Inventory reorder spreadsheet
Wedding budget spreadsheet
Meal planner and grocery spreadsheet
Rental income record spreadsheet
Social content calendar spreadsheet
Job application tracker spreadsheet
Subscription audit spreadsheet
Craft material cost spreadsheet
Event ticket revenue spreadsheet
Trip expense sharing spreadsheet
Workout log spreadsheet
Annual cash-flow planning spreadsheet
Product profit margin spreadsheet
''', 'Create and test the working XLSX or Google Sheets template separately. This editor starts its PDF design brief and instructions; it does not generate working formulas or a spreadsheet file.')
group('notion-systems','Notion & digital workspaces','guide','Notion users seeking organized, reusable workspaces','Define the workflow|Plan databases and views|Build and test the workspace|Write duplication instructions','notion notion-budget', '''
Notion personal life dashboard
Notion student assignment hub
Notion freelancer client workspace
Notion content calendar system
Notion reading library tracker
Notion personal finance dashboard
Notion meal planning workspace
Notion habit and goal dashboard
Notion project management workspace
Notion small business CRM
Notion travel planning dashboard
Notion job search workspace
Notion course notes system
Notion wedding planning workspace
Notion home management hub
Notion podcast production workspace
Notion creator sponsorship tracker
Notion digital product launch hub
Notion research notes library
Notion quarterly review dashboard
''', 'Build and test the duplicable Notion template separately. Add the template access instructions only after it works; this draft is the PDF companion, not a live Notion workspace.')
group('editable-templates','Editable branding & social templates','guide','businesses and creators needing customizable visual assets','Define the audience and dimensions|Build the visual system|Create editable variations|Test customization and delivery','creative canva envato career', '''
Editable brand identity kit
Instagram carousel template collection
Pinterest pin template bundle
Small business media kit template
UGC creator portfolio template
Professional resume template bundle
Business proposal slide template
Workshop presentation slide deck
Email newsletter layout templates
Podcast episode artwork templates
Product launch social template kit
Real-estate listing social templates
Restaurant menu layout templates
Wedding invitation template suite
Event flyer template collection
Digital workbook layout templates
Client welcome packet templates
Online course slide templates
Creator rate-card templates
Printable product mockup templates
''', 'Build the editable source files or template links in the appropriate design tool. Snapfront starts the PDF design brief and companion guide; a rendered PDF is not a Canva, PowerPoint, or other editable template.')
group('media-assets','Photography, video & audio assets','guide','creators who need original, licensed production assets','Specify the asset and use case|Produce original files|Test quality and compatibility|Document licensing and installation','creative envato shopify', '''
Warm portrait Lightroom preset pack
Food photography Lightroom preset pack
Real-estate interior photo preset pack
Black-and-white street photo presets
Product photography backdrop collection
Vertical video title animation pack
Podcast intro music pack
Original ambient study music bundle
Video transition sound-effect pack
Nature ambience recording collection
Social video caption style pack
Original stock lifestyle photo bundle
Small business stock product photos
Film-look video color LUT pack
Original illustration sticker pack
Hand-drawn icon collection
Botanical digital paper collection
Streamer overlay graphics kit
Original texture overlay pack
Custom handwritten font project
''', 'Produce and test the actual media, preset, font, or design files separately with rights you own. This draft is a PDF production brief and user guide, not the working media asset.')
group('tech','AI workflows & technology resources','guide','creators and small teams learning practical technology workflows','Define a real use case|Build an original example|Test outputs and failure cases|Write setup and usage guidance','shopify envato teachable', '''
AI content planning prompt workbook
Customer support prompt library
Small business automation planning kit
Freelancer proposal prompt pack|hooks
AI product description prompt workbook
Research verification checklist pack|checklist
No-code website launch workbook
Email automation workflow guide
Online course production checklist|checklist
Personal knowledge-base setup guide
Podcast repurposing prompt pack|hooks
Data organization beginner workbook
Small business cybersecurity checklist|checklist
Digital file backup planning workbook
Accessibility review checklist|checklist
Website testing checklist bundle|checklist
AI image art-direction workbook
Spreadsheet automation tutorial workbook
Creator tool evaluation workbook
Digital product quality-assurance checklist|checklist
''')
assert len(ideas)==500
assert len({i['title'].casefold() for i in ideas})==500
catalog=dict(version=1,as_of='2026-10-18',title='500 digital product ideas — 2026 research',methodology='Original niche ideas informed by marketplace categories, paid listings, and 2026 trend reports. This is not a verified top-500 sales ranking. Sources support categories, not sales claims for each idea. Review counts are not sales counts. The year is still in progress.',sources=S,categories=categories,ideas=ideas)
(ROOT/'server/src/digital-ideas-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
lines=['# 500 digital product ideas — 2026 research','',catalog['methodology'],'','Researched October 18, 2026. No seller files, designs, reviews or branded listings were copied. No sales volumes or income projections are invented. 420 PDF-oriented ideas and 80 ideas requiring an external working asset. The latter start a clearly labeled PDF companion, not a simulated working asset.','', '## Sources and interpretation','']
for s in S: lines.append(f"- **{s['id']}** — [{s['title']}]({s['url']}): {s['note']} Published: {s['published'] or 'undated/live collection'}; checked {s['checked']}.")
for c in categories:
    lines+=['',f"## {c['name']}",'',f"Category evidence: {', '.join(c['source_ids'])}. The 20 specific concepts below are Snapfront editorial ideas.",'']
    for i in [x for x in ideas if x['category_id']==c['id']]:lines.append(f"- **{i['id']} — {i['title']}** ({i['delivery']})")
(ROOT/'docs/digital-product-ideas-2026.md').write_text('\n'.join(lines)+'\n')
print(f'Wrote {len(ideas)} ideas in {len(categories)} categories from {len(S)} sources')
