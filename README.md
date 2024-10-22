# 📝Highlighter

Manage, display the highlights, and comment them in a elegant way.

## ⚡Usage

> [!warning]
> It's still early days for this plugin, I suggest you just try using it with the [epub importer](https://github.com/aoout/obsidian-epub-importer) to highlight books and manage higlights.

### 📖With Epub Importer

> [!note]
> Please set the setting tags on `highlighter` and `epub importer` to be the same.

When **oneNote** is off, the book chapter notes will be scattered in a folder. In this case, all these notes are called an **HighlightBox**.

So when your activeNote is one of the notes, you are in this HighlightBox, and you can search all the highlights of this book through the `Search highlights in current HighlightBox` command.

![alt text](assets/image.png)

Moreover, when you are in a HighlightBox, by running the `Update highlights file` command, you can generate a **highlights.md** file, located in the root directory of the HighlightBox.

If you want to comment a highlight, you can type an @ symbol and then write the comment on a new line. If your input conforms to the format, your comments will be retained when the `Update highlights file` command updates the highlights.md file.

![alt text](assets/image-1.png)

When a highlight has a corresponding comment, place the mouse on the highlight and press the `ctrl` key, a pop-up window will display the comment.

![alt text](assets/image-2.png)

## 🖼️GIFs

### Jump to highlight

![alt text](assets/Obsidian_L2n1q4dAVu.gif)

## ⚙️How it works &... Why?

Highlighter matches each highlight solely based on the string content. This can lead to issues when there are two identical highlights, resulting in unpredictable outcomes.

The reason Highlighter does this, instead of using block IDs like many other plugins to mark and track each highlight, is that it aims to adhere to the File Over App philosophy as an Obsidian plugin. It strives to provide powerful highlighting and management features without adding any extra content or data that would disrupt the native semantics of the files.

If one day this plugin stops being updated or you decide to stop using Obsidian, your markdown files will still retain everything, such as the native markdown highlighting syntax and a visually intuitive highlights file. Additionally, your markdown source files won’t be cluttered with strange block IDs or CSS pollution.