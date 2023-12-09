# Highlighter

manage, display the highlights, and comment them in a elegant way.

## Usage

> [!warnning]
> It's still early days for this plugin, I suggest you just try using it with the [epub importer](https://github.com/aoout/obsidian-epub-importer) to highlight books and manage higlights.

### With Epub Import

When **granularity** is greater than 0, the book chapter notes will be scattered in a folder. In this case, all these notes are called an **HighlightBox**.

So when your activeNote is one of the notes, you are in this HighlightBox, and you can search all the highlights of this book through the `Search highlights in current HighlightBox` command.

![](assets/image1.png)

Moreover, when you are in a HighlightBox, by running the `Update highlights file` command, you can generate a **highlights.md** file, located in the root directory of the HighlightBox.

![](assets/image2.png)

If you want to comment a highlight, you can type an @ symbol and then write the comment on a new line. If your input conforms to the format, your comments will be retained when the `Update highlights file` command updates the highlights.md file.

![](assets/image3.png)