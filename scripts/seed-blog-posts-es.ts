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
      "Bailar cambia por completo la forma en la que vives una ciudad. Entra a una social en el barrio adecuado y el lugar se abre de otra manera: amigos nuevos, noches largas, música que jamás habrías encontrado en Spotify. Hay ciudades con escenas que atraen bailarines de todo el mundo. Estas son las que valen un viaje.",
  },
  {
    type: "text",
    content:
      "## Mejores ciudades para bailar salsa\n\n**1. Cali, Colombia.** La capital mundial de la salsa. Cali baila su propio estilo (la salsa caleña) a una velocidad que parece imposible la primera vez que la ves. Bandas en vivo casi todas las noches.\n\n**2. La Habana, Cuba.** La raíz. Casino y rueda por todas partes, y una musicalidad que se respira en la calle. Casa de la Música y 1830 son clásicos.\n\n**3. Nueva York, EE.UU.** Mambo on 2, técnica muy limpia y congresos de primer nivel. La ciudad donde se construyó la salsa lineal moderna.\n\n**4. Medellín, Colombia.** Una escena más joven y hambrienta que la de Cali. Mezcla de estilos y un circuito de congresos que no para de crecer.\n\n**5. París, Francia.** La capital europea de la salsa. Sociales semanales en La Bellevilloise y el Barrio Latino mantienen viva la comunidad todo el año.",
  },
  {
    type: "two-column",
    text:
      "## Mejores ciudades para bailar bachata\n\n**1. Santo Domingo, República Dominicana.** Donde nació la bachata. La escuchas en cualquier colmado, bailada como lleva bailándose por generaciones.\n\n**2. Madrid, España.** La capital mundial de la bachata sensual. Festivales semanales, los mejores profesores y los congresos más grandes de Europa.\n\n**3. Miami, EE.UU.** Un cruce cultural donde la tradición dominicana se mezcla con los estilos sensuales modernos.\n\n**4. Berlín, Alemania.** Una escena más profunda de lo que uno esperaría. Varias sociales semanales y una comunidad underground muy sólida.\n\n**5. París, Francia.** Solo superada por Madrid en Europa. Estudios excelentes y festivales durante todo el año.",
    image: { url: UNSPLASH.bachataCouple, alt: "Bailarines de bachata en una social" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## Mejores ciudades para bailar kizomba\n\n**1. Lisboa, Portugal.** La casa espiritual de la kizomba fuera de África. Varias sociales por semana y la ciudad donde nació el 'urban kiz'.\n\n**2. Luanda, Angola.** La fuente real. La kizomba como la bailan allá es más lenta, más suave y más profunda que casi todo lo que se ve en Europa o EE.UU.\n\n**3. París, Francia.** La escena de kizomba más grande y diversa de Europa. Todos los sabores: tradicional, semba, urban, tarraxinha.\n\n**4. Londres, Reino Unido.** Comunidad pequeña y unida, excelentes profesores y un circuito de festivales que crece cada año.\n\n**5. Berlín, Alemania.** Pequeña pero seria. Mucho énfasis en musicalidad y en los fundamentos.",
    image: { url: UNSPLASH.socialDance, alt: "Pareja bailando kizomba en abrazo cerrado" },
    imagePosition: "left",
  },
  {
    type: "image",
    url: UNSPLASH.festival,
    alt: "Festival de baile con gente de todo el mundo",
  },
  {
    type: "text",
    content:
      "## Cómo encontrar la escena cuando viajas\n\nCada escena funciona con su propio ritmo. Las noches buenas, los locales buenos, el público que va. Llegar sin información suele traducirse en una noche perdida, así que un poco de preparación cambia todo.\n\nAlgunas cosas que funcionan bien:\n\n- Revisa las [páginas de ciudades de DanceCircle](https://dancecircle.co/es/cities). Hacemos seguimiento a la cantidad de bailarines, los mejores DJs, profesores y organizadores en cada ciudad importante.\n- Sigue a dos o tres DJs locales en Instagram. Suelen anunciar con una semana de antelación dónde van a pinchar.\n- Escribe directamente a un bailarín local. La mayoría te recomienda con gusto la mejor social de la semana.\n\nLas escenas de baile son mucho más acogedoras de lo que parecen desde fuera. Ve, preséntate y baila.",
  },
];

