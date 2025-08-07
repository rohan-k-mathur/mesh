import { Mark, mergeAttributes } from "@tiptap/core";

export const FontFamily = Mark.create({
  name: "fontFamily",
  addOptions() {
    return { types: ["textStyle"] };
  },
  parseHTML() {
    return [{ style: "font-family" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontFamily:
        (family: string) =>
        ({ chain }) =>
          chain()
            .setMark("textStyle", { style: `font-family:${family}` })
            .run(),
      unsetFontFamily:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { style: null }).run(),
    };
  },
});
