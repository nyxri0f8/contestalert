import fs from 'fs';

const filePath = 'src/app/events/[id]/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fetch Payment QR Signed URL
const loadDetailsRegex = /const finalDbEvent = eventWithImage \|\| dbEvent;/;
content = content.replace(
  loadDetailsRegex,
  `const finalDbEvent = eventWithImage || dbEvent;
        let paymentQrUrl = null;
        if (dbEvent.payment_qr_path) {
          const { data: qrData } = await supabase.storage.from("payment-qrs").createSignedUrl(dbEvent.payment_qr_path, 3600);
          paymentQrUrl = qrData?.signedUrl || null;
        }`
);

// 2. Add to setEvent state
const setEventRegex = /fee: parseFloat\(dbEvent\.fee\) \|\| 0,/;
content = content.replace(
  setEventRegex,
  `fee: parseFloat(dbEvent.fee) || 0,
          paymentLink: dbEvent.payment_link || null,
          paymentQrUrl: paymentQrUrl,`
);

// 3. Add transactionId state
const stateRegex = /const \[formData, setFormData\] = useState<Record<string, any>>\(\{\}\);/;
content = content.replace(
  stateRegex,
  `const [formData, setFormData] = useState<Record<string, any>>({});
  const [transactionId, setTransactionId] = useState("");`
);

// 4. Pass transactionId to RPC
const rpcRegex = /p_is_external_confirmation: false,\n\s*p_form_data: formData,/;
content = content.replace(
  rpcRegex,
  `p_is_external_confirmation: false,
        p_form_data: formData,
        p_transaction_id: transactionId || null,`
);

// 5. Update Registration Form UI to show payment stuff
const submitBtnRegex = /(<button\s*type="submit"\s*disabled=\{registering\}[\s\S]*?<\/button>)/;
content = content.replace(
  submitBtnRegex,
  `{(event.paymentLink || event.paymentQrUrl) && (
                      <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--surface-border)] space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
                          <CurrencyInr weight="bold" className="w-4 h-4 text-[var(--accent)]" /> Payment Details
                        </div>
                        {event.paymentLink && (
                          <a href={event.paymentLink} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 bg-[var(--accent-muted)] text-[var(--accent)] text-center text-xs font-bold rounded-lg border border-[var(--accent)]/20 hover:bg-[var(--accent)] hover:text-black transition-colors">
                            Click here to Pay Online
                          </a>
                        )}
                        {event.paymentQrUrl && (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs text-[var(--foreground-muted)]">Or scan UPI QR Code:</span>
                            <img src={event.paymentQrUrl} alt="Payment QR" className="w-40 h-40 rounded-xl border border-[var(--surface-border)]" />
                            <span className="text-[10px] text-center text-[var(--foreground-muted)]">Please add your Team Name in the payment notes.</span>
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-[var(--foreground-secondary)] block mb-1.5">Transaction ID <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. T230919102..."
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                          />
                        </div>
                      </div>
                    )}
                    $1`
);

fs.writeFileSync(filePath, content);
console.log("Updated events/[id]/page.tsx");
