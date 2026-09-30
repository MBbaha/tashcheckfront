import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { COMPANY, COMPANY_DETAILS, COMPANY_SHORT, TOLOV_MAQSADI } from '../constants';
import { formatDate, formatMoney, numberToWordsUzbek, padNumber } from '../utils/format';
import './Receipt.css';

/* ---------- Bezaklar (bir marta yaratiladi) ---------- */

// Bank cheklaridagi kabi to'lqinsimon himoya foni (guilloche)
const GUILLOCHE = (() => {
  const W = 720;
  const H = 300;
  let paths = '';
  for (let k = 0; k < 16; k++) {
    let d = '';
    const amp = 14 + k * 1.3;
    const phase = k * 0.42;
    for (let x = 0; x <= W; x += 5) {
      const y =
        H / 2 +
        amp * Math.sin(x * 0.032 + phase) +
        (k - 8) * 11 * Math.cos(x * 0.011 + phase * 0.6);
      d += `${x ? 'L' : 'M'}${x} ${y.toFixed(1)}`;
    }
    paths += `<path d="${d}"/>`;
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">` +
    `<g fill="none" stroke="#2b5fb3" stroke-width="0.55" opacity="0.16">${paths}</g></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
})();

const MICROTEXT = `${COMPANY_SHORT} · KVITANSIYA · `.repeat(14);

/** QR kodni sinxron PNG rasm qilib beradi (PDF va chop etishda kechikmaydi) */
function qrDataUrl(text) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  const cell = 8;
  const pad = 1; // oq hoshiya (modul)
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = (n + pad * 2) * cell;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0b1a33';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (modules.data[y * n + x]) ctx.fillRect((x + pad) * cell, (y + pad) * cell, cell, cell);
    }
  }
  return canvas.toDataURL('image/png');
}

const toNum = (v) => Number(String(v ?? '').replace(/\s/g, '')) || 0;
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const F = ({ label, value, className = '', strong }) => (
  <div className={`rc-f ${className}`}>
    <span className="rc-f__l">{label}</span>
    <span className={`rc-f__v${strong ? ' rc-f__v--strong' : ''}`}>{value || ' '}</span>
  </div>
);

/* ---------- Kvitansiya: 190 × 80 mm ---------- */

const Receipt = forwardRef(function Receipt({ data, draft = false }, ref) {
  const summa = toNum(data.summa);
  const extra = toNum(data.qoshimchatolov);
  const no = padNumber(data.tartibraqam);
  const chekSana = formatDate(data.createdAt || new Date());
  const uchish = data.sana ? formatDate(data.sana, { utc: true }) : '';
  const words = summa ? `${capitalize(numberToWordsUzbek(summa))} 00 tiyin` : '';
  const phone = data.phonenumber ? `+998 ${data.phonenumber}` : '';
  const people = data.amountpeople ? `${data.amountpeople} nafar` : '';

  const qr = useMemo(
    () =>
      qrDataUrl(
        [
          COMPANY_SHORT,
          `Kvitansiya No ${no}`,
          `Sana: ${chekSana}`,
          `To'lovchi: ${data.fullname || '-'}`,
          `Summa: ${formatMoney(summa)} so'm`,
          `Kassir: ${data.kassir || '-'}`,
        ].join('\n')
      ),
    [no, chekSana, data.fullname, summa, data.kassir]
  );

  const details = [
    COMPANY_DETAILS.stir && `STIR: ${COMPANY_DETAILS.stir}`,
    COMPANY_DETAILS.manzil,
    COMPANY_DETAILS.telefon && `Tel: ${COMPANY_DETAILS.telefon}`,
  ].filter(Boolean);

  const micrDate = chekSana.replace(/\./g, '');

  return (
    <div className="rc" ref={ref}>
      {/* ===== TALON (kassada qoladi) ===== */}
      <section className="rc-stub" style={{ backgroundImage: GUILLOCHE }}>
        <div className="rc-stub__brand">{COMPANY_SHORT}</div>
        <div className="rc-stub__title">Kassa kirim orderi</div>
        <div className="rc-stub__no">
          № <b>{no}</b>
          <span>{chekSana}</span>
        </div>

        <F className="rc-f--wrap" label="Kimdan qabul qilindi" value={data.fullname} />
        <F label="Asos (to'lov maqsadi)" value={TOLOV_MAQSADI} />
        <div className="rc-stub__pair">
          <F label="Uchish" value={uchish} />
          <F label="Kishi" value={people} />
        </div>
        <div className="rc-stub__sum">
          <span>Summa</span>
          <b>{formatMoney(summa)} so'm</b>
        </div>
        {extra > 0 && <F label="Qo'shimcha (xona)" value={`${formatMoney(extra)} so'm`} />}

        <div className="rc-stub__sign">
          <span className="rc-f__l">Kassir</span>
          <div className="rc-line" />
          <small>{data.kassir}</small>
        </div>
        <div className="rc-stub__foot">Talon · kassada qoladi</div>
      </section>

      {/* ===== QIRQISH CHIZIG'I ===== */}
      <div className="rc-cut" aria-hidden="true">
        <span>✂</span>
      </div>

      {/* ===== KVITANSIYA (to'lovchiga beriladi) ===== */}
      <section className="rc-main" style={{ backgroundImage: GUILLOCHE }}>
        <div className="rc-micro" aria-hidden="true">{MICROTEXT}</div>
        <div className="rc-emblem" aria-hidden="true">R</div>

        <header className="rc-head">
          <div className="rc-brand">
            <div className="rc-logo">R</div>
            <div className="rc-brand__text">
              <b>{COMPANY}</b>
              <small>{[COMPANY_DETAILS.faoliyat, ...details].filter(Boolean).join(' · ')}</small>
            </div>
          </div>
          <div className="rc-doc">
            <div className="rc-doc__title">Kvitansiya</div>
            <div className="rc-doc__no">
              № <b>{no}</b>
            </div>
          </div>
        </header>

        <div className="rc-sub">
          <span>Naqd pul qabul qilinganligi to'g'risida</span>
          <span>
            Sana: <b>{chekSana}</b>
          </span>
        </div>

        <div className="rc-body">
        <div className="rc-rows">
          <div className="rc-row">
            <F className="rc-w3" label="To'lovchi (F.I.Sh.)" value={data.fullname} strong />
            <F className="rc-w2" label="Telefon" value={phone} />
          </div>
          <div className="rc-row rc-row--grid">
            <F className="rc-w3" label="Yashash manzili" value={data.location} />
            <F className="rc-w1" label="Uchish sanasi" value={uchish} />
            <F className="rc-w1" label="Kishilar soni" value={people} />
          </div>
          <div className="rc-row rc-row--grid">
            <F className="rc-w3" label="To'lov maqsadi" value={TOLOV_MAQSADI} />
            <F className="rc-w1" label="Alohida xona" value={data.amountroom || '—'} />
            <F className="rc-w1" label="Qo'shimcha to'lov" value={extra ? `${formatMoney(extra)} so'm` : '—'} />
          </div>
        </div>
        <div className="rc-qrbox">
          <img className="rc-qr" src={qr} alt="QR" />
          <span>Tekshirish</span>
        </div>
        </div>

        <div className="rc-money">
          <div className="rc-money__left">
            <div className="rc-amount">
              <span className="rc-amount__l">Summa</span>
              <span className="rc-amount__v">***{formatMoney(summa)},00</span>
              <span className="rc-amount__c">so'm</span>
            </div>
            <div className="rc-words">
              <span>So'z bilan:</span> {words || ' '}
            </div>
          </div>
        </div>

        <div className="rc-signs">
          <div className="rc-sign">
            <span className="rc-f__l">Qabul qildi (kassir)</span>
            <div className="rc-line" />
            <small>{data.kassir || ' '}</small>
          </div>
          <div className="rc-sign">
            <span className="rc-f__l">To'lovchi</span>
            <div className="rc-line" />
            <small>{data.fullname || ' '}</small>
          </div>
        </div>

        <div className="rc-micr" aria-hidden="true">
          <span>‖{no}‖</span>
          <span>:{micrDate}:</span>
          <span>{String(Math.round(summa)).padStart(10, '0')}‖</span>
          <em>To'lovchiga beriladi</em>
        </div>
      </section>

      {draft && (
        <div className="rc-draft" aria-hidden="true">
          NAMUNA · SAQLANMAGAN
        </div>
      )}
    </div>
  );
});

export default Receipt;

/**
 * Ekranda kvitansiyani joyiga sig'diradi (telefonda kichraytiradi).
 * Chop etishda masshtab o'chiriladi — qog'ozda doim 190 × 80 mm.
 */
export function ReceiptFit({ children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [box, setBox] = useState({ scale: 1, height: undefined });

  useLayoutEffect(() => {
    const update = () => {
      if (!outer.current || !inner.current) return;
      const scale = Math.min(1, outer.current.clientWidth / inner.current.offsetWidth);
      setBox({ scale, height: inner.current.offsetHeight * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(outer.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="rc-fit" ref={outer} style={{ height: box.height }}>
      <div
        className="rc-fit__inner"
        ref={inner}
        style={{
          transform: `scale(${box.scale})`,
          margin: box.scale < 1 ? 0 : '0 auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}
