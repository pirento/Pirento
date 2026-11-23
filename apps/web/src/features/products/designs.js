// How each product home is laid out, so the ten sites feel like ten places built on one system.
//   hero:     split (text + widget) · split-reverse · center (widget below) · editorial (huge type, widget in its own band)
//   features: bento · rows · cards
//   how:      steps (dark band) · timeline (paper, vertical)
//   covers:   the section the widget already is (extra = prices or the product's own list, how), so the page does not repeat it
import {BoxStrip} from './widgets/BoxStrip';
import {ChatSample} from './widgets/ChatSample';
import {EmiWidget} from './widgets/EmiWidget';
import {ExamFacts} from './widgets/ExamFacts';
import {RateCard} from './widgets/RateCard';
import {ReferralFlow} from './widgets/ReferralFlow';
import {SampleIdCard} from './widgets/SampleIdCard';
import {ServiceSearch} from './widgets/ServiceSearch';
import {SpecSheet} from './widgets/SpecSheet';
import {CarbonPrice} from './widgets/CarbonPrice';

export const DESIGNS = {
  legal: {hero: 'split', Widget: ServiceSearch, features: 'bento', how: 'steps'},
  black: {hero: 'editorial', Widget: RateCard, features: 'rows', how: 'timeline', covers: 'extra'},
  green: {hero: 'split-reverse', Widget: CarbonPrice, features: 'cards', how: 'steps'},
  intern: {hero: 'center', Widget: ExamFacts, features: 'rows', how: 'timeline'},
  ai: {hero: 'split', Widget: ChatSample, features: 'cards', how: 'steps', covers: 'extra'},
  vault: {hero: 'editorial', Widget: SpecSheet, features: 'bento', how: 'timeline', covers: 'extra'},
  one: {hero: 'center', Widget: ReferralFlow, features: 'cards', how: 'steps', covers: 'how'},
  capital: {hero: 'split', Widget: EmiWidget, features: 'rows', how: 'timeline'},
  'bharat-id': {hero: 'split-reverse', Widget: SampleIdCard, features: 'bento', how: 'timeline'},
  giftox: {hero: 'center', Widget: BoxStrip, features: 'cards', how: 'steps', covers: 'extra'},
};

export const designFor = (slug) => DESIGNS[slug] ?? DESIGNS.legal;
