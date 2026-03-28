const categories = {
  Food: {
    words: [
      "Pizza", "Sushi", "Tacos", "Ramen", "Burger", "Pasta", "Dumpling", "Croissant",
      "Pho", "Bibimbap", "Pad Thai", "Satay", "Laksa", "Dim Sum", "Katsu Curry",
      "Banh Mi", "Rendang", "Mochi", "Takoyaki", "Hotpot", "Nasi Goreng", "Spring Roll",
      "Tonkatsu", "Congee", "Char Siu",
    ],
    hints: [
      "doughy", "savory", "handheld", "warm", "cheesy", "filling", "steamed", "flaky",
      "soupy", "mixed", "noodles", "skewered", "spicy", "bite-sized", "crispy",
      "crunchy", "rich", "sweet", "round", "boiling", "fried", "wrapped",
      "breaded", "comfort", "glazed",
    ],
  },
  Drink: {
    words: [
      "Boba Tea", "Espresso", "Lemonade", "Smoothie", "Matcha", "Kombucha", "Milkshake", "Sparkling Water",
      "Thai Tea", "Sake", "Teh Tarik", "Calamansi Juice", "Yakult", "Soju", "Mango Lassi",
      "Chai Latte", "Coconut Water", "Iced Coffee", "Ramune", "Pocari Sweat",
    ],
    hints: [
      "cold", "bitter", "sweet", "fizzy", "green", "tangy", "creamy", "bubbly",
      "orange", "rice", "frothy", "citrus", "probiotic", "strong", "tropical",
      "spiced", "refreshing", "iced", "Japanese", "sporty",
    ],
  },
  Movie: {
    words: [
      "Inception", "Titanic", "Avatar", "Parasite", "Interstellar", "Joker", "Frozen", "The Matrix",
      "Spirited Away", "Oldboy", "Train to Busan", "Your Name", "Crazy Rich Asians", "Minari",
      "Shoplifters", "Everything Everywhere All at Once", "Ip Man", "Howl's Moving Castle",
      "Dangal", "Infernal Affairs", "One Cut of the Dead",
    ],
    hints: [
      "dreamy", "romantic", "visual", "dark", "space", "chaos", "icy", "virtual",
      "magical", "revenge", "zombies", "fate", "wealthy", "farming", "family",
      "multiverse", "martial arts", "whimsical", "wrestling", "undercover", "low budget",
    ],
  },
  Location: {
    words: [
      "Paris", "Tokyo", "Bali", "New York", "Santorini", "Dubai", "Machu Picchu", "Kyoto",
      "Seoul", "Bangkok", "Singapore", "Hanoi", "Osaka", "Jeju Island", "Hong Kong",
      "Taipei", "Da Nang", "Boracay", "Angkor Wat", "Shibuya", "Harajuku", "Chiang Mai",
    ],
    hints: [
      "romantic", "busy", "tropical", "loud", "blue", "tall", "ancient", "peaceful",
      "trendy", "hot", "modern", "charming", "lively", "island", "dense",
      "night markets", "beach", "paradise", "temple", "crossing", "colorful", "chill",
    ],
  },
  Object: {
    words: [
      "Umbrella", "Mirror", "Candle", "Telescope", "Compass", "Hourglass", "Lantern", "Magnifier",
      "Fan", "Chopsticks", "Incense", "Jade Bracelet", "Paper Lantern", "Origami Crane",
      "Lucky Cat", "Wind Chime", "Rice Cooker", "Bento Box", "Tatami Mat",
    ],
    hints: [
      "protective", "reflective", "warm", "far", "direction", "time", "glowing", "close",
      "cooling", "pair", "fragrant", "green", "floating", "folded",
      "waving", "ringing", "steaming", "layered", "soft",
    ],
  },
  Celebrity: {
    words: [
      "Beyoncé", "Elon Musk", "Zendaya", "BTS", "Rihanna", "Taylor Swift", "MrBeast", "Billie Eilish",
      "BLACKPINK", "Son Heung-min", "Manny Pacquiao", "Lisa", "Jungkook", "Naomi Osaka",
      "Simu Liu", "Awkwafina", "Jay Chou", "IU", "Lana Condor", "Hoyeon Jung",
      "Olivia Rodrigo", "Bad Bunny", "Doja Cat",
    ],
    hints: [
      "powerful", "techy", "stylish", "group", "bold", "catchy", "loud", "dark",
      "pink", "soccer", "boxing", "dancing", "golden", "tennis",
      "Marvel", "funny", "piano", "sweet", "rom-com", "model",
      "angsty", "Latin", "quirky",
    ],
  },
  Trends: {
    words: [
      "ASMR", "AI Art", "BeReal", "Cottagecore", "Deinfluencing", "BookTok", "Quiet Luxury", "Goblin Mode",
      "Mukbang", "K-beauty", "Hallyu Wave", "Anime Cosplay", "Matcha Everything", "Skincare Routine",
      "Bubble Tea Craze", "Street Food Tours", "Lo-fi Beats", "Digital Nomad", "Clean Girl Aesthetic",
    ],
    hints: [
      "whisper", "digital", "real", "cozy", "honest", "reading", "subtle", "chaotic",
      "eating", "glowing", "Korean wave", "costume", "green", "layering",
      "chewy", "exploring", "chill", "remote", "minimal",
    ],
  },
  "K-Drama": {
    words: [
      "Squid Game", "Crash Landing on You", "Goblin", "Itaewon Class", "Reply 1988",
      "Vincenzo", "All of Us Are Dead", "My Love from the Star", "Extraordinary Attorney Woo",
      "Hotel Del Luna", "Sweet Home", "True Beauty", "Business Proposal", "Hometown Cha-Cha-Cha",
      "The Glory", "Moving", "Alchemy of Souls",
    ],
    hints: [
      "survival", "border", "immortal", "food", "nostalgia",
      "mafia", "zombies", "alien", "whale",
      "ghost", "monster", "makeover", "office", "seaside",
      "revenge", "superpowers", "magic",
    ],
  },
  Anime: {
    words: [
      "Naruto", "One Piece", "Attack on Titan", "Demon Slayer", "My Hero Academia",
      "Jujutsu Kaisen", "Dragon Ball", "Death Note", "Spy x Family", "Chainsaw Man",
      "Sailor Moon", "Haikyuu", "Fullmetal Alchemist", "Gintama", "One Punch Man",
      "Tokyo Revengers", "Bleach", "Hunter x Hunter",
    ],
    hints: [
      "ninja", "pirate", "titan", "swords", "hero",
      "cursed", "power", "notebook", "family", "devil",
      "moon", "volleyball", "alchemy", "comedy", "bald",
      "gangs", "soul", "hunter",
    ],
  },
  "Asian Food": {
    words: [
      "Kimchi", "Sashimi", "Xiaolongbao", "Tteokbokki", "Gyoza",
      "Hainanese Chicken Rice", "Tom Yum", "Okonomiyaki", "Lumpia", "Miso Soup",
      "Kimbap", "Peking Duck", "Tandoori Chicken", "Samosa", "Pork Belly",
      "Udon", "Siopao", "Japchae", "Tempura", "Adobo",
    ],
    hints: [
      "fermented", "raw", "soup inside", "spicy rice cake", "pan-fried",
      "poached", "sour", "pancake", "fried roll", "warm",
      "rolled", "roasted", "smoky", "triangular", "crispy skin",
      "thick noodle", "steamed bun", "glass noodle", "battered", "vinegar",
    ],
  },
  Music: {
    words: [
      "Dynamite", "Gangnam Style", "Despacito", "Bad Guy", "Blinding Lights",
      "Butter", "Levitating", "Stay", "Flower", "Super Shy",
      "Anti-Hero", "As It Was", "Kill Bill", "Seven", "Cupid",
      "Cruel Summer", "Paint the Town Red", "Makeba",
    ],
    hints: [
      "explosive", "dance", "Latin", "creepy", "neon",
      "smooth", "disco", "duet", "bloom", "shy",
      "villain", "nostalgic", "revenge", "lucky", "love",
      "hot", "red", "African",
    ],
  },
  Gaming: {
    words: [
      "Minecraft", "Genshin Impact", "Valorant", "League of Legends", "Among Us",
      "Pokémon", "Mario Kart", "Zelda", "Roblox", "Fortnite",
      "Elden Ring", "Animal Crossing", "Overwatch", "Stardew Valley", "Honkai Star Rail",
      "Final Fantasy", "Street Fighter", "Persona 5",
    ],
    hints: [
      "blocks", "gacha", "tactical", "lanes", "sus",
      "catch", "racing", "adventure", "build", "battle royale",
      "dark souls", "island", "team", "farming", "train",
      "crystals", "fighting", "stylish",
    ],
  },
};

export default categories;
