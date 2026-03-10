import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

/**
 * ColoredListItem Extension
 * Propagates inline text color from list item content to the <li> element,
 * so that ::marker (bullet dots and numbers) follows the text color.
 */
export const ColoredListItem = Extension.create({
  name: 'coloredListItem',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            state.doc.descendants((node, pos) => {
              if (node.type.name === 'listItem') {
                let color: string | null = null;

                node.descendants((child) => {
                  if (color) return false;
                  child.marks.forEach((mark) => {
                    if (
                      mark.type.name === 'textStyle' &&
                      (mark.attrs as Record<string, unknown>).color
                    ) {
                      color = (mark.attrs as Record<string, unknown>).color as string;
                    }
                  });
                });

                if (color) {
                  decorations.push(
                    Decoration.node(pos, pos + node.nodeSize, {
                      style: `color: ${color}`,
                    })
                  );
                }
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});
