import { z } from 'zod'

const CATEGORIES = [
  'Kafe', 'Restoran', 'Park', 'Müze', 'Sahil/Plaj',
  'Sokak/Cadde', 'Kütüphane', 'Bar', 'Teras/Çatı',
  'Köy/Kasaba', 'Doğa/Yürüyüş', 'Manzara Noktası', 'Tarihi Mekan', 'Diğer',
] as const

export const newPlaceSchema = z.object({
  name: z.string().min(1, 'Mekan adı zorunludur').max(100, 'Mekan adı çok uzun'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Kategori seçmelisiniz' }) }),
  city: z.string().min(1, 'Şehir zorunludur'),
  neighborhood: z.string().optional(),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
})
export type NewPlaceInput = z.infer<typeof newPlaceSchema>
