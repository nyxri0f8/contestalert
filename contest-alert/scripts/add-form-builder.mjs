import fs from 'fs';

let content = fs.readFileSync('src/app/admin/events/new/page.tsx', 'utf8');

// 1. Add formSchema state
const stateMarker = '  const [externalLink, setExternalLink] = useState("");';
const formSchemaState = `  const [externalLink, setExternalLink] = useState("");
  const [formSchema, setFormSchema] = useState<{ id: string; label: string; type: "text" | "number" | "select"; options: string; required: boolean }[]>([]);

  const addField = () => {
    setFormSchema([...formSchema, { id: Date.now().toString(), label: "", type: "text", options: "", required: false }]);
  };

  const updateField = (index: number, key: string, value: any) => {
    const updated = [...formSchema];
    updated[index] = { ...updated[index], [key]: value };
    setFormSchema(updated);
  };

  const removeField = (index: number) => {
    const updated = [...formSchema];
    updated.splice(index, 1);
    setFormSchema(updated);
  };
`;
content = content.replace(stateMarker, formSchemaState);

// 2. Add form_schema to submission data
const submitMarker = '        eventData.faculty_coordinator_email = facultyCoordEmail || null;';
const submitData = `        eventData.faculty_coordinator_email = facultyCoordEmail || null;
        eventData.form_schema = formSchema.map(f => ({
          ...f,
          options: f.type === 'select' ? f.options.split(',').map(s => s.trim()).filter(Boolean) : []
        }));`;
content = content.replace(submitMarker, submitData);

// 3. Add Form Builder UI to the JSX
const jsxMarker = '{/* === COMMON: Cover Image === */}';
const formBuilderUI = `
              {/* === REGISTRATION FORM BUILDER (Internal Only) === */}
              {eventType === "internal" && (
                <div className="border-t border-[var(--surface-border)] pt-6 pb-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--foreground)]">Registration Form Builder</h4>
                      <p className="text-[10px] text-[var(--foreground-muted)]">
                        Add custom fields (e.g., T-Shirt Size, GitHub Profile). <br/>
                        <strong className="text-[var(--accent)]">For Team Events:</strong> Add fields for "Team Member 2 Name", etc. Only the Team Leader should register.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addField}
                      className="px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--surface-border)] text-xs font-semibold hover:bg-[var(--surface-border)] transition-colors"
                    >
                      + Add Field
                    </button>
                  </div>
                  
                  {formSchema.length > 0 && (
                    <div className="space-y-3">
                      {formSchema.map((field, idx) => (
                        <div key={field.id} className="p-4 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] grid grid-cols-12 gap-3 items-start relative group">
                          <div className="col-span-12 sm:col-span-5 space-y-1">
                            <label className={labelClass}>Field Label</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. GitHub URL"
                              value={field.label}
                              onChange={(e) => updateField(idx, 'label', e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div className="col-span-6 sm:col-span-3 space-y-1">
                            <label className={labelClass}>Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(idx, 'type', e.target.value)}
                              className={inputClass}
                            >
                              <option value="text">Text / URL</option>
                              <option value="number">Number</option>
                              <option value="select">Dropdown</option>
                            </select>
                          </div>
                          <div className="col-span-4 sm:col-span-2 space-y-1">
                            <label className={labelClass}>Required</label>
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(idx, 'required', e.target.checked)}
                                className="w-4 h-4 rounded border-[var(--surface-border)] bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
                              />
                            </div>
                          </div>
                          <div className="col-span-2 sm:col-span-2 flex justify-end items-center h-full pt-5">
                            <button
                              type="button"
                              onClick={() => removeField(idx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                          {field.type === 'select' && (
                            <div className="col-span-12 space-y-1 mt-1">
                              <label className={labelClass}>Options (Comma separated)</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Small, Medium, Large"
                                value={field.options}
                                onChange={(e) => updateField(idx, 'options', e.target.value)}
                                className={inputClass}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* === COMMON: Cover Image === */}`;
content = content.replace(jsxMarker, formBuilderUI);

fs.writeFileSync('src/app/admin/events/new/page.tsx', content);
console.log('Added Form Builder UI');
