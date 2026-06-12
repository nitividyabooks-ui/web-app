import { Product } from "@/lib/products";

export interface CollectionFaq {
    question: string;
    answer: string;
}

export interface CollectionDef {
    slug: string;
    /** Primary target keyword — one per page, see docs/seo-keyword-map.md */
    keyword: string;
    title: string; // h1
    metaTitle: string;
    metaDescription: string;
    eyebrow: string;
    /** 300–500 words of genuinely differentiated intro copy, as paragraphs */
    intro: string[];
    faqs: CollectionFaq[];
    related: string[]; // sibling collection slugs
    match: (p: Product) => boolean;
}

const startAge = (p: Product) => {
    const m = p.ageRange?.match(/(\d+)/);
    return m ? parseInt(m[1]) : 0;
};

const hasTag = (p: Product, ...tags: string[]) => tags.some((t) => p.tags?.includes(t));

const isBilingual = (p: Product) => /hindi/i.test(p.language) && /english/i.test(p.language);

export const COLLECTIONS: CollectionDef[] = [
    {
        slug: "books-for-1-year-old",
        keyword: "books for 1 year old",
        title: "Books for 1 Year Olds",
        metaTitle: "Best Books for 1 Year Olds in India",
        metaDescription:
            "Sturdy, colourful first books for 1 year olds. Bilingual Hindi-English board books with animals, actions, and festivals — made in India for Indian homes.",
        eyebrow: "Shop by age",
        intro: [
            "At one, your child is not reading — they are looking, pointing, grabbing, and listening to your voice. The best books for 1 year olds work with that: one big, bright picture per page, a single word or two to name it, and pages that survive being chewed, thrown, and read forty times in a row.",
            "This is also the age when the sounds of language settle in. A one year old who hears both Hindi and English words for the same picture — haathi and elephant, diya and lamp — is building two sound maps at once, effortlessly. That window is wide open now and starts narrowing through the preschool years, which is why every Miko book pairs Hindi and English on the same page instead of treating Hindi as an afterthought.",
            "Start with familiar things. Animals your child sees in books and parks, everyday actions like clapping and waving, the festivals lighting up your home each season. Naming the familiar is how reading begins — long before stories with plots, a one year old wants to point at a picture and hear you say its name. The books below are built exactly for that stage.",
        ],
        faqs: [
            {
                question: "What kind of books are best for a 1 year old?",
                answer: "Look for large, high-contrast pictures, one idea per page, and very few words. At this age books are about naming and pointing together, not following a story. Durable pages matter — a loved book will be handled roughly.",
            },
            {
                question: "Is it too early to introduce Hindi and English together?",
                answer: "No — the first three years are the easiest time for a child to absorb two languages. Hearing both languages for the same picture builds both vocabularies in parallel without confusion.",
            },
            {
                question: "How long should I read with a 1 year old?",
                answer: "Five minutes at a time is plenty. Follow your child's attention: if they want to flip pages or linger on one picture, that is reading too. Little and often beats long sessions.",
            },
        ],
        related: ["books-for-2-year-old", "bilingual-books-for-children"],
        match: (p) => startAge(p) <= 1,
    },
    {
        slug: "books-for-2-year-old",
        keyword: "books for 2 year old",
        title: "Books for 2 Year Olds",
        metaTitle: "Best Books for 2 Year Olds in India",
        metaDescription:
            "Picture books for 2 year olds that build first words in Hindi and English — animals, manners, actions, and festival books designed for toddlers in Indian homes.",
        eyebrow: "Shop by age",
        intro: [
            "Two is the age of the vocabulary explosion. A typical two year old learns several new words a week, repeats everything, and starts joining words into little sentences. Books are the single richest source of that new vocabulary — a child hears words in books that simply never come up in daily conversation.",
            "The best books for 2 year olds give that growth something to hold on to: clear pictures tied to words they can use today, simple repeated structures they can finish for you, and themes from their own world — animals, festivals at home, please and thank you, jumping and clapping. When a book shows a toddler the diya they lit last Diwali, the words stick because the memory is theirs.",
            "This is also the perfect age for bilingual reading. A two year old will happily say haathi one minute and elephant the next without any sense that these belong to separate worlds. The Miko series puts both languages on every page, so whichever language your home leans on, the other one comes along for free.",
            "Below are our books for this age — short enough for toddler attention spans, sturdy enough for toddler hands, and rooted in the sights and sounds of an Indian childhood.",
        ],
        faqs: [
            {
                question: "What should a 2 year old's books look like?",
                answer: "Short books with bright, uncluttered pictures and a line or two per page. Repetition is a feature, not a flaw — toddlers learn by hearing the same structures again and again, and they love predicting what comes next.",
            },
            {
                question: "My 2 year old won't sit through a book. Is that normal?",
                answer: "Completely. Attention at this age comes in bursts. Let them turn pages, skip around, and walk away — every minute with a book counts. Books with single, nameable pictures work better than long stories for restless toddlers.",
            },
            {
                question: "Are these books good for learning Hindi?",
                answer: "Yes. The Miko books show Hindi and English together for every concept, so a child raised mostly in English picks up everyday Hindi words naturally — and vice versa.",
            },
        ],
        related: ["books-for-3-year-old", "books-for-1-year-old"],
        match: (p) => startAge(p) <= 2,
    },
    {
        slug: "books-for-3-year-old",
        keyword: "books for 3 year old",
        title: "Books for 3 Year Olds",
        metaTitle: "Best Books for 3 Year Olds in India",
        metaDescription:
            "Books for 3 year olds that spark questions — Indian festivals, mythology, manners, and values, told in Hindi and English for curious preschoolers.",
        eyebrow: "Shop by age",
        intro: [
            "Three year olds ask why. Why do we light diyas? Why does the elephant god have one tooth? Why do we say thank you? The best books for this age treat those questions with respect — they give real answers in small words, and they open the door to the next question.",
            "This is when books can start carrying culture, not just vocabulary. A three year old is ready to meet Ganesha and Hanuman as characters, to understand that Holi means colours and Diwali means lamps, and to connect the values in a story — sharing, courage, kindness — to what happened at playschool this morning.",
            "Language-wise, three is when many Indian kids tip hard into English, especially once school starts. Keeping Hindi alive now takes deliberate, joyful exposure — and a book where Hindi sits right next to English on the page is the gentlest way to do it. No drills, just stories and naming games in both languages.",
            "These books are chosen for exactly this stage: curious minds, growing attention spans, and hearts ready for stories with meaning.",
        ],
        faqs: [
            {
                question: "What books hold a 3 year old's attention?",
                answer: "Books with characters they recognise across pages, questions they can answer, and themes from their own life. At three, children can follow simple story arcs and love being asked 'what happens next?'",
            },
            {
                question: "Is 3 a good age for mythology books?",
                answer: "Yes, if the telling is gentle and visual. Three year olds meet Ganesha and Krishna the way they meet any beloved character — through pictures and simple stories, long before the philosophy matters.",
            },
            {
                question: "How do I keep Hindi going once school is in English?",
                answer: "Make Hindi part of pleasure, not homework. Bilingual books let you read the same page in both languages, so Hindi stays connected to warmth and story time rather than becoming a subject.",
            },
        ],
        related: ["indian-mythology-books-for-kids", "books-for-2-year-old"],
        match: (p) => startAge(p) <= 3,
    },
    {
        slug: "hindi-books-for-kids",
        keyword: "hindi books for kids",
        title: "Hindi Books for Kids",
        metaTitle: "Hindi Books for Kids & Toddlers (Ages 0-5)",
        metaDescription:
            "Hindi books for kids aged 0-5 with English alongside — first words, festivals, and stories that keep Hindi alive at home, even in English-first families.",
        eyebrow: "Shop by language",
        intro: [
            "Most Indian parents want their children to know Hindi. Most Indian children's bookshelves are almost entirely English. That gap is where Hindi quietly slips away — not because anyone decided to drop it, but because the books, the school, and the cartoons all pull one way.",
            "Hindi books for kids close that gap, and the earlier the better. A child who hears Hindi words in a parent's voice at story time files them under love and comfort, not under 'subject'. By the time school makes everything English, Hindi already has a home.",
            "We made the Miko series bilingual rather than Hindi-only for a practical reason: in many homes, the parent reading aloud is more comfortable in English. With Hindi and English on the same page, anyone can read the book — Mumma, Papa, Nani, or the babysitter — and the child gets both languages every single time. The Hindi is real, everyday Hindi: haathi, diya, namaste, pyaar — words a child can use at the dinner table tonight.",
            "If you want your child's first hundred Hindi words to arrive with pictures, cuddles, and zero pressure, start here.",
        ],
        faqs: [
            {
                question: "My child only responds in English. Will Hindi books help?",
                answer: "Yes — understanding comes before speaking. Keep reading and naming in Hindi without forcing replies; comprehension builds silently and speech follows when the child is ready.",
            },
            {
                question: "I can't read Devanagari fluently. Can I still use these books?",
                answer: "Yes. The Miko books pair every Hindi word with English on the same page, so you can read confidently regardless of which script you are stronger in.",
            },
            {
                question: "What age should Hindi books start?",
                answer: "From birth. Babies tune into the sounds of a language long before they speak — the earlier Hindi enters story time, the more native it feels later.",
            },
        ],
        related: ["bilingual-books-for-children", "books-for-2-year-old"],
        match: (p) => /hindi/i.test(p.language),
    },
    {
        slug: "bilingual-books-for-children",
        keyword: "bilingual children's books india",
        title: "Bilingual Books for Children",
        metaTitle: "Bilingual Hindi-English Books for Children",
        metaDescription:
            "Bilingual Hindi-English books for children aged 0-5. Both languages on every page, so kids grow up fluent in their world and their roots.",
        eyebrow: "Shop by language",
        intro: [
            "A bilingual book is a simple idea with an outsized payoff: both languages, same page, same picture. The child's brain does the rest — mapping two words to one meaning, switching between them without effort, building the wiring that research consistently links to stronger attention and flexible thinking.",
            "For Indian families the case is even more direct. English is the language of school and, increasingly, of the playground. Hindi (or any mother tongue) is the language of grandparents, festivals, songs, and home. A child fluent in both moves through their whole world without a gap — they can follow the bedtime story and the phone call to Nani.",
            "What makes a bilingual book actually work is balance. If the Hindi is tiny, decorative, or tucked in a corner, children learn that it is the less important language. In the Miko series both languages get equal weight on every page, read in whichever order your family prefers. Read it in English on Monday and Hindi on Tuesday — the pictures hold the meaning steady while the words switch.",
            "These are the books we would put in every Indian nursery: simple, beautiful, and quietly doing double duty.",
        ],
        faqs: [
            {
                question: "Will two languages in one book confuse my child?",
                answer: "No. Decades of bilingualism research show children separate languages naturally. Mixing at this age is a normal phase of sorting, not confusion.",
            },
            {
                question: "How do I read a bilingual book aloud?",
                answer: "Any way you like: one language per sitting, both languages per page, or follow your child's requests. There is no wrong order — consistency of exposure matters more than method.",
            },
            {
                question: "We speak a different mother tongue, not Hindi. Are these still useful?",
                answer: "Yes — the English text works on its own, and the Hindi gives your child a bridge to India's most widely spoken language alongside the mother tongue you speak at home.",
            },
        ],
        related: ["hindi-books-for-kids", "books-for-1-year-old"],
        match: isBilingual,
    },
    {
        slug: "indian-mythology-books-for-kids",
        keyword: "mythology books for kids",
        title: "Indian Mythology Books for Kids",
        metaTitle: "Indian Mythology Books for Kids & Toddlers",
        metaDescription:
            "First Indian mythology books for kids aged 0-5 — meet Ganesha, Krishna, and the festivals of India through gentle pictures and bilingual Hindi-English text.",
        eyebrow: "Shop by theme",
        intro: [
            "Every Indian child eventually asks who Ganesha is. Maybe at a temple, maybe at a neighbour's Ganpati celebration, maybe pointing at the idol on your shelf. Indian mythology books for kids exist so that the answer can be a delighted story rather than a fumbled summary.",
            "For the youngest readers, mythology is not theology — it is characters. An elephant-headed god who loves sweets. A blue baby who steals butter. A monkey who can fly. These figures belong in a toddler's imagination the same way any beloved character does, and meeting them early makes every festival, every temple visit, and every grandparent's story land richer.",
            "We keep first mythology gentle and visual: warm illustrations, a few words per page in Hindi and English, and the festivals woven in — because for a small child, Diwali and Holi are how mythology shows up in real life. The stories behind the celebrations can deepen year by year; the love for them starts now.",
            "Start with the gods and goddesses book, add the festivals book, and watch your child start narrating the next puja to you.",
        ],
        faqs: [
            {
                question: "What age can children start mythology books?",
                answer: "From around age one as picture books — naming Ganesha like they name an elephant — and from age three as simple stories. Depth grows with the child.",
            },
            {
                question: "Are these books religious instruction?",
                answer: "No. They introduce gods, goddesses, and festivals as culture and story — figures every Indian child will encounter — leaving each family to add its own beliefs and practice.",
            },
            {
                question: "Why pair mythology with festivals?",
                answer: "Because festivals are where young children actually meet mythology: the Ganesha idol, the Diwali diyas, the Holi colours. Connecting books to lived celebrations makes both more meaningful.",
            },
        ],
        related: ["books-for-3-year-old", "birthday-gift-books-for-toddlers"],
        match: (p) => hasTag(p, "mythology", "culture", "festivals"),
    },
    {
        slug: "birthday-gift-books-for-toddlers",
        keyword: "birthday gift for 2 year old",
        title: "Birthday Gift Books for Toddlers",
        metaTitle: "Birthday Gift Books for Toddlers (1-5 Years)",
        metaDescription:
            "Looking for a birthday gift a toddler will keep? Beautiful bilingual Indian books — better than another toy, remembered long after the party.",
        eyebrow: "Gifting",
        intro: [
            "Toys break, plastic gets forgotten in a week, and every toddler already owns four versions of the same stacking ring. A book is the birthday gift that outlasts the party: read at bedtime for years, remembered as 'the one Masi gave me', and quietly doing good every single night.",
            "The trick is choosing a book that feels like a gift. It should be beautiful enough to unwrap — rich illustrations, a cover that makes the birthday child grab it — and right for the age, so it gets used now rather than shelved for later. For one and two year olds, that means bold pictures and first words; for three to five, stories with characters and meaning.",
            "Books with Indian roots make especially thoughtful gifts. Most toddlers' shelves are full of farm animals and yellow school buses; a book where the festivals, food, and faces look like the child's own world stands out instantly — and grandparents love seeing Hindi on the page.",
            "Gift one book, or gift the complete Miko set and become the relative who gave them their whole first library. Either way, you are giving bedtime, not landfill.",
        ],
        faqs: [
            {
                question: "What is a good book gift for a 2 year old's birthday?",
                answer: "A sturdy picture book with bright single-image pages and a theme they love — animals and everyday actions are reliable hits at two. The Miko animal and action books are made for exactly this age.",
            },
            {
                question: "Is the complete set too much for a gift?",
                answer: "It is the gift parents remember. Five books cover animals, festivals, manners, actions, and mythology — a complete first library, and the bundle pricing makes it generous without being extravagant.",
            },
            {
                question: "Do you include anything for gifting?",
                answer: "Every order ships well-protected, and you can message us on WhatsApp after ordering for a personal gift note — we are happy to include one.",
            },
        ],
        related: ["baby-shower-gift-books", "books-for-2-year-old"],
        match: () => true,
    },
    {
        slug: "baby-shower-gift-books",
        keyword: "baby gift books india",
        title: "Baby Shower Gift Books",
        metaTitle: "Baby Shower Gift Books — Start Their First Library",
        metaDescription:
            "Skip the third baby blanket. Gift books at the baby shower or godh bharai — bilingual Indian board books that start a child's library from day one.",
        eyebrow: "Gifting",
        intro: [
            "The new parents will receive five blankets, a mountain of onesies in newborn size, and at least two diaper cakes. What almost nobody brings to a baby shower or godh bharai is the thing the child will use every single day for years: books.",
            "Books make unexpectedly perfect baby shower gifts. They do not expire when the baby grows three centimetres. They give exhausted new parents something lovely to do during midnight feeds — reading aloud starts from day one, and a newborn settles to the rhythm of a parent's reading voice long before the pictures mean anything. And a book inscribed with a note from you becomes a keepsake in a way a romper never will.",
            "For an Indian baby, books that carry the culture are an even better start. The Miko books put Hindi and English side by side from the very first page, so the baby grows up hearing both languages as one warm stream — and the gods, festivals, and animals of an Indian childhood are there waiting as the child grows into them.",
            "Bring one book with a handwritten message inside the cover, or bring the complete set and gift the entire first shelf. The blankets will be outgrown by Diwali; your gift will be read for years.",
        ],
        faqs: [
            {
                question: "Are books a good baby shower gift?",
                answer: "One of the best. Reading aloud starts from birth, books never get outgrown the way clothes do, and an inscribed first book becomes a lifelong keepsake.",
            },
            {
                question: "Which books suit a baby who isn't born yet?",
                answer: "High-contrast, simple-image books for the early months, growing into first-words books by age one. The Miko series spans this whole arc, which is why the full set works so well as a shower gift.",
            },
            {
                question: "Can I add a personal message?",
                answer: "Yes — write your note inside the front cover, or message us on WhatsApp after ordering and we will include a gift note with the shipment.",
            },
        ],
        related: ["books-for-1-year-old", "birthday-gift-books-for-toddlers"],
        match: (p) => startAge(p) === 0,
    },
];

export function getCollection(slug: string): CollectionDef | undefined {
    return COLLECTIONS.find((c) => c.slug === slug);
}
