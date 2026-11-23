// Plantation drives open for tree sponsorship. Price is per tree, in rupees.
export const GREEN_DRIVES = [
  {driveId: 'aravalli-ridge', name: 'Aravalli Ridge Restoration', region: 'Rajasthan', pricePerTree: 99},
  {driveId: 'sundarbans-mangrove', name: 'Sundarbans Mangrove Belt', region: 'West Bengal', pricePerTree: 149},
  {driveId: 'western-ghats', name: 'Western Ghats Corridor', region: 'Karnataka', pricePerTree: 119},
];

// Donating trees: planted on a drive like a sponsorship, but they grow no carbon credits for the giver.
// shortcut: paid to Pirento Green, not a registered charity, so no 80G receipt; move to Pirento Foundation once it is registered.
export const GREEN_DONATION = {slug: 'green-donate', name: 'Donate trees', pricePerTree: 500};
