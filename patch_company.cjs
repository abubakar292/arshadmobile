const fs = require('fs');
let code = fs.readFileSync('src/pages/PurchaseMobilePage.tsx', 'utf8');

const targetStr = `            <Select
              label="Company *"
              required
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              options={COMPANIES.filter(c => c.value !== '')}
            />`;

const replaceStr = `            <Select
              label="Company *"
              required
              value={formData.company}
              onChange={e => setFormData({...formData, company: e.target.value})}
              options={COMPANIES.filter(c => c.value !== '')}
            />
            {formData.company === 'Other' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Custom Brand Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Motorola"
                  className="w-full rounded-xl border border-primary-500/20 bg-white/5 px-4 py-2.5 text-slate-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  value={formData.customCompany}
                  onChange={e => setFormData({...formData, customCompany: e.target.value})}
                />
              </div>
            )}`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/pages/PurchaseMobilePage.tsx', code);
