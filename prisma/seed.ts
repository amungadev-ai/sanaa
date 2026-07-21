import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ============================================
  // 1. Create ADMIN user
  // ============================================
  const hashedPassword = await hash("Admin@2024!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "admin@sanaathrumylens.co.ke",
      name: "Admin Sanaa",
      username: "admin_sanaa",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
      bio: "Administrator for Sanaa Through My Lens blog CMS",
    },
  });

  console.log(`✅ Created ADMIN: ${admin.email}`);

  // Create additional demo users
  const editor = await prisma.user.upsert({
    where: { email: "editor@sanaathrumylens.co.ke" },
    update: {},
    create: {
      email: "editor@sanaathrumylens.co.ke",
      name: "Wanjiku Editor",
      username: "wanjiku_editor",
      password: await hash("Editor@2024!", 12),
      role: "EDITOR",
      isActive: true,
      emailVerified: new Date(),
      bio: "Senior Editor at Sanaa Through My Lens",
    },
  });

  const reader = await prisma.user.upsert({
    where: { email: "reader@example.com" },
    update: {},
    create: {
      email: "reader@example.com",
      name: "Blog Reader",
      username: "blog_reader",
      password: await hash("Reader@2024!", 12),
      role: "READER",
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Created demo users: editor, reader");

  // ============================================
  // 2. Create Categories
  // ============================================
  const categoriesData = [
    { name: "Music", slug: "music", description: "Kenyan and East African music scene — from gengetone to benga, Afro-fusion and beyond", color: "#E11D48", icon: "music", sortOrder: 1 },
    { name: "Film & Video", slug: "film-video", description: "Kenyan cinema, documentary, short films and the growing video content scene", color: "#7C3AED", icon: "film", sortOrder: 2 },
    { name: "Books & Literature", slug: "books-literature", description: "Kenyan literature, poetry, publishing and the storytelling tradition", color: "#0891B2", icon: "book-open", sortOrder: 3 },
    { name: "Visual Arts", slug: "visual-arts", description: "Contemporary and traditional visual arts — painting, sculpture, photography, digital art", color: "#059669", icon: "palette", sortOrder: 4 },
    { name: "Theatre & Performance", slug: "theatre-performance", description: "Stage arts, spoken word, dance and performance art in Kenya and East Africa", color: "#D97706", icon: "drama", sortOrder: 5 },
    { name: "Opinion & Commentary", slug: "opinion-commentary", description: "Critical perspectives on arts, culture and creative industry policy", color: "#DC2626", icon: "message-square", sortOrder: 6 },
    { name: "Events", slug: "events", description: "Art exhibitions, festivals, concerts, launches and cultural happenings", color: "#2563EB", icon: "calendar", sortOrder: 7 },
    { name: "Interviews & Features", slug: "interviews-features", description: "In-depth conversations with artists, curators, and cultural figures", color: "#9333EA", icon: "mic", sortOrder: 8 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.name] = created.id;
  }

  console.log(`✅ Created ${categoriesData.length} categories`);

  // ============================================
  // 3. Create Tags
  // ============================================
  const tagsData = [
    "Nairobi", "Kenya", "East Africa", "Afrobeats", "Gengetone",
    "Benga", "Contemporary Art", "Photography", "Poetry", "Festival",
    "Kampala", "Dar es Salaam", "Mombasa", "Culture", "Heritage",
    "Emerging Artists", "Review", "Analysis", "Trending", "New Release",
  ];

  const tags: Record<string, string> = {};
  for (const tagName of tagsData) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const created = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name: tagName, slug },
    });
    tags[tagName] = created.id;
  }

  console.log(`✅ Created ${tagsData.length} tags`);

  // ============================================
  // 4. Create Sample Posts
  // ============================================
  const postsData = [
    {
      title: "The Rise of Gengetone: How Nairobi's Youth Are Redefining Kenyan Music",
      slug: "rise-of-gengetone-nairobi-youth-music",
      excerpt: "From the clubs of Eastlands to global streaming platforms, gengetone has become the voice of a generation.",
      content: `<h2>The Sound of a Generation</h2>
<p>Gengetone emerged from Nairobi's informal settlements around 2018, blending sheng slang, catchy hooks, and pulsating beats. What started as underground party music has become Kenya's most recognizable cultural export.</p>

<h2>From Clubs to Charts</h2>
<p>Artists like Sailors, Ethic, and Boondocks Gang pioneered the genre with tracks that dominated airwaves and social media. Their raw energy and unapologetic celebration of urban youth culture resonated far beyond Nairobi.</p>

<blockquote>"Gengetone is more than music — it's a cultural movement. It tells our stories in our language." — DJ Proposition</blockquote>

<h2>The Global Stage</h2>
<p>With collaborations featuring international artists and millions of YouTube views, gengetone has proven that local sounds can achieve global reach. The genre continues to evolve, incorporating Afrobeat influences and electronic production.</p>

<h2>What's Next</h2>
<p>As the industry matures, gengetone artists are exploring more sophisticated themes while maintaining the genre's infectious energy. The question isn't whether gengetone will endure — it's how it will transform next.</p>`,
      status: "PUBLISHED",
      isFeatured: true,
      allowComments: true,
      readingTime: 6,
      views: 1247,
      publishedAt: new Date("2024-12-15"),
      categoryNames: ["Music"],
      tagNames: ["Nairobi", "Kenya", "Gengetone", "Trending"],
      authorId: author.id,
    },
    {
      title: "Wanuri Kahiu's 'Pumzi' and the Future of African Sci-Fi Film",
      slug: "wanuri-kahiu-pumzi-african-sci-fi-film",
      excerpt: "How a Kenyan filmmaker's short film pioneered Afrofuturism in cinema and inspired a new wave of African speculative storytelling.",
      content: `<h2>A Vision of the Future</h2>
<p>Wanuri Kahiu's 2009 short film "Pumzi" (Swahili for "breath") presented a post-apocalyptic Africa where water is the most precious resource. Made on a modest budget, it became a landmark of African science fiction cinema.</p>

<h2>Afrofuturism on Screen</h2>
<p>Before Black Panther made Afrofuturism a household term, Kahiu was already imagining African futures rooted in both technology and tradition. "Pumzi" showed that African filmmakers could create compelling speculative fiction without Hollywood budgets.</p>

<blockquote>"I wanted to show that Africa has always been a place of innovation and imagination." — Wanuri Kahiu</blockquote>

<h2>The Ripple Effect</h2>
<p>Kahiu's work, including the acclaimed "Rafiki," has inspired a generation of East African filmmakers to explore genres beyond social realism. From Nairobi's emerging VFX studios to streaming platforms seeking African content, the infrastructure for African sci-fi is finally catching up to the vision.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 5,
      views: 834,
      publishedAt: new Date("2024-11-28"),
      categoryNames: ["Film & Video"],
      tagNames: ["Kenya", "Review", "Emerging Artists"],
      authorId: author.id,
    },
    {
      title: "Inside Nairobi's Thriving Contemporary Art Galleries",
      slug: "nairobi-contemporary-art-galleries",
      excerpt: "A guide to the spaces shaping Kenya's visual art landscape — from established institutions to experimental collectives.",
      content: `<h2>The Gallery Scene</h2>
<p>Nairobi's contemporary art scene has experienced remarkable growth over the past decade. Galleries like Circle Art Agency, One Off Contemporary Art Gallery, and the Nairobi Contemporary Art Institute (NCAI) have created platforms for both established and emerging artists.</p>

<h2>Must-Visit Spaces</h2>
<p>From the established corridors of Rahimtulla Museum to the experimental walls of Kuona Artists Collective, Nairobi offers a diverse gallery landscape. Each space has its own curatorial voice and community focus.</p>

<h2>Beyond the Walls</h2>
<p>Street art and public installations are also gaining recognition, with murals transforming neighborhoods like Kibera and downtown Nairobi into open-air galleries. The boundary between gallery and street continues to blur.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 7,
      views: 562,
      publishedAt: new Date("2024-12-01"),
      categoryNames: ["Visual Arts"],
      tagNames: ["Nairobi", "Kenya", "Contemporary Art", "Photography"],
      authorId: editor.id,
    },
    {
      title: "Draft: The State of Publishing in East Africa",
      slug: "state-of-publishing-east-africa",
      excerpt: "An in-depth look at the challenges and opportunities facing East African publishers in the digital age.",
      content: `<h2>Draft Content</h2><p>This is a draft article exploring the East African publishing landscape, from traditional print to digital platforms...</p>`,
      status: "DRAFT",
      isFeatured: false,
      allowComments: true,
      readingTime: 8,
      views: 0,
      categoryNames: ["Books & Literature"],
      tagNames: ["East Africa", "Kenya", "Culture"],
      authorId: author.id,
    },
    {
      title: "Pending: Lamu Cultural Festival — Preserving Swahili Heritage",
      slug: "lamu-cultural-festival-swahili-heritage",
      excerpt: "Celebrating twenty years of the Lamu Cultural Festival and its role in preserving Swahili traditions.",
      content: `<h2>A Celebration of Culture</h2><p>The Lamu Cultural Festival brings together communities to celebrate Swahili heritage through donkey races, dhow sailing, poetry, and traditional dance...</p>`,
      status: "PENDING_REVIEW",
      isFeatured: false,
      allowComments: true,
      readingTime: 5,
      views: 0,
      categoryNames: ["Events", "Heritage"],
      tagNames: ["Kenya", "Mombasa", "Heritage", "Festival"],
      authorId: author.id,
    },
    // Additional published posts for richer homepage
    {
      title: "Why Kenyan Literature Needs Its Own Canon",
      slug: "kenyan-literature-needs-its-own-canon",
      excerpt: "The case for establishing a distinctly Kenyan literary tradition — one that centres our languages, our histories, and our ways of seeing the world.",
      content: `<h2>Beyond the Colonial Library</h2>
<p>For decades, Kenyan literature has been measured against Western standards. Ngugi wa Thiong'o argued for decolonising the mind, yet our schools still teach a curriculum that privileges the English canon. A genuinely Kenyan literary tradition would centre oral storytelling, Swahili and vernacular literature, and the experiences of ordinary Kenyans.</p>

<h2>Building the Canon</h2>
<p>The works of Meja Mwangi, Grace Ogot, and Muthoni Likimani form a foundation, but the contemporary scene demands expansion. Writers like Yvonne Owuor, Mukoma wa Ngugi, and Natasha Kimani are pushing boundaries in fiction, while poets like Njeri Wangari and Ngartia Bryan are redefining what Kenyan verse can be.</p>

<blockquote>"We don't need permission to name our own classics. The stories our grandmothers told are literature enough." — Ngartia Bryan</blockquote>

<h2>The Role of Publishers</h2>
<p>Kenyatta University's Twaweza Communications, Storymoja, and Jalada Collective are creating spaces for Kenyan voices. But distribution remains a challenge — most Kenyan books never reach readers beyond Nairobi's bookshops.</p>`,
      status: "PUBLISHED",
      isFeatured: true,
      allowComments: true,
      readingTime: 7,
      views: 923,
      publishedAt: new Date("2026-05-01"),
      categoryNames: ["Books & Literature", "Opinion & Commentary"],
      tagNames: ["Kenya", "Culture", "Analysis"],
      authorId: editor.id,
    },
    {
      title: "The Mysterious Disappearance of Benga: Kenya's Original Pop Sound",
      slug: "disappearance-of-benga-kenya-original-pop",
      excerpt: "Once the soundtrack of Kenya, benga music has faded from the mainstream. What happened, and can it make a comeback?",
      content: `<h2>The Golden Age</h2>
<p>In the 1970s and 80s, benga was Kenya. From Daniel Owino Misiani and Shirati Jazz to D.O. Misiani and Victoria Kings, benga dominated the airwaves, bars, and weddings across the country. Its distinctive finger-picking guitar style and upbeat rhythms were unmistakably Kenyan.</p>

<h2>The Decline</h2>
<p>The rise of kapuka, genge, and later gengetone pushed benga to the margins. Radio stations stopped playing it, younger artists stopped making it, and the legends who pioneered it grew old without successors. But the story is more complex than simple generational replacement.</p>

<h2>Signs of Revival</h2>
<p>A new generation of musicians is rediscovering benga. Artists like Blinky Bill and Ondatropik are sampling benga guitar lines in electronic productions. In Kisumu, young bands are forming to play classic benga with a modern twist. The sound isn't dead — it's evolving.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 6,
      views: 678,
      publishedAt: new Date("2026-04-20"),
      categoryNames: ["Music"],
      tagNames: ["Kenya", "Benga", "Nairobi", "Culture"],
      authorId: author.id,
    },
    {
      title: "Afrofuturism in East African Visual Art: Beyond Wakanda",
      slug: "afrofuturism-east-african-visual-art",
      excerpt: "How East African artists are creating Afrofuturist visions that go beyond Hollywood stereotypes and imagine truly African futures.",
      content: `<h2>More Than a Trend</h2>
<p>Afrofuturism has become a buzzword since Black Panther, but East African artists have been imagining African futures for decades. From Wangechi Mutu's surreal collages to Cyrus Kabiru's wearable sculpture, the region has a distinct take on what African futures look like.</p>

<h2>The Nairobi Scene</h2>
<p>Galleries like NCAI and Circle Art are showcasing artists whose work engages with technology, identity, and speculation. Michael Soi's satirical paintings critique power structures, while Bulinya Martyn's digital art imagines Kenyan cities reimagined through a futuristic lens.</p>

<h2>Beyond the Aesthetic</h2>
<p>True Afrofuturism isn't just about aesthetics — it's about agency. These artists aren't waiting for permission to imagine the future; they're building it. Their work asks: What if Africa had never been colonised? What will Nairobi look like in 2099?</p>`,
      status: "PUBLISHED",
      isFeatured: true,
      allowComments: true,
      readingTime: 5,
      views: 1102,
      publishedAt: new Date("2026-05-10"),
      categoryNames: ["Visual Arts", "Interviews & Features"],
      tagNames: ["Nairobi", "Kenya", "Contemporary Art", "Emerging Artists"],
      authorId: editor.id,
    },
    {
      title: "Theatre in Nairobi Is Having a Moment — But Can It Last?",
      slug: "theatre-in-nairobi-having-a-moment",
      excerpt: "From immersive performances to sold-out runs, Nairobi's theatre scene is thriving. But structural challenges threaten its sustainability.",
      content: `<h2>A New Energy</h2>
<p>Something is shifting in Nairobi's theatre scene. Productions like "Too Early for Birds" are selling out weeks in advance. The Kenya National Theatre, long dormant, is hosting back-to-back shows. Young companies like Heartstrings Kenya and Patchwork Ensemble are pushing boundaries with immersive and site-specific work.</p>

<h2>The Business Challenge</h2>
<p>But enthusiasm alone can't sustain an industry. Most theatre companies operate without permanent venues. Ticket prices remain low, sponsorship is scarce, and actors struggle to make a living. The gap between creative ambition and financial reality remains the sector's biggest challenge.</p>

<blockquote>"We need to stop treating theatre as a hobby and start treating it as an industry." — Keith Pearson, Heartstrings Kenya</blockquote>

<h2>What Needs to Change</h2>
<p>Government support, corporate sponsorship, and audience development are all essential. But most importantly, Kenya needs a theatre infrastructure — venues, training programmes, and distribution networks — that matches the talent of its artists.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 6,
      views: 445,
      publishedAt: new Date("2026-04-05"),
      categoryNames: ["Theatre & Performance", "Opinion & Commentary"],
      tagNames: ["Nairobi", "Kenya", "Culture", "Analysis"],
      authorId: author.id,
    },
    {
      title: "Interview: Magunga Williams on Building Africa's Biggest Literary Blog",
      slug: "interview-magunga-williams-literary-blog",
      excerpt: "The founder of The Magunga Review talks about creating a platform for African stories, the state of literary criticism, and why African readers deserve better.",
      content: `<h2>From Side Project to Institution</h2>
<p>What started as a personal blog has become one of Africa's most influential literary platforms. Magunga Williams built The Magunga Review from scratch, creating a space where African books, writers, and ideas take centre stage.</p>

<h2>On Literary Criticism</h2>
<p>"African literature has a criticism problem," Williams says. "We celebrate publication but rarely engage with the quality of the work. We need honest, rigorous criticism that respects both the writer and the reader."</p>

<h2>The Future of African Publishing</h2>
<p>Williams is optimistic about the future. "Digital platforms are democratising both writing and reading. A writer in Kisumu can now reach a reader in Lagos without going through London or New York. That changes everything."</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 8,
      views: 389,
      publishedAt: new Date("2026-03-15"),
      categoryNames: ["Interviews & Features", "Books & Literature"],
      tagNames: ["Kenya", "East Africa", "Culture", "Review"],
      authorId: editor.id,
    },
    {
      title: "Documentary Renaissance: How Kenyan Filmmakers Are Telling Their Own Stories",
      slug: "documentary-renaissance-kenyan-filmmakers",
      excerpt: "A new wave of Kenyan documentarians is challenging the outsider gaze and creating intimate, authentic portraits of Kenyan life.",
      content: `<h2>Taking Back the Narrative</h2>
<p>For decades, documentaries about Kenya were made by foreigners — often focusing on wildlife, poverty, or conflict. A new generation of Kenyan filmmakers is changing that, telling stories about everyday life, innovation, and culture from an insider's perspective.</p>

<h2>The Tools Are Accessible</h2>
<p>Smartphone cameras, affordable editing software, and streaming platforms have democratised documentary filmmaking. Young Kenyans in their twenties are producing work that would have required a broadcast budget just a decade ago.</p>

<h2>Notable Work</h2>
<p>From Toni Kamau's "I Am Samuel" to Sam Soko's "Softie," Kenyan documentaries are winning international festival awards while speaking directly to local audiences. The challenge now is building a sustainable distribution ecosystem within Kenya itself.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 6,
      views: 567,
      publishedAt: new Date("2026-04-28"),
      categoryNames: ["Film & Video"],
      tagNames: ["Kenya", "Nairobi", "Review", "Emerging Artists"],
      authorId: author.id,
    },
    {
      title: "Why Kenya's Creative Economy Policy Matters More Than Ever",
      slug: "kenya-creative-economy-policy-matters",
      excerpt: "The government's creative economy framework could transform the arts sector — if implementation matches ambition.",
      content: `<h2>A Landmark Policy</h2>
<p>Kenya's creative economy policy represents the most comprehensive government framework for the arts sector in the country's history. It promises tax incentives, intellectual property protections, and funding mechanisms that could fundamentally change how creative businesses operate.</p>

<h2>The Gap Between Policy and Practice</h2>
<p>However, Kenya has a long history of well-crafted policies that gather dust. The creative sector has heard promises before. What makes this different is the growing economic evidence: the creative economy contributes significantly to GDP and employs millions of young Kenyans.</p>

<h2>What Artists Need</h2>
<p>Affordable studio space, accessible funding, streamlined licensing, and genuine consultation. The policy addresses all of these on paper. The real test will be whether the Ministry of Culture can translate words into tangible support for artists, musicians, filmmakers, and writers across the country.</p>`,
      status: "PUBLISHED",
      isFeatured: false,
      allowComments: true,
      readingTime: 7,
      views: 312,
      publishedAt: new Date("2026-02-20"),
      categoryNames: ["Opinion & Commentary"],
      tagNames: ["Kenya", "Culture", "Analysis"],
      authorId: editor.id,
    },
  ];

  for (const postData of postsData) {
    const { categoryNames, tagNames, ...rest } = postData;

    const existingPost = await prisma.post.findUnique({ where: { slug: rest.slug } });
    if (existingPost) continue;

    // Get category IDs for this post
    const postCategoryIds = categoryNames
      .map((name: string) => categories[name])
      .filter(Boolean);

    const postTagIds = tagNames
      .map((name: string) => tags[name])
      .filter(Boolean);

    const post = await prisma.post.create({
      data: {
        ...rest,
        publishedAt: rest.publishedAt || undefined,
        categories: {
          create: postCategoryIds.map((categoryId: string) => ({ categoryId })),
        },
        tags: {
          create: postTagIds.map((tagId: string) => ({ tagId })),
        },
      },
    });

    // Create initial revision
    await prisma.postRevision.create({
      data: {
        postId: post.id,
        title: post.title,
        content: post.content,
        changeNote: "Initial version",
        version: 1,
        authorId: postData.authorId,
      },
    });
  }

  console.log(`✅ Created ${postsData.length} sample posts`);

  // ============================================
  // 5. Create Sample Events
  // ============================================
  const eventsData = [
    {
      title: "Nairobi International Jazz Festival 2026",
      slug: "nairobi-international-jazz-festival-2026",
      description: "The annual Nairobi International Jazz Festival returns with a stellar lineup of local and international jazz artists. Experience world-class performances in the heart of Kenya's capital. This year features Grammy-nominated artists alongside Kenya's finest jazz talent, with workshops, masterclasses, and after-parties across three stages.",
      excerpt: "Annual jazz festival featuring local and international artists",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/nairobi-jazz-festival-6a0b64d0ee748.webp",
      eventType: "IN_PERSON",
      venue: "Carnivore Grounds",
      location: "Langata Road",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2026-06-20T14:00:00"),
      endDate: new Date("2026-06-22T22:00:00"),
      timezone: "Africa/Nairobi",
      websiteUrl: "https://nairobijazzfestival.com",
      ticketUrl: "https://nairobijazzfestival.com/tickets",
      isFree: false,
      price: "KES 3,000 - 15,000",
      isFeatured: true,
      isActive: true,
      categoryIds: [categories["Music"]],
    },
    {
      title: "East African Film Festival 2026",
      slug: "east-african-film-festival-2026",
      description: "A celebration of East African cinema featuring screenings, workshops, and networking opportunities for filmmakers across the region. Over 50 films from Kenya, Uganda, Tanzania, Rwanda, and Burundi will be screened alongside panel discussions with award-winning directors and hands-on filmmaking workshops.",
      excerpt: "Showcasing the best of East African cinema",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/east-african-film-festival-6a0b64c9b8aaa.webp",
      eventType: "HYBRID",
      venue: "Alliance Française",
      location: "Monrovia Street",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2026-07-10T09:00:00"),
      endDate: new Date("2026-07-14T21:00:00"),
      timezone: "Africa/Nairobi",
      isFree: false,
      price: "KES 500 - 2,000",
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Film & Video"]],
    },
    {
      title: "Kuona Artists Open Studio 2026",
      slug: "kuona-artists-open-studio-2026",
      description: "Visit Kuona Artists Collective for their annual open studio event. Meet artists, see works in progress, and purchase original art directly from creators. Over 40 artists open their studios for intimate conversations about their creative process, with live demonstrations and a pop-up art shop.",
      excerpt: "Meet artists and explore their creative spaces",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/kuona-open-studio-6a0b64cd8772a.webp",
      eventType: "IN_PERSON",
      venue: "Kuona Artists Collective",
      location: "Dennis Pritt Road",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2026-06-07T10:00:00"),
      endDate: new Date("2026-06-08T17:00:00"),
      timezone: "Africa/Nairobi",
      isFree: true,
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Visual Arts"]],
    },
    {
      title: "Lamu Cultural Festival 2026",
      slug: "lamu-cultural-festival-2026",
      description: "Celebrating over two decades of preserving Swahili heritage, the Lamu Cultural Festival brings together communities for donkey races, dhow sailing competitions, traditional henna painting, poetry recitals, and Swahili cuisine. Set against the backdrop of the UNESCO World Heritage Site, this festival is a living museum of coastal culture.",
      excerpt: "Celebrating Swahili heritage on the Kenyan coast",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/lamu-cultural-festival-6a0b64cf58a08.webp",
      eventType: "IN_PERSON",
      venue: "Lamu Old Town",
      location: "Lamu Island",
      city: "Lamu",
      country: "Kenya",
      startDate: new Date("2026-08-14T09:00:00"),
      endDate: new Date("2026-08-17T21:00:00"),
      timezone: "Africa/Nairobi",
      isFree: true,
      isFeatured: true,
      isActive: true,
      categoryIds: [categories["Theatre & Performance"]],
    },
    {
      title: "Nairobi Poetry Slam Championship",
      slug: "nairobi-poetry-slam-championship-2026",
      description: "The biggest spoken word event in East Africa returns for its annual championship. Watch 24 of the region's most powerful voices compete in three rounds of electrifying performance poetry. Featuring international guest poets, open mic sessions, and a workshop on the craft of spoken word.",
      excerpt: "East Africa's premier spoken word competition",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/nairobi-poetry-slam-6a0b64d2bfc18.webp",
      eventType: "IN_PERSON",
      venue: "Kenya National Theatre",
      location: "Harry Thuku Road",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2026-07-25T18:00:00"),
      endDate: new Date("2026-07-26T22:00:00"),
      timezone: "Africa/Nairobi",
      isFree: false,
      price: "KES 1,000",
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Books & Literature"]],
    },
    {
      title: "Kenya Theatre Festival 2026",
      slug: "kenya-theatre-festival-2026",
      description: "A week-long celebration of Kenyan and East African theatre featuring 15 productions across multiple venues. From experimental one-person shows to large-scale musicals, the festival showcases the breadth and depth of contemporary East African stage artistry. Includes playwriting workshops and director's labs.",
      excerpt: "A week of outstanding East African stage performances",
      coverImage: "https://cdn.sanaathrumylens.co.ke/uploads/2026/05/misc/kenya-theatre-festival-6a0b64cbb7764.webp",
      eventType: "IN_PERSON",
      venue: "Kenya Cultural Centre",
      location: "Uhlenia Gardens",
      city: "Nairobi",
      country: "Kenya",
      startDate: new Date("2026-09-07T14:00:00"),
      endDate: new Date("2026-09-13T21:00:00"),
      timezone: "Africa/Nairobi",
      isFree: false,
      price: "KES 800 - 3,000",
      isFeatured: false,
      isActive: true,
      categoryIds: [categories["Theatre & Performance"]],
    },
  ];

  for (const eventData of eventsData) {
    const { categoryIds: eventCatIds, ...rest } = eventData;

    const existingEvent = await prisma.event.findUnique({ where: { slug: rest.slug } });
    if (existingEvent) {
      // Update existing event with new data (coverImage, future dates)
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: {
          title: rest.title,
          description: rest.description,
          excerpt: rest.excerpt,
          coverImage: rest.coverImage,
          venue: rest.venue,
          location: rest.location,
          city: rest.city,
          country: rest.country,
          startDate: rest.startDate,
          endDate: rest.endDate,
          timezone: rest.timezone,
          isFree: rest.isFree,
          price: rest.price,
          isFeatured: rest.isFeatured,
          isActive: rest.isActive,
          eventType: rest.eventType,
          websiteUrl: rest.websiteUrl,
          ticketUrl: rest.ticketUrl,
        },
      });
      continue;
    }

    await prisma.event.create({
      data: {
        ...rest,
        categories: {
          create: eventCatIds
            .filter(Boolean)
            .map((categoryId: string) => ({ categoryId })),
        },
      },
    });
  }

  console.log(`✅ Created ${eventsData.length} sample events`);

  // ============================================
  // 6. Create Site Settings
  // ============================================
  const settingsData = [
    { key: "site_name", value: "Sanaa Through My Lens", label: "Site Name", type: "text" },
    { key: "site_description", value: "An arts & culture opinion blog focused on Kenya and East Africa — exploring music, film, literature, visual arts, and theatre through critical perspectives.", label: "Site Description", type: "text" },
    { key: "site_tagline", value: "Arts. Culture. Perspective.", label: "Tagline", type: "text" },
    { key: "site_url", value: "https://sanaathrumylens.co.ke", label: "Site URL", type: "text" },
    { key: "posts_per_page", value: "10", label: "Posts Per Page", type: "number" },
    { key: "allow_comments", value: "true", label: "Allow Comments", type: "boolean" },
    { key: "moderate_comments", value: "true", label: "Moderate Comments", type: "boolean" },
    { key: "require_review", value: "true", label: "Require Post Review", type: "boolean" },
    { key: "social_twitter", value: "@sanaalens", label: "Twitter Handle", type: "text" },
    { key: "social_instagram", value: "@sanaathrumylens", label: "Instagram Handle", type: "text" },
    { key: "social_youtube", value: "", label: "YouTube Channel", type: "text" },
    { key: "smtp_host", value: "", label: "SMTP Host", type: "text" },
    { key: "smtp_port", value: "587", label: "SMTP Port", type: "text" },
    { key: "smtp_user", value: "", label: "SMTP User", type: "text" },
    { key: "smtp_pass", value: "", label: "SMTP Password", type: "password" },
    { key: "newsletter_from_name", value: "Sanaa Through My Lens", label: "Newsletter From Name", type: "text" },
    { key: "contact_email", value: "hello@sanaathrumylens.co.ke", label: "Contact Email", type: "text" },
    { key: "analytics_enabled", value: "false", label: "Analytics Enabled", type: "boolean" },
    { key: "maintenance_mode", value: "false", label: "Maintenance Mode", type: "boolean" },
    { key: "newsletter_enabled", value: "true", label: "Newsletter Enabled", type: "boolean" },
  ];

  for (const setting of settingsData) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log(`✅ Created ${settingsData.length} site settings`);

  // ============================================
  // 7. Create Newsletter Subscribers
  // ============================================
  const subscribersData = [
    { email: "subscriber1@example.com", name: "Jane Doe", token: "sub_token_001" },
    { email: "subscriber2@example.com", name: "John Smith", token: "sub_token_002" },
  ];

  for (const sub of subscribersData) {
    await prisma.newsletterSubscriber.upsert({
      where: { email: sub.email },
      update: {},
      create: { ...sub, status: "ACTIVE" },
    });
  }

  console.log("✅ Created newsletter subscribers");

  // ============================================
  // 8. Create Sample Comments
  // ============================================
  const publishedPost = await prisma.post.findFirst({ where: { status: "PUBLISHED" } });
  if (publishedPost) {
    await prisma.comment.createMany({
      data: [
        {
          content: "Great article! Gengetone really has changed the Kenyan music landscape.",
          postId: publishedPost.id,
          authorId: reader.id,
          status: "APPROVED",
        },
        {
          content: "I'd love to see more coverage of the underground hip-hop scene in Nairobi too.",
          postId: publishedPost.id,
          authorId: moderator.id,
          status: "APPROVED",
          moderatedById: editor.id,
        },
        {
          content: "This is a pending comment for moderation review.",
          postId: publishedPost.id,
          authorId: reader.id,
          status: "PENDING",
        },
      ],
    });
    console.log("✅ Created sample comments");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials:");
  console.log("  ADMIN:   admin@sanaathrumylens.co.ke / Admin@2024!");
  console.log("  EDITOR:  editor@sanaathrumylens.co.ke / Editor@2024!");
  console.log("  READER:  reader@example.com / Reader@2024!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