const post2Body: Block[] = [
  {
    type: "text",
    content:
      "Has visto unos cuantos vídeos virales, una amiga te arrastra constantemente a las sociales y algo de todo eso te parece irresistible. Y ahora te pones a mirar clases para principiantes y siempre aparecen los mismos tres nombres: salsa, bachata, kizomba.\n\nDesde fuera parecen el mismo tipo de baile en pareja. En realidad son muy distintos, y elegir bien desde el principio te puede ahorrar meses de frustración.",
  },
  {
    type: "two-column",
    text:
      "## Salsa: rápida, técnica, juguetona\n\n**Origen:** Cuba, perfeccionada en Nueva York y Puerto Rico.\n\n**Energía:** Alta. La salsa va rápido. La música empuja, el ritmo marca, y desde el primer día vas a estar girando y haciendo shines.\n\n**Lo que probablemente te va a encantar:** la musicalidad, la variedad, que cada canción es una conversación distinta. También es la más reconocida a nivel mundial de las tres, así que casi cualquier ciudad a la que viajes va a tener escena.\n\n**Empieza con salsa si:** te apasiona el ritmo, disfrutas aprendiendo técnica, quieres un entrenamiento de verdad y no te importa verte torpe las primeras semanas mientras tu cuerpo procesa el paso básico.",
    image: { url: UNSPLASH.couple1, alt: "Bailarines de salsa en medio de un giro" },
    imagePosition: "right",
  },
  {
    type: "two-column",
    text:
      "## Bachata: musical, accesible, romántica\n\n**Origen:** República Dominicana. Hoy es el baile en pareja que más rápido crece en el mundo.\n\n**Energía:** Media. El paso básico es sencillo y ya lo puedes bailar en tu primera noche. A partir de ahí se abre el trabajo corporal, la musicalidad y la conexión con la pareja.\n\n**Lo que probablemente te va a encantar:** lo rápido que puedes empezar a bailar de verdad. La bachata premia más el sentir que la técnica. En uno o dos meses ya te vas a mover bien.\n\n**Empieza con bachata si:** quieres estar bailando en sociales pronto, te gusta la música emocional, te importa más la conexión que los movimientos llamativos y prefieres movimientos suaves a giros rápidos.",
    image: { url: UNSPLASH.couple2, alt: "Pareja de bachata en conexión cercana" },
    imagePosition: "left",
  },
  {
    type: "two-column",
    text:
      "## Kizomba: lenta, profunda, de suelo\n\n**Origen:** Angola. Es descendiente del semba, con influencia del zouk.\n\n**Energía:** Baja y muy conectada al suelo. La kizomba se camina, no se marca. Abrazo cerrado, cambios de peso sutiles, un liderazgo casi imperceptible. Es el equivalente a bailar en voz baja.\n\n**Lo que probablemente te va a encantar:** la intimidad y la musicalidad. La kizomba exige menos capacidad atlética que la salsa o la bachata, pero mucha más conciencia corporal. Cuando cuaja, no hay otra cosa que se sienta igual.\n\n**Empieza con kizomba si:** buscas profundidad antes que lucimiento, estás cómodo con el abrazo cerrado, disfrutas la música lenta y no te molesta que llegar a un nivel básico te lleve más tiempo que con bachata.",
    image: { url: UNSPLASH.socialDance, alt: "Pareja bailando kizomba en abrazo cerrado" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## Comparativa rápida\n\n| | Salsa | Bachata | Kizomba |\n|---|---|---|---|\n| **Curva de aprendizaje** | Empinada | Suave | Moderada |\n| **Tiempo para bailar social** | 3 a 6 meses | 1 a 2 meses | 2 a 4 meses |\n| **Tempo musical** | Rápido | Medio | Lento |\n| **Conexión** | Abierta | Variable | Cerrada |\n| **Tamaño de la escena mundial** | Enorme | Enorme | Media, en crecimiento |\n\n## Entonces, ¿cuál eliges?\n\nLa respuesta honesta es: la que tenga la mejor escena en tu ciudad. Una bachata con sociales todas las semanas le gana siempre a una salsa con poca gente. La comunidad es lo que te mantiene volviendo cuando pasa el enamoramiento inicial.\n\nSi por suerte tienes escena fuerte en los tres, la bachata suele ser el mejor punto de partida. Vas a estar bailando en sociales en semanas, lo que te da confianza y red social. Desde ahí, la salsa y la kizomba se montan más fácil.\n\n[Busca tu ciudad en DanceCircle](https://dancecircle.co/es/cities) y mira cuántos bailarines hay activos en cada estilo y quiénes son los profesores locales.",
  },
];

const post3Body: Block[] = [
  {
    type: "text",
    content:
      "Cada social tiene sus reglas no escritas. Romperlas sin querer no te va a echar del local, pero probablemente no te saquen a bailar una segunda vez. Respétalas y te reciben bien en cualquier parte del mundo.\n\nUna lista corta de lo que realmente importa.",
  },
  {
    type: "text",
    content:
      "## 1. Cualquiera puede sacar a cualquiera\n\nGénero, nivel, antigüedad en la escena, nada de eso importa. Si quieres bailar con alguien, sácalo. Si alguien te saca, acepta a menos que realmente necesites un descanso. Un simple \"¿bailas?\" funciona en cualquier idioma.\n\n## 2. 'No' es una respuesta completa\n\nLa gente dice que no por cien razones distintas. Pies cansados, mal día, descansando, guardando la canción para otra persona. Nunca preguntes por qué, nunca insistas, nunca te lo tomes personal. Sonríes, dices \"más tarde\" y sigues. Y cuando el que dice no eres tú, un \"no, gracias\" basta. No le debes una explicación a nadie.",
  },
  {
    type: "two-column",
    text:
      "## 3. La higiene no es opcional\n\nEl baile es una actividad de contacto cercano, y lo básico marca una diferencia enorme:\n\n- Dúchate antes de la social\n- Camiseta limpia, y lleva una de repuesto si sudas mucho\n- Aliento fresco, con chicle o mentas en el bolsillo\n- Desodorante sí, colonia con calma\n- Uñas cortas y limpias\n\nEsta es la diferencia más grande entre la gente que baila toda la noche y la que no baila casi nada.",
    image: { url: UNSPLASH.danceClass, alt: "Bailarines preparándose antes de una social" },
    imagePosition: "right",
  },
  {
    type: "text",
    content:
      "## 4. Cuidar la pista es tu trabajo\n\nLa pista es compartida. El líder es responsable de proteger a su pareja de choques, lo que significa bajar la intensidad de giros y desplazamientos cuando está llena. Y tú, si algo duele, habla. Un \"cuidado con el brazo\" no es grosero, es seguridad.\n\n## 5. Baila al nivel de tu pareja, no al tuyo\n\nLos mejores bailarines de cualquier sala no están haciendo sus movimientos más llamativos con todo el mundo. Leen con quién están y ofrecen un baile que se sienta bien *para esa persona*. Si tu pareja es principiante, dale el mejor baile de principiante de la noche.",
  },
  {
    type: "two-column",
    text:
      "## 6. Di gracias al final de cada canción\n\nMira a tu pareja a los ojos, dile gracias, cierra la conexión con calma. Si puedes, acompáñala fuera de la pista. Es un detalle pequeño que demuestra respeto y deja un buen sabor.\n\n## 7. No des clase en la pista social\n\nA menos que tu pareja te lo pida explícitamente, no corrijas, no enseñes, no arregles su técnica en mitad del baile. Es condescendiente, mata el ambiente y no es tu trabajo. Guarda el feedback para la clase o el entrenamiento.",
    image: { url: UNSPLASH.handshake, alt: "Bailarines agradeciéndose después de una canción" },
    imagePosition: "left",
  },
  {
    type: "text",
    content:
      "## 8. Cuidado con el abrazo cerrado\n\nLa bachata y la kizomba implican contacto físico cercano. Es normal, pero también es un privilegio, no algo automático. Cuando bailas con alguien por primera vez:\n\n- Empieza en abrazo abierto o semiabierto\n- Deja que sea la otra persona quien cierre el espacio si quiere\n- Nunca tires de nadie hacia ti\n- Respeta a quien mantenga un poco de distancia, tendrá sus razones\n\n## 9. No monopolices a una pareja\n\nBailar varias canciones seguidas con la misma persona está bien si los dos disfrutan. Si llevas una hora bailando con alguien que claramente mira al resto de la sala, suéltalo. La pista social es variedad y comunidad.\n\n## 10. ¿Nuevo aquí? Pregunta\n\nCualquier escena intimida desde fuera. Acércate a alguien con cara amable y di: \"oye, soy nuevo, ¿algún consejo sobre este sitio?\". Te reciben mejor y más rápido de lo que te imaginas. Todos los bailarines se acuerdan de cuando empezaron.\n\n[Encuentra tu escena local en DanceCircle](https://dancecircle.co/es/cities) y llega conociendo ya algunas caras.",
  },
];

const posts = [
  {
    title: "Las 15 Mejores Ciudades del Mundo para Bailar Salsa, Bachata y Kizomba",
    slug: "best-cities-for-dancing-salsa-bachata-kizomba",
    excerpt:
      "Desde la salsa frenética de Cali hasta la kizomba suave de Lisboa y la bachata de raíz de Santo Domingo. Las 15 ciudades que todo bailarín viajero debería conocer.",
    coverImage: UNSPLASH.salsaCouple,
    locale: "es" as const,
    category: "dance-travel",
    body: JSON.stringify(post1Body),
    seo: {
      metaTitle: "Mejores Ciudades para Bailar Salsa, Bachata y Kizomba (2026) | DanceCircle",
      metaDescription:
        "Las 15 mejores ciudades del mundo para bailar social. De Cali y La Habana para la salsa, a Lisboa para la kizomba y Santo Domingo para la bachata.",
      keywords:
        "mejores ciudades para bailar salsa, mejores ciudades bachata, mejores ciudades kizomba, viajes de baile, salsa cali, kizomba lisboa, bachata madrid, destinos de baile",
    },
  },
  {
    title: "Salsa, Bachata o Kizomba: ¿Cuál Deberías Aprender Primero?",
    slug: "salsa-vs-bachata-vs-kizomba-beginner-guide",
    excerpt:
      "Tres de los bailes en pareja más populares del mundo, comparados uno al lado del otro. Para que elijas el que mejor encaja contigo y empieces a bailar antes.",
    coverImage: UNSPLASH.partyScene,
    locale: "es" as const,
    category: "beginner-guide",
    body: JSON.stringify(post2Body),
    seo: {
      metaTitle: "Salsa, Bachata o Kizomba: Guía para Principiantes | DanceCircle",
      metaDescription:
        "Comparativa de salsa, bachata y kizomba: orígenes, dificultad, música y conexión. Elige el baile adecuado para ti.",
      keywords:
        "salsa vs bachata, bachata o kizomba, qué baile aprender primero, baile en pareja principiantes, cómo elegir baile, comparativa salsa bachata kizomba",
    },
  },
  {
    title: "Etiqueta en la Pista: 10 Reglas que Todo Bailarín Social Debería Conocer",
    slug: "dance-floor-etiquette-social-dancer-guide",
    excerpt:
      "Las reglas no escritas que todo bailarín aprende por las malas. De higiene y cuidado de la pista a cómo sacar a bailar y cómo decir que no.",
    coverImage: UNSPLASH.crowd,
    locale: "es" as const,
    category: "dance-tips",
    body: JSON.stringify(post3Body),
    seo: {
      metaTitle: "Etiqueta en la Pista: 10 Reglas para Bailarines Sociales | DanceCircle",
      metaDescription:
        "Las reglas no escritas del baile social: cómo sacar a bailar, higiene, cuidado de la pista, etiqueta del abrazo cerrado y cómo encajar en cualquier escena.",
      keywords:
        "etiqueta de baile, reglas del baile social, cómo sacar a bailar, etiqueta en la pista, etiqueta bachata, etiqueta salsa, consejos baile social",
    },
  },
];

async function main() {
  await connectMongo();

  console.log(`\n📝 Seeding ${posts.length} Spanish blog posts as drafts...\n`);

  for (const post of posts) {
    const existing = await BlogPost.findOne({
      slug: post.slug,
      locale: post.locale,
    });

    if (existing) {
      console.log(`⏭️  Skipped "${post.title}" — already exists`);
      continue;
    }

    const created = await BlogPost.create({
      ...post,
      isPublished: false,
    });

    console.log(`✅ Created draft: ${post.title}`);
    console.log(`   /es/blog/${post.slug}`);
    console.log(`   id: ${created._id}\n`);
  }

  console.log("\n✨ Done.\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
