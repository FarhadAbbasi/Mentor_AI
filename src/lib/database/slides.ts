import { supabase } from '../supabase';
import type { DBSlide } from './types';

export async function saveSlides(
  webinarId: string,
  slides: Omit<DBSlide, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>[]
) {
  // First delete existing slides
  await supabase
    .from('slides')
    .delete()
    .eq('webinar_id', webinarId);

  // Then insert new slides
  const { data, error } = await supabase
    .from('slides')
    .insert(
      slides.map(slide => ({
        ...slide,
        webinar_id: webinarId
      }))
    )
    .select();

  if (error) throw error;
  return data;
}



// export async function updateSlides(
//   webinarId: string,
//   slides: Omit<DBSlide, 'id' | 'webinar_id' | 'created_at' | 'updated_at'>[]
// ) {

//   const updates = slides.map(async (slide) => (
//     await supabase
//       .from('slides')
//       .update({
//         title: slide.title,
//         content: slide.content,
//         notes: slide.notes,
//         order_index: slide.order_index
//       })
//       .eq('id', slide.order_index) // Update specific slide
//       .eq('webinar_id', webinarId)
//   )
//   )

//   const results = await Promise.all(updates);
//   return results;
// }



