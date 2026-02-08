# Mathematical Formulas Reference
## Decay, Perspective, Velocity, and Reinforcement Formulas

---

## DECAY FORMULAS

### 1. Exponential Decay
**Formula:** `x(t) = x₀ × e^(-λt)`

**Parameters:**
- `x₀` = initial value
- `λ` (lambda) = decay constant (rate of decay)
- `t` = time
- `e` = Euler's number (~2.718)

**What it does:** Value decreases exponentially over time, approaching zero asymptotically.

**Common Uses:**
- Radioactive decay (half-life calculations)
- Population decline
- Temperature cooling (Newton's law)
- Signal attenuation in electronics
- Memory retention curves
- **Your system:** Health decay, exponential entropy component

**Example:** If λ = 0.1 and x₀ = 100, after t=10: x(10) = 100 × e^(-1) ≈ 36.8

---

### 2. Damped Oscillation Decay
**Formula:** `x(t) = x₀ × e^(-λt) × cos(ωt)`

**Parameters:**
- `x₀` = initial amplitude
- `λ` (lambda) = damping coefficient
- `ω` (omega) = angular frequency
- `t` = time

**What it does:** Oscillates while decaying exponentially. The oscillation amplitude decreases over time.

**Common Uses:**
- Spring-mass-damper systems
- RLC circuits (electrical)
- Pendulum with friction
- Sound wave attenuation
- Vibration damping
- **Your system:** Entropy and memory oscillations (damped component)

**Example:** A pendulum swinging with air resistance follows this pattern.

---

### 3. Visits-Based Health Decay
**Formula:** `h(t) = h₀ × exp(-k / (visits + ε) × Δt)`

**Parameters:**
- `h₀` = current health
- `k` = decay rate constant
- `visits` = number of visits/activity
- `ε` (epsilon) = small constant to prevent division by zero
- `Δt` = time delta

**What it does:** Health decays slower when there's more activity (visits). More activity = slower decay.

**Common Uses:**
- System health monitoring
- Resource depletion models
- Activity-based degradation
- **Your system:** Health metric calculation

**Behavior:** High visits → slower decay. Low visits → faster decay.

---

### 4. Linear Decay
**Formula:** `x(t) = x₀ - rt`

**Parameters:**
- `x₀` = initial value
- `r` = decay rate (constant)
- `t` = time

**What it does:** Value decreases linearly at a constant rate.

**Common Uses:**
- Battery discharge (simplified)
- Depreciation
- Countdown timers
- Simple resource consumption

---

### 5. Power Law Decay
**Formula:** `x(t) = x₀ × t^(-α)`

**Parameters:**
- `x₀` = initial value
- `α` (alpha) = decay exponent
- `t` = time

**What it does:** Decays according to a power law, slower than exponential for large t.

**Common Uses:**
- Memory retention (Ebbinghaus forgetting curve)
- Social media engagement decay
- Information diffusion
- Learning curve decay

---

### 6. Logarithmic Decay
**Formula:** `x(t) = x₀ - a × ln(1 + bt)`

**Parameters:**
- `x₀` = initial value
- `a`, `b` = constants
- `ln` = natural logarithm

**What it does:** Decays logarithmically, very slow decay rate.

**Common Uses:**
- Long-term memory models
- Skill retention
- Habit formation decay

---

## PERSPECTIVE FORMULAS

### 1. Perspective Projection (3D to 2D)
**Formula:** 
```
x' = (x × d) / (d + z)
y' = (y × d) / (d + z)
```

**Parameters:**
- `x, y, z` = 3D coordinates
- `d` = distance to projection plane
- `x', y'` = 2D projected coordinates

**What it does:** Projects 3D points onto a 2D plane with perspective (distant objects appear smaller).

**Common Uses:**
- 3D graphics rendering
- Computer vision
- Camera projection
- Game engines
- CAD software

---

### 2. Perspective Matrix (Homogeneous Coordinates)
**Formula:** 
```
[x']   [1  0  0  0] [x]
[y'] = [0  1  0  0] [y]
[z']   [0  0  a  b] [z]
[w']   [0  0 -1  0] [w]
```

Where `a = (far + near) / (far - near)`, `b = (2 × far × near) / (far - near)`

**What it does:** Matrix transformation for perspective projection in graphics pipelines.

**Common Uses:**
- OpenGL/DirectX rendering
- 3D game engines
- Graphics APIs

---

### 3. Field of View (FOV) Calculation
**Formula:** `FOV = 2 × arctan(height / (2 × distance))`

**Parameters:**
- `height` = screen/plane height
- `distance` = distance to projection plane

**What it does:** Calculates the field of view angle for perspective projection.

**Common Uses:**
- Camera settings
- Game FOV configuration
- VR headset calibration

---

### 4. Depth Buffer (Z-Buffer)
**Formula:** `z_buffer = (far + near) / (far - near) - (2 × far × near) / ((far - near) × z)`

**What it does:** Converts world-space Z depth to normalized device coordinates for depth testing.

**Common Uses:**
- 3D rendering depth sorting
- Occlusion culling
- Shadow mapping

---

## VELOCITY FORMULAS

### 1. Constant Velocity
**Formula:** `v = Δx / Δt`

**Parameters:**
- `v` = velocity
- `Δx` = displacement
- `Δt` = time interval

**What it does:** Calculates velocity as change in position over time.

**Common Uses:**
- Physics calculations
- Animation
- Game movement
- Kinematics

---

### 2. Velocity with Acceleration
**Formula:** `v(t) = v₀ + at`

**Parameters:**
- `v₀` = initial velocity
- `a` = acceleration
- `t` = time

**What it does:** Calculates velocity at time t given initial velocity and constant acceleration.

**Common Uses:**
- Physics simulations
- Projectile motion
- Vehicle physics
- Game engines

---

### 3. Velocity from Position (Derivative)
**Formula:** `v = dx/dt`

**What it does:** Velocity is the derivative of position with respect to time.

**Common Uses:**
- Calculus-based physics
- Motion analysis
- Trajectory calculations

---

### 4. Terminal Velocity
**Formula:** `v_terminal = √(2mg / (ρAC_d))`

**Parameters:**
- `m` = mass
- `g` = gravitational acceleration
- `ρ` (rho) = fluid density
- `A` = cross-sectional area
- `C_d` = drag coefficient

**What it does:** Maximum velocity reached when drag equals gravitational force.

**Common Uses:**
- Falling objects in air
- Parachute calculations
- Physics simulations

---

### 5. Angular Velocity
**Formula:** `ω = Δθ / Δt` or `ω = 2πf`

**Parameters:**
- `ω` (omega) = angular velocity
- `θ` (theta) = angular displacement
- `f` = frequency

**What it does:** Rate of rotation (radians per second).

**Common Uses:**
- Rotating objects
- Pendulum motion
- Circular motion
- **Your system:** Phase updates in damped oscillation

---

### 6. Velocity Smoothing (Exponential Moving Average)
**Formula:** `v_smooth = α × v_new + (1 - α) × v_old`

**Parameters:**
- `α` (alpha) = smoothing factor (0-1)
- `v_new` = new velocity reading
- `v_old` = previous smoothed velocity

**What it does:** Smooths velocity readings to reduce noise.

**Common Uses:**
- Sensor data filtering
- Animation smoothing
- Input handling
- **Your system:** Chaos and load calculations use similar smoothing

---

## REINFORCEMENT FORMULAS

### 1. Exponential Reinforcement (Growth)
**Formula:** `x(t) = x₀ × e^(rt)`

**Parameters:**
- `x₀` = initial value
- `r` = growth rate
- `t` = time

**What it does:** Value increases exponentially over time (opposite of decay).

**Common Uses:**
- Population growth
- Compound interest
- Bacterial growth
- Investment returns
- Learning curve (positive)

---

### 2. Logistic Growth (Sigmoid Reinforcement)
**Formula:** `x(t) = K / (1 + A × e^(-rt))`

**Parameters:**
- `K` = carrying capacity (maximum value)
- `A` = constant
- `r` = growth rate
- `t` = time

**What it does:** Grows exponentially initially, then slows and approaches a maximum (S-curve).

**Common Uses:**
- Population growth with limits
- Adoption curves
- Skill learning (plateau effect)
- Market saturation
- Neural network activations

---

### 3. Linear Reinforcement
**Formula:** `x(t) = x₀ + rt`

**Parameters:**
- `x₀` = initial value
- `r` = reinforcement rate
- `t` = time

**What it does:** Value increases linearly at constant rate.

**Common Uses:**
- Simple accumulation
- Score systems
- Resource generation
- Time-based rewards

---

### 4. Power Law Reinforcement
**Formula:** `x(t) = x₀ × t^α`

**Parameters:**
- `x₀` = initial value
- `α` (alpha) = growth exponent
- `t` = time

**What it does:** Grows according to power law (faster than linear, slower than exponential for α < 1).

**Common Uses:**
- Experience point systems
- Skill progression
- Social media follower growth
- Learning curves

---

### 5. Reinforcement Learning (Q-Learning Update)
**Formula:** `Q(s,a) = Q(s,a) + α[r + γ × max(Q(s',a')) - Q(s,a)]`

**Parameters:**
- `Q(s,a)` = Q-value for state-action pair
- `α` (alpha) = learning rate
- `r` = reward
- `γ` (gamma) = discount factor
- `s'` = next state

**What it does:** Updates Q-value based on reward and future expected value.

**Common Uses:**
- Machine learning
- Game AI
- Autonomous systems
- Decision making algorithms

---

### 6. Health Recovery (Your System's Recovery)
**Formula:** `h(t) = h₀ + recovery_rate × visitor_ratio × Δt`

**Parameters:**
- `h₀` = current health
- `recovery_rate` = base recovery rate
- `visitor_ratio` = visits / baseline_visits
- `Δt` = time delta

**What it does:** Health increases when visitor activity is high (above threshold).

**Common Uses:**
- System health monitoring
- **Your system:** Health recovery when visitor_ratio > 0.8

**Behavior:** More visitors → faster recovery. Capped at maximum (100%).

---

### 7. Adaptive Reinforcement (Variable Rate)
**Formula:** `x(t) = x₀ + ∫[r(activity) × dt]`

**What it does:** Reinforcement rate depends on activity level (integral form).

**Common Uses:**
- Dynamic systems
- Activity-based rewards
- Adaptive difficulty
- **Your system:** Health recovery rate adapts to visitor activity

---

## COMBINED FORMULAS (Used in Your System)

### 1. Dual Decay (Exponential + Damped Oscillation)
**Formula:** `x(t) = x_exp(t) + x_damped(t)`

Where:
- `x_exp(t) = x₀ × e^(-λt)` (exponential baseline)
- `x_damped(t) = A × e^(-λt) × cos(ωt)` (oscillation component)

**What it does:** Combines exponential decay with oscillating component.

**Your system uses this for:**
- Entropy: `entropy.exponential + entropyOscillation`
- Memory: `memory.exponential + memoryOscillation`

---

### 2. Smoothing with Noise
**Formula:** `x_smooth = α × x_smooth + (1 - α) × (target + noise)`

**Your system uses this for:**
- Chaos calculation: `chaos = chaos × 0.95 + (targetChaos + random) × 0.05`
- Load calculation: `load = load × 0.9 + (baseLoad + random) × 0.1`

**What it does:** Smoothly transitions toward target value with added noise for realism.

---

## SUMMARY TABLE

| Formula Type | Primary Use | Your System Application |
|-------------|--------------|------------------------|
| Exponential Decay | Natural decay processes | Health decay, entropy baseline |
| Damped Oscillation | Oscillating systems with friction | Entropy/memory oscillations |
| Visits-Based Decay | Activity-dependent decay | Health calculation |
| Perspective Projection | 3D graphics | (Not currently used) |
| Velocity | Motion calculations | Phase updates (ω × Δt) |
| Exponential Reinforcement | Growth processes | Health recovery |
| Logistic Growth | Bounded growth | (Potential for health cap) |
| Dual Decay | Complex decay patterns | Entropy and memory metrics |

---

## NOTES FOR RUST IMPLEMENTATION

1. **Precision**: Use `f64` for all calculations (matches JavaScript's Number type)
2. **Constants**: Define decay parameters as constants in `config.rs`
3. **Time**: Use `chrono` crate for timestamp handling
4. **Random**: Use `rand` crate for noise generation (chaos, load smoothing)
5. **Math**: Rust's `std::f64` has `exp()`, `cos()`, `ln()` functions
6. **State**: Store phase values (entropy.phase, memory.phase) for oscillation continuity
