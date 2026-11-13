'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Globe,
  Upload,
  Server,
  Layers,
  Palette,
  Puzzle,
  UserCheck,
  CheckCircle2,
  Rocket,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Check,
  Shield,
  Eye,
} from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Information', icon: Globe },
  { id: 2, name: 'Branding', icon: Palette },
  { id: 3, name: 'Hosting', icon: Server },
  { id: 4, name: 'Domain', icon: Layers },
  { id: 5, name: 'Theme', icon: Palette },
  { id: 6, name: 'Plugins', icon: Puzzle },
  { id: 7, name: 'Administrator', icon: UserCheck },
  { id: 8, name: 'Review', icon: CheckCircle2 },
  { id: 9, name: 'Generate', icon: Rocket },
];

export default function CreateWebsiteWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data Sources
  const [hostingList, setHostingList] = useState<any[]>([]);
  const [themeList, setThemeList] = useState<any[]>([]);
  const [pluginList, setPluginList] = useState<any[]>([]);

  // Step 1: Info
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('ताज़ा और निष्पक्ष समाचार');
  const [description, setDescription] = useState('24x7 Digital Hindi News Portal');
  const [language, setLanguage] = useState('hi');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('Delhi');
  const [city, setCity] = useState('New Delhi');
  const [contactEmail, setContactEmail] = useState('editor@earthin.online');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');

  // Step 2: Branding
  const [mainLogoUrl, setMainLogoUrl] = useState('');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [footerLogoUrl, setFooterLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#d60000');
  const [secondaryColor, setSecondaryColor] = useState('#0b1120');
  const [headerStyle, setHeaderStyle] = useState('aajtak_broadcast');
  const [footerStyle, setFooterStyle] = useState('standard');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Step 3: Hosting
  const [hostingConnectionId, setHostingConnectionId] = useState<number | null>(null);

  // Step 4: Domain
  const [primaryDomain, setPrimaryDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [documentRoot, setDocumentRoot] = useState('/public_html');

  // Step 5: Theme
  const [selectedThemeSlug, setSelectedThemeSlug] = useState('earthin-samachar');

  // Step 6: Plugins
  const [selectedPluginSlugs, setSelectedPluginSlugs] = useState<string[]>([
    'live-tv',
    'breaking-news-broadcaster',
  ]);

  // Step 7: Administrator
  const [adminName, setAdminName] = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('admin@earthin.online');

  // Load Hosting, Themes, Plugins
  useEffect(() => {
    fetch('/api/hosting')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.connections?.length) {
          setHostingList(data.connections);
          setHostingConnectionId(data.connections[0].id);
        }
      });

    fetch('/api/cms/themes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.themes?.length) {
          setThemeList(data.themes);
        }
      });

    fetch('/api/cms/plugins')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.plugins?.length) {
          setPluginList(data.plugins);
        }
      });
  }, []);

  // Handle Logo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'branding');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setter(data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleTogglePlugin = (slug: string) => {
    setSelectedPluginSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      name,
      title: title || name,
      tagline,
      description,
      language,
      country,
      state,
      city,
      contactEmail: (contactEmail || adminEmail || 'editor@earthin.online').trim(),
      contactPhone,
      address,
      mainLogoUrl,
      headerLogoUrl,
      footerLogoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      headerStyle,
      footerStyle,
      hostingConnectionId,
      primaryDomain: (primaryDomain || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, ''),
      subdomain,
      documentRoot,
      selectedThemeSlug,
      selectedPluginSlugs,
      adminName: (adminName || 'Super Admin').trim(),
      adminEmail: (adminEmail || contactEmail || 'admin@earthin.online').trim(),
    };

    try {
      const res = await fetch('/api/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Website generation failed');
      }

      // Redirect directly to the live Deployment Details page
      if (data?.deployment?.id) {
        router.push(`/deployments/${data.deployment.id}`);
      } else {
        router.push('/websites');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Wizard Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary">Create News Website</h1>
        <p className="text-xs text-text-muted mt-0.5">
          Step-by-step guided generator for automated news portal deployment
        </p>
      </div>

      {/* Steps Stepper */}
      <div className="bg-card border border-card-border rounded-xl p-3 mb-6 overflow-x-auto">
        <div className="flex items-center min-w-max gap-1">
          {STEPS.map((s) => {
            const isDone = s.id < currentStep;
            const isCurrent = s.id === currentStep;
            const Icon = s.icon;

            return (
              <div key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => s.id < currentStep && setCurrentStep(s.id)}
                  disabled={s.id > currentStep}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isCurrent
                      ? 'bg-primary text-white shadow-sm shadow-primary/25'
                      : isDone
                      ? 'text-success hover:bg-card-border/50'
                      : 'text-text-muted opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      isCurrent
                        ? 'bg-white text-primary font-bold'
                        : isDone
                        ? 'bg-success text-white'
                        : 'bg-sidebar text-text-muted border border-card-border'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span>{s.name}</span>
                </button>
                {s.id < STEPS.length && <div className="w-4 h-[1px] bg-card-border mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-error-subtle border border-error/30 text-error flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Generation Error</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-card border border-card-border rounded-2xl p-6 md:p-8 glow-card min-h-[480px] flex flex-col justify-between">
        <div>
          {/* STEP 1: INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-2xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 1 — Website & Channel Information</h2>
                <p className="text-xs text-text-muted">Enter core identification and editorial contact details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    News Channel Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!title) setTitle(e.target.value);
                    }}
                    placeholder="e.g. Earthin Samachar"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Website Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. अर्थिन समाचार — सबसे तेज़ हिंदी न्यूज़"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. आपका विश्वसनीय डिजिटल न्यूज़ नेटवर्क"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">Editorial Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="editor@earthin.online"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Uttar Pradesh, Maharashtra, Delhi"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Lucknow, Bhopal, Mumbai"
                    className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Editorial Office Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="News Desk address for public footer and contact page"
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* STEP 2: BRANDING */}
          {currentStep === 2 && (
            <div className="space-y-5 max-w-3xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 2 — Branding & Identity</h2>
                <p className="text-xs text-text-muted">Upload broadcast logos, favicons, and configure brand color palette</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Logo */}
                <div className="bg-sidebar/50 border border-card-border rounded-xl p-4">
                  <label className="block text-xs font-medium text-text-primary mb-2">Main Channel Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-sidebar border border-card-border flex items-center justify-center overflow-hidden">
                      {mainLogoUrl ? (
                        <img src={mainLogoUrl} alt="Main Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Palette className="w-6 h-6 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setMainLogoUrl)}
                        className="text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover"
                      />
                      <p className="text-[10px] text-text-muted mt-1">Recommended: PNG / SVG with transparent background</p>
                    </div>
                  </div>
                </div>

                {/* Favicon */}
                <div className="bg-sidebar/50 border border-card-border rounded-xl p-4">
                  <label className="block text-xs font-medium text-text-primary mb-2">Browser Favicon</label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-sidebar border border-card-border flex items-center justify-center overflow-hidden">
                      {faviconUrl ? (
                        <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                      ) : (
                        <Globe className="w-5 h-5 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*,.ico"
                        onChange={(e) => handleFileUpload(e, setFaviconUrl)}
                        className="text-xs text-text-muted file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover"
                      />
                      <p className="text-[10px] text-text-muted mt-1">Square icon: 32x32 or 64x64 PNG / ICO</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Primary Broadcast Color (Navbar, Badges, Highlights)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded border border-card-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="bg-sidebar border border-card-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary uppercase w-32"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Studio Accent Color (Utility Bar, Studio Player, Footer)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-10 rounded border border-card-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="bg-sidebar border border-card-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary uppercase w-32"
                    />
                  </div>
                </div>
              </div>

              {/* Header Style */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">Header Layout Style</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'aajtak_broadcast', label: 'AajTak Broadcast', desc: 'Top Bar + Masthead + Red Nav' },
                    { id: 'classic', label: 'Classic Newsroom', desc: 'Left Logo + Horizontal Bar' },
                    { id: 'compact', label: 'Compact Sticky', desc: 'Modern slim floating strip' },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setHeaderStyle(style.id)}
                      className={`text-left p-3 rounded-xl border transition ${
                        headerStyle === style.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-card-border bg-sidebar/60 text-text-secondary hover:border-card-border/80'
                      }`}
                    >
                      <div className="text-xs font-semibold">{style.label}</div>
                      <div className="text-[10px] text-text-muted mt-0.5">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: HOSTING */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-2xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 3 — Select cPanel Hosting Connection</h2>
                <p className="text-xs text-text-muted">Choose an internal Earthin cPanel or client cPanel connection</p>
              </div>

              {hostingList.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-card-border text-center">
                  <Server className="w-8 h-8 text-warning mx-auto mb-2 opacity-60" />
                  <div className="text-sm font-semibold text-text-primary">No hosting connections available</div>
                  <p className="text-xs text-text-muted mt-1">
                    You must connect a cPanel account before deploying.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/hosting/add')}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs bg-primary text-white px-3 py-1.5 rounded-lg"
                  >
                    Add Hosting Connection &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {hostingList.map((host) => (
                    <label
                      key={host.id}
                      className={`block p-4 rounded-xl border cursor-pointer transition ${
                        hostingConnectionId === host.id
                          ? 'border-primary bg-primary/10'
                          : 'border-card-border bg-sidebar/50 hover:border-card-border/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="hostingConnection"
                            checked={hostingConnectionId === host.id}
                            onChange={() => setHostingConnectionId(host.id)}
                            className="text-primary"
                          />
                          <div>
                            <div className="text-sm font-semibold text-text-primary">{host.name}</div>
                            <div className="text-xs text-text-muted font-mono">{host.serverUrl}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              host.status === 'active' ? 'bg-success-subtle text-success' : 'bg-error-subtle text-error'
                            }`}
                          >
                            {host.status.toUpperCase()}
                          </span>
                          <div className="text-[11px] text-text-muted mt-1">
                            PHP {host.capabilities?.phpVersion || '8.3'} • MySQL {host.capabilities?.mysqlVersion || '8.0'}
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DOMAIN */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-2xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 4 — Domain & Document Root</h2>
                <p className="text-xs text-text-muted">Specify the target public domain name and web server folder</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Primary Domain Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={primaryDomain}
                  onChange={(e) => setPrimaryDomain(e.target.value.toLowerCase())}
                  placeholder="e.g. samachar.earthin.online or khabar.com"
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Ensure the DNS A-Record or CNAME for this domain points to your selected cPanel host IP address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  cPanel Document Root
                </label>
                <input
                  type="text"
                  value={documentRoot}
                  onChange={(e) => setDocumentRoot(e.target.value)}
                  placeholder="/public_html"
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Default is <code className="text-primary font-mono">/public_html</code> for main domain, or <code className="text-primary font-mono">/public_html/subdomain</code> for addon/subdomains.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: THEME */}
          {currentStep === 5 && (
            <div className="space-y-4 max-w-3xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 5 — Select Editorial Theme</h2>
                <p className="text-xs text-text-muted">Choose an official verified theme included with Earthin News CMS</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {themeList.map((theme) => (
                  <div
                    key={theme.slug}
                    onClick={() => setSelectedThemeSlug(theme.slug)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedThemeSlug === theme.slug
                        ? 'border-primary bg-primary/10'
                        : 'border-card-border bg-sidebar/50 hover:border-card-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-text-primary">{theme.name}</div>
                      <span className="text-[10px] bg-card px-2 py-0.5 rounded font-mono text-text-muted">
                        v{theme.version}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                      {theme.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="text-text-muted">By {theme.author}</span>
                      {selectedThemeSlug === theme.slug && (
                        <span className="text-primary font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: PLUGINS */}
          {currentStep === 6 && (
            <div className="space-y-4 max-w-3xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 6 — Choose Approved Newsroom Plugins</h2>
                <p className="text-xs text-text-muted">Activate verified editorial extensions for Live TV, polls, alerts, and badges</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {pluginList.map((plug) => {
                  const isChecked = selectedPluginSlugs.includes(plug.slug);
                  return (
                    <div
                      key={plug.slug}
                      onClick={() => handleTogglePlugin(plug.slug)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        isChecked
                          ? 'border-primary bg-primary/10'
                          : 'border-card-border bg-sidebar/50 hover:border-card-border/80'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 text-primary rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-text-primary">{plug.name}</span>
                          <span className="text-[10px] text-text-muted bg-card px-1.5 py-0.5 rounded">
                            {plug.category || 'Editorial'}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-1 line-clamp-2">{plug.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: ADMINISTRATOR */}
          {currentStep === 7 && (
            <div className="space-y-4 max-w-2xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 7 — Initial Administrator Account</h2>
                <p className="text-xs text-text-muted">Credentials created automatically inside the generated CMS installation</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Administrator Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Shaurya Joshi (Chief Editor)"
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Administrator Email Address <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@earthin.online"
                  className="w-full bg-sidebar border border-card-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <p className="text-[11px] text-text-muted mt-1.5">
                  The initial password will be cryptographically generated and securely delivered upon deployment completion.
                </p>
              </div>
            </div>
          )}

          {/* STEP 8: REVIEW */}
          {currentStep === 8 && (
            <div className="space-y-4 max-w-3xl">
              <div className="border-b border-card-border/60 pb-3 mb-4">
                <h2 className="text-base font-semibold text-text-primary">Step 8 — Review Deployment Manifest</h2>
                <p className="text-xs text-text-muted">Verify all settings before launching the durable deployment workflow</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border">
                  <span className="text-text-muted block text-[11px]">Channel Name</span>
                  <span className="font-semibold text-text-primary">{name}</span>
                </div>
                <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border">
                  <span className="text-text-muted block text-[11px]">Primary Domain</span>
                  <span className="font-mono text-primary font-semibold">{primaryDomain}</span>
                </div>
                <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border">
                  <span className="text-text-muted block text-[11px]">Selected Theme</span>
                  <span className="font-semibold text-text-primary">{selectedThemeSlug}</span>
                </div>
                <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border">
                  <span className="text-text-muted block text-[11px]">Super Admin Email</span>
                  <span className="font-semibold text-text-primary">{adminEmail}</span>
                </div>
                <div className="p-3 bg-sidebar/50 rounded-xl border border-card-border col-span-2">
                  <span className="text-text-muted block text-[11px]">Active Newsroom Plugins ({selectedPluginSlugs.length})</span>
                  <span className="text-text-secondary mt-1 block">
                    {selectedPluginSlugs.join(', ') || 'None selected'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: GENERATE */}
          {currentStep === 9 && (
            <div className="space-y-5 max-w-2xl text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Rocket className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Ready to Launch {name || 'News Website'}</h2>
              <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                Clicking <span className="font-semibold text-primary">Generate Website</span> will initiate the 28-step durable deployment workflow on Vercel. Database, credentials, and CMS release will be provisioned automatically.
              </p>

              <div className="pt-4">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGenerate}
                  className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-primary/25 inline-flex items-center gap-2 disabled:opacity-60 transition"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Provisioning & Starting Workflow...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4" />
                      <span>Generate Website Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Controls Footer */}
        <div className="mt-8 pt-4 border-t border-card-border/60 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((c) => Math.max(1, c - 1))}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary px-3 py-2 rounded-lg border border-card-border disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 9 ? (
            <button
              type="button"
              onClick={() => {
                if (currentStep === 1 && (!name || !title)) {
                  alert('Please enter Channel Name and Website Title');
                  return;
                }
                if (currentStep === 3 && !hostingConnectionId) {
                  alert('Please select a cPanel hosting connection');
                  return;
                }
                if (currentStep === 4 && !primaryDomain) {
                  alert('Please enter a Primary Domain');
                  return;
                }
                if (currentStep === 7 && (!adminName || !adminEmail)) {
                  alert('Please enter Administrator Name and Email');
                  return;
                }
                setCurrentStep((c) => Math.min(9, c + 1));
              }}
              className="flex items-center gap-1.5 text-xs bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}

