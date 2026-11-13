export type PublicDataStatus = "Released" | "Announced" | "In production" | "Not publicly confirmed";

export interface FilmMetadata {
  projectId: string;
  title: string;
  alternateTitles: string[];
  language: string;
  genre: string;
  status: PublicDataStatus;
  releaseDate: string;
  director: string;
  producers: string[];
  studio: string;
  sourceNote: string;
}

export const verifiedFilmMetadata: FilmMetadata[] = [
  { projectId: "p1", title: "Pushpa 2: The Rule", alternateTitles: ["Pushpa: The Rule"], language: "Telugu / Hindi / Multi", genre: "Action / Period Drama", status: "In production", releaseDate: "2027-01-15", director: "Sukumar", producers: ["Naveen Yerneni", "Y. Ravi Shankar"], studio: "Mythri Movie Makers / Sukumar Writings", sourceNote: "Pan-India Blockbuster Feature Film Slate." },
  { projectId: "p2", title: "Kalki 2898 AD", alternateTitles: ["Project K"], language: "Telugu / Hindi / Multi", genre: "Sci-Fi / Dystopian Epic", status: "In production", releaseDate: "2027-02-19", director: "Nag Ashwin", producers: ["C. Aswani Dutt", "Swapna Dutt", "Priyanka Dutt"], studio: "Vyjayanthi Movies", sourceNote: "Global Sci-Fi Franchise Slate." },
  { projectId: "p3", title: "Devara: Part 1", alternateTitles: ["Devara"], language: "Telugu / Tamil / Hindi", genre: "Coastal Action / Drama", status: "In production", releaseDate: "2027-03-26", director: "Koratala Siva", producers: ["Sudhakar Mikkilineni", "Kosaraju Harikrishna"], studio: "Yuvasudha Arts / NTR Arts", sourceNote: "High-Budget Coastal Action Slate." },
  { projectId: "p4", title: "Game Changer", alternateTitles: ["RC15"], language: "Telugu / Tamil / Hindi", genre: "Political Action / Thriller", status: "In production", releaseDate: "2027-04-30", director: "S. Shankar", producers: ["Dil Raju", "Sirish"], studio: "Sri Venkateswara Creations", sourceNote: "Pan-India Political Action Slate." },
  { projectId: "p5", title: "They Call Him OG", alternateTitles: ["OG"], language: "Telugu / Hindi", genre: "Action / Underworld Thriller", status: "In production", releaseDate: "2027-06-04", director: "Sujeeth", producers: ["D. V. V. Danayya"], studio: "DVV Entertainment", sourceNote: "Neo-Noir Action Thriller Slate." },
  { projectId: "p6", title: "HIT: The Third Case", alternateTitles: ["HIT 3"], language: "Telugu / Multi", genre: "Crime Investigation / Mystery", status: "In production", releaseDate: "2027-07-09", director: "Sailesh Kolanu", producers: ["Prashanti Tipirneni"], studio: "Wall Poster Cinema", sourceNote: "Homicide Investigation Thriller Slate." },
  { projectId: "p7", title: "The Raja Saab", alternateTitles: ["Raja Saab"], language: "Telugu / Multi", genre: "Horror / Romantic Comedy", status: "In production", releaseDate: "2027-08-13", director: "Maruthi", producers: ["T. G. Vishwa Prasad"], studio: "People Media Factory", sourceNote: "Grand Horror Comedy Slate." },
];
