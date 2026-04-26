// Seeds the events table with a handful of realistic Indian events.
// Idempotent: uses upsert on `slug`, so running twice is safe.
//
// Run:    npm run seed
// Reads:  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error(
    "Missing env vars. Run with: node --env-file=.env scripts/seed.mjs",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

const events = [
  {
    slug: "hackbangalore-2026",
    name: "HackBangalore 2026",
    description:
      "India's biggest student hackathon. 36 hours of building, with mentors from Google, Atlassian, and Razorpay. Past winners have raised seed rounds straight out of the venue.",
    category: "tech",
    city: "Bengaluru",
    venue: "IIIT Bangalore",
    start_date: "2026-07-18",
    end_date: "2026-07-19",
    cover_image_url:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80",
    website_url: "https://hackbangalore.com",
    is_featured: true,
  },
  {
    slug: "tata-mumbai-marathon-2027",
    name: "Tata Mumbai Marathon 2027",
    description:
      "Asia's largest marathon. Full marathon, half, 10K, and Dream Run categories along the Mumbai coastline. Slots fill out months ahead.",
    category: "running",
    city: "Mumbai",
    venue: "CSMT, Fort",
    start_date: "2027-01-17",
    end_date: "2027-01-17",
    cover_image_url:
      "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&q=80",
    website_url: "https://tatamumbaimarathon.procam.in",
    is_featured: true,
  },
  {
    slug: "sunburn-goa-2026",
    name: "Sunburn Festival Goa 2026",
    description:
      "Asia's biggest electronic music festival. Three days of multiple stages, beach views, and the global EDM lineup.",
    category: "music",
    city: "Goa",
    venue: "Vagator Beach",
    start_date: "2026-12-28",
    end_date: "2026-12-30",
    cover_image_url:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80",
    website_url: "https://sunburn.in",
    is_featured: true,
  },
  {
    slug: "pycon-india-2026",
    name: "PyCon India 2026",
    description:
      "The annual gathering of the Indian Python community. Talks, workshops, dev sprints — everything Python.",
    category: "conference",
    city: "Hyderabad",
    venue: "HICC Novotel",
    start_date: "2026-09-26",
    end_date: "2026-09-28",
    cover_image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    website_url: "https://in.pycon.org",
    is_featured: false,
  },
  {
    slug: "mood-indigo-2026",
    name: "IIT Bombay Mood Indigo 2026",
    description:
      "Asia's largest college cultural festival. Pro nights, competitions, workshops — across the IIT-B Powai campus.",
    category: "college",
    city: "Mumbai",
    venue: "IIT Bombay, Powai",
    start_date: "2026-12-19",
    end_date: "2026-12-22",
    cover_image_url:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
    website_url: "https://moodi.org",
    is_featured: false,
  },
  {
    slug: "nh7-weekender-pune-2026",
    name: "NH7 Weekender Pune",
    description:
      "Multi-genre indie music festival across four stages. Indie, metal, hip-hop, electronic — all weekend.",
    category: "music",
    city: "Pune",
    venue: "Mahalaxmi Lawns",
    start_date: "2026-11-28",
    end_date: "2026-11-29",
    cover_image_url:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
    website_url: "https://nh7.in/weekender",
    is_featured: false,
  },
  {
    slug: "ethindia-2026",
    name: "ETHIndia 2026",
    description:
      "The world's largest Ethereum hackathon. 48 hours, $250K+ in prizes, hundreds of builders shipping web3 apps.",
    category: "tech",
    city: "Bengaluru",
    venue: "KTPO Whitefield",
    start_date: "2026-12-05",
    end_date: "2026-12-07",
    cover_image_url:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200&q=80",
    website_url: "https://ethindia.co",
    is_featured: false,
  },
  {
    slug: "ladakh-marathon-2026",
    name: "Ladakh Marathon 2026",
    description:
      "The world's highest marathon at 11,500 ft. Full, half, and 7K runs through Leh's Himalayan landscape.",
    category: "running",
    city: "Leh",
    venue: "Leh Polo Ground",
    start_date: "2026-09-12",
    end_date: "2026-09-13",
    cover_image_url:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
    website_url: "https://ladakhmarathon.com",
    is_featured: false,
  },
];

const { data, error } = await supabase
  .from("events")
  .upsert(events, { onConflict: "slug" })
  .select("slug");

if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${data?.length ?? 0} events:`);
for (const row of data ?? []) console.log(`  - ${row.slug}`);
