import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdminAuth } from './useAdminAuth';
import { CameraIcon } from '../../components/Icons';
import { getRepo } from '../../lib/repo';
import { uploadImage, deleteImage } from '../../lib/imagekit';
import { categories } from '../../config/categories';
import { strings } from '../../config/strings';
import {
  itemInputSchema,
  type Condition,
  type Status,
  type ItemImage,
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0].id);
  const [condition, setCondition] = useState<Condition>('good');
  const [status, setStatus] = useState<Status>('available');
  const [soldPrice, setSoldPrice] = useState<string>('');

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > 4) {
      alert('You can only have up to 4 photos per item.');
      return;
    }

    const newDrafts: ImageDraft[] = [];
    for (const f of files) {
      if (f.size > 15 * 1024 * 1024) {
        alert(`File ${f.name} is larger than 15 MB. Please select a smaller photo.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(f);
      newDrafts.push({
        id: 'draft-' + Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl,
      });
    }

    setImages(prev => [...prev, ...newDrafts]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const target = images[index];
    if (target.uploaded) {
      setRemovedImages(prev => [...prev, target.uploaded!]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (images.length === 0) {
      setError('Please add at least 1 photo.');
      return;
    }

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

      // 2. Validate with zod
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
      });

      // 3. Save to repository
      const repo = await getRepo();
      if (isEdit && id) {
        await repo.update(id, input);
      } else {
        await repo.create(input);
      }

      // 4. Delete removed images from ImageKit
      for (const removed of removedImages) {
        if (removed.fileId) {
          deleteImage(removed.fileId, token).catch(() => {});
        }
      }

      navigate('/admin/items');
    } catch (err) {
      console.error('Submit error:', err);
      setError((err as Error).message || 'Failed to save item');

      // Best effort cleanup if saving failed
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
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-[var(--fg)]">
                {strings.imagesLabel} (1 to 4)
              </h2>
              <p className="text-xs text-[var(--muted)]">
                First photo is the cover. Up to 4 photos.
              </p>
            </div>
            {images.length < 4 && (
              <label className="min-h-[44px] px-3.5 py-2 rounded-xl bg-green-50 dark:bg-green-950/50 hover:bg-green-100 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                <CameraIcon className="w-4 h-4" />
                <span>{strings.addPhoto}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Photo Previews */}
          {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {images.map((draft, idx) => (
                <div
                  key={draft.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-gray-100 dark:bg-gray-800 group"
                >
                  <img
                    src={draft.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {idx === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
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
              <span className="block">No photos attached yet. Tap "Add photo" to upload.</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {strings.titleLabel} *
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
            {strings.descriptionLabel}
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
