export type MotionBrand = "aeroglobal" | "branda";

export interface Book {
  id: string;
  cover: string;
  title: string;
  author: string;
  description: string;
}

export const BRANDS: Record<
  MotionBrand,
  { name: string; tagline: string; shelfTitle: string; shelfLead: string }
> = {
  aeroglobal: {
    name: "Folio",
    tagline: "Literary fiction",
    shelfTitle: "The quiet shelf",
    shelfLead: "Four novels where motion stays gentle — unhurried lifts, soft landings.",
  },
  branda: {
    name: "Nocturne",
    tagline: "Thriller & suspense",
    shelfTitle: "After dark",
    shelfLead: "Same grid, sharper timing — tighter snaps, bolder hover, more edge.",
  },
};

export const BOOKS: Record<MotionBrand, Book[]> = {
  aeroglobal: [
    {
      id: "great-gatsby",
      cover: "/assets/covers/great-gatsby.jpg",
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      description: "Jazz-age longing in gold and green light.",
    },
    {
      id: "catcher-in-the-rye",
      cover: "/assets/covers/catcher-in-the-rye.jpg",
      title: "The Catcher in the Rye",
      author: "J.D. Salinger",
      description: "Restless voice, city winter, small rebellions.",
    },
    {
      id: "to-kill-a-mockingbird",
      cover: "/assets/covers/to-kill-a-mockingbird.jpg",
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      description: "Southern heat, moral clarity, childhood witness.",
    },
    {
      id: "the-alchemist",
      cover: "/assets/covers/the-alchemist.jpg",
      title: "The Alchemist",
      author: "Paulo Coelho",
      description: "Desert roads, omens, and the personal legend.",
    },
  ],
  branda: [
    {
      id: "1984",
      cover: "/assets/covers/1984.jpg",
      title: "1984",
      author: "George Orwell",
      description: "Surveillance state, doublethink, cold dread.",
    },
    {
      id: "the-girl-on-the-train",
      cover: "/assets/covers/girl-on-the-train.jpg",
      title: "The Girl on the Train",
      author: "Paula Hawkins",
      description: "Commuter blur, unreliable memory, missing hours.",
    },
    {
      id: "rebecca",
      cover: "/assets/covers/rebecca.jpg",
      title: "Rebecca",
      author: "Daphne du Maurier",
      description: "Manderley shadows and a name that won't fade.",
    },
    {
      id: "the-secret-history",
      cover: "/assets/covers/secret-history.jpg",
      title: "The Secret History",
      author: "Donna Tartt",
      description: "Closed circle, classical guilt, snow on the quad.",
    },
  ],
};
