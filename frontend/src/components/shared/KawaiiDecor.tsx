import {
  Planet, Browser, Ghost, Folder, Astronaut, Backpack,
  Cat, File as FileIcon, CreditCard, SpeechBubble, IceCream, Mug,
  MOODS,
} from "react-kawaii";

type KawaiiMood = (typeof MOODS)[number];

/** Map module ids to their Kawaii mascot */
const MODULE_CHARACTERS = {
  dashboard: Planet,
  tools: Browser,
  methods: Ghost,
  library: Folder,
  "ai-engine": Astronaut,
  tasks: Backpack,
  calendar: Cat,
  files: FileIcon,
  resources: CreditCard,
  inbox: SpeechBubble,
  default: IceCream,
  empty: Mug,
} as const;

type ModuleId = keyof typeof MODULE_CHARACTERS;

const MODULE_MOODS: Record<string, KawaiiMood> = {
  dashboard: "blissful",
  tools: "happy",
  methods: "excited",
  library: "happy",
  "ai-engine": "blissful",
  tasks: "lovestruck",
  calendar: "happy",
  files: "blissful",
  resources: "happy",
  inbox: "excited",
  default: "blissful",
  empty: "sad",
};

interface KawaiiDecorProps {
  module?: ModuleId;
  size?: number;
  color?: string;
  mood?: KawaiiMood;
  className?: string;
}

export function KawaiiDecor({ module = "default", size = 140, color, mood, className }: KawaiiDecorProps) {
  const Char = MODULE_CHARACTERS[module] || MODULE_CHARACTERS.default;
  const actualMood = mood || MODULE_MOODS[module] || "blissful";

  return (
    <div className={className} style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}>
      <Char size={size} mood={actualMood} color={color || "#83C5BE"} />
    </div>
  );
}

export { MODULE_CHARACTERS, MODULE_MOODS };
export type { ModuleId };
