import { Box, Typography } from '@mui/material';
import { Fragment } from 'react';

// Rendu Markdown minimal, sans dépendance externe — couvre juste ce que
// l'assistant IA utilise réellement (gras **texte**, titres #/##/###,
// listes à puces "- " ou "* ", séparateurs "---"). Corrige le bug signalé
// par l'utilisateur : les symboles # et * s'affichaient tels quels au lieu
// d'être transformés en vraie mise en forme.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export default function MarkdownText({ text, fontSize }: { text: string; fontSize?: number }) {
  const lines = text.split('\n');
  const blocks: JSX.Element[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    blocks.push(
      <Box key={key} component="ul" sx={{ my: 0.5, pl: 2.5 }}>
        {listBuffer.map((item, i) => (
          <Typography key={i} component="li" variant="body2" sx={{ fontSize }}>
            {renderInline(item, `${key}-li-${i}`)}
          </Typography>
        ))}
      </Box>,
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    const key = `b-${i}`;

    if (trimmed === '---' || trimmed === '') {
      flushList(`${key}-flush`);
      if (trimmed === '') blocks.push(<Box key={key} sx={{ height: 6 }} />);
      return;
    }
    if (/^#{1,3}\s/.test(trimmed)) {
      flushList(`${key}-flush`);
      const level = trimmed.match(/^#+/)![0].length;
      const content = trimmed.replace(/^#{1,3}\s/, '');
      blocks.push(
        <Typography
          key={key}
          variant={level === 1 ? 'subtitle1' : 'subtitle2'}
          fontWeight={700}
          sx={{ mt: 1, fontSize: fontSize ? fontSize + 1 : undefined }}
        >
          {renderInline(content, key)}
        </Typography>,
      );
      return;
    }
    if (/^[-*]\s/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s/, ''));
      return;
    }
    flushList(`${key}-flush`);
    blocks.push(
      <Typography key={key} variant="body2" sx={{ fontSize }}>
        {renderInline(trimmed, key)}
      </Typography>,
    );
  });
  flushList('final-flush');

  return <Box>{blocks}</Box>;
}
