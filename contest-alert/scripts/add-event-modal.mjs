import fs from 'fs';

let content = fs.readFileSync('src/app/events/[id]/page.tsx', 'utf8');

// 1. Add formData state
const stateMarker = '  const [phone, setPhone] = useState("");';
const formSchemaState = `  const [phone, setPhone] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
`;
content = content.replace(stateMarker, formSchemaState);

// 2. Fetch form_schema from DB
const fetchMarker = '            year: "numeric",\n          }),';
const fetchReplacement = `            year: "numeric",\n          }),
          formSchema: dbEvent.form_schema || [],`;
content = content.replace(fetchMarker, fetchReplacement);

// 3. Update register_for_event payload
const rpcMarker = `        p_phone: phone || null,
        p_is_external_confirmation: false,`;
const rpcReplacement = `        p_phone: phone || null,
        p_is_external_confirmation: false,
        p_form_data: formData,`;
content = content.replace(rpcMarker, rpcReplacement);

// 4. Render Dynamic Form inputs
const uiMarker = '{/* === INTERNAL EVENT ACTION === */}';
const uiReplacement = `
{/* === REGISTRATION MODAL (Dynamic Form) === */}
{showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
    >
      <div className="p-6 border-b border-[var(--surface-border)] flex justify-between items-center">
        <h3 className="text-lg font-bold">Register for {event.title}</h3>
        <button onClick={() => setShowForm(false)} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">×</button>
      </div>
      
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <form id="registration-form" onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Team Name (Optional)</label>
            <input type="text" placeholder="e.g. CyberKnights" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Contact Phone (Required)</label>
            <input type="tel" placeholder="e.g. 9876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]" />
          </div>

          {/* Dynamic Fields */}
          {event.formSchema && event.formSchema.map((field: any) => (
            <div key={field.id} className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Select...</option>
                  {field.options && field.options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                />
              )}
            </div>
          ))}
        </form>
      </div>

      <div className="p-6 border-t border-[var(--surface-border)] flex gap-3">
        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-sm font-bold transition-all">
          Cancel
        </button>
        <button type="submit" form="registration-form" disabled={registering} className="flex-1 py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-sm font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center">
          {registering ? "Registering..." : "Confirm Registration"}
        </button>
      </div>
    </motion.div>
  </div>
)}

{/* === INTERNAL EVENT ACTION === */}`;
content = content.replace(uiMarker, uiReplacement);

// 5. Remove inline form since we use modal now
const inlineFormMarkerStart = '                      ) : showForm ? (';
const inlineFormMarkerEnd = '                        <button onClick={() => setShowForm(true)} className="w-full py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2">';
const inlineFormReplacement = `                      ) : (
                        <button onClick={() => setShowForm(true)} className="w-full py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2">`;
if(content.includes(inlineFormMarkerStart)) {
  const startIndex = content.indexOf(inlineFormMarkerStart);
  const endIndex = content.indexOf(inlineFormMarkerEnd, startIndex);
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + inlineFormReplacement + content.substring(endIndex + inlineFormMarkerEnd.length);
  }
}

fs.writeFileSync('src/app/events/[id]/page.tsx', content);
console.log('Added Registration Modal');
