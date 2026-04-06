'use client';

/**
 * PresentationGamePlayer - router component.
 *
 * Reads playable.templateId and delegates to the appropriate game player:
 *  HOVER_SELECT -> HoverSelectGamePlayer (Kahoot-style HTML UI)
 *  DRAG_DROP    -> DragDropGamePlayer    (canvas-based UI)
 */

import { HoverSelectGamePlayer } from './HoverSelectGamePlayer';
import { DragDropGamePlayer } from './DragDropGamePlayer';

type Props = {
  playable: any;
  onEnd?: () => void;
  onReplay?: () => void;
};

export function PresentationGamePlayer({ playable, onEnd, onReplay }: Props) {
  const templateId: string | undefined = playable?.templateId;

  if (templateId === 'HOVER_SELECT') {
    return <HoverSelectGamePlayer playable={playable} onEnd={onEnd} onReplay={onReplay} />;
  }

  if (templateId === 'DRAG_DROP') {
    return <DragDropGamePlayer playable={playable} onEnd={onEnd} onReplay={onReplay} />;
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-black text-white/50 text-sm">
      Loai game khong duoc ho tro: {templateId ?? '(unknown)'}
    </div>
  );
}
