/**
 * Utility untuk mengonversi file gambar ke format WebP di sisi client (browser)
 * sebelum diunggah ke storage / Supabase.
 * Mengurangi ukuran file secara signifikan dengan kompresi berkualitas tinggi.
 */
export interface ConvertWebpOptions {
  /**
   * Kualitas kompresi (0.0 hingga 1.0). Default: 0.82 (kualitas optimal & hemat ukuran)
   */
  quality?: number
  /**
   * Batas resolusi dimensi maksimum (lebar atau tinggi dalam pixel).
   * Default: 1920px. Gambar lebih besar akan di-scale down proporsional.
   */
  maxDimension?: number
}

export async function convertImageToWebp(
  file: File,
  options: ConvertWebpOptions = {}
): Promise<File> {
  const { quality = 0.82, maxDimension = 1920 } = options

  // Jika bukan file gambar atau lingkungan bukan browser (SSR)
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    let objectUrl = ''
    try {
      objectUrl = URL.createObjectURL(file)
    } catch {
      return resolve(file)
    }

    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Hitung skala proporsional jika melebihi maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return resolve(file)
      }

      // Render image ke canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Cek apakah browser mendukung toBlob dengan type image/webp
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file)
          }

          // Buat nama file baru dengan ekstensi .webp
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
          const webpFile = new File([blob], `${nameWithoutExt}.webp`, {
            type: 'image/webp',
            lastModified: Date.now()
          })

          resolve(webpFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      // Fallback ke file asli jika terjadi kendala saat load gambar
      resolve(file)
    }

    img.src = objectUrl
  })
}
