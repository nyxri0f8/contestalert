import fs from 'fs';

const filePath = 'src/app/admin/events/new/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove seats state
content = content.replace('const [seats, setSeats] = useState("60");\n', '');

// 2. Add paymentLink and paymentQrFile states
content = content.replace(
  'const [fee, setFee] = useState("0");\n',
  `const [fee, setFee] = useState("0");
  const [paymentLink, setPaymentLink] = useState("");
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);

  const handlePaymentQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const max_size = 800;

      if (width > max_size || height > max_size) {
        if (width > height) {
          height = Math.round((height * max_size) / width);
          width = max_size;
        } else {
          width = Math.round((width * max_size) / height);
          height = max_size;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.split('.')[0] + '_qr.webp', { type: 'image/webp' });
            setPaymentQrFile(webpFile);
          }
        }, 'image/webp', 0.85);
      }
    };
  };
`
);

// 3. Update handleSubmit
content = content.replace(
  'const eventData: any = {',
  `
      let payment_qr_path = null;
      if (paymentQrFile) {
        const fileName = \`\${Math.random().toString(36).substring(2, 15)}_\${Date.now()}_qr.webp\`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payment-qrs')
          .upload(fileName, paymentQrFile, { contentType: 'image/webp' });

        if (uploadError) {
          alert("QR Code upload failed: " + uploadError.message);
          throw uploadError;
        }
        payment_qr_path = uploadData.path;
      }

      const eventData: any = {`
);

content = content.replace(
  'eventData.capacity = parseInt(seats) || 100;',
  `eventData.capacity = 9999;
        eventData.payment_link = paymentLink || null;
        eventData.payment_qr_path = payment_qr_path || null;`
);

// 4. Update JSX form
// Remove seats div
const seatsDivRegex = /<div>\s*<label className="text-xs font-semibold.*?Seats Capacity<\/label>[\s\S]*?<\/div>/;
content = content.replace(seatsDivRegex, '');

// Insert Payment Link and QR Code inputs after the fee input
const feeDivRegex = /(<div>\s*<label className="text-xs font-semibold.*?Registration Fee \(₹\)<\/label>[\s\S]*?<\/div>)/;
content = content.replace(
  feeDivRegex,
  `$1
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)] block mb-1.5">Payment Link (URL)</label>
                    <input
                      type="url"
                      placeholder="https://rzp.io/l/..."
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--surface-border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)] block mb-1.5">Upload Payment QR Code (UPI)</label>
                    <div className="relative group rounded-lg border border-dashed border-[var(--surface-border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors overflow-hidden">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentQrUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-[var(--foreground-muted)] group-hover:text-[var(--accent)] transition-colors">
                        <UploadSimple weight="light" className="w-6 h-6" />
                        <span className="text-xs font-medium px-4 text-center">
                          {paymentQrFile ? paymentQrFile.name : "Click or drag QR image to upload & compress"}
                        </span>
                      </div>
                    </div>
                  </div>`
);

fs.writeFileSync(filePath, content);
console.log("Updated events/new/page.tsx");
