# Parks Synth Framework — Cyberpunk Alley Robotics Ecosystem

A grounded, physical, mechanical design for robot deployment, classification, capture, modification, and combat. This is street robotics — illegal mods, black-market parts, alley combat rings. Not creatures. Not anime. Engineered.

---

## 1. Terminology (Canonical)

| Term | Definition |
|------|-------------|
| **Synth** | Primary term for robotic units. Manufactured frame units. |
| **Frame Unit** | Internal classification / technical designation. |
| **Forge Cube** | Deployment module. Compressed storage form. Metal cube. |
| **Mag Clamp** | Capture device. Attaches to chassis, runs override, compresses target into cube. |
| **Synth Codex** | Species book. Frame classes, roles, mod compatibility, variants. |
| **Combat Circle** | Arena zone in alley. Physical ring where Synths fight. |

---

## 2. Deployment System Logic

### 2.1 Forge Cube Lifecycle

```
[Pocket] → [Throw] → [Ground Contact] → [Magnetic Lock] → [Panel Split] → [Extrusion] → [Assembly] → [Boot] → [Stand Ready]
```

**States:**
- `STORED` — Cube in pocket inventory
- `IN_FLIGHT` — Cube thrown, arc trajectory
- `LOCKED` — Cube contacts ground, magnetic anchors engage (audible *clunk*)
- `SPLITTING` — Six panels separate along seams (0.8s)
- `EXTRUDING` — Internal frame/limbs extend outward (1.2s)
- `ASSEMBLING` — Joints lock, armor plates slide into place (0.6s)
- `BOOTING` — Power-up sequence, visor/display lights (0.4s)
- `READY` — Synth stands, idle animation, awaiting commands

**Rules:**
- No teleportation. All assembly is spatially continuous.
- Cube must land on valid surface (floor, arena pad). Invalid surface = bounce, no deploy.
- One Synth per deployment. No stacking.
- Deployment is interruptible only during IN_FLIGHT (cube can be caught/deflected).

### 2.2 Pocket Device Logic

- Player has a **pocket deploy device** (physical UI: bottom-center HUD).
- Device holds Forge Cubes (compressed Synths).
- Slots: Quick pocket (2), Wallet (tokens/credits), Cargo C (4), Cargo D (4).
- Drag cube → hand → throw. Same as current implementation, but cubes are now explicitly Forge Cubes.

---

## 3. Synth Classification System

### 3.1 Frame Class (Primary)

| Class | Description | Typical Role |
|-------|-------------|--------------|
| **Slim** | Light chassis, minimal armor, high mobility | Intel, social, hacking |
| **Standard** | Balanced frame, modular mounts | General combat, hybrid |
| **Heavy** | Reinforced chassis, slow, high durability | Frontline, tank |
| **Industrial** | Oversized, industrial-grade parts | Brute, demolition |

### 3.2 Combat Role

| Role | Strength | Weakness |
|------|----------|----------|
| **Social** | Interference, control, scanning | Physical damage |
| **Melee** | Close-range, high impact | Range, mobility |
| **Ranged** | Projectile, suppression | Close quarters |
| **Hybrid** | Adaptive, multi-role | Jack-of-all-trades |
| **Brute** | Raw damage, armor | Speed, evasion |

### 3.3 Intelligence Level

- **L0** — No autonomy. Remote-piloted only.
- **L1** — Basic scripts. Follow, wait, simple attacks.
- **L2** — Tactical. Target priority, positioning, combos.
- **L3** — Adaptive. Learns from combat, personality chips.

### 3.4 Core Manufacturer

Every Synth has a manufacturer tag (lore + mod compatibility):
- **PARK Systems** — Default, starter units
- **Nexus Robotics** — Premium, high-end
- **Alley Forge** — Black-market, unlicensed
- **Salvage** — Rebuilt from parts, unknown origin

---

## 4. Starter Synth Designs

### 4.1 Conversationalist Type

**Frame Class:** Slim  
**Combat Role:** Social  
**Intelligence:** L2  

**Role:**
- Social interaction, intel gathering, negotiation
- Scanning (environment, other Synths)
- Hacking (locks, systems, weak points)

**Combat:**
- Weak physically (low strike, low armor)
- Strong in interference (jamming, control override, debuff)
- Can disable or confuse enemy Synths

**Visual:**
- Slim frame, minimal bulk
- Glowing interface panels (chest, forearms)
- Facial display or visor (emotes, status)
- Exposed wiring/circuitry (intentional design)
- No heavy weapon mounts

**Stats (baseline):**
- Strike: 25 | Block: 20 | Dodge: 55 | Stamina: 70
- Tactics: 80 | Temper: 30
- Special: Interference 70, Scan 60

