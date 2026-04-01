/**
 * Product category configuration.
 *
 * This is the data layer — no React or UI imports.
 * Swap the CATEGORY_OPTIONS object (or the getCategoryOptions function) to pull
 * from an API, QuickBooks, or a settings page without touching any component code.
 *
 * Shape of each entry:
 *   sizes     — selectable size/dimension options
 *   materials — material / stock options (maps to paper_material on the quote)
 *   finishes  — finishing options (maps to color_finish on the quote)
 *   qtyPresets — quick-select quantity buttons shown above the number input
 */

export const CATEGORY_OPTIONS = {
  'Business Cards': {
    sizes: ['Standard 3.5"×2"', 'Square 2.5"×2.5"', 'Mini 3.5"×1.75"', 'European 3.35"×2.17"'],
    materials: ['14pt Gloss Cover', '16pt Gloss Cover', '100lb Uncoated', 'Soft Touch Matte', 'Premium Linen'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate', 'Spot UV', 'Soft Touch Laminate'],
    qtyPresets: [250, 500, 1000, 2500, 5000],
  },
  'Flyers': {
    sizes: ['8.5"×11"', '5.5"×8.5"', '4"×6"', '4"×9"', '11"×17"'],
    materials: ['60lb Uncoated', '80lb Gloss Text', '100lb Gloss Text', '80lb Matte Text'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate'],
    qtyPresets: [250, 500, 1000, 2500, 5000],
  },
  'Brochures': {
    sizes: ['Letter Trifold 8.5"×11"', 'Half-fold 8.5"×11"', 'Z-fold 8.5"×11"', 'Rack Card 4"×9"'],
    materials: ['80lb Gloss Text', '100lb Gloss Text', '80lb Matte Text', '60lb Uncoated'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate'],
    qtyPresets: [250, 500, 1000, 2500, 5000],
  },
  'Booklets': {
    sizes: ['8.5"×11"', '5.5"×8.5"', '8.5"×5.5" Landscape'],
    materials: ['60lb Uncoated / 80lb Cover', '80lb Gloss / 100lb Cover', '100lb Gloss / 14pt Cover'],
    finishes: ['Saddle Stitch', 'Perfect Bound', 'Spiral Bound', 'Wire-O Bound'],
    qtyPresets: [25, 50, 100, 250, 500],
  },
  'Posters': {
    sizes: ['11"×17"', '18"×24"', '24"×36"', '27"×39"', '36"×48"'],
    materials: ['100lb Gloss Text', '100lb Matte Text', 'Lustre Photo Paper', 'Canvas'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate', 'UV Coating'],
    qtyPresets: [1, 5, 10, 25, 50, 100],
  },
  'Banners': {
    sizes: ["2'×4'", "2'×6'", "3'×6'", "4'×8'", 'Custom Size'],
    materials: ['13oz Vinyl', '18oz Vinyl', 'Mesh Vinyl', 'Fabric'],
    finishes: ['None', 'Grommets', 'Pole Pockets', 'Hemmed Edges'],
    qtyPresets: [1, 2, 5, 10, 25],
  },
  'Postcards': {
    sizes: ['4"×6"', '5"×7"', '6"×9"', '6"×11"', '4.25"×5.5" (A2)'],
    materials: ['14pt Gloss Cover', '100lb Uncoated', '16pt Gloss Cover'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate', 'UV Coating'],
    qtyPresets: [250, 500, 1000, 2500, 5000],
  },
  'Stickers': {
    sizes: ['Circle 2"', 'Circle 3"', 'Square 2"×2"', 'Rectangle 3"×2"', 'Custom'],
    materials: ['White Gloss Vinyl', 'White Matte Vinyl', 'Clear Vinyl', 'Kraft Paper'],
    finishes: ['None', 'Gloss Laminate', 'Matte Laminate'],
    qtyPresets: [100, 250, 500, 1000, 2500],
  },
  'Signs': {
    sizes: ['18"×24"', '24"×36"', '4\'×4\'', '4\'×8\'', 'Custom'],
    materials: ['Coroplast', 'Foamcore', 'Aluminum', 'PVC'],
    finishes: ['None', 'Matte Laminate', 'Gloss Laminate', 'UV Coating'],
    qtyPresets: [1, 5, 10, 25, 50],
  },
};

/** Fallback for any category not explicitly configured above. */
export const DEFAULT_OPTIONS = {
  sizes: ['Standard', 'Custom'],
  materials: ['80lb Gloss Text', '100lb Gloss Cover', '60lb Uncoated', 'Vinyl'],
  finishes: ['None', 'Gloss Laminate', 'Matte Laminate'],
  qtyPresets: [100, 250, 500, 1000, 2500],
};

/** Returns options for the given category, falling back to DEFAULT_OPTIONS. */
export function getCategoryOptions(category) {
  return CATEGORY_OPTIONS[category] || DEFAULT_OPTIONS;
}
