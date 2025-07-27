/**
 * Food-related quotes for the TasteBuddy homepage hero section
 * 
 * This file contains inspirational quotes about cooking, food, and sharing meals.
 * Quotes are randomly selected and displayed in the hero section.
 * 
 * To add new quotes:
 * 1. Add them to the quotes array below
 * 2. Follow the existing format with 'text' and 'author' properties
 * 3. Keep quotes concise and inspirational
 * 
 * To remove quotes:
 * 1. Simply delete the quote object from the array
 */

export interface FoodQuote {
  text: string;
  author: string;
}

export const foodQuotes: FoodQuote[] = [
  {
    text: "Cooking is love made visible.",
    author: "Unknown"
  },
  {
    text: "The secret ingredient is always love.",
    author: "Unknown"
  },
  {
    text: "Food is our common ground, a universal experience.",
    author: "James Beard"
  },
  {
    text: "Cooking is one of the strongest ceremonies for life.",
    author: "Laura Esquivel"
  },
  {
    text: "A recipe has no soul. You, as the cook, must bring soul to the recipe.",
    author: "Thomas Keller"
  },
  {
    text: "Food brings people together on many different levels.",
    author: "Emeril Lagasse"
  },
  {
    text: "Good food is the foundation of genuine happiness.",
    author: "Auguste Escoffier"
  },
  {
    text: "Cooking is not about convenience. It's about love and care.",
    author: "Thomas Keller"
  },
  {
    text: "The discovery of a new dish does more for human happiness than the discovery of a new star.",
    author: "Jean Anthelme Brillat-Savarin"
  },
  {
    text: "Food is symbolic of love when words are inadequate.",
    author: "Alan D. Wolfelt"
  },
  {
    text: "Cooking is all about people. Food is maybe the only universal thing that really has the power to bring everyone together.",
    author: "Guy Fieri"
  },
  {
    text: "Food is not rational. Food is culture, habit, craving, and identity.",
    author: "Jonathan Safran Foer"
  },
  {
    text: "To cook is to create, and to create well is an act of integrity.",
    author: "Julia Child"
  },
  {
    text: "The fondest memories are made when gathered around the table.",
    author: "Unknown"
  },
  {
    text: "Life is too short for bad food and boring recipes.",
    author: "Unknown"
  },
  {
    text: "Sharing food with another human being is an intimate act that should not be indulged in lightly.",
    author: "M.F.K. Fisher"
  },
  {
    text: "Food is the thread that weaves through the fabric of our memories.",
    author: "Unknown"
  },
  {
    text: "Every recipe tells a story, every meal creates a memory.",
    author: "Unknown"
  },
  {
    text: "Good cooking is about being inspired by the simple things around you.",
    author: "Gordon Ramsay"
  },
  {
    text: "The kitchen is the heart of the home.",
    author: "Unknown"
  }
];