---

### 4.2 Warrior Type

**Frame Class:** Standard  
**Combat Role:** Melee  
**Intelligence:** L1  

**Role:**
- Combat, protection, arena fights
- Frontline engagement

**Combat:**
- Heavy melee (high strike, high block)
- Projectile capable (secondary mount)
- Balanced stamina

**Visual:**
- Bulkier metal frame
- Visible joints (hydraulic, reinforced)
- Industrial weapon mounts (arms, shoulders)
- Scratched/worn armor (battle-ready)
- No facial display — sensor cluster only

**Stats (baseline):**
- Strike: 70 | Block: 55 | Dodge: 35 | Stamina: 60
- Tactics: 40 | Temper: 65
- Special: Melee 75, Ranged 40

---

## 5. Paid Synth Designs (Premium Unlock)

### 5.1 Tactical Hybrid

**Frame Class:** Standard  
**Combat Role:** Hybrid  
**Intelligence:** L2  

**Role:**
- Combat + scanning
- Battlefield awareness
- Adaptive fighting style

**Combat:**
- Balanced melee and ranged
- Can scan enemy weak points mid-fight
- Switches tactics based on opponent

**Visual:**
- Medium frame, modular sensor array
- Dual-purpose limbs (melee + scan)
- HUD-style visor
- Cleaner lines than Warrior (premium)

**Stats (baseline):**
- Strike: 50 | Block: 45 | Dodge: 50 | Stamina: 65
- Tactics: 70 | Temper: 45
- Special: Scan 55, Melee 50, Ranged 50

---

### 5.2 Industrial Brute

**Frame Class:** Industrial  
**Combat Role:** Brute  
**Intelligence:** L1  

**Role:**
- Massive damage
- Slow, tanky
- Modular weapon mounts

**Combat:**
- Heavy melee, high damage per hit
- Slow attack speed, low dodge
- Can mount multiple weapon types

**Visual:**
- Massive frame, industrial-grade plating
- Visible hydraulic pistons, heavy joints
- Multiple weapon hardpoints (shoulders, arms, back)
- Weld marks, rust, industrial aesthetic

**Stats (baseline):**
- Strike: 90 | Block: 70 | Dodge: 15 | Stamina: 50
- Tactics: 25 | Temper: 85
- Special: Melee 95, Armor 80

---

## 6. Synth Codex Structure

The Codex expands as the player encounters Synths. Each entry:

```yaml
synth_id: string
name: string
frame_class: Slim | Standard | Heavy | Industrial
combat_role: Social | Melee | Ranged | Hybrid | Brute
intelligence: L0 | L1 | L2 | L3
manufacturer: string

# Physical
visual_descriptor: string
height_class: S | M | L | XL
weight_class: Light | Medium | Heavy | Industrial

# Combat
base_stats: { strike, block, dodge, stamina, tactics, temper }
special_stats: { [key]: number }

# Mods
mod_slots: [ "limb", "armor", "processor", "weapon", "personality", "mobility" ]
compatible_mods: string[]  # IDs of mods this frame can use

# Lore
known_variants: string[]
black_market_mods: string[]
encounter_count: number  # How many times player has seen this
captured: boolean
```

**Codex UI:**
- Grid/list of encountered Synths
- Filter by frame class, role, manufacturer
- Search by name
- Expandable details: stats, mod compatibility, variants. 

---

## 7. Arena Combat Framework

### 7.1 Combat Circles

- Physical zones in alley (marked circles, raised platforms)

- **Types:**
  - **1v1** — Standard duel. First to 0 HP or 0 stamina loses.
  - **Swarm** — Multiple Synths per side. Last standing wins.
  - **Territory Defense** — Hold the center for X seconds. Waves of attackers.

### 7.2 Combat Flow

```
[Deploy] → [Synths enter circle] → [Countdown] → [Fight] → [Resolution] → [Rewards]
```

**Resolution:**
- Use existing combat resolver (strike, block, dodge, stamina, tactics, temper)
- Add **Interference** stat for Social types: reduces enemy accuracy, can apply control effects
- Add **Scan** stat: reveals weak points, increases damage on next hit

**Spectators:**
- Players can watch without deploying
- Chat/ether visible
- Bets (credits) optional

### 7.3 Rewards

- **Parts** — Random from pool: limbs, armor, processors, weapons
- **Credits** — Based on win margin, bet multiplier
- **Codex** — Unlock encountered enemy Synth in Codex

---

## 8. Capture System Logic

### 8.1 Mag Clamp Device

- Separate device from Forge Cube
- Stored in pocket (Cargo slot)
- Must be equipped/selected before use

### 8.2 Capture Process

