// Bharat ID: what the card looks like, clearly marked as a sample.
import {QRCodeSVG} from 'qrcode.react';
import {WidgetCard} from './Card';

export function SampleIdCard() {
  return (
    <WidgetCard className="p-0! md:p-0!">
      <div className="inverse relative overflow-hidden rounded-t-[22px] p-6 md:p-8">
        <div aria-hidden className="grid-bg absolute inset-0 opacity-40" />
        <div className="relative flex items-start justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <p className="eyebrow">Bharat ID · Sample</p>
            <p className="mt-8 text-sm text-inverse-muted">Name</p>
            <p className="text-xl">Your name here</p>
            <p className="mt-5 text-sm text-inverse-muted">ID</p>
            <p className="num text-2xl! tracking-[0.08em] whitespace-nowrap sm:text-3xl!">0000 0000 00</p>
          </div>
          <div className="shrink-0 rounded-[10px] bg-paper p-2">
            <QRCodeSVG
              value={`${location.origin}/verify`}
              size={84}
              bgColor="transparent"
              fgColor="currentColor"
              className="size-16 text-ink sm:size-[84px]"
            />
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-3 text-center text-xs text-muted">
        <li className="border-r border-rule p-4">10 digits</li>
        <li className="border-r border-rule p-4">Checksum</li>
        <li className="p-4">Public verify</li>
      </ul>
    </WidgetCard>
  );
}
