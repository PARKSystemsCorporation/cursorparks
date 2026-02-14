import { EXOKIN_ROOTS, NUANCE_PREFIXES, TONE_SUFFIXES, ProtoRoot, ToneType } from "./lexicon";
export type { ToneType };

export interface SemanticIntent {
    action: string;      // e.g. "move", "observe"
    subject?: string;    // e.g. "self", "other"
    object?: string;     // e.g. "danger", "bond"
    tone: ToneType;      // e.g. "urgent", "calm"
    nuance?: keyof typeof NUANCE_PREFIXES;
}

export interface ExokinSentence {
    proto: string;       // "Neofloent solivenoxt"
    english: string;     // "I am moving towards danger."
    structure: {
        subject?: string;
        action: string;
        object?: string;
    };
}

export class ExokinLinguist {
    private exokinId: string;
    // Local memory cache: unique key -> { word, weight }
    private memoryCache: Map<string, { word: string; weight: number }> = new Map();

    constructor(exokinId: string) {
        this.exokinId = exokinId;
        this.loadMemory(); // Fire and forget
    }

    private async loadMemory() {
        try {
            const res = await fetch(`/api/exokin/memory?exokinId=${encodeURIComponent(this.exokinId)}`);
            if (res.ok) {
                const data = await res.json();
                // data is ExokinLanguageMemory[]
                for (const item of data) {
                    // Key by meaning + root
                    this.memoryCache.set(`${item.meaning}:${item.root}`, {
                        word: item.word,
                        weight: item.emotionalWeight
                    });
                }
            }
        } catch (e) {
            console.warn("ExokinLinguist: Failed to load memory", e);
        }
    }

    private persistMemory(meaning: string, root: string, word: string, category: string, weight: number) {
        const key = `${meaning}:${root}`;
        // Update local immediately
        this.memoryCache.set(key, { word, weight });

        // Sync remote
        fetch("/api/exokin/memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                exokinId: this.exokinId,
                meaning,
                root,
                word,
                category,
                emotionalWeight: weight,
            }),
        }).catch(e => console.warn("ExokinLinguist: Failed to persist memory", e));
    }

    /**
     * Construct a sentence from an abstract intent.
     * Logic:
     * 1. Check if we have a robust memory for this intent? (Not fully implemented, currently mapped by root)
     * 2. Build from roots
     */
    public construct(intent: SemanticIntent): ExokinSentence {
        const parts: string[] = [];
        const structure: ExokinSentence["structure"] = { action: "", subject: intent.subject, object: intent.object };

        // 1. Subject (Optional)
        if (intent.subject) {
            const rootMeta = this.selectRoot("subject", intent.subject, "neutral");
            // Subject morphology: root + "ar" (standard subject marker from lex) or just bias
            const word = this.formatWord(rootMeta.text, "ar");
            parts.push(word);
        }

        // 2. Action (Core)
        const actionBias = intent.tone === "aggressive" ? "harsh" : "fluid";
        // If not found in roots, default to "var"
        const actionRoot = this.selectRoot("action", intent.action, actionBias);

        const prefix = intent.nuance ? NUANCE_PREFIXES[intent.nuance] : "";
        const suffix = this.getSuffix(intent.tone);

        // Check if we specifically remember a word for this Action+Root?
        // The previous implementation of memory lookup was unique([exokinId, meaning, root]).
        // So we check if we have "movement:flo" cached.
        const memoryKey = `${intent.action}:${actionRoot.text}`;
        const cached = this.memoryCache.get(memoryKey);

        let actionWord = "";
        if (cached && cached.weight > 0.5) {
            // use cached word if strong weight (habit)
            actionWord = cached.word;
        } else {
            // construct new
            actionWord = prefix + actionRoot.text + suffix;
            // save it
            this.persistMemory(intent.action, actionRoot.text, actionWord, "action", 0.1);
        }

        parts.push(this.capitalize(actionWord));
        structure.action = intent.action;

        // 3. Object (Optional)
        if (intent.object) {
            const objBias = intent.tone === "urgent" ? "harsh" : "fluid";
            const objRoot = this.selectRoot("object", intent.object, objBias);
            const objSuffix = intent.tone === "curious" ? "el" : "or";

            const objKey = `${intent.object}:${objRoot.text}`;
            const objCached = this.memoryCache.get(objKey);
            let objWord = "";

            if (objCached && objCached.weight > 0.5) {
                objWord = objCached.word;
            } else {
                objWord = objRoot.text + objSuffix;
                this.persistMemory(intent.object, objRoot.text, objWord, "object", 0.1);
            }

            parts.push(this.capitalize(objWord));
        }

        // Assembly
        const proto = parts.join(" ");
        const english = this.translateIntent(intent);

        return { proto, english, structure };
    }

    private selectRoot(category: string, meaning: string, biasBias: "fluid" | "harsh" | "neutral"): ProtoRoot {
        const roots = EXOKIN_ROOTS[meaning] || EXOKIN_ROOTS["unknown"];
        if (!roots) return { text: "var", bias: "neutral" };

        const biased = roots.filter(r => r.bias === biasBias);
        return biased.length > 0 ? biased[0] : roots[0];
    }

    private getSuffix(tone: ToneType): string {
        const opts = TONE_SUFFIXES[tone];
        return opts[Math.floor(Math.random() * opts.length)];
    }

    private formatWord(root: string, suffix: string): string {
        return this.capitalize(root + suffix);
    }

    private capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    private translateIntent(intent: SemanticIntent): string {
        let s = "";
        if (intent.subject === "self") s += "I ";
        else if (intent.subject === "other") s += "You ";

        s += intent.action + " ";

        if (intent.object) s += intent.object;

        if (intent.tone === "urgent") s += " (Urgent)";
        if (intent.tone === "curious") s += "?";

        return s.trim();
    }
}
