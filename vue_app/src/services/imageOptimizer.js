import imageCompression from 'browser-image-compression';

/**
 * Optimizes an image converting it to WebP format, reducing size and dimensions.
 * Skips optimization for non-image files such as PDF or Word documents.
 * 
 * @param {File} file - The file to compress.
 * @returns {Promise<File>} - A promise that resolves to the compressed File object.
 */
export const optimizeImage = async (file) => {
    // Return original if it's not an image (like PDF or DOCX)
    if (!file || !file.type.startsWith('image/')) {
        return file;
    }

    const options = {
        maxSizeMB: 0.3,           // 300 KB max limit
        maxWidthOrHeight: 1280,   // HD Max resolution
        useWebWorker: true,
        fileType: 'image/webp'    // Convert to webp
    };

    try {
        console.log(`Original size (${file.name}): ${(file.size / 1024 / 1024).toFixed(3)} MB`);
        const compressedBlob = await imageCompression(file, options);
        console.log(`Optimized size (WebP): ${(compressedBlob.size / 1024 / 1024).toFixed(3)} MB`);

        // Format new filename
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const newFileName = `${baseName}.webp`;

        // Create new File object from the compressed blob
        return new File([compressedBlob], newFileName, { type: 'image/webp' });
    } catch (error) {
        console.error("Error during image optimization:", error);
        return file; // Fallback to original file if compression fails
    }
};

/**
 * Optimizes an array or FileList of images.
 * @param {FileList|Array<File>} files 
 * @param {number} maxFiles 
 * @returns {Promise<Array<File>>}
 */
export const optimizeMultipleImages = async (files, maxFiles = 10) => {
    if (!files || files.length === 0) return [];
    
    const limit = Math.min(files.length, maxFiles);
    const optimizedFiles = [];

    for (let i = 0; i < limit; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const optimized = await optimizeImage(file);
            optimizedFiles.push(optimized);
        } else {
            optimizedFiles.push(file); // fallback for non-images if included in array
        }
    }

    return optimizedFiles;
};
