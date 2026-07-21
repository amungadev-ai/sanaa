import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample artists...");

  // Get existing categories to link artists
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  const artists = [
    {
      name: "Nyashinski",
      slug: "nyashinski",
      stageName: "Nyashinski",
      bio: `<p>Nyashinski, born Nyamari Ongegu, is one of Kenya's most influential musicians and a pioneer of the Kenyan hip-hop renaissance. After a decade-long hiatus in the US, he returned to Kenya in 2016 and quickly re-established himself as a force in East African music.</p><p>His comeback single "Now You Know" became an anthem, and his debut album <em>Lucky You</em> showcased his versatility across hip-hop, Afrobeat, and Genge. Known for his lyrical prowess and cultural commentary, Nyashinski has become a voice for Kenya's urban youth.</p><p>He has performed at major festivals across Africa and collaborated with artists like Sauti Sol, Khaligraph Jones, and international producers. His music blends traditional Kenyan sounds with contemporary production, creating a unique sonic identity that resonates across the continent.</p>`,
      shortBio: "Kenyan hip-hop icon and Afrobeats pioneer who redefined the East African music scene",
      artistType: "MUSICIAN",
      location: "Nairobi, Kenya",
      country: "Kenya",
      websiteUrl: "https://nyashinski.com",
      socialLinks: JSON.stringify({
        twitter: "https://x.com/nyaborshinski",
        instagram: "https://instagram.com/nyaborshinski",
        youtube: "https://youtube.com/@nyashinski",
        spotify: "https://open.spotify.com/artist/nyashinski",
      }),
      isFeatured: true,
      isActive: true,
      categoryIds: [categoryMap.get("music"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
    {
      name: "Wangechi Mutu",
      slug: "wangechi-mutu",
      stageName: null,
      bio: `<p>Wangechi Mutu is a Kenyan-born visual artist and sculptor whose work explores themes of identity, ecology, and the female form. Based between Nairobi and New York, she has become one of the most celebrated contemporary African artists working today.</p><p>Her collages, sculptures, and installations blend the surreal with the political, drawing from sources as diverse as African traditions, science fiction, and fashion photography. Her work challenges conventional beauty standards and addresses issues of consumerism, environmental degradation, and post-colonial identity.</p><p>Mutu's major commissions include works for the Metropolitan Museum of Art, the Nasher Museum, and the Venice Biennale. In 2019, her sculptures "The NewOnes, will free Us" were featured on the Met Facade — making her the first artist to create work for the museum's exterior. She continues to be a powerful voice in the global art world.</p>`,
      shortBio: "Internationally acclaimed Kenyan visual artist and sculptor based between Nairobi and New York",
      artistType: "PAINTER",
      location: "Nairobi, Kenya",
      country: "Kenya",
      websiteUrl: "https://wangechimutu.com",
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/wangechi.mutu",
      }),
      isFeatured: true,
      isActive: true,
      categoryIds: [categoryMap.get("visual-arts"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
    {
      name: "Wanuri Kahiu",
      slug: "wanuri-kahiu",
      stageName: null,
      bio: `<p>Wanuri Kahiu is a Kenyan filmmaker and author best known for her award-winning film <em>Rafiki</em>, which premiered at the 2018 Cannes Film Festival — the first Kenyan film to do so. The film, a love story between two young women in Nairobi, challenged social norms and sparked a national conversation about LGBTQ+ rights in Kenya.</p><p>Born in Nairobi, Kahiu studied film at the University of California, Los Angeles (UCLA). She is the founder of Afrobubblegum, a media company dedicated to creating fun, vibrant, and imaginative African art that celebrates the continent's diversity.</p><p>Her work extends beyond filmmaking into literature — she co-edited the anthology <em>Ituhiku</em> and has been a vocal advocate for African storytellers to embrace genres like sci-fi and fantasy. She has been recognized by Time Magazine, TED, and the Sundance Institute for her groundbreaking contributions to African cinema.</p>`,
      shortBio: "Award-winning Kenyan filmmaker whose Cannes-premiered Rafiki broke barriers in African cinema",
      artistType: "FILMMAKER",
      location: "Nairobi, Kenya",
      country: "Kenya",
      websiteUrl: "https://afrobubblegum.com",
      socialLinks: JSON.stringify({
        twitter: "https://x.com/wanuri",
        instagram: "https://instagram.com/afrobubblegum",
      }),
      isFeatured: true,
      isActive: true,
      categoryIds: [categoryMap.get("film"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
    {
      name: "Ngugi wa Thiong'o",
      slug: "ngugi-wa-thiongo",
      stageName: null,
      bio: `<p>Ngugi wa Thiong'o is one of Africa's most celebrated writers and intellectuals. Born in 1938 in Limuru, Kenya, he has been a towering figure in African literature for over five decades, with works spanning novels, plays, essays, and memoirs.</p><p>His landmark decision to abandon English as his primary literary language in favor of Gikuyu — his mother tongue — has made him a leading voice in the debate on linguistic decolonization. Works like <em>Decolonising the Mind</em> and <em>Petals of Blood</em> have influenced generations of writers and scholars worldwide.</p><p>Ngugi's writing is deeply rooted in Kenyan history and the anti-colonial struggle. His debut novel <em>Weep Not, Child</em> (1964) was the first English-language novel published by an East African. He has been imprisoned for his political writing, lived in exile, and is currently Distinguished Professor of English and Comparative Literature at the University of California, Irvine. He remains a perennial contender for the Nobel Prize in Literature.</p>`,
      shortBio: "Legendary Kenyan writer and intellectual, champion of African languages and decolonization",
      artistType: "WRITER",
      location: "Irvine, California / Limuru, Kenya",
      country: "Kenya",
      websiteUrl: null,
      socialLinks: JSON.stringify({
        twitter: "https://x.com/Ngugi_wa_Thiongo",
      }),
      isFeatured: false,
      isActive: true,
      categoryIds: [categoryMap.get("books"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
    {
      name: "Blinky Bill",
      slug: "blinky-bill",
      stageName: "Blinky Bill",
      bio: `<p>Blinky Bill, born Bill Sellanga, is a Nairobi-based DJ, producer, and rapper who has been at the forefront of Kenya's alternative music scene for over a decade. As a founding member of the collective Just A Band, he helped put Kenyan alternative music on the global map.</p><p>His solo work blends electronic production, hip-hop, and traditional Kenyan rhythms into a sound he describes as "AFRO-electronica." His debut solo album <em>Everyone's Just Winging It</em> received critical acclaim across Africa and beyond.</p><p>Blinky Bill has performed at major international festivals including AFROPUNK, Primavera Sound, and Roskilde. He is also a visual artist and filmmaker, directing music videos and short films. His creative output represents the vibrant, boundary-pushing spirit of Nairobi's artistic community.</p>`,
      shortBio: "Nairobi-based DJ/producer pioneering AFRO-electronica and alternative Kenyan music",
      artistType: "DJ",
      location: "Nairobi, Kenya",
      country: "Kenya",
      websiteUrl: "https://blinkybill.com",
      socialLinks: JSON.stringify({
        twitter: "https://x.com/BlinkyBillSell",
        instagram: "https://instagram.com/blinkybillsellanga",
        youtube: "https://youtube.com/@blinkybill",
        soundcloud: "https://soundcloud.com/blinkybill",
        spotify: "https://open.spotify.com/artist/blinkybill",
      }),
      isFeatured: false,
      isActive: true,
      categoryIds: [categoryMap.get("music"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
    {
      name: "Osborne Macharia",
      slug: "osborne-macharia",
      stageName: null,
      bio: `<p>Osborne Macharia is a Kenyan photographer and visual artist whose work sits at the intersection of fine art, fashion, and storytelling. Known for his vibrant, cinematic style, he has become one of the most sought-after photographers in Africa.</p><p>His personal projects — such as <em>MIKR</em> (Make It Kenya Rule), <em>Macavity</em>, and <em>Kabangu</em> — are Afrofuturist photo series that reimagine Kenyan narratives through a speculative lens. These works have been exhibited internationally and challenge stereotypical representations of Africa.</p><p>Macharia's commercial work includes campaigns for global brands including Nike, Safaricom, Coca-Cola, and Samsung. He was named among the "100 Most Influential Young Africans" by Avance Media and his work has been featured in Vogue, The New York Times, and The Guardian. He is a passionate advocate for the power of African visual storytelling.</p>`,
      shortBio: "Award-winning Kenyan photographer and Afrofuturist visual storyteller",
      artistType: "PHOTOGRAPHER",
      location: "Nairobi, Kenya",
      country: "Kenya",
      websiteUrl: "https://osbornemacharia.co.ke",
      socialLinks: JSON.stringify({
        instagram: "https://instagram.com/osbornemacharia",
        twitter: "https://x.com/OsborneMacharia",
      }),
      isFeatured: false,
      isActive: true,
      categoryIds: [categoryMap.get("visual-arts"), categoryMap.get("culture")].filter(Boolean) as string[],
    },
  ];

  let created = 0;
  for (const artistData of artists) {
    const { categoryIds, ...data } = artistData;

    const existing = await prisma.artist.findUnique({ where: { slug: data.slug } });
    if (existing) {
      console.log(`  Artist "${data.name}" already exists, skipping`);
      continue;
    }

    const artist = await prisma.artist.create({
      data: {
        ...data,
        categories: categoryIds.length > 0
          ? { create: categoryIds.map((categoryId: string) => ({ categoryId })) }
          : undefined,
      },
    });

    console.log(`  Created artist: ${artist.name} (${artist.slug})`);
    created++;
  }

  console.log(`\nSeeded ${created} artists (${artists.length - created} already existed)`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
