import connectMongo from "@/libs/mongoose";
import BlogPost from "@/models/BlogPost";

type Block =
  | { type: "text"; content: string }
  | {
      type: "two-column";
      text: string;
      image: { url: string; alt: string };
      imagePosition: "left" | "right";
    }
  | { type: "image"; url: string; alt: string };

const UNSPLASH = {
  salsaCouple: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?w=1200&h=630&fit=crop",
  bachataCouple: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=1200&h=630&fit=crop",
  socialDance: "https://images.unsplash.com/photo-1545959570-a94084071b5d?w=1200&h=630&fit=crop",
  cityLights: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=630&fit=crop",
  beachDance: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=630&fit=crop",
  danceClass: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&h=630&fit=crop",
  crowd: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=630&fit=crop",
  couple1: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=800&h=600&fit=crop",
  couple2: "https://images.unsplash.com/photo-1559234938-b60fff04894d?w=800&h=600&fit=crop",
  partyScene: "https://images.unsplash.com/photo-1571266028243-e4bb35f36c94?w=800&h=600&fit=crop",
  handshake: "https://images.unsplash.com/photo-1511715282680-fbf93a50e721?w=800&h=600&fit=crop",
  festival: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&h=600&fit=crop",
};

const post1Body: Block[] = [
  {
    type: "text",
    content:
      "Dancing transforms cities. Walk into a social in the right neighborhood, and a city you thought you knew suddenly opens up — friends, music, rhythm, late nights. Some cities have legendary scenes that draw dancers from around the world. Here are the cities we'd tell any traveling dancer to visit.",
  },
  {
    type: "text",
    content:
      "## 🔥 Best Cities for Salsa\n\n**1. Cali, Colombia** — The world capital of salsa, full stop. Cali dances its own frantic style (salsa caleña) at superhuman speed. You'll find live-band socials every night of the week.\n\n**2. Havana, Cuba** — The birthplace of the form. Casino and rueda dominate, and the musicality is in the air. Dance at Casa de la Música and 1830.\n\n**3. New York City, USA** — Mambo on the 2, tight technique, world-class congresses. The Palladium legacy lives on.\n\n**4. Medellín, Colombia** — A younger, hungrier scene than Cali, with a mix of styles and rapidly-growing congresses.\n\n**5. Paris, France** — Europe's salsa capital. Weekly socials at La Bellevilloise and the Latin Quarter keep the scene buzzing year-round.",
  },
  {
    type: "two-column",
    text:
      "## 💃 Best Cities for Bachata\n\n**1. Santo Domingo, Dominican Republic** — Where bachata was born. You'll hear the real thing in every colmado, danced the way your grandmother's generation danced it.\n\n**2. Madrid, Spain** — The global capital of sensual bachata. Weekly festivals, top instructors, and Europe's biggest congresses.\n\n**3. Miami, USA** — A cultural crossroads where Dominican tradition meets modern sensual styles.\n\n**4. Berlin, Germany** — Surprisingly deep scene with multiple weekly socials and a strong underground community.\n\n**5. Paris, France** — Second only to Madrid in Europe, with excellent studios and festivals throughout the year.",
    image: { url: UNSPLASH.bachataCouple, alt: "Bachata dancers on the social floor" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## 🎶 Best Cities for Kizomba\n\n**1. Lisbon, Portugal** — The spiritual home of kizomba outside Africa. Multiple socials every night, and the birthplace of 'urban kiz'.\n\n**2. Luanda, Angola** — The source. Kizomba as the locals dance it is smoother, slower, and deeper than what you've probably seen abroad.\n\n**3. Paris, France** — The largest and most diverse kizomba scene in Europe. Every flavor — traditional, semba, urban, tarraxinha.\n\n**4. London, UK** — A tight-knit community with excellent instructors and a growing festival circuit.\n\n**5. Berlin, Germany** — Small but serious. Strong on musicality and fundamentals.",
    image: { url: UNSPLASH.socialDance, alt: "Kizomba couple in close embrace" },
    imagePosition: "left",
  },
  {
    type: "image",
    url: UNSPLASH.festival,
    alt: "Dance festival crowd from around the world",
  },
  {
    type: "text",
    content:
      "## How to find the scene when you travel\n\nEvery scene has its own rhythm — the right nights, the right venues, the right crowd. Walking in blind can mean a wasted night. Before you land somewhere new:\n\n- **Check DanceCircle's city pages** — we track dancer populations, top DJs, teachers, and event organizers in every major city.\n- **Follow local DJs on Instagram** — they announce where they're playing that week.\n- **Message a local dancer** — most are happy to point travelers to the best social of the week.\n\nThe world's dance scenes are far more welcoming than you'd expect. Show up, introduce yourself, and dance. That's it.\n\n---\n\n**Planning a dance trip?** Browse [dance cities on DanceCircle](https://dancecircle.co/en/cities) to find scenes near your destination — complete with the teachers, DJs, and event organizers who make them work.",
  },
];

const post2Body: Block[] = [
  {
    type: "text",
    content:
      "You've watched a few viral dance clips, your friend keeps dragging you to socials, and something about it all looks irresistible. But now you're staring at a list of beginner classes and three names keep coming up: salsa, bachata, kizomba. They all look like partner dancing — but they're more different than they appear.\n\nHere's what you need to know to pick the right one for *you*.",
  },
  {
    type: "two-column",
    text:
      "## 🔥 Salsa — Fast, Technical, Playful\n\n**Origin:** Cuba, refined in New York and Puerto Rico.\n\n**Energy:** High. Salsa moves fast. The music is driving and rhythmic — you'll be turning, spinning, and shining almost from day one.\n\n**What you'll love:** The musicality, the playfulness, the sheer variety. Every song is a different conversation. Salsa is also the most internationally recognized — every major city on earth has a scene.\n\n**Best for you if:** you love rhythm, enjoy learning technical skills, want a workout, and don't mind looking awkward for a few weeks while your body figures out the basic step.",
    image: { url: UNSPLASH.couple1, alt: "Salsa dancers mid-turn" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## 💃 Bachata — Musical, Accessible, Romantic\n\n**Origin:** Dominican Republic, now the world's fastest-growing partner dance.\n\n**Energy:** Medium. The basic step is simple enough to dance your first night. From there, it opens up into endless body movement, musicality, and connection work.\n\n**What you'll love:** How quickly you can start dancing for real. Bachata rewards feeling over technique — you can be moving beautifully in a month or two.\n\n**Best for you if:** you want to dance *soon*, love emotional music, care more about connection than flash, and prefer smoother movement over rapid-fire turns.",
    image: { url: UNSPLASH.couple2, alt: "Bachata couple in close connection" },
    imagePosition: "left",
  },
  {
    type: "two-column",
    text:
      "## 🎶 Kizomba — Slow, Deep, Grounded\n\n**Origin:** Angola — a descendant of semba, influenced by zouk.\n\n**Energy:** Low and grounded. Kizomba is walked, not stepped. The close embrace, the subtle weight shifts, the almost-imperceptible leading — it's the dance equivalent of whispering.\n\n**What you'll love:** The intimacy and musicality. Kizomba requires less athletic ability than salsa or bachata, but more body awareness. When it clicks, nothing else feels like it.\n\n**Best for you if:** you want depth over flash, are comfortable with close connection, enjoy slow music, and don't mind that it takes longer to reach a basic level than bachata.",
    image: { url: UNSPLASH.socialDance, alt: "Kizomba couple dancing in close embrace" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## Quick comparison\n\n| | Salsa | Bachata | Kizomba |\n|---|---|---|---|\n| **Learning curve** | Steep | Gentle | Moderate |\n| **Time to dance socially** | 3–6 months | 1–2 months | 2–4 months |\n| **Music tempo** | Fast | Medium | Slow |\n| **Connection style** | Open | Variable | Close |\n| **Global scene size** | Huge | Huge | Medium but growing |\n\n## So which should *you* start with?\n\nHonestly? **Whichever scene in your city has the best socials.** A thriving bachata scene beats an anemic salsa scene every time. The community is what keeps you coming back long after the honeymoon phase wears off.\n\nIf you genuinely have great options for all three — try bachata first. You'll be dancing socially within weeks, which builds confidence and a network. From there, salsa and kizomba become easier to layer on.\n\n---\n\n**Not sure what your city has?** [Find your city on DanceCircle](https://dancecircle.co/en/cities) — see how many dancers are active in each style and who the local teachers are.",
  },
];

const post3Body: Block[] = [
  {
    type: "text",
    content:
      "Every social has its unwritten rules. Break them accidentally and you won't get kicked out — but you might not get a second dance. Follow them, and you'll be welcomed anywhere in the world.\n\nHere are the 10 rules every new social dancer needs to know.",
  },
  {
    type: "text",
    content:
      "## 1. Anyone can ask anyone\n\nGender, experience level, who's been in the scene longer — none of it matters. If you want to dance with someone, ask. If someone asks you, say yes unless you genuinely need to sit out.\n\nA simple **\"Would you like to dance?\"** works in every language.\n\n## 2. \"No\" is a complete sentence — and you must respect it\n\nPeople decline for a hundred reasons: tired feet, bad mood, resting, saving the next song for a friend. **Never ask why. Never push back. Never take it personally.** Smile, say \"maybe later,\" and move on.",
  },
  {
    type: "two-column",
    text:
      "## 3. Hygiene is non-negotiable\n\nDance is a close-contact activity. The basics:\n\n- Shower before the social\n- Clean shirt — bring a spare if you sweat heavily\n- Fresh breath (gum or mints in your pocket)\n- Light deodorant, easy on the cologne\n- Short, clean fingernails\n\nThis is the single biggest gap between people who get dances all night and people who don't.",
    image: { url: UNSPLASH.danceClass, alt: "Dancers preparing before a social" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## 4. Floor awareness is your job\n\nThe dance floor is shared. Leaders are responsible for protecting their partners from collisions — that means dialing back turns and travel when the floor is packed. Followers: speak up if something hurts. A firm \"easy on the arm\" isn't rude, it's safety.\n\n## 5. Dance to your partner's level, not your own\n\nThe best dancers in any room aren't doing their flashiest moves with every partner. They're reading who they're with and offering a dance that feels good *for that person*. If your partner is a beginner, give them the best beginner dance of their night.",
  },
  {
    type: "two-column",
    text:
      "## 6. Thank your partner — always\n\nAt the end of every song, look your partner in the eye and say thank you. It's a tiny gesture that signals respect and closes the connection cleanly. Walk them off the floor if you can.\n\n## 7. Don't teach on the social floor\n\nUnless your partner explicitly asks, don't correct, coach, or \"fix\" their technique mid-dance. It's condescending, it kills the mood, and it's not your job. Save the feedback for class or a practice space.",
    image: { url: UNSPLASH.handshake, alt: "Dancers thanking each other after a song" },
    imagePosition: "left",
  },
  {
    type: "text",
    content:
      "## 8. Be polite about the close embrace\n\nBachata and kizomba involve close physical contact. That's normal — but it's also a privilege, not a default. When you dance with someone new:\n\n- Start in an open or semi-open frame\n- Let them close the space if they're comfortable\n- Never pull someone into you\n- Respect a partner who keeps distance — they have their reasons\n\n## 9. Don't monopolize one partner\n\nIt's fine to dance several songs in a row with someone if you're both enjoying it. But if you're dancing with the same person for an hour while they're clearly looking around, let them go. The social floor is about variety and community.\n\n## 10. New here? Just ask\n\nEvery scene looks intimidating from the outside. Walk up to someone who looks friendly and say: *\"Hey, I'm new — any tips on this place?\"* You'll get welcomed in faster than you'd believe. Dancers remember being new.\n\n---\n\n**New to a city?** [Find your local scene on DanceCircle](https://dancecircle.co/en/cities) — we'll show you who the regulars, DJs, and organizers are, so you walk in knowing faces.",
  },
];

const posts = [
  {
    title: "The 15 Best Cities in the World for Dancing Salsa, Bachata & Kizomba",
    slug: "best-cities-for-dancing-salsa-bachata-kizomba",
    excerpt:
      "From Cali's frantic salsa to Lisbon's smooth kizomba and Santo Domingo's roots bachata — the 15 cities every traveling dancer should know.",
    coverImage: UNSPLASH.salsaCouple,
    locale: "en" as const,
    category: "dance-travel",
    body: JSON.stringify(post1Body),
    seo: {
      metaTitle: "Best Cities for Dancing Salsa, Bachata & Kizomba (2026) | DanceCircle",
      metaDescription:
        "The 15 best cities worldwide for social dancing — from Cali and Havana for salsa to Lisbon for kizomba and Santo Domingo for bachata.",
      keywords:
        "best salsa cities, best bachata cities, best kizomba cities, dance travel, salsa cali, kizomba lisbon, bachata madrid, dance vacation destinations",
    },
  },
  {
    title: "Salsa vs Bachata vs Kizomba: Which Should You Learn First?",
    slug: "salsa-vs-bachata-vs-kizomba-beginner-guide",
    excerpt:
      "Three of the world's most popular partner dances, compared side by side — so you can pick the one that fits you and start dancing sooner.",
    coverImage: UNSPLASH.partyScene,
    locale: "en" as const,
    category: "beginner-guide",
    body: JSON.stringify(post2Body),
    seo: {
      metaTitle: "Salsa vs Bachata vs Kizomba: Beginner's Guide | DanceCircle",
      metaDescription:
        "Compare salsa, bachata, and kizomba side by side: origins, difficulty, music, and connection style. Pick the right dance for you.",
      keywords:
        "salsa vs bachata, bachata vs kizomba, which dance to learn first, beginner partner dance, how to choose a dance, salsa bachata kizomba comparison",
    },
  },
  {
    title: "Dance Floor Etiquette: 10 Rules Every Social Dancer Should Know",
    slug: "dance-floor-etiquette-social-dancer-guide",
    excerpt:
      "The unwritten rules every social dancer learns the hard way — from hygiene to floor awareness to how to ask for a dance (and how to say no).",
    coverImage: UNSPLASH.crowd,
    locale: "en" as const,
    category: "dance-tips",
    body: JSON.stringify(post3Body),
    seo: {
      metaTitle: "Dance Floor Etiquette: 10 Rules for Social Dancers | DanceCircle",
      metaDescription:
        "The unwritten rules of social dancing: how to ask for a dance, hygiene, floor awareness, close embrace etiquette, and how to be welcomed anywhere.",
      keywords:
        "dance etiquette, social dance rules, how to ask for a dance, dance floor etiquette, bachata etiquette, salsa etiquette, social dancing tips, dance partner",
    },
  },
];

async function main() {
  await connectMongo();

  console.log(`\n📝 Seeding ${posts.length} blog posts as drafts...\n`);

  for (const post of posts) {
    const existing = await BlogPost.findOne({
      slug: post.slug,
      locale: post.locale,
    });

    if (existing) {
      console.log(`⏭️  Skipped "${post.title}" — slug already exists`);
      continue;
    }

    const created = await BlogPost.create({
      ...post,
      isPublished: false,
    });

    console.log(`✅ Created draft: ${post.title}`);
    console.log(`   /en/blog/${post.slug}`);
    console.log(`   id: ${created._id}\n`);
  }

  console.log(
    "\n✨ Done. Review and publish from /en/admin/blog when ready.\n"
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
