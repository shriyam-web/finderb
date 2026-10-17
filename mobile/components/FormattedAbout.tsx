import { Text, type StyleProp, type TextStyle } from 'react-native';
import { fonts } from '../constants/typography';
import { parseAboutMarkup, type AboutNode } from '../lib/aboutFormat';

type Marks = { bold: boolean; italic: boolean; underline: boolean };

function face(marks: Marks): TextStyle {
  const style: TextStyle = {};
  if (marks.italic && marks.bold) style.fontFamily = fonts.boldItalic;
  else if (marks.italic) style.fontFamily = fonts.italic;
  else if (marks.bold) style.fontFamily = fonts.bold;
  if (marks.underline) style.textDecorationLine = 'underline';
  return style;
}

function renderNodes(nodes: AboutNode[], marks: Marks, keyPrefix: string) {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === 'text') return <Text key={key}>{node.text}</Text>;
    if (node.type === 'break') return <Text key={key}>{'\n'}</Text>;
    const next = { ...marks, [node.type]: true };
    return (
      <Text key={key} style={face(next)}>
        {renderNodes(node.children, next, key)}
      </Text>
    );
  });
}

export function FormattedAbout({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={style}>
      {renderNodes(parseAboutMarkup(text), { bold: false, italic: false, underline: false }, 'about')}
    </Text>
  );
}