```
[Target weakened] → [Mag Clamp thrown] → [Clamp attaches] → [Override sequence] → [Compression] → [Cube stored]
```

**Conditions:**
- Target HP below threshold (e.g. 25%)
- Target not already owned
- Target is "capturable" (wild or enemy, not ally)
- Valid surface (clamp must land on target)

**Override sequence:**
- 2–3 second process
- Target can be freed if clamp is destroyed during override
- On success: target compresses into Forge Cube, added to inventory

**Failure:**
- Target breaks free (stamina/strength check)
- Clamp is destroyed
- Clamp misses (invalid throw)

**Black-market mod:** Clamp can be upgraded for higher capture rate (lower HP threshold, faster override).

---

## 9. Modification System (Replaces Evolution)

Synths do **not** evolve. They are **modified** through parts.

### 9.1 Part Categories

| Category | Effect | Slot |
|----------|--------|------|
| **Limb** | Strike, block, mobility | Arm/leg |
| **Armor** | HP, block, durability | Torso, limbs |
| **Processor** | Tactics, intelligence, speed | Core |
| **Weapon** | Strike, ranged, special | Mount |
| **Personality** | Temper, behavior, dialogue | Core |
| **Mobility** | Dodge, speed, stamina | Legs, thrusters |

### 9.2 Part Sources

- **Marketplace** — Buy with credits
- **Arena wins** — Random drops from combat
- **Stealing** — Pickpocket, black-market heists
- **Salvaging** — Destroyed Synths yield parts (damaged, need repair)

### 9.3 Modification Flow

```
[Part acquired] → [Synth selected] → [Compatibility check] → [Install] → [Stat update]
```

### 9.4 Mod Compatibility

- Each Synth has `mod_slots` and `compatible_mods`
- Parts have `compatible_frames` (which frame classes can use them)
- **Black-market mods** — Unlicensed, higher risk, unique effects. May void warranty / attract attention.

---

## 10. Player Progression Loop

```
Enter world
    → Receive 2 starter Synths (Conversationalist + Warrior)
    → Walk alley
    → See combat zones
    → Deploy Forge Cube
    → Synth assembles
    → Fight
    → Win parts + credits
    → Modify Synth
    → Build stronger unit
    → Capture new Synths (Mag Clamp)
    → Expand Codex
    → Unlock paid Synths (optional)
    → Repeat
```

**Progression gates:**
- Credits for marketplace parts
- Arena wins for part drops
- Codex for intel (weak points, strategies)
- Reputation for black-market access

---

## 11. Visual Design Rules

### 11.1 Physical

- All assembly is mechanical. No magic, no teleportation.
- Joints, hydraulics, pistons visible where appropriate.
- Weld marks, scratches, wear. Battle-ready, not pristine.

### 11.2 Color Palette

- **Primary:** Metal (gunmetal, steel, brushed aluminum)
- **Accent:** Construction orange (PARK), moon red (danger), brass (industrial)
- **Tech:** Glowing panels (cyan, amber, green for status)
- **Avoid:** Pastels, neon pink, cartoon colors

### 11.3 Silhouette

- Each Synth type has a distinct silhouette
- Slim = narrow, tall
- Warrior = broad, armored
- Brute = heavy, blocky
- Industrial = oversized, industrial

### 11.4 Not Allowed

- Cartoony proportions
- Anime aesthetics
- Creature-like features (fur, organic shapes)
- Cute or mascot-style design

---

## 12. Implementation Checklist

### 12.1 Rename Existing

- [ ] "Robot" → "Synth" in UI, code, copy
- [ ] "Capsule" → "Forge Cube"
- [ ] "Training robot" → "Conversationalist Starter" (or similar)

### 12.2 New Systems

- [ ] Synth classification (frame class, role, manufacturer)
- [ ] Codex data structure + UI
- [ ] Mag Clamp device + capture flow
- [ ] Modification system (parts, slots, compatibility)
- [ ] Arena combat types (1v1, swarm, territory)

### 12.3 Starter Synths

- [ ] Conversationalist: slim frame, visor, interference stats
- [ ] Warrior: heavy frame, weapon mounts, melee stats

### 12.4 Paid Synths

- [ ] Tactical Hybrid: hybrid stats, scan + combat
- [ ] Industrial Brute: massive frame, brute stats

### 12.5 Deployment

- [ ] Multi-stage assembly animation (split → extrude → assemble → boot)
- [ ] No teleportation; all physical

---

## 13. Extensibility

New Synths can be added infinitely by:

1. Defining `frame_class`, `combat_role`, `intelligence`
2. Setting base stats and special stats
3. Listing compatible mod slots
4. Adding manufacturer tag
5. Registering in Codex

The framework is internally consistent: every Synth fits the same classification, modification, and combat systems.
