// 1 palette = 30 œufs, 1 carton = 12 palettes = 360 œufs.
const OEUFS_PAR_PALETTE = 30;
const PALETTES_PAR_CARTON = 12;
const OEUFS_PAR_CARTON = OEUFS_PAR_PALETTE * PALETTES_PAR_CARTON; // 360

function oeufsDepuisCartons(cartons, palettes) {
  return (cartons || 0) * OEUFS_PAR_CARTON + (palettes || 0) * OEUFS_PAR_PALETTE;
}

module.exports = { OEUFS_PAR_PALETTE, PALETTES_PAR_CARTON, OEUFS_PAR_CARTON, oeufsDepuisCartons };
