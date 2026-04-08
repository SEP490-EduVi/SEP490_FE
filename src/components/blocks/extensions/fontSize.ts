import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /** Set inline font-size (e.g. "16px") */
      setFontSize: (fontSize: string) => ReturnType;
      /** Remove inline font-size */
      unsetFontSize: () => ReturnType;
    };
  }
}

/**
 * FontSize Extension
 * ------------------
 * Adds a `fontSize` attribute to the `textStyle` mark so text can have an
 * explicit font size rendered as `style="font-size: Xpx"`.
 *
 * Requires `@tiptap/extension-text-style` to be included in the editor.
 */
export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
