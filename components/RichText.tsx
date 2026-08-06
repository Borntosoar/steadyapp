import React from 'react';
import { Text } from 'react-native';
import { useTheme } from './ui';
import { type as t } from '../constants/theme';
import { parseInline } from '../lib/inline';

export { parseInline };

/** Renders a paragraph of module content, honouring **bold** and *italic*. */
export function RichText({ children, size = 'body' }: { children: string; size?: 'body' | 'bodySm' }) {
  const c = useTheme();
  const base = size === 'body' ? t.body : t.bodySm;
  return (
    <Text style={[base, { color: c.ink }]}>
      {parseInline(children).map((tok, i) => (
        <Text
          key={i}
          style={{
            fontWeight: tok.bold ? '700' : '400',
            fontStyle: tok.italic ? 'italic' : 'normal',
          }}
        >
          {tok.text}
        </Text>
      ))}
    </Text>
  );
}
