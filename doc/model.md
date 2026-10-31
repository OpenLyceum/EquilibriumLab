# Equilibrium Lab: model

The chemistry behind the four screens, for teachers and developers. Every mixture is ideal: no
activity coefficients, no non-ideal gas corrections.

## Standard states, K and Q

ΔH° and ΔS° are taken as constant over each reaction's temperature range (the van 't Hoff
approximation), so

```
ΔG° = ΔH° − TΔS° = −RT ln K°
```

| Phase | Standard state | K° is | Relation |
|---|---|---|---|
| Gas | 1 bar | Kp, from partial pressures pᵢ = cᵢRT (bar) | Kc = Kp / (RT)^Δn, R = 0.083145 L·bar/(mol·K) |
| Aqueous | 1 M | Kc, from concentrations (M) | — |

Δn is the change in moles of gas per mole of reaction. Pure water in the cobalt equilibrium never
appears in Q or K. Q is built the same way as K from the current mixture, and Qc/Kc = Qp/Kp, so both
forms always agree on the direction of shift.

## Reactions

Gas-phase ΔH° and ΔS° are computed from the standard enthalpies of formation and standard entropies
in OpenStax *Chemistry 2e*, Appendix G (298.15 K, 1 bar). Generic reactions take K at 298 K (and,
for the unknowns, ΔH°) as parameters; ΔS° = R ln K + ΔH°/298.15 K.

| Reaction | ΔH° (kJ) | ΔS° (J/K) | K°(298 K) | Default T | Kc at default T | T range (K) |
|---|---|---|---|---|---|---|
| N₂O₄ ⇌ 2NO₂ | +57.24 | +175.8 | 0.143 (Kp) | 298 K | 5.76 × 10⁻³ | 273–373 |
| H₂ + I₂(g) ⇌ 2HI | −9.48 | +21.8 | 630 | 700 K | 70.2 | 600–800 |
| N₂ + 3H₂ ⇌ 2NH₃ | −91.80 | −198.1 | 5.4 × 10⁵ (Kp) | 600 K | 11.0 | 550–800 |
| CO + H₂O(g) ⇌ CO₂ + H₂ | −41.20 | −42.0 | 1.1 × 10⁵ | 900 K | 1.58 | 700–1200 |
| Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺ | −10 | +7.4 | 138 | 298 K | 138 | 278–348 |
| Co(H₂O)₆²⁺ + 4Cl⁻ ⇌ CoCl₄²⁻ + 6H₂O(l) | +50 | +119.4 | 3.0 × 10⁻³ | 298 K | 3.0 × 10⁻³ | 278–363 |
| A ⇌ B, A + B ⇌ C, 2A ⇌ B | 0 (adjustable K) | — | 2 | 298 K | 2 | 273–373 |
| Unknown 1 (A + B ⇌ C) | −35 | — | 40 | 298 K | 40 | 273–373 |
| Unknown 2 (A ⇌ B) | +48 | — | 0.05 | 298 K | 0.05 | 273–373 |

Checks against tabulated constants (tested): Kp(N₂O₄, 298 K) ≈ 0.15; Kp(Haber, 298 K) ≈ 6 × 10⁵;
K(water-gas shift, 298 K) ≈ 1 × 10⁵ and ≈ 1 near 1000 K; K(HI, 700 K) ≈ 70, against the classic
54 at 699 K (ΔH° and ΔS° are not quite constant over 400 K).

**The two aqueous values are representative teaching values, not literature data.** The
FeSCN²⁺ formation constant and the cobalt chloride equilibrium depend strongly on ionic strength
and on the acid medium, and published values scatter widely. The sim uses K = 138 with a mildly
exothermic ΔH° (heating fades the red, as in the classroom demonstration) and K = 3 × 10⁻³ with an
endothermic ΔH° of +50 kJ/mol (heating turns the solution blue, adding water turns it pink). The
qualitative behaviour is right; the numbers should not be quoted as measured constants.

The temperature ranges of the HI, Haber and water-gas-shift reactions stop where K becomes so large
that the last of the reactants takes minutes to react; see Kinetics.

## Kinetics

Each reaction is treated as a single elementary step:

```
r_f = k_f Π[reactant]^|ν|      r_r = k_r Π[product]^ν      k_r = k_f / Kc
dξ/dt = V (r_f − r_r)          nᵢ = nᵢ⁰ + νᵢ ξ
```

so the net rate vanishes exactly at Q = K, whatever k_f is. k_f follows the Arrhenius equation from
a reference value; a catalyst multiplies both k_f and k_r by 8, leaving K unchanged.

