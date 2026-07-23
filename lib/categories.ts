// Supermarket aisle categories, in the order you'd typically walk a UK store.

export type CategoryId =
  | "produce"
  | "bakery"
  | "meat-fish"
  | "dairy-eggs"
  | "chilled-deli"
  | "frozen"
  | "cupboard"
  | "snacks"
  | "drinks"
  | "household"
  | "health-beauty"
  | "baby"
  | "pet"
  | "other";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  emoji: string;
}

export const CATEGORY_ORDER: CategoryMeta[] = [
  { id: "produce", label: "Fruit & Veg", emoji: "🥦" },
  { id: "bakery", label: "Bakery", emoji: "🥖" },
  { id: "meat-fish", label: "Meat & Fish", emoji: "🥩" },
  { id: "dairy-eggs", label: "Dairy & Eggs", emoji: "🥛" },
  { id: "chilled-deli", label: "Chilled & Deli", emoji: "🧀" },
  { id: "frozen", label: "Frozen", emoji: "🧊" },
  { id: "cupboard", label: "Food Cupboard", emoji: "🥫" },
  { id: "snacks", label: "Snacks & Treats", emoji: "🍫" },
  { id: "drinks", label: "Drinks", emoji: "🧃" },
  { id: "household", label: "Household", emoji: "🧻" },
  { id: "health-beauty", label: "Health & Beauty", emoji: "🧴" },
  { id: "baby", label: "Baby", emoji: "🍼" },
  { id: "pet", label: "Pet", emoji: "🐾" },
  { id: "other", label: "Other", emoji: "🛒" },
];

export const CATEGORY_BY_ID: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORY_ORDER.map((c) => [c.id, c])
) as Record<CategoryId, CategoryMeta>;

