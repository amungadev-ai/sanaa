import { db } from "@/lib/db"

async function seedArtists() {
  console.log("🎨 Seeding artists...")

  // Get existing categories for linking
  const categories = await db.category.findMany()
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  const artists = [
    {
      name: "Sauti Sol",
      slug: "sauti-sol",
      stageName: "Sauti Sol",
      bio: `<p>Sauti Sol is a Kenyan afro-pop band formed in 2005. The group consists of vocalists Bien-Aimé Baraza, Willis Chimano, Savara Mudigi, and guitarist Polycarp Otieno. They have become one of East Africa's most celebrated musical acts, known for their harmonious blend of Luo, Luhya, and Swahili musical traditions with contemporary pop.</p><p>Their breakthrough album <em>Mwanzo</em> (2008) established them as a force in Kenyan music, while subsequent releases like <em>Sol Filosophia</em> and <em>Live and Die in Afrika</em> cemented their pan-African appeal. They've collaborated with international artists and performed at major festivals worldwide.</p>`,
      shortBio: "Kenya's premier afro-pop group blending traditional rhythms with contemporary sounds.",
      artistType: "MUSICIAN",
      location: "Nairobi, Kenya",
      country: "Kenya",
      isFeatured: true,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/SautiSol",
        instagram: "https://instagram.com/saborofficial",
        youtube: "https://youtube.com/@SautiSol",
        spotify: "https://open.spotify.com/artist/sauti-sol",
      }),
      websiteUrl: "https://sautisol.com",
      categoryIds: [categoryMap.get("music")].filter(Boolean) as string[],
    },
    {
      name: "Wangechi Mutu",
      slug: "wangechi-mutu",
      stageName: null,
      bio: `<p>Wangechi Mutu is a Kenyan-born American visual artist known for her complex and layered artworks that explore themes of gender, race, and colonialism. Working across painting, sculpture, and collage, Mutu has established herself as one of the most important contemporary artists of her generation.</p><p>Her work has been exhibited at major institutions including the Metropolitan Museum of Art, the Museum of Modern Art in New York, and the Centre Pompidou in Paris. In 2019, she was commissioned to create works for the Met Facade, making her the first artist to do so.</p>`,
      shortBio: "Internationally acclaimed Kenyan visual artist exploring identity, gender, and colonialism.",
      artistType: "PAINTER",
      location: "Nairobi / New York",
      country: "Kenya",
      isFeatured: true,
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/wangechi_mutu",
      }),
      websiteUrl: "https://wangechimutu.com",
      categoryIds: [categoryMap.get("visual-arts")].filter(Boolean) as string[],
    },
    {
      name: "Wanuri Kahiu",
      slug: "wanuri-kahiu",
      stageName: null,
      bio: `<p>Wanuri Kahiu is a Kenyan filmmaker and director best known for her award-winning film <em>Rafiki</em> (2018), which was the first Kenyan film to premiere at the Cannes Film Festival. The film's vibrant portrayal of a love story between two women in Nairobi sparked international conversation and was initially banned in Kenya.</p><p>Kahiu is a passionate advocate for African storytelling and is the co-founder of Afrobubblegum, a media company focused on creating fun, vibrant African art. She believes in telling stories that celebrate the joy and imagination of African life.</p>`,
      shortBio: "Award-winning Kenyan filmmaker and director of the Cannes-premiered film 'Rafiki'.",
      artistType: "FILMMAKER",
      location: "Nairobi, Kenya",
      country: "Kenya",
      isFeatured: true,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/wanuri",
        instagram: "https://instagram.com/wanuri",
      }),
      categoryIds: [categoryMap.get("film-video")].filter(Boolean) as string[],
    },
    {
      name: "Ngũgĩ wa Thiong'o",
      slug: "ngugi-wa-thiongo",
      stageName: null,
      bio: `<p>Ngũgĩ wa Thiong'o is a Kenyan writer and academic who is widely regarded as one of Africa's most important living writers. Born in 1938 in Limuru, Kenya, he has written novels, plays, short stories, and essays that have been translated into over 30 languages.</p><p>His seminal work <em>Decolonising the Mind</em> (1986) argued for the importance of writing in African languages rather than colonial languages. He made the radical decision to abandon English as his primary literary language in favor of Gikuyu and Kiswahili. His novels include <em>Weep Not, Child</em>, <em>A Grain of Wheat</em>, and <em>Wizard of the Crow</em>.</p>`,
      shortBio: "Kenya's most celebrated author and champion of writing in African languages.",
      artistType: "WRITER",
      location: "Irvine, USA / Limuru, Kenya",
      country: "Kenya",
      isFeatured: true,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/NgugiwaThiongo",
      }),
      websiteUrl: "https://ngugiwathiongo.com",
      categoryIds: [categoryMap.get("books-literature")].filter(Boolean) as string[],
    },
    {
      name: "Blinky Bill",
      slug: "blinky-bill",
      stageName: "Blinky Bill",
      bio: `<p>Blinky Bill, born Bill Sellanga, is a Nairobi-based DJ, producer, and musician who has been instrumental in shaping Kenya's alternative music scene. As a founding member of the collective Just A Band, he helped pioneer a new sound that blended electronic music with Kenyan pop culture references.</p><p>His solo work as Blinky Bill has pushed boundaries further, combining electronic production with live instrumentation and African rhythms. His debut solo album <em>Everyone's Just Winging It and No One's Leaving</em> (2018) was critically acclaimed and featured collaborations with artists from across Africa and beyond.</p>`,
      shortBio: "Nairobi-based DJ/producer pioneering Kenya's alternative electronic music scene.",
      artistType: "DJ",
      location: "Nairobi, Kenya",
      country: "Kenya",
      isFeatured: false,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/blinkybill",
        instagram: "https://instagram.com/blinkybill",
        spotify: "https://open.spotify.com/artist/blinky-bill",
        soundcloud: "https://soundcloud.com/blinkybill",
      }),
      categoryIds: [categoryMap.get("music")].filter(Boolean) as string[],
    },
    {
      name: "Omar Victor Diop",
      slug: "omar-victor-diop",
      stageName: null,
      bio: `<p>Omar Victor Diop is a Senegalese photographer and visual artist whose work explores identity, history, and the African diaspora. Based in Dakar, his striking photographic portraits have gained international recognition for their vivid colors and powerful storytelling.</p><p>His project <em>Project Diaspora</em> recreated historical portraits of notable Africans in European history, exploring themes of memory and representation. His work has been exhibited at the Brooklyn Museum, the Smithsonian, and various biennials around the world.</p>`,
      shortBio: "Senegalese photographer exploring identity and the African diaspora through vivid portraiture.",
      artistType: "PHOTOGRAPHER",
      location: "Dakar, Senegal",
      country: "Senegal",
      isFeatured: false,
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/omarvictordiop",
      }),
      categoryIds: [categoryMap.get("visual-arts")].filter(Boolean) as string[],
    },
  ]

  for (const artistData of artists) {
    const { categoryIds, ...data } = artistData

    const existing = await db.artist.findUnique({ where: { slug: data.slug } })
    if (existing) {
      console.log(`  ↳ Artist "${data.name}" already exists, skipping`)
      continue
    }

    const artist = await db.artist.create({
      data: {
        ...data,
        categories: categoryIds.length > 0
          ? { create: categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
      },
    })

    console.log(`  ✓ Created artist: ${artist.name} (${artist.artistType})`)
  }

  console.log("🎨 Artist seeding complete!")
}

seedArtists()
  .catch((e) => {
    console.error("Failed to seed artists:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
