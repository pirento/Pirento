// Blue Dart's API gateway: a JWT from the login call, then a waybill (AWB) for each parcel and its tracking scans.
// shortcut: paths and field names follow Blue Dart's published gateway samples; check them against the developer
// portal (developer.dhl.com, Blue Dart) with the account's keys before going live.
import {ApiError} from '@pirento/shared/server';
import {bluedartOn, config} from '../config.js';

const bd = config.bluedart;
let token = null; // {value, until}: one JWT per process, renewed before it lapses

async function jwt() {
  if (token && token.until > Date.now()) return token.value;
  const res = await fetch(`${bd.url}/token/v1/login`, {
    headers: {ClientID: bd.clientId, clientSecret: bd.clientSecret},
    signal: AbortSignal.timeout(20_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.JWTToken) throw new ApiError(502, 'BLUEDART_FAILED', 'Blue Dart did not sign us in');
  token = {value: json.JWTToken, until: Date.now() + 20 * 3_600_000};
  return token.value;
}

async function call(method, path, body) {
  if (!bluedartOn()) throw new ApiError(503, 'BLUEDART_OFF', 'Blue Dart is not switched on yet');
  const res = await fetch(bd.url + path, {
    method,
    headers: {JWTToken: await jwt(), ...(body ? {'content-type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) token = null;
  if (!res.ok) {
    console.error('bluedart', path, res.status, JSON.stringify(json).slice(0, 300));
    throw new ApiError(502, 'BLUEDART_FAILED', 'Blue Dart did not answer. Try again in a minute.');
  }
  return json;
}

const profile = () => ({LoginID: bd.loginId, LicenceKey: bd.licenceKey, Api_type: 'S'});
/** Splits an address into Blue Dart's three 30-character lines. */
export const addressLines = (address) => {
  const words = String(address).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if (!cur || (cur + ' ' + w).length <= 30) lines[lines.length - 1] = cur ? `${cur} ${w}` : w.slice(0, 30);
    else if (lines.length < 3) lines.push(w.slice(0, 30));
    else lines[2] = `${lines[2]} ${w}`.slice(0, 30);
  }
  return lines;
};

/** Books a parcel: Blue Dart registers the pickup and returns its waybill number (AWB). */
export async function bookWaybill({to, weightKg, pieces, value, ref, pickupAt = new Date()}) {
  const [a1 = '', a2 = '', a3 = ''] = addressLines(to.address);
  const [s1 = '', s2 = '', s3 = ''] = addressLines(bd.shipper.address);
  const r = await call('POST', '/waybill/v1/GenerateWayBill', {
    Request: {
      Consignee: {
        ConsigneeName: to.name.slice(0, 30),
        ConsigneeAddress1: a1,
        ConsigneeAddress2: a2,
        ConsigneeAddress3: a3,
        ConsigneePincode: to.pincode,
        ConsigneeMobile: to.mobile,
      },
      Shipper: {
        CustomerCode: bd.customerCode,
        OriginArea: bd.originArea,
        CustomerName: bd.shipper.name,
        CustomerAddress1: s1,
        CustomerAddress2: s2,
        CustomerAddress3: s3,
        CustomerPincode: bd.shipper.pincode,
        CustomerMobile: bd.shipper.mobile,
        Sender: bd.shipper.name,
      },
      Services: {
        ProductCode: 'A', // Domestic Priority
        PieceCount: pieces,
        ActualWeight: weightKg,
        DeclaredValue: value,
        CreditReferenceNo: ref, // our shipment number: Blue Dart refuses a second waybill for it
        PickupDate: `/Date(${pickupAt.getTime()})/`,
        PickupTime: '1600',
        RegisterPickup: true,
      },
    },
    Profile: profile(),
  });
  const out = r.GenerateWayBillResult ?? r;
  if (out.IsError || !out.AWBNo) {
    const why = (out.Status ?? [])
      .map((s) => s.StatusInformation)
      .filter(Boolean)
      .join('; ');
    throw new ApiError(502, 'BLUEDART_REFUSED', why || 'Blue Dart did not book the parcel');
  }
  return {awb: String(out.AWBNo)};
}

/** Blue Dart's status types, in our words. */
const STATUS = {DL: 'delivered', RT: 'returned', RD: 'returned', UD: 'failed'};

/** Where a parcel is: our status, Blue Dart's own words and the scans, newest first. */
export async function trackWaybill(awb) {
  const q = new URLSearchParams({
    handler: 'tnt',
    action: 'custawbquery',
    loginid: bd.loginId,
    awb: 'awb',
    numbers: awb,
    format: 'json',
    lickey: bd.licenceKey,
    verno: '1',
    scan: '1',
  });
  const r = await call('GET', `/tracking/v1/shipment?${q}`);
  const s = [].concat(r.ShipmentData?.Shipment ?? [])[0];
  if (!s) return null;
  const scans = [].concat(s.Scans ?? []).map((x) => {
    const d = x.ScanDetail ?? x;
    return {at: `${d.ScanDate ?? ''} ${d.ScanTime ?? ''}`.trim(), text: d.Scan ?? '', place: d.ScannedLocation ?? ''};
  });
  return {status: STATUS[s.StatusType] ?? 'in-transit', said: s.Status ?? '', scans};
}
