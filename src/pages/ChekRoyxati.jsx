import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import Receipt, { ReceiptFit } from '../components/Receipt.jsx';
import { formatDate, formatMoney, padNumber } from '../utils/format';
import { downloadPdf } from '../utils/pdf';

export default function ChekRoyxati() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const [viewItem, setViewItem] = useState(null); // ko'rish modali
  const [pdfItem, setPdfItem] = useState(null); // PDF uchun yashirin render
  const pdfRef = useRef(null);

  const [deleteItem, setDeleteItem] = useState(null);
  const [code, setCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/getUsers');
      setItems(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // PDF: yashirin nusxa chizilgach yuklab olinadi
  useEffect(() => {
    if (!pdfItem) return;
    let cancelled = false;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      try {
        if (!cancelled) await downloadPdf(pdfRef.current, `kvitansiya_${padNumber(pdfItem.tartibraqam)}.pdf`);
      } catch {
        showToast('❌ PDF yaratishda xatolik');
      } finally {
        if (!cancelled) setPdfItem(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfItem]);

  // Esc bilan modallarni yopish
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setViewItem(null);
      closeDelete();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((it) =>
      [it.fullname, it.phonenumber, it.location, it.kassir, padNumber(it.tartibraqam), it.tartibraqam]
        .filter((v) => v !== undefined && v !== null)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [items, search]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, it) => ({
          people: acc.people + (Number(it.amountpeople) || 0),
          summa: acc.summa + (Number(it.summa) || 0),
          extra: acc.extra + (Number(it.qoshimchatolov) || 0),
        }),
        { people: 0, summa: 0, extra: 0 }
      ),
    [filtered]
  );

  const closeDelete = () => {
    setDeleteItem(null);
    setCode('');
    setDeleteError('');
  };

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!code || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/delete/${deleteItem._id}`, { data: { code } });
      setItems((prev) => prev.filter((it) => it._id !== deleteItem._id));
      showToast(`✅ № ${padNumber(deleteItem.tartibraqam)} o'chirildi`);
      closeDelete();
    } catch (err) {
      setDeleteError(getErrorMessage(err, "O'chirishda xatolik yuz berdi"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="list-page">
      <div className="list-head no-print">
        <h1>Cheklar ro'yxati</h1>
        <div className="list-head__actions">
          <input
            type="search"
            className="search"
            placeholder="🔍 Ism, telefon, № yoki kassir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn--ghost" onClick={load} disabled={loading}>
            ↻ Yangilash
          </button>
          <Link to="/kvitansiya" className="btn btn--primary">
            + Yangi kvitansiya
          </Link>
        </div>
      </div>

      <div className="stats no-print">
        <div className="stat">
          <span>Kvitansiyalar</span>
          <strong>{filtered.length} ta</strong>
        </div>
        <div className="stat">
          <span>Insonlar soni</span>
          <strong>{totals.people} nafar</strong>
        </div>
        <div className="stat">
          <span>To'lovlar jami</span>
          <strong>{formatMoney(totals.summa)} so'm</strong>
        </div>
        <div className="stat">
          <span>Qo'shimcha to'lovlar</span>
          <strong>{formatMoney(totals.extra)} so'm</strong>
        </div>
      </div>

      <div className="card card--flush no-print">
        {loading ? (
          <p className="empty">Yuklanmoqda...</p>
        ) : error ? (
          <div className="empty">
            <p className="text-error">{error}</p>
            <button className="btn" onClick={load}>
              Qayta urinish
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="empty">{search ? 'Hech narsa topilmadi' : "Hali kvitansiya yo'q"}</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Chek sanasi</th>
                  <th>Ism Familya</th>
                  <th>Telefon</th>
                  <th>Manzil</th>
                  <th className="num">Summa</th>
                  <th className="num">Kishi</th>
                  <th className="num">Qo'sh. to'lov</th>
                  <th>Xona</th>
                  <th>Uchish</th>
                  <th>Kassir</th>
                  <th className="num">Dollar kursi</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => (
                  <tr key={it._id}>
                    <td><b>{padNumber(it.tartibraqam)}</b></td>
                    <td>{formatDate(it.createdAt)}</td>
                    <td>{it.fullname}</td>
                    <td>{it.phonenumber}</td>
                    <td>{it.location}</td>
                    <td className="num">{formatMoney(it.summa)}</td>
                    <td className="num">{it.amountpeople}</td>
                    <td className="num">{it.qoshimchatolov ? formatMoney(it.qoshimchatolov) : '—'}</td>
                    <td>{it.amountroom || '—'}</td>
                    <td>{formatDate(it.sana, { utc: true })}</td>
                    <td>{it.kassir || '—'}</td>
                    <td className="num">{formatMoney(it.dollar)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn--sm" onClick={() => setViewItem(it)}>
                          Ko'rish
                        </button>
                        <button
                          className="btn btn--sm btn--success"
                          onClick={() => setPdfItem(it)}
                          disabled={!!pdfItem}
                        >
                          {pdfItem?._id === it._id ? '...' : 'PDF'}
                        </button>
                        <button className="btn btn--sm btn--danger" onClick={() => setDeleteItem(it)}>
                          O'chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== KO'RISH MODALI ===== */}
      {viewItem && (
        <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && setViewItem(null)}>
          <div className="modal__box modal__box--wide">
            <div className="print-area">
              <ReceiptFit>
                <Receipt data={viewItem} />
              </ReceiptFit>
            </div>
            <div className="modal__actions no-print">
              <button className="btn btn--primary" onClick={() => window.print()}>
                🖨 Chop etish
              </button>
              <button className="btn" onClick={() => setPdfItem(viewItem)} disabled={!!pdfItem}>
                {pdfItem ? 'Tayyorlanmoqda...' : '⬇ PDF'}
              </button>
              <button className="btn btn--ghost" onClick={() => setViewItem(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== O'CHIRISH MODALI ===== */}
      {deleteItem && (
        <div className="modal no-print" onMouseDown={(e) => e.target === e.currentTarget && closeDelete()}>
          <form className="modal__box" onSubmit={confirmDelete}>
            <h3>Kvitansiyani o'chirish</h3>
            <p className="muted">
              № {padNumber(deleteItem.tartibraqam)} — {deleteItem.fullname}
            </p>
            <input
              type="password"
              className="input"
              placeholder="Maxfiy kod"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            {deleteError && <p className="text-error">{deleteError}</p>}
            <div className="modal__actions">
              <button type="submit" className="btn btn--danger" disabled={!code || deleting}>
                {deleting ? "O'chirilmoqda..." : 'Tasdiqlash'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={closeDelete}>
                Bekor qilish
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PDF uchun yashirin nusxa */}
      {pdfItem && (
        <div className="offscreen" aria-hidden="true">
          <Receipt ref={pdfRef} data={pdfItem} />
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
