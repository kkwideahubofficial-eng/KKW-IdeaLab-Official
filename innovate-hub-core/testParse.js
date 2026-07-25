import ts from 'typescript';
import fs from 'fs';

const fileName = './src/pages/Achievements.tsx';
const fileContent = fs.readFileSync(fileName, 'utf8');

const program = ts.createProgram([fileName], {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  skipLibCheck: true
});

const diagnostics = ts.getPreEmitDiagnostics(program);
console.log('Diagnostic count:', diagnostics.length);
diagnostics.forEach(diag => {
  const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
  if (diag.file) {
    const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
    console.log(`${diag.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    console.log(message);
  }
});
