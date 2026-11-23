// Pirento Green's money and credit formats: rupees with paise for a credit's price, credits from 0.01-credit units.
const whole = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0});
const exact = new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', minimumFractionDigits: 2});
// Paise only when there are some: ₹2,491 but ₹1,245.50.
export const rupees = (paise) => (paise % 100 ? exact : whole).format(paise / 100);
export const credits = (units) => (units / 100).toLocaleString('en-IN', {minimumFractionDigits: 2});
