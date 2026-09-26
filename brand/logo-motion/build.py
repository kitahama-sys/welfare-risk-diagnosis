"""Inline logo-data.json and motion.js into page.template.html -> logo-motion.html."""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
t = open('page.template.html', encoding='utf-8').read()
t = t.replace('/*__DATA__*/', open('logo-data.json').read()).replace('/*__MOTION__*/', open('motion.js', encoding='utf-8').read())
doc = '<!doctype html>\n<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + t + '\n</body></html>\n'
open('logo-motion.html', 'w', encoding='utf-8').write(doc)