**These rate laws are illustrative, not the real mechanisms or rates.** The Haber reaction is not a
four-body collision, and N₂O₄ dissociates in microseconds. The reference rate constants are chosen
so each reaction reaches 90 % of the way to equilibrium in about 5–8 s of simulated time at its
default conditions, and the activation energies are kept low (29–40 kJ/mol) so the rate constant
changes by at most about 30× across a temperature range; every temperature on the Van 't Hoff
screen then settles within seconds (with the catalyst that screen keeps in the vessel).

The extent ξ is integrated with fourth-order Runge–Kutta in substeps of at most half the local
relaxation time 1/|d(flux)/dξ|, clamped to the extents where a reactant or a product runs out. If
400 substeps cannot cover a frame (a catalysed reaction at high temperature), the rest of the step
goes straight to the equilibrium extent. Atoms are conserved exactly because every species moves
along ξ.

## Equilibrium solver

ln Qc(ξ) increases monotonically with ξ, from −∞ where a product runs out to +∞ where a reactant
runs out, so the equilibrium extent is the root of ln Qc(ξ) − ln Kc, found by bisection to machine
precision. The solver starts mixtures at equilibrium, sets the ICE problems and draws the
equilibrium reference lines on the Approach chart.

## Particle box

The box draws `particlesPerMole` particles per mole of each species (about 50–150 at the default
amounts, at most 400). It does not run its own chemistry: the mixture reports cumulative forward
and reverse flows (mol of reaction), and the box replays them as events, at most 12 per frame in
each direction. A forward event takes a particle of the first reactant, gathers the nearest
particles of the other reactants it needs, and replaces them with the products at their centroid; a
reverse event does the opposite. Any difference left between the events replayed and the net extent
(after a jump to equilibrium, or a dropped backlog) is corrected the same way, so the counts follow
the amounts to within a few particles.

Particles move in straight lines and bounce off the walls at speeds proportional to √(T/M). The box
height is proportional to the volume. Cl⁻ in the cobalt equilibrium is in large excess, so it is
drawn as a background density and takes no part in events. The vessel is tinted by the coloured
species (NO₂ brown, I₂ violet, FeSCN²⁺ red, Co(H₂O)₆²⁺ pink, CoCl₄²⁻ blue), each at full strength
at a set concentration.

## ICE problems

Initial reactant concentrations are 30–90 % of the reaction's largest default concentration (two
significant figures); products are usually absent, and in about one problem in three are present
too, so some problems run in reverse. Haber and cobalt chloride are left out because their ICE
equations are quartic.

- **Find the equilibrium row:** K is given to three significant figures, and the reaction's ΔS° is
  shifted so that rounded K is exact. x is the extent per litre toward products.
- **Find K:** the equilibrium concentration of the first product is given to three significant
  figures; x follows from it, and K is computed from the resulting equilibrium row.

The change row is right if every coefficient equals ν times one common sign; with the sign flipped,
the expected x is negated. x and K are accepted within 2 %. The small-x test reports the change of
the most depleted species as a percentage of its initial concentration against the 5 % rule.

## Le Chatelier stresses

ln Qc and ln Kc are compared before and after each stress:

Reaction time is held while a temperature or piston control is being adjusted. On release,
the lab evaluates the imposed stress before letting the mixture respond. This keeps predictions
independent of how long a control is held. The chart records both sides of the stress at that
same instant; the play/pause selection is preserved.

| Stress | Effect |
|---|---|
| Add or remove a species (25 % of the largest default amount per press) | Q changes, K does not |
| Change the volume (piston) or add water | Q changes by V^(−Δn); no change if Δn = 0 |
| Argon at fixed volume | Total pressure rises; no concentration or partial pressure changes, so neither Q nor K |
| Argon at fixed pressure | The vessel expands (up to its largest volume), diluting the gases: like an expansion |
| Heat or cool | K changes (up when ΔH° > 0), Qc does not; in the Kp form Qp also changes a little at fixed volume |
| Catalyst | Neither Q nor K; equilibrium is reached faster |

## Van 't Hoff

K° is read from the settled mixture once |ln(Q/K)| < 0.002. With measurement error on, each ln K gets
a Gaussian error of standard deviation 0.04 (about 4 % in K). The fit is ordinary least squares of
ln K on 1/T:

```
ln K = −(ΔH°/R)(1/T) + ΔS°/R        ΔH° = −R × slope        ΔS° = R × intercept
```

For readable axis values, the graph plots 1000/T. Its displayed slope is therefore the slope
against 1/T divided by 1000. The Fit panel reports this graph slope and uses
ΔH° = −1000R × graph slope (converting J/mol to kJ/mol for the final readout).

The ΔG° plot shows −RT ln K at each measured point and the line ΔH° − TΔS° from the fit; it crosses
zero at T = ΔH°/ΔS° when ΔH° and ΔS° have the same sign.
