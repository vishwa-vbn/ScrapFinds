import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { CameraIcon, SparklesIcon, CheckIcon } from '../../components/Icons';
import { getRepo } from '../../lib/repo';
import { uploadImage, deleteImage } from '../../lib/imagekit';
import { translateItemWithGemini } from '../../lib/geminiTranslate';
import { categories } from '../../config/categories';
import { strings } from '../../config/strings';
import {
  itemInputSchema,
  type Condition,
  type Status,
  type ItemImage,
  type ItemTranslation,
} from '../../types/item';

interface ImageDraft {
  id: string; // local key
  file?: File;
  previewUrl: string;
  uploaded?: ItemImage;
}

export function ItemForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { getIdToken } = useAdminAuth();

  // Primary (English / Default)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0].id);
  const [condition, setCondition] = useState<Condition>('good');
  const [status, setStatus] = useState<Status>('available');
  const [soldPrice, setSoldPrice] = useState<string>('');

  // Localized Translations (Kannada & Hindi)
  const [knTitle, setKnTitle] = useState('');
  const [knDescription, setKnDescription] = useState('');
  const [hiTitle, setHiTitle] = useState('');
  const [hiDescription, setHiDescription] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationSuccess, setTranslationSuccess] = useState(false);

  // Active translation preview tab in form
  const [activeLangTab, setActiveLangTab] = useState<'kn' | 'hi'>('kn');

  const [images, setImages] = useState<ImageDraft[]>([]);
  const [removedImages, setRemovedImages] = useState<ItemImage[]>([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing item if edit mode
  useEffect(() => {
    if (!id) return;
    let active = true;

    async function loadItem() {
      try {
        setLoading(true);
        const repo = await getRepo();
        const item = await repo.get(id!);
        if (active && item) {
          setTitle(item.title);
          setDescription(item.description);
          setCategory(item.category);
          setCondition(item.condition);
          setStatus(item.status);
          if (typeof item.soldPrice === 'number') {
            setSoldPrice(String(item.soldPrice));
          }
          if (item.translations?.kn) {
            setKnTitle(item.translations.kn.title || '');
            setKnDescription(item.translations.kn.description || '');
          }
          if (item.translations?.hi) {
            setHiTitle(item.translations.hi.title || '');
            setHiDescription(item.translations.hi.description || '');
          }
          setImages(
            item.images.map(img => ({
              id: img.fileId,
              previewUrl: img.url,
              uploaded: img,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load item for edit:', err);
        setError('Failed to load item details');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadItem();
    return () => {
      active = false;
    };
  }, [id]);

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 4 - images.length;
    if (remainingSlots <= 0) {
      alert('Maximum 4 photos allowed per item.');
      return;
    }

    const toAdd = files.slice(0, remainingSlots).map(file => ({
      id: URL.createObjectURL(file),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const draft = images[index];
    if (draft.uploaded) {
      setRemovedImages(prev => [...prev, draft.uploaded!]);
    }
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // AI Translation with Gemini
  const handleAutoTranslate = async () => {
    if (!title.trim() && !description.trim()) {
      alert('Please enter at least a Title or Description before generating translations.');
      return;
    }

    try {
      setTranslating(true);
      setError(null);
      const token = await getIdToken().catch(() => undefined);

      const result = await translateItemWithGemini({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        idToken: token,
      });

      if (result.kn) {
        setKnTitle(result.kn.title || '');
        setKnDescription(result.kn.description || '');
      }
      if (result.hi) {
        setHiTitle(result.hi.title || '');
        setHiDescription(result.hi.description || '');
      }

      setTranslationSuccess(true);
      setTimeout(() => setTranslationSuccess(false), 3500);
    } catch (err) {
      console.error('Gemini translate error:', err);
      alert((err as Error).message || 'Failed to auto-generate translations. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please add at least 1 photo.');
      return;
    }

    setError(null);
    const newlyUploaded: ItemImage[] = [];

    try {
      setSaving(true);
      const token = await getIdToken();

      // 1. Upload new files sequentially
      const finalImages: ItemImage[] = [];
      for (let i = 0; i < images.length; i++) {
        const draft = images[i];
        if (draft.uploaded) {
          finalImages.push(draft.uploaded);
        } else if (draft.file) {
          setUploadStatus(`Compressing & uploading image ${i + 1} of ${images.length}…`);
          const uploaded = await uploadImage(draft.file, token);
          newlyUploaded.push(uploaded);
          finalImages.push(uploaded);
        }
      }

      setUploadStatus('Saving item…');

      // 2. Build translations map
      const translations: { kn?: ItemTranslation; hi?: ItemTranslation } = {};
      if (knTitle.trim() || knDescription.trim()) {
        translations.kn = {
          title: knTitle.trim() || title.trim(),
          description: knDescription.trim() || description.trim(),
        };
      }
      if (hiTitle.trim() || hiDescription.trim()) {
        translations.hi = {
          title: hiTitle.trim() || title.trim(),
          description: hiDescription.trim() || description.trim(),
        };
      }

      // 3. Validate with zod
      const parsedSoldPrice =
        soldPrice.trim() !== '' && !isNaN(Number(soldPrice.trim()))
          ? Number(soldPrice.trim())
          : undefined;

      const input = itemInputSchema.parse({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        status,
        images: finalImages,
        ...(parsedSoldPrice !== undefined && parsedSoldPrice >= 0
          ? { soldPrice: parsedSoldPrice }
          : {}),
        ...(Object.keys(translations).length > 0 ? { translations } : {}),
      });

      // 4. Save to repository
      const repo = await getRepo();
      if (isEdit && id) {
        await repo.update(id, input);
      } else {
        await repo.create(input);
      }

      // 5. Delete removed images from ImageKit
      for (const removed of removedImages) {
        if (removed.fileId) {
          deleteImage(removed.fileId, token).catch(() => {});
        }
      }

      navigate('/admin/items');
    } catch (err) {
      console.error('Submit error:', err);
      setError((err as Error).message || 'Failed to save item');

      if (newlyUploaded.length > 0) {
        try {
          const token = await getIdToken();
          for (const img of newlyUploaded) {
            deleteImage(img.fileId, token).catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }
    } finally {
      setSaving(false);
      setUploadStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[var(--fg)]">
          {isEdit ? strings.editItem : strings.addItem}
        </h1>
        <Link
          to="/admin/items"
          className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--fg)]"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photos Section */}
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--fg)]">Photos ({images.length}/4)</h2>
              <p className="text-xs text-[var(--muted)]">
                First photo is the cover photo. Max 4 photos.
              </p>
            </div>
            <button
              type="button"
              disabled={images.length >= 4}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 font-bold text-xs hover:bg-green-100 disabled:opacity-40 transition-colors cursor-pointer"
            >
              + Add photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-gray-50 dark:bg-slate-800 group"
                >
                  <img
                    src={img.previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      Cover
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 backdrop-blur-sm flex items-center justify-between text-white text-[10px]">
                    {idx !== 0 ? (
                      <button
                        type="button"
                        onClick={() => handleMakeCover(idx)}
                        className="hover:underline cursor-pointer"
                      >
                        Set cover
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="text-red-300 hover:text-red-100 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center text-xs text-[var(--muted)] space-y-2">
              <CameraIcon className="w-8 h-8 mx-auto text-[var(--muted)] opacity-60" />
              <span className="block">No photos attached yet. Tap "+ Add photo" to upload.</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {strings.titleLabel} (English / Default) *
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Vintage Philips Wooden Stereo Radio"
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="text-[11px] text-right text-[var(--muted)]">
            {title.length}/80
          </div>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="category" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {strings.categoryLabel} *
            </label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="condition" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {strings.conditionLabel} *
            </label>
            <select
              id="condition"
              value={condition}
              onChange={e => setCondition(e.target.value as Condition)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              <option value="like_new">{strings.conditionLikeNew}</option>
              <option value="good">{strings.conditionGood}</option>
              <option value="fair">{strings.conditionFair}</option>
              <option value="needs_repair">{strings.conditionNeedsRepair}</option>
            </select>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label htmlFor="status" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {strings.statusLabel} *
          </label>
          <select
            id="status"
            value={status}
            onChange={e => setStatus(e.target.value as Status)}
            className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            <option value="available">{strings.statusAvailable}</option>
            <option value="reserved">{strings.statusReserved}</option>
            <option value="sold">{strings.statusSold}</option>
          </select>
        </div>

        {/* Sold Price (Optional / When Sold) */}
        <div className="space-y-1.5">
          <label htmlFor="soldPrice" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            Sold Price (₹) {status === 'sold' && <span className="text-amber-600 font-semibold">(Sold Item)</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--muted)]">
              ₹
            </span>
            <input
              id="soldPrice"
              type="number"
              min="0"
              step="1"
              value={soldPrice}
              onChange={e => setSoldPrice(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full min-h-[44px] pl-8 pr-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            Manually enter the final amount received when item is sold for analytics tracking.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {strings.descriptionLabel} (English / Default)
          </label>
          <textarea
            id="description"
            rows={4}
            maxLength={1000}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Details about working condition, ports, wear, cosmetic details…"
            className="w-full px-3.5 py-2.5 bg-[var(--card)] text-[var(--fg)] border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="text-[11px] text-right text-[var(--muted)]">
            {description.length}/1000
          </div>
        </div>

        {/* AI Multilingual Translation Card (Gemini) */}
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-green-200/80 dark:border-green-900/60 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h3 className="text-sm font-bold text-[var(--fg)]">
                  AI Translation (Kannada & Hindi)
                </h3>
              </div>
              <p className="text-xs text-[var(--muted)] pt-0.5">
                Powered by Gemini. Auto-generates local buyer-friendly descriptions in Kannada & Hindi.
              </p>
            </div>

            <button
              type="button"
              disabled={translating || (!title.trim() && !description.trim())}
              onClick={handleAutoTranslate}
              className="min-h-[40px] px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <SparklesIcon className={`w-3.5 h-3.5 ${translating ? 'animate-spin' : ''}`} />
              <span>{translating ? 'Generating Translations…' : 'Generate with Gemini'}</span>
            </button>
          </div>

          {translationSuccess && (
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 text-xs font-semibold flex items-center gap-2">
              <CheckIcon className="w-4 h-4 text-green-600 shrink-0" />
              <span>Translations generated successfully! Review or edit below before saving.</span>
            </div>
          )}

          {/* Translation Tabs: Kannada vs Hindi */}
          <div className="space-y-3 pt-1 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLangTab('kn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeLangTab === 'kn'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('hi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeLangTab === 'hi'
                    ? 'bg-green-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-slate-800 text-[var(--muted)] hover:text-[var(--fg)]'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>

            {/* Kannada Fields */}
            {activeLangTab === 'kn' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase">
                    ಕನ್ನಡ ಶೀರ್ಷಿಕೆ (Kannada Title)
                  </label>
                  <input
                    type="text"
                    value={knTitle}
                    onChange={e => setKnTitle(e.target.value)}
                    placeholder="ಉದಾಹರಣೆ: ವಿಂಟೇಜ್ ಫಿಲಿಪ್ಸ್ ಮರದ ರೇಡಿಯೋ"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase">
                    ಕನ್ನಡ ವಿವರಣೆ (Kannada Description)
                  </label>
                  <textarea
                    rows={3}
                    value={knDescription}
                    onChange={e => setKnDescription(e.target.value)}
                    placeholder="ವಸ್ತುವಿನ ಕೆಲಸದ ಸ್ಥಿತಿ, ಧ್ವನಿ ಗುಣಮಟ್ಟ ಮತ್ತು ವಿವರಗಳು…"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}

            {/* Hindi Fields */}
            {activeLangTab === 'hi' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase">
                    हिंदी शीर्षक (Hindi Title)
                  </label>
                  <input
                    type="text"
                    value={hiTitle}
                    onChange={e => setHiTitle(e.target.value)}
                    placeholder="उदा: विंटेज फिलिप्स लकड़ी का स्टीरियो रेडियो"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-[var(--muted)] uppercase">
                    हिंदी विवरण (Hindi Description)
                  </label>
                  <textarea
                    rows={3}
                    value={hiDescription}
                    onChange={e => setHiDescription(e.target.value)}
                    placeholder="सामान की स्थिति, साउंड क्वालिटी और अन्य विवरण…"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/60 border border-[var(--border)] rounded-xl text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <span>{uploadStatus || strings.saving}</span>
            ) : (
              <span>{isEdit ? 'Update Item' : strings.addItem}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ItemForm;
