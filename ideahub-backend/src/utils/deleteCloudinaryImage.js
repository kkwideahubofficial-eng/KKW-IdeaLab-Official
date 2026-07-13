import cloudinary from '../config/cloudinary.js';

/**
 * Deletes an image asset from Cloudinary using its stored URL.
 * Automatically parses the public_id and folder structure from Cloudinary URLs.
 * 
 * @param {string | string[]} urls - Single Cloudinary URL or array of URLs to delete
 */
export const deleteFromCloudinary = async (urls) => {
  if (!urls) return;

  const urlArray = Array.isArray(urls) ? urls : [urls];

  for (const url of urlArray) {
    if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
      continue;
    }

    try {
      // Format: https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/v<version>/<public_id_with_ext>
      const uploadSplit = url.split('/upload/');
      if (uploadSplit.length < 2) continue;

      let publicIdWithExt = uploadSplit[1];

      // Remove version string if present (e.g. v1723456789/)
      publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, '');

      // Extract public_id without extension
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

      // Determine resource type (raw for pdfs, image for images)
      const resourceType = url.includes('/raw/upload/') || url.toLowerCase().endsWith('.pdf') ? 'raw' : 'image';

      const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`Cloudinary asset deletion result [${publicId}]:`, result);
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset for URL (${url}):`, err.message);
    }
  }
};

export default deleteFromCloudinary;