// Lexicon: terms (lowercase) mapped to a category. Multi-word terms are
// matched greedily (longest first) by the parser, so "black pepper" wins
// over "pepper" and "dog food" wins over nothing.
const LEXICON: Record<CategoryId, string[]> = {
  produce: [
    "apple", "banana", "orange", "satsuma", "clementine", "tangerine", "lemon",
    "lime", "grape", "strawberry", "raspberry", "blueberry", "blackberry",
    "cherry", "melon", "watermelon", "pineapple", "mango", "peach", "nectarine",
    "pear", "plum", "kiwi", "avocado", "pomegranate", "fig", "date", "rhubarb",
    "tomato", "cherry tomato", "potato", "new potato", "sweet potato", "onion",
    "red onion", "shallot", "garlic", "ginger", "carrot", "parsnip", "swede",
    "turnip", "broccoli", "cauliflower", "cabbage", "red cabbage", "brussels sprout",
    "sprout", "lettuce", "spinach", "kale", "rocket", "watercress", "cucumber",
    "courgette", "zucchini", "aubergine", "eggplant", "pepper", "red pepper",
    "green pepper", "yellow pepper", "bell pepper", "chilli", "chili", "jalapeno",
    "mushroom", "celery", "leek", "spring onion", "asparagus", "green bean",
    "runner bean", "mangetout", "sugar snap pea", "sweetcorn", "corn on the cob",
    "beetroot", "radish", "salad", "salad bag", "mixed salad", "coleslaw mix",
    "butternut squash", "squash", "pumpkin", "coriander", "parsley", "basil",
    "mint", "rosemary", "thyme", "dill", "chives", "lemongrass", "fresh herbs",
    "grapefruit", "passion fruit", "apricot",
  ],
  bakery: [
    "bread", "loaf", "loaf of bread", "white bread", "brown bread", "wholemeal bread", "sourdough",
    "baguette", "bread roll", "rolls", "bap", "bagel", "croissant", "pain au chocolat",
    "brioche", "wrap", "wraps", "tortilla wrap", "pitta", "pitta bread", "naan",
    "naan bread", "crumpet", "english muffin", "muffin", "teacake", "scone",
    "cake", "birthday cake", "doughnut", "donut", "pastry", "danish", "hot cross bun",
    "garlic bread", "breadsticks", "ciabatta",
  ],
  "meat-fish": [
    "chicken", "chicken breast", "chicken thigh", "chicken wings", "whole chicken",
    "chicken drumstick", "beef", "mince", "minced beef", "beef mince", "steak",
    "sirloin", "ribeye", "pork", "pork chop", "pork loin", "bacon", "streaky bacon",
    "back bacon", "sausage", "sausages", "pork sausages", "ham", "gammon", "lamb",
    "lamb chop", "leg of lamb", "turkey", "turkey mince", "duck", "venison",
    "meatball", "meatballs", "burger", "burgers", "beef burger", "chorizo",
    "pepperoni", "salami", "fish", "salmon", "salmon fillet", "cod", "cod fillet",
    "tuna steak", "prawn", "prawns", "king prawns", "shrimp", "haddock", "mackerel",
    "sea bass", "trout", "sardines", "crab", "lobster", "scallops", "mussels",
    "smoked salmon", "fish cake", "fish cakes", "kipper",
  ],
  "dairy-eggs": [
    "milk", "semi skimmed milk", "skimmed milk", "whole milk", "oat milk",
    "almond milk", "soy milk", "soya milk", "coconut milk drink", "lactose free milk",
    "cheese", "cheddar", "cheddar cheese", "mozzarella", "parmesan", "feta",
    "halloumi", "brie", "camembert", "stilton", "goats cheese", "cream cheese",
    "cottage cheese", "grated cheese", "cheese slices", "babybel", "butter",
    "salted butter", "unsalted butter", "margarine", "spread", "yogurt", "yoghurt",
    "greek yogurt", "greek yoghurt", "natural yoghurt", "yoghurts", "fromage frais",
    "cream", "double cream", "single cream", "whipping cream", "creme fraiche",
    "sour cream", "soured cream", "custard", "egg", "eggs", "free range eggs",
    "half dozen eggs", "dozen eggs",
  ],
  "chilled-deli": [
    "hummus", "houmous", "coleslaw", "potato salad", "dip", "dips", "tzatziki",
    "guacamole", "salsa", "olives", "antipasti", "pate", "quiche", "scotch egg",
    "pork pie", "sausage roll", "cooked meats", "sliced ham", "sliced chicken",
    "sliced turkey", "prosciutto", "parma ham", "fresh pasta", "fresh ravioli",
    "fresh tortellini", "gnocchi", "fresh soup", "sushi", "falafel", "tofu",
    "quorn", "vegan sausages", "ready meal", "ready meals", "pizza dough",
    "fresh pizza", "orange juice fresh",
  ],
  frozen: [
    "ice cream", "vanilla ice cream", "ice lolly", "ice lollies", "frozen peas",
    "frozen sweetcorn", "frozen vegetables", "frozen veg", "frozen berries",
    "frozen fruit", "frozen pizza", "pizza", "fish fingers", "fish finger",
    "frozen chips", "chips", "oven chips", "french fries", "hash browns",
    "frozen prawns", "frozen chicken", "chicken nuggets", "frozen pastry",
    "puff pastry", "frozen yorkshire puddings", "yorkshire puddings",
    "frozen garlic bread", "ice", "ice cubes", "sorbet", "frozen waffles",
    "frozen spinach", "frozen mango",
  ],
  cupboard: [
    "pasta", "spaghetti", "penne", "fusilli", "macaroni", "lasagne sheets",
    "lasagne", "noodles", "egg noodles", "rice noodles", "rice", "basmati rice",
    "brown rice", "jasmine rice", "risotto rice", "couscous", "quinoa", "bulgur",
    "flour", "plain flour", "self raising flour", "bread flour", "cornflour",
    "sugar", "caster sugar", "brown sugar", "icing sugar", "granulated sugar",
    "salt", "sea salt", "black pepper", "peppercorns", "olive oil",
    "extra virgin olive oil", "vegetable oil", "sunflower oil", "rapeseed oil",
    "coconut oil", "sesame oil", "vinegar", "balsamic vinegar", "white wine vinegar",
    "apple cider vinegar", "malt vinegar", "soy sauce", "fish sauce", "oyster sauce",
    "worcestershire sauce", "ketchup", "tomato ketchup", "mayonnaise", "mayo",
    "mustard", "dijon mustard", "wholegrain mustard", "english mustard",
    "hot sauce", "sriracha", "sweet chilli sauce", "bbq sauce", "brown sauce",
    "pasta sauce", "tomato sauce", "pesto", "curry sauce", "curry paste",
    "curry powder", "tikka masala", "korma", "tinned tomatoes", "chopped tomatoes",
    "tomato puree", "passata", "baked beans", "beans", "kidney beans",
    "black beans", "butter beans", "cannellini beans", "chickpeas", "lentils",
    "red lentils", "tinned tuna", "tuna", "tinned salmon", "tinned sardines",
    "tinned sweetcorn", "soup", "tinned soup", "tomato soup", "chicken soup",
    "cereal", "cornflakes", "weetabix", "porridge", "porridge oats", "oats",
    "granola", "muesli", "honey", "jam", "strawberry jam", "raspberry jam",
    "marmalade", "peanut butter", "almond butter", "nutella", "chocolate spread",
    "marmite", "golden syrup", "maple syrup", "stock", "stock cubes", "stock cube",
    "chicken stock", "vegetable stock", "beef stock", "gravy", "gravy granules",
    "herbs and spices", "mixed herbs", "oregano", "paprika", "smoked paprika",
    "cumin", "turmeric", "cinnamon", "nutmeg", "chilli powder", "chilli flakes",
    "garlic powder", "onion powder", "bay leaves", "coconut milk", "coconut cream",
    "breadcrumbs", "yeast", "baking powder", "bicarbonate of soda", "vanilla extract",
    "cocoa powder", "chocolate chips", "raisins", "sultanas", "dried apricots",
    "dried fruit", "desiccated coconut", "condensed milk", "evaporated milk",
    "custard powder", "jelly", "angel delight", "taco shells", "taco kit",
    "fajita kit", "tortillas", "crackers for cheese", "rice pudding",
    "instant noodles", "pot noodle", "olive tapenade", "sun dried tomatoes",
  ],
  snacks: [
    "crisps", "salt and vinegar crisps", "cheese and onion crisps", "ready salted crisps",
    "tortilla chips", "doritos", "pringles", "popcorn", "chocolate", "chocolate bar",
    "dark chocolate", "milk chocolate", "white chocolate", "biscuits", "biscuit",
    "digestives", "hobnobs", "rich tea", "custard creams", "bourbon biscuits",
    "cookies", "cookie", "shortbread", "sweets", "candy", "haribo", "wine gums",
    "jelly babies", "mints", "chewing gum", "gum", "nuts", "peanuts", "salted peanuts",
    "almonds", "cashews", "cashew nuts", "pistachios", "walnuts", "mixed nuts",
    "crackers", "cream crackers", "rice cakes", "breadsticks snack", "pretzels",
    "cereal bar", "cereal bars", "granola bar", "granola bars", "protein bar",
    "flapjack", "malt loaf", "dried mango", "banana chips", "trail mix",
    "chocolate buttons", "kitkat", "twix", "snickers", "mars bar", "dairy milk",
  ],
  drinks: [
    "water", "still water", "sparkling water", "bottled water", "juice",
    "orange juice", "apple juice", "cranberry juice", "pineapple juice",
    "grape juice", "tomato juice", "squash", "orange squash", "blackcurrant squash",
    "cordial", "elderflower cordial", "lemonade", "cola", "coke", "diet coke",
    "coke zero", "pepsi", "fanta", "sprite", "irn bru", "fizzy drinks", "fizzy pop",
    "tonic water", "tonic", "ginger beer", "ginger ale", "energy drink", "red bull",
    "monster", "lucozade", "sports drink", "smoothie", "smoothies", "milkshake",
    "iced coffee", "iced tea", "kombucha", "tea", "tea bags", "teabags",
    "green tea", "herbal tea", "peppermint tea", "chamomile tea", "earl grey",
    "coffee", "instant coffee", "ground coffee", "coffee beans", "coffee pods",
    "decaf coffee", "hot chocolate", "cocoa", "beer", "lager", "ale", "stout",
    "cider", "wine", "red wine", "white wine", "rose wine", "rose", "prosecco",
    "champagne", "gin", "vodka", "whisky", "whiskey", "rum", "tequila", "baileys",
    "non alcoholic beer", "alcohol free beer",
  ],
  household: [
    "toilet paper", "toilet roll", "toilet rolls", "loo roll", "kitchen roll",
    "kitchen towel", "paper towels", "napkins", "washing up liquid", "dish soap",
    "fairy liquid", "dishwasher tablets", "dishwasher salt", "rinse aid",
    "laundry detergent", "washing powder", "washing liquid", "laundry pods",
    "fabric softener", "fabric conditioner", "stain remover", "bleach",
    "surface cleaner", "antibacterial spray", "disinfectant", "dettol", "zoflora",
    "multi surface cleaner", "glass cleaner", "window cleaner", "bathroom cleaner",
    "kitchen cleaner", "oven cleaner", "floor cleaner", "toilet cleaner",
    "toilet bleach", "limescale remover", "sponges", "scourers", "cleaning cloths",
    "microfibre cloths", "rubber gloves", "bin bags", "bin liners", "food bags",
    "freezer bags", "sandwich bags", "foil", "tin foil", "aluminium foil",
    "cling film", "baking paper", "greaseproof paper", "parchment paper",
    "batteries", "aa batteries", "aaa batteries", "light bulb", "light bulbs",
    "candles", "matches", "lighter", "air freshener", "febreze", "firelighters",
    "dustbin bags", "washing up sponges", "dish cloths",
  ],
  "health-beauty": [
    "shampoo", "conditioner", "dry shampoo", "shower gel", "body wash", "soap",
    "hand soap", "hand wash", "hand sanitiser", "hand sanitizer", "toothpaste",
    "toothbrush", "toothbrushes", "mouthwash", "dental floss", "floss",
    "deodorant", "antiperspirant", "razors", "razor blades", "shaving foam",
    "shaving gel", "moisturiser", "moisturizer", "face wash", "face cream",
    "body lotion", "lip balm", "sun cream", "sunscreen", "suncream", "after sun",
    "cotton pads", "cotton buds", "cotton wool", "makeup remover", "micellar water",
    "tissues", "pocket tissues", "plasters", "bandages", "antiseptic cream",
    "savlon", "paracetamol", "ibuprofen", "aspirin", "cold and flu tablets",
    "lemsip", "cough syrup", "cough medicine", "throat lozenges", "strepsils",
    "antihistamines", "hay fever tablets", "vitamins", "vitamin c", "vitamin d",
    "multivitamins", "sanitary towels", "tampons", "panty liners", "hair gel",
    "hairspray", "hair dye", "nail varnish remover", "eye drops",
  ],
  baby: [
    "nappies", "diapers", "baby wipes", "wipes", "nappy bags", "nappy cream",
    "sudocrem", "baby food", "baby food pouches", "formula", "baby formula",
    "baby milk", "follow on milk", "baby porridge", "baby rice", "rusks",
    "baby snacks", "baby shampoo", "baby lotion", "baby oil", "baby bath",
    "teething gel", "calpol", "baby rice cakes",
  ],
  pet: [
    "dog food", "wet dog food", "dry dog food", "dog biscuits", "dog treats",
    "dog chews", "dental sticks", "cat food", "wet cat food", "dry cat food",
    "cat treats", "cat litter", "cat milk", "pet food", "bird seed", "fish food",
    "rabbit food", "hamster food", "guinea pig food", "poo bags", "dog poo bags",
  ],
  other: [],
};

// Build a term -> category lookup, and an index of terms grouped by word
// count so the parser can do longest-match-first n-gram scanning.
const TERM_TO_CATEGORY = new Map<string, CategoryId>();
let maxTermWords = 1;

for (const [cat, terms] of Object.entries(LEXICON) as [CategoryId, string[]][]) {
  for (const term of terms) {
    TERM_TO_CATEGORY.set(term, cat);
    const words = term.split(" ").length;
    if (words > maxTermWords) maxTermWords = words;
  }
}

export const MAX_TERM_WORDS = maxTermWords;

function singularize(word: string): string {
  if (word.length > 3 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("oes")) return word.slice(0, -2);
  if (word.length > 2 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

// Look up a phrase in the lexicon, trying the exact phrase first and then a
// singularized version of its last word ("bananas" -> "banana").
export function lookupTerm(phrase: string): CategoryId | undefined {
  const direct = TERM_TO_CATEGORY.get(phrase);
  if (direct) return direct;

  const words = phrase.split(" ");
  const last = words[words.length - 1];
  const singular = singularize(last);
  if (singular !== last) {
    const alt = [...words.slice(0, -1), singular].join(" ");
    return TERM_TO_CATEGORY.get(alt);
  }
  return undefined;
}
