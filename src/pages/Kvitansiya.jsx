import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import Receipt, { ReceiptFit } from '../components/Receipt.jsx';
import { KASSIRLAR } from '../constants';
import {
  formatLongDate,
  formatNumberInput,
  formatPhone,
  numberToWordsUzbek,
  padNumber,
  stripSpaces,
} from '../utils/format';
import { downloadPdf } from '../utils/pdf';

const initialForm = {
  sana: '',
  fullname: '',
  phonenumber: '',
  amountpeople: '',
  location: '',
  summa: '',
  amountroom: '',
  qoshimchatolov: '',
  kassir: '',
  dollar: '',
};

const MONEY_FIELDS = ['summa', 'qoshimchatolov', 'dollar'];

export default function Kvitansiya() {
  const [form, setForm] = useState(initialForm);
  const [nextNo, setNextNo] = useState(null);
  const [saved, setSaved] = useState(null); // serverdan qaytgan kvitansiya
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pdfRef = useRef(null);

  const loadNextNumber = () =>
    api
      .get('/next-number')
      .then((res) => setNextNo(res.data.data))
      .catch(() => setNextNo(null));

  useEffect(() => {
    loadNextNumber();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (MONEY_FIELDS.includes(name)) v = formatNumberInput(value);
    if (name === 'phonenumber') v = formatPhone(value);
    setForm((f) => ({ ...f, [name]: v }));
  };

  const validate = () => {
    if (stripSpaces(form.phonenumber).length !== 9) return 'Telefon raqami 9 ta raqamdan iborat bo‘lishi kerak (90 123 45 67)';
    if (!Number(stripSpaces(form.summa))) return 'To‘lov summasini kiriting';
    if (!Number(stripSpaces(form.dollar))) return 'Dollar kursini kiriting';
    if (!form.kassir) return 'Kassirni tanlang';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || saved) return;

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/register', {
        ...form,
        summa: stripSpaces(form.summa),
        qoshimchatolov: stripSpaces(form.qoshimchatolov) || 0,
        dollar: stripSpaces(form.dollar),
        amountpeople: Number(form.amountpeople),
      });
      setSaved(res.data.data);
      setSuccess(`Kvitansiya № ${padNumber(res.data.data.tartibraqam)} saqlandi`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setForm(initialForm);
    setSaved(null);
    setError('');
    setSuccess('');
    loadNextNumber();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await downloadPdf(pdfRef.current, `kvitansiya_${padNumber(saved.tartibraqam)}.pdf`);
    } catch {
      setError('PDF yaratishda xatolik yuz berdi');
    } finally {
      setPdfLoading(false);
    }
  };

  const preview = saved || { ...form, tartibraqam: nextNo };
  const sumWords = numberToWordsUzbek(form.summa);

  return (
    <div className="kv-layout">
      {/* ===== FORMA ===== */}
      <section className="card no-print">
        <div className="card__head">
          <div>
            <h1>Yangi kvitansiya</h1>
            <p className="muted">{formatLongDate()}</p>
          </div>
          <span className="badge">№ {saved ? padNumber(saved.tartibraqam) : padNumber(nextNo)}</span>
        </div>

        {success && <div className="alert alert--success">✅ {success}</div>}
        {error && <div className="alert alert--error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={!!saved || loading} className="form-grid">
            <label className="field">
              <span>Uchish sanasi *</span>
              <input type="date" name="sana" value={form.sana} onChange={handleChange} required />
            </label>

            <label className="field">
              <span>To'lov maqsadi</span>
              <input value="Umra xizmati" readOnly tabIndex={-1} />
            </label>

            <label className="field field--wide">
              <span>Kim tomonidan to'lov qilindi *</span>
              <input
                name="fullname"
                placeholder="Ism Familya"
                value={form.fullname}
                onChange={handleChange}
                autoComplete="off"
                required
              />
            </label>

            <label className="field">
              <span>Telefon raqami *</span>
              <div className="input-prefix">
                <em>+998</em>
                <input
                  name="phonenumber"
                  inputMode="numeric"
                  placeholder="90 123 45 67"
                  value={form.phonenumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </label>

            <label className="field">
              <span>Necha kishiga *</span>
              <input
                type="number"
                name="amountpeople"
                min="1"
                max="500"
                value={form.amountpeople}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field field--wide">
              <span>Yashash manzili (qayerdan) *</span>
              <input
                name="location"
                placeholder="Masalan: Toshkent, Chilonzor"
                value={form.location}
                onChange={handleChange}
                required
              />
            </label>

            <label className="field field--wide">
              <span>To'lov summasi (so'm) *</span>
              <input
                name="summa"
                inputMode="numeric"
                placeholder="0"
                className="input-money"
                value={form.summa}
                onChange={handleChange}
                required
              />
              {sumWords && <small className="words">{sumWords}</small>}
            </label>

            <label className="field">
              <span>Alohida xona (soni)</span>
              <input
                name="amountroom"
                placeholder="—"
                value={form.amountroom}
                onChange={handleChange}
                maxLength={20}
              />
            </label>

            <label className="field">
              <span>Qo'shimcha to'lov (so'm)</span>
              <input
                name="qoshimchatolov"
                inputMode="numeric"
                placeholder="0"
                value={form.qoshimchatolov}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              <span>Qabul qiluvchi kassir *</span>
              <select name="kassir" value={form.kassir} onChange={handleChange} required>
                <option value="" disabled>
                  Tanlang...
                </option>
                {KASSIRLAR.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Dollar kursi (so'm) *</span>
              <input
                name="dollar"
                inputMode="numeric"
                placeholder="12 800"
                value={form.dollar}
                onChange={handleChange}
                required
              />
              <small className="muted">Kvitansiyada chiqmaydi, faqat hisob uchun</small>
            </label>
          </fieldset>

          <div className="form-actions">
            {!saved ? (
              <button type="submit" className="btn btn--success" disabled={loading}>
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn--primary" onClick={() => window.print()}>
                  🖨 Chop etish
                </button>
                <button type="button" className="btn" onClick={handlePdf} disabled={pdfLoading}>
                  {pdfLoading ? 'Tayyorlanmoqda...' : '⬇ PDF yuklash'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={handleNew}>
                  + Yangi kvitansiya
                </button>
              </>
            )}
            <Link to="/chekRoyxati" className="btn btn--ghost">
              Cheklar ro'yxati
            </Link>
          </div>
        </form>
      </section>

      {/* ===== JONLI KO'RINISH ===== */}
      <section className="kv-preview">
        <h2 className="kv-preview__title no-print">{saved ? 'Tayyor kvitansiya' : 'Ko‘rinishi'}</h2>
        <div className="print-area">
          <ReceiptFit>
            <Receipt data={preview} draft={!saved} />
          </ReceiptFit>
        </div>
      </section>

      {/* PDF uchun doim keng formatdagi yashirin nusxa */}
      {saved && (
        <div className="offscreen" aria-hidden="true">
          <Receipt ref={pdfRef} data={saved} />
        </div>
      )}
    </div>
  );
}
