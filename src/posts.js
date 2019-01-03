import * as fs from 'fs';
import * as path from 'path';
import * as yamlFront from 'yaml-front-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

const md = new MarkdownIt({
  html: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (e) {
        // Ignore
      }
    }

    return ''; // use external default escaping
  }
});

const DIR = path.join(__dirname, '..', 'posts');

class Post {
  constructor(file) {
    const raw = fs.readFileSync(path.join(DIR, file), 'utf8');

    const front = yamlFront.loadFront(raw);

    this.slug = file.replace(/\.md$/, '');
    this.title = front.title;
    this.date = new Date(front.date);
    this.html = md.render(front.__content);
    this.scripts = front.scripts;
  }
}

function generate() {
  const files = fs.readdirSync(DIR).filter(f => /\.md$/.test(f));

  return files
    .map(file => new Post(file))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export default generate();
