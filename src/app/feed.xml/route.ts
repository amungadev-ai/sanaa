import { db } from "@/lib/db";

export async function GET() {
  const baseUrl = "https://sanaathrumylens.co.ke";

  try {
    // Get the latest 50 published posts
    const posts = await db.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 50,
      include: {
        author: { select: { name: true, username: true } },
        categories: { include: { category: true } },
      },
    });

    const items = posts
      .map((post) => {
        const pubDate = post.publishedAt
          ? new Date(post.publishedAt).toUTCString()
          : new Date(post.createdAt).toUTCString();
        const categories = post.categories
          .map((c) => c.category.name)
          .join(", ");
        const description = post.excerpt || post.content?.substring(0, 200) || "";
        const link = `${baseUrl}/post/${post.slug}`;

        return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author?.name || "Sanaa Through My Lens"}</author>
      ${categories ? `<category>${categories}</category>` : ""}
      ${post.featuredImage ? `<enclosure url="${post.featuredImage}" type="image/jpeg" />` : ""}
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <channel>
    <title>Sanaa Through My Lens</title>
    <link>${baseUrl}</link>
    <description>Arts and Culture Opinion Blog — Stories, Reviews, and Perspectives from East Africa</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <managingEditor>editor@sanaathrumylens.co.ke (Sanaa Through My Lens)</managingEditor>
    <webMaster>webmaster@sanaathrumylens.co.ke (Sanaa Through My Lens)</webMaster>
    <ttl>60</ttl>
    <image>
      <url>${baseUrl}/logo.svg</url>
      <title>Sanaa Through My Lens</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);
    return new Response("Error generating RSS feed", { status: 500 });
  }
}
