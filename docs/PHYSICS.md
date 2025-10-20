# Physics Background

This document explains the physics behind the Electrostatic Field Visualizer.

## Electrostatics Fundamentals

### Point Charges

A point charge is an idealized model of a charged object where all charge is concentrated at a single point. Charges can be positive or negative.

- **Positive charges** (red): Conventionally, protons carry positive charge
- **Negative charges** (blue): Electrons carry negative charge

### Coulomb's Law

The force between two point charges is given by Coulomb's Law:

```
F = k * q₁ * q₂ / r²
```

Where:
- `F` = Force between charges
- `k` = Coulomb's constant
- `q₁, q₂` = Magnitudes of charges
- `r` = Distance between charges

## Electric Field

The electric field `E` at a point describes the force that would be exerted on a unit positive charge at that location.

### Field from a Point Charge

```
E(r) = k * q * r̂ / r²
```

Where:
- `E(r)` = Electric field at position r
- `q` = Source charge
- `r̂` = Unit vector from charge to field point
- `r` = Distance from charge to field point

### Superposition Principle

For multiple charges, the total field is the vector sum of individual fields:

```
E_total(r) = Σᵢ E_i(r)
```

This is the principle used in the visualizer to calculate the field from multiple charges.

## Electric Potential

Electric potential `V` (voltage) is the potential energy per unit charge at a point.

### Potential from a Point Charge

```
V(r) = k * q / r
```

### Relationship to Electric Field

The electric field is the negative gradient of the potential:

```
E = -∇V
```

In 2D (used in this visualizer):
```
E_x = -∂V/∂x
E_y = -∂V/∂y
```

## Field Lines

Electric field lines visualize the direction and strength of the electric field:

1. **Direction**: Tangent to field lines shows field direction at that point
2. **Density**: Closer lines indicate stronger field
3. **Origin**: Field lines originate from positive charges
4. **Termination**: Field lines terminate at negative charges

### Properties of Field Lines

- Never cross each other
- Perpendicular to equipotential surfaces
- Denser where field is stronger
- Always point from high to low potential

## Equipotential Lines

Equipotential lines connect points of equal electric potential.

### Properties

- Perpendicular to electric field lines
- No work required to move charge along equipotential
- Closer spacing indicates stronger field
- Never cross each other

## Numerical Implementation

### Field Calculation

In the shader, we calculate potential at each pixel:

```wgsl
var phi: f32 = 0.0;
for (var i = 0u; i < numCharges; i = i + 1u) {
    let charge = charges[i];
    let dx = pos.x - charge.x;
    let dy = pos.y - charge.y;
    let dist = sqrt(dx * dx + dy * dy);
    phi = phi + charge.q / max(dist, 0.1);
}
```

The `max(dist, 0.1)` prevents division by zero near charges.

### Field Line Integration

Field lines are traced by integrating the field direction:

1. Start near a charge with offset
2. Calculate field at current position
3. Normalize field vector
4. Step in field direction
5. Repeat until termination condition

### Color Mapping

The visualizer maps potential to color:

- **Red spectrum**: Positive potential
- **Blue spectrum**: Negative potential
- **Intensity**: Magnitude of potential

For large potentials, we use logarithmic scaling:
```
if |φ| > 1:
    intensity ∝ 1/φ
else:
    intensity ∝ φ
```

## Physical Units

In this simulation, we use arbitrary units suitable for visualization:

- **Distance**: Screen pixels
- **Charge**: Arbitrary units (typically -250 to +250)
- **Potential**: Dimensionless
- **Coulomb constant**: Implicitly set to 1

## Common Configurations

### Dipole

Two equal and opposite charges:
- Shows symmetric field pattern
- Field lines curve from positive to negative
- Potential zero at perpendicular bisector

### Multiple Charges

With many charges:
- Complex field patterns emerge
- Superposition visible
- Shows principle of electrostatic shielding

## Limitations

1. **2D Simulation**: Real electrostatics is 3D
2. **Point Charges**: Real charges have finite size
3. **Static Fields**: No time-varying fields
4. **Vacuum**: No dielectric materials
5. **Classical**: No quantum effects

## Further Reading

- [Griffiths: Introduction to Electrodynamics](https://en.wikipedia.org/wiki/Introduction_to_Electrodynamics)
- [Feynman Lectures on Physics, Volume II](https://www.feynmanlectures.caltech.edu/)
- [Jackson: Classical Electrodynamics](https://en.wikipedia.org/wiki/Classical_Electrodynamics_(book))
