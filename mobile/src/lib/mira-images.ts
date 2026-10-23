import type { DigitalDesignerProposal, DigitalDocument } from './api';
import type { ImageJob } from './image-assistant';
export type MiraImageRequest = NonNullable<DigitalDesignerProposal['image_requests']>[number];
/** Only completed, product-bound jobs may become image blocks. */
export function applyMiraImages(document: DigitalDocument, requests: MiraImageRequest[], jobs: (ImageJob | undefined)[], productId: string): DigitalDocument {
  const next = JSON.parse(JSON.stringify(document)) as DigitalDocument;
  requests.forEach((request, index) => {
    const job = jobs[index];
    if (!job || job.status !== 'done') return;
    if (job.product_id !== productId || job.context !== 'digital' || job.operation !== 'digital-art' || !/^[\w-]+\.(?:png|jpe?g|webp)$/.test(job.image_file ?? '')) throw new Error('This image belongs to a different product.');
    const page = next.pages.find(p => p.id === request.page_id);
    if (!page) throw new Error('The page for this image is no longer in the draft.');
    if (request.replace_block_id) {
      const block = page.blocks.find(b => b.id === request.replace_block_id && b.kind === 'image');
      if (!block) throw new Error('The image to replace is no longer in the draft.');
      block.image_file = job.image_file; block.image_fit = 'contain';
    } else page.blocks.splice(Math.min(1,page.blocks.length),0,{id:`mira-art-${job.id}`,kind:'image',image_file:job.image_file,image_fit:'contain'});
  });
  return next;
}
