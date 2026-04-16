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
  bachataCouple: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?w=1200&h=630&fit=crop",
  socialDance: "https://images.unsplash.com/photo-1545959570-a94084071b5d?w=1200&h=630&fit=crop",
  danceClass: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200&h=630&fit=crop",
  couple1: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?w=800&h=600&fit=crop",
  couple2: "https://images.unsplash.com/photo-1559234938-b60fff04894d?w=800&h=600&fit=crop",
  handshake: "https://images.unsplash.com/photo-1511715282680-fbf93a50e721?w=800&h=600&fit=crop",
  festival: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&h=600&fit=crop",
};

const post1Body: Block[] = [
  {
    type: "text",
    content:
      "Dancing changes the way you experience a city. Walk into a social in the right neighborhood and the place opens up: new friends, late nights, music you'd never have found on Spotify. A few cities have scenes that pull dancers in from everywhere. These are the ones worth planning a trip around.",
  },
  {
    type: "text",
    content:
      "## Best cities for salsa\n\n**1. Cali, Colombia.** The world capital of salsa. Cali dances its own frantic style (salsa caleña) at speeds that feel unreasonable the first time you see it. Live bands most nights.\n\n**2. Havana, Cuba.** The source. Casino and rueda everywhere, and the musicality is baked into daily life. Casa de la Música and 1830 are classics.\n\n**3. New York City.** Mambo on the 2, tight technique, world-class congresses. The city where modern linear salsa was built.\n\n**4. Medellín, Colombia.** A younger, hungrier scene than Cali. More of a mix of styles and a fast-growing congress circuit.\n\n**5. Paris, France.** Europe's salsa capital. Weekly socials at La Bellevilloise and the Latin Quarter keep the community buzzing all year.",
  },
  {
    type: "two-column",
    text:
      "## Best cities for bachata\n\n**1. Santo Domingo, Dominican Republic.** Where bachata was born. You'll hear the real thing in every colmado, danced the way grandparents have been dancing it for decades.\n\n**2. Madrid, Spain.** The global capital of sensual bachata. Weekly festivals, top instructors, and the biggest congresses in Europe.\n\n**3. Miami, USA.** A crossroads where Dominican tradition meets modern sensual styles.\n\n**4. Berlin, Germany.** Deeper than you'd expect. Several weekly socials and a strong underground community.\n\n**5. Paris, France.** Second only to Madrid in Europe, with excellent studios and festivals throughout the year.",
    image: { url: UNSPLASH.bachataCouple, alt: "Bachata dancers on the social floor" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## Best cities for kizomba\n\n**1. Lisbon, Portugal.** The spiritual home of kizomba outside Africa. Multiple socials a week, and the birthplace of 'urban kiz'.\n\n**2. Luanda, Angola.** The actual source. Kizomba the way locals dance it is slower, smoother, and deeper than most of what you see in Europe or the US.\n\n**3. Paris, France.** The largest and most diverse kizomba scene in Europe. Every flavor: traditional, semba, urban, tarraxinha.\n\n**4. London, UK.** Tight-knit community, excellent instructors, and a growing festival circuit.\n\n**5. Berlin, Germany.** Small but serious. Strong emphasis on musicality and fundamentals.",
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
      "## Finding the scene when you travel\n\nEvery scene runs on its own rhythm. The right nights, the right venues, the right crowd. Walking in blind usually means a wasted night, so a bit of prep goes a long way.\n\nA few things that tend to work:\n\n- Check [DanceCircle's city pages](https://dancecircle.co/en/cities). We track dancer populations, top DJs, teachers, and event organizers in every major city.\n- Follow two or three local DJs on Instagram. They usually announce where they're playing the week before.\n- Message a local dancer directly. Most are happy to point a traveler toward the best social of the week.\n\nDance scenes are far more welcoming than they look from the outside. Show up, introduce yourself, and dance.",
  },
];

const post2Body: Block[] = [
  {
    type: "text",
    content:
      "You've watched a few viral dance clips, a friend keeps dragging you to socials, and something about it all looks irresistible. Now you're staring at a list of beginner classes and three names keep coming up: salsa, bachata, kizomba.\n\nThey all look like partner dancing from the outside. They're actually quite different, and picking the right one for you can save months of frustration.",
  },
  {
    type: "two-column",
    text:
      "## Salsa: fast, technical, playful\n\n**Origin:** Cuba, refined in New York and Puerto Rico.\n\n**Energy:** High. Salsa moves fast. The music is driving and rhythmic, and you'll be turning, spinning, and shining almost from day one.\n\n**What you'll probably love:** The musicality, the playfulness, the variety. Every song is a different conversation. Salsa is also the most internationally recognized of the three, so almost any city you travel to will have a scene.\n\n**Start with salsa if:** you love rhythm, enjoy learning technical skills, want a real workout, and don't mind looking awkward for a few weeks while your body figures out the basic step.",
    image: { url: UNSPLASH.couple1, alt: "Salsa dancers mid-turn" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## Bachata: musical, accessible, romantic\n\n**Origin:** Dominican Republic, now the world's fastest-growing partner dance.\n\n**Energy:** Medium. The basic step is simple enough to dance your first night. From there it opens up into body movement, musicality, and connection work.\n\n**What you'll probably love:** How quickly you can start dancing for real. Bachata rewards feeling over technique. You can be moving well within a month or two.\n\n**Start with bachata if:** you want to be dancing socially soon, love emotional music, care more about connection than flashy moves, and prefer smoother movement over rapid-fire turns.",
    image: { url: UNSPLASH.couple2, alt: "Bachata couple in close connection" },
    imagePosition: "left",
  },
  {
    type: "two-column",
    text:
      "## Kizomba: slow, deep, grounded\n\n**Origin:** Angola, a descendant of semba, with influences from zouk.\n\n**Energy:** Low and grounded. Kizomba is walked, not stepped. Close embrace, subtle weight shifts, almost-imperceptible leading. It's the dance equivalent of whispering.\n\n**What you'll probably love:** The intimacy and musicality. Kizomba requires less athletic ability than salsa or bachata, but more body awareness. When it clicks, nothing else feels like it.\n\n**Start with kizomba if:** you want depth over flash, you're comfortable with close connection, you enjoy slow music, and you don't mind that reaching a basic level takes longer than it does in bachata.",
    image: { url: UNSPLASH.socialDance, alt: "Kizomba couple dancing in close embrace" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## Quick comparison\n\n| | Salsa | Bachata | Kizomba |\n|---|---|---|---|\n| **Learning curve** | Steep | Gentle | Moderate |\n| **Time to dance socially** | 3 to 6 months | 1 to 2 months | 2 to 4 months |\n| **Music tempo** | Fast | Medium | Slow |\n| **Connection style** | Open | Variable | Close |\n| **Global scene size** | Huge | Huge | Medium, growing |\n\n## So which one should you actually pick?\n\nThe honest answer is: whichever scene in your city has the best socials. A thriving bachata scene beats a weak salsa scene every single time. The community is what keeps you coming back once the honeymoon phase wears off.\n\nIf you genuinely have great options for all three, bachata is usually the best starting point. You'll be dancing socially within weeks, which builds confidence and a network. After that, salsa and kizomba are easier to layer on.\n\n[Find your city on DanceCircle](https://dancecircle.co/en/cities) to see how many dancers are active in each style and who the local teachers are.",
  },
];

const post3Body: Block[] = [
  {
    type: "text",
    content:
      "Every social has its unwritten rules. Break them by accident and you won't get kicked out, but you might not get a second dance. Follow them, and you'll be welcomed anywhere in the world.\n\nA short list of what actually matters.",
  },
  {
    type: "text",
    content:
      "## 1. Anyone can ask anyone\n\nGender, experience level, who's been in the scene longer, none of it matters. If you want to dance with someone, ask. If someone asks you, say yes unless you genuinely need to sit out. A simple \"would you like to dance?\" works in every language.\n\n## 2. 'No' is a complete sentence\n\nPeople decline for a hundred reasons. Tired feet, bad mood, resting, saving the next song for a friend. Never ask why, never push back, never take it personally. Smile, say \"maybe later,\" and move on. And when *you* need to say no, a simple \"no thank you\" is fine. You don't owe anyone an explanation.",
  },
  {
    type: "two-column",
    text:
      "## 3. Hygiene is not optional\n\nDance is a close-contact activity, and the basics make a real difference:\n\n- Shower before the social\n- Wear a clean shirt, bring a spare if you sweat heavily\n- Fresh breath, gum or mints in your pocket\n- Light deodorant, go easy on the cologne\n- Short, clean fingernails\n\nThis is the single biggest gap between people who get dances all night and people who don't.",
    image: { url: UNSPLASH.danceClass, alt: "Dancers preparing before a social" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## 4. Floor awareness is your job\n\nThe dance floor is shared. Leaders are responsible for protecting their partner from collisions, which means dialing back turns and travel when the floor is packed. Followers, speak up if something hurts. A firm \"easy on the arm\" isn't rude, it's safety.\n\n## 5. Dance to your partner's level, not your own\n\nThe best dancers in any room aren't doing their flashiest moves with every partner. They're reading who they're with and offering a dance that feels good *for that person*. If your partner is a beginner, give them the best beginner dance of their night.",
  },
  {
    type: "two-column",
    text:
      "## 6. Say thank you at the end of every song\n\nLook your partner in the eye, say thank you, close the connection cleanly. Walk them off the floor if you can. It's a small gesture that signals respect and leaves a good taste.\n\n## 7. Don't teach on the social floor\n\nUnless your partner explicitly asks, don't correct, coach, or 'fix' their technique mid-dance. It's condescending, it kills the mood, and it's not your job. Save the feedback for class or practice time.",
    image: { url: UNSPLASH.handshake, alt: "Dancers thanking each other after a song" },
    imagePosition: "left",
  },
  {
    type: "text",
    content:
      "## 8. Be careful with close embrace\n\nBachata and kizomba involve close physical contact. That's normal, but it's also a privilege, not a default. When you dance with someone new:\n\n- Start in an open or semi-open frame\n- Let them close the space if they want to\n- Never pull someone into you\n- Respect a partner who keeps a little distance, they have their reasons\n\n## 9. Don't monopolize one partner\n\nDancing several songs in a row with the same person is fine if you're both enjoying it. If you're dancing with the same person for an hour while they're clearly looking around the room, let them go. The social floor is about variety and community.\n\n## 10. New here? Just ask\n\nEvery scene looks intimidating from the outside. Walk up to someone who looks friendly and say: \"hey, I'm new, any tips on this place?\" You'll get welcomed in faster than you'd expect. Dancers remember being new.\n\n[Find your local scene on DanceCircle](https://dancecircle.co/en/cities) and walk in knowing a few faces already.",
  },
];

const updates = [
  { slug: "best-cities-for-dancing-salsa-bachata-kizomba", body: post1Body },
  { slug: "salsa-vs-bachata-vs-kizomba-beginner-guide", body: post2Body },
  { slug: "dance-floor-etiquette-social-dancer-guide", body: post3Body },
];

async function main() {
  await connectMongo();

  console.log(`\n✏️  Updating ${updates.length} blog posts to sound less AI-y...\n`);

  for (const { slug, body } of updates) {
    const result = await BlogPost.updateOne(
      { slug, locale: "en" },
      { $set: { body: JSON.stringify(body) } }
    );

    if (result.matchedCount === 0) {
      console.log(`⚠️  Not found: ${slug}`);
    } else {
      console.log(`✅ Updated: ${slug}`);
    }
  }

  console.log("\n✨ Done.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
