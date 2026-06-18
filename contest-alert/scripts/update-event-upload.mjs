import fs from 'fs';

let content = fs.readFileSync('src/app/admin/events/new/page.tsx', 'utf8');

// 1. Add imageFile state and handleImageUpload
const stateMarker = '  const [image, setImage] = useState("");';
const handleImageUploadLogic = `  const [image, setImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      const max_width = 1280;
      const max_height = 720;

      if (width > max_width || height > max_height) {
        if (width / height > max_width / max_height) {
          height = Math.round((height * max_width) / width);
          width = max_width;
        } else {
          width = Math.round((width * max_height) / height);
          height = max_height;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const webpFile = new File([blob], file.name.split('.')[0] + '.webp', { type: 'image/webp' });
            setImageFile(webpFile);
            setImage("ready"); 
          }
        }, 'image/webp', 0.85);
      }
    };
  };`;
content = content.replace(stateMarker, handleImageUploadLogic);

// 2. Modify handleSubmit to upload image
const submitMarker = '      const eventData: any = {';
const uploadLogic = `      let cover_image_path = null;
      if (imageFile) {
        const fileName = \`\${Math.random().toString(36).substring(2, 15)}_\${Date.now()}.webp\`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-covers')
          .upload(fileName, imageFile, { contentType: 'image/webp' });

        if (uploadError) {
          alert("Image upload failed: " + uploadError.message);
          throw uploadError;
        }
        cover_image_path = uploadData.path;
      }

      const eventData: any = {`;
content = content.replace(submitMarker, uploadLogic);

// 3. Inject cover_image_path to eventData
const coverImageMarker = '        cover_image: image || `https://picsum.photos/seed/${Math.random()}/800/500`,';
const coverImageReplacement = `        cover_image_path,
        cover_image: cover_image_path ? null : (image || \`https://picsum.photos/seed/\${Math.random()}/800/500\`),`;
content = content.replace(coverImageMarker, coverImageReplacement);

// 4. Replace the UI input
const uiMarkerStart = '{/* === COMMON: Cover Image === */}';
const uiMarkerEnd = '              {/* === COMMON: Description === */}';
const uiReplacement = `{/* === COMMON: Cover Image === */}
              <div className="space-y-1">
                <label className={labelClass}>Cover Image (Max 1280x720, Auto-converted to WebP)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={inputClass}
                />
                {imageFile && <p className="text-[10px] text-[var(--accent)] font-semibold mt-1">Image selected & optimized. Ready for upload.</p>}
              </div>

              {/* === COMMON: Description === */}`;

const startIndex = content.indexOf(uiMarkerStart);
const endIndex = content.indexOf(uiMarkerEnd);
if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + uiReplacement + content.substring(endIndex + uiMarkerEnd.length - 35);
}

fs.writeFileSync('src/app/admin/events/new/page.tsx', content);
console.log('Updated Event Creation logic for WebP uploads');